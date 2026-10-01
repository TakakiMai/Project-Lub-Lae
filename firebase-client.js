import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAh3pCV2Bx54uG6403kL-0-XH3DxeCmCuI',
  authDomain: 'color-guessing-a00c4.firebaseapp.com',
  projectId: 'color-guessing-a00c4',
  storageBucket: 'color-guessing-a00c4.firebasestorage.app',
  messagingSenderId: '352324686988',
  appId: '1:352324686988:web:65f60d693833db6b6cd7a9',
  measurementId: 'G-LQGG6FDDHR'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getFirestore(app);
const authenticationReady = signInAnonymously(auth).then(({ user }) => user);

function roomCollection() {
  return collection(database, 'rooms');
}

function makeRoomView(roomId, roomData, members = [], actions = []) {
  const bots = (roomData.bots || []).map((bot) => ({ ...bot, isBot: true }));
  const humanPlayers = members.map((member) => ({ ...member, id: member.uid, isBot: false }));
  return { ...roomData, id: roomId, isRemote: true, players: [...humanPlayers, ...bots], actions };
}

async function getRoom(roomId) {
  await authenticationReady;
  const roomReference = doc(database, 'rooms', roomId);
  const roomSnapshot = await getDoc(roomReference);
  if (!roomSnapshot.exists()) return null;
  const memberSnapshot = await getDocs(collection(roomReference, 'members'));
  return makeRoomView(roomId, roomSnapshot.data(), memberSnapshot.docs.map((member) => member.data()));
}

const RoomBackend = {
  ready: authenticationReady,
  get uid() {
    return auth.currentUser?.uid || null;
  },
  getRoom,

  subscribeOpenRooms(onChange, onError) {
    let unsubscribe = null;
    let cancelled = false;
    authenticationReady.then(() => {
      if (cancelled) return;
      const waitingRooms = query(roomCollection(), where('status', 'in', ['waiting', 'playing']));
      unsubscribe = onSnapshot(waitingRooms, (snapshot) => {
      onChange(snapshot.docs.map((room) => ({ id: room.id, ...room.data(), isRemote: true, players: room.data().bots || [] })));
      }, onError);
    }).catch(onError);
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  },

  subscribeRoom(roomId, onChange, onError) {
    let roomData = null;
    let members = [];
    let actions = [];
    let roomUnsubscribe = null;
    let membersUnsubscribe = null;
    let actionsUnsubscribe = null;
    let cancelled = false;
    const emit = () => {
      if (roomData) onChange(makeRoomView(roomId, roomData, members, actions));
      else onChange(null);
    };

    authenticationReady.then(() => {
      if (cancelled) return;
      const roomReference = doc(database, 'rooms', roomId);
      roomUnsubscribe = onSnapshot(roomReference, (snapshot) => {
        if (!snapshot.exists()) {
          roomData = null;
          membersUnsubscribe?.();
          membersUnsubscribe = null;
          actionsUnsubscribe?.();
          actionsUnsubscribe = null;
          members = [];
          actions = [];
          emit();
          return;
        }
        roomData = snapshot.data();
        emit();
        if (!membersUnsubscribe) {
          membersUnsubscribe = onSnapshot(collection(roomReference, 'members'), (memberSnapshot) => {
            members = memberSnapshot.docs.map((member) => member.data());
            emit();
          }, onError);
        }
        
        if (!actionsUnsubscribe) {
          actionsUnsubscribe = onSnapshot(collection(roomReference, 'actions'), (actionSnapshot) => {
            actions = actionSnapshot.docs.map((action) => action.data());
            emit();
          }, onError);
        }
      }, onError);
    }).catch(onError);

    return () => {
      cancelled = true;
      roomUnsubscribe?.();
      membersUnsubscribe?.();
      actionsUnsubscribe?.();
    };
  },

  async createRoom(room) {
    const user = await authenticationReady;
    const roomId = room.id;
    const roomReference = doc(database, 'rooms', roomId);
    const sourceHost = room.players.find((player) => !player.isBot);
    const host = {
      uid: user.uid,
      name: sourceHost?.name || user.displayName || 'นักสำรวจ',
      color: sourceHost?.color || 'Red',
      isHost: true
    };
    const bots = room.players.filter((player) => player.isBot).map((bot) => ({
      id: bot.id,
      name: bot.name,
      botStyle: bot.botStyle,
      color: bot.color,
      isBot: true
    }));
    const roomData = {
      name: room.name,
      code: roomId,
      ownerUid: user.uid,
      hostId: user.uid,
      memberUids: [user.uid],
      playerCount: 1 + bots.length,
      capacity: 8,
      botCount: bots.length,
      bots,
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await runTransaction(database, async (transaction) => {
      const existingRoom = await transaction.get(roomReference);
      if (existingRoom.exists()) throw new Error('ROOM_CODE_EXISTS');
      transaction.set(roomReference, roomData);
      transaction.set(doc(roomReference, 'members', user.uid), host);
    });
    return makeRoomView(roomId, roomData, [host]);
  },

  async joinRoom(roomId, profile) {
    const user = await authenticationReady;
    const roomReference = doc(database, 'rooms', roomId);
    const memberReference = doc(roomReference, 'members', user.uid);
    await runTransaction(database, async (transaction) => {
      const roomSnapshot = await transaction.get(roomReference);
      const memberSnapshot = await transaction.get(memberReference);
      if (!roomSnapshot.exists()) throw new Error('ROOM_NOT_FOUND');
      const room = roomSnapshot.data();
      if (room.status !== 'waiting') throw new Error('ROOM_STARTED');
      if (memberSnapshot.exists()) return;
      if (room.playerCount >= room.capacity) throw new Error('ROOM_FULL');

      const member = { uid: user.uid, name: profile.name, color: profile.color, isHost: false };
      transaction.update(roomReference, {
        memberUids: [...room.memberUids, user.uid],
        playerCount: room.playerCount + 1,
        updatedAt: serverTimestamp()
      });
      transaction.set(memberReference, member);
    });
    return getRoom(roomId);
  },

  async updateRoomSettings(room) {
    const user = await authenticationReady;
    const roomReference = doc(database, 'rooms', room.id);
    const bots = room.players.filter((player) => player.isBot).map((bot) => ({
      id: bot.id,
      name: bot.name,
      botStyle: bot.botStyle,
      color: bot.color,
      isBot: true
    }));
    await runTransaction(database, async (transaction) => {
      const snapshot = await transaction.get(roomReference);
      if (!snapshot.exists()) throw new Error('ROOM_NOT_FOUND');
      const current = snapshot.data();
      if (current.ownerUid !== user.uid) throw new Error('HOST_ONLY');
      if (current.status !== 'waiting') throw new Error('ROOM_STARTED');
      const playerCount = current.memberUids.length + bots.length;
      if (playerCount > current.capacity) throw new Error('ROOM_FULL');
      transaction.update(roomReference, {
        name: room.name,
        bots,
        botCount: bots.length,
        playerCount,
        updatedAt: serverTimestamp()
      });
    });
  },

  async setMemberColor(roomId, color) {
    const user = await authenticationReady;
    const memberReference = doc(database, 'rooms', roomId, 'members', user.uid);
    await updateDoc(memberReference, { color, updatedAt: serverTimestamp() });
  },

  async leaveRoom(roomId) {
    const user = await authenticationReady;
    const roomReference = doc(database, 'rooms', roomId);
    const memberReference = doc(roomReference, 'members', user.uid);
    const roomSnapshot = await getDoc(roomReference);
    if (!roomSnapshot.exists()) return;
    const room = roomSnapshot.data();

    if (room.ownerUid === user.uid) {
      const memberSnapshot = await getDocs(collection(roomReference, 'members'));
      const batch = writeBatch(database);
      memberSnapshot.docs.forEach((member) => batch.delete(member.ref));
      batch.delete(roomReference);
      await batch.commit();
      return;
    }

    await runTransaction(database, async (transaction) => {
      const latestRoom = await transaction.get(roomReference);
      const member = await transaction.get(memberReference);
      if (!latestRoom.exists() || !member.exists()) return;
      const data = latestRoom.data();
      transaction.update(roomReference, {
        memberUids: data.memberUids.filter((uid) => uid !== user.uid),
        playerCount: Math.max(data.memberUids.length - 1 + data.botCount, 0),
        updatedAt: serverTimestamp()
      });
      transaction.delete(memberReference);
    });
  },

  async startRoom(roomId) {
    const user = await authenticationReady;
    const roomReference = doc(database, 'rooms', roomId);
    await runTransaction(database, async (transaction) => {
      const snapshot = await transaction.get(roomReference);
      if (!snapshot.exists()) throw new Error('ROOM_NOT_FOUND');
      const room = snapshot.data();
      if (room.ownerUid !== user.uid) throw new Error('HOST_ONLY');
      if (room.status !== 'waiting') throw new Error('ROOM_STARTED');
      if (room.playerCount < 3 || room.playerCount > room.capacity) throw new Error('PLAYER_COUNT');
      transaction.update(roomReference, { status: 'playing', updatedAt: serverTimestamp() });
    });
  },

  async publishGameState(roomId, gameState) {
    const user = await authenticationReady;
    const roomReference = doc(database, 'rooms', roomId);
    await runTransaction(database, async (transaction) => {
      const snapshot = await transaction.get(roomReference);
      if (!snapshot.exists()) throw new Error('ROOM_NOT_FOUND');
      const room = snapshot.data();
      if (room.ownerUid !== user.uid) throw new Error('HOST_ONLY');
      if (room.status !== 'playing') throw new Error('ROOM_NOT_PLAYING');
      transaction.update(roomReference, { gameState, updatedAt: serverTimestamp() });
    });
  },

  async publishAction(roomId, payload) {
    const user = await authenticationReady;
    const roomReference = doc(database, 'rooms', roomId);
    const actionReference = doc(roomReference, 'actions', user.uid);
    await setDoc(actionReference, {
      uid: user.uid,
      ...payload,
      updatedAt: serverTimestamp()
    });
  }
};

window.RoomBackend = RoomBackend;
window.dispatchEvent(new Event('room-backend-ready'));
