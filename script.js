const STORAGE_KEYS = { username: 'luna-username', rooms: 'luna-rooms', color: 'luna-color' };

      const availableColors = ['Red', 'Blue', 'Black', 'Brown', 'Green', 'Orange', 'Pink', 'Sky Blue', 'Violet', 'Yellow'];

      function showNotification(msg) {
        const div = document.createElement('div');
        div.className = 'custom-notification';
        div.textContent = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
      }

      const state = {
        username: localStorage.getItem(STORAGE_KEYS.username) || '',
        color: localStorage.getItem(STORAGE_KEYS.color) || 'Red',
        rooms: JSON.parse(localStorage.getItem(STORAGE_KEYS.rooms) || '[]'),
        volume: Number(localStorage.getItem('luna-volume') || 0.75),
        musicEnabled: localStorage.getItem('luna-music-enabled') !== 'false',
        currentRoom: null,
        phase: 'auth',
        statusMessage: '',
        statusTimer: null,
        gameSyncRevision: 0,
        lastRemoteGameRevision: 0,
        remoteApplying: false,
        roundNumber: 0,
        turnNumber: 0,
        routeDeck: [],
        pathCards: [],
        seenHazards: new Set(),
        artifactReserve: [],
        collectedArtifactCount: 0,
        cardSequence: 0,
        decisions: {},
        revealCardData: null,
        activeHazardKey: null,
        roomBotCount: 2,
        revealTimer: null,
        countdownTimer: null,
        roundTimer: null,
        gameSyncTimer: null
      };

      // ข้อมูลจำนวนและการ์ดสมบัติมูลค่าต่างๆ (สามารถปรับแก้จำนวนการ์ดหรือมูลค่าเงินพดด้วงได้ตามต้องการ)
const treasureDistribution = [
  { value: 1, count: 1 }, { value: 2, count: 1 }, { value: 3, count: 1 },
  { value: 4, count: 1 }, { value: 5, count: 2 }, { value: 7, count: 2 },
  { value: 9, count: 1 }, { value: 11, count: 2 }, { value: 13, count: 1 },
  { value: 14, count: 1 }, { value: 15, count: 1 }, { value: 17, count: 1 }
];

// ข้อมูลไพ่ตระกูลอุปสรรค (ค่า key จะต้องตรงกับชื่อไฟล์ภาพและไฟล์วิดีโอที่คุณมี)
const hazardDefinitions = [
  { name: 'เสือสมิง', key: 'Tiger' },
  { name: 'งูเจ้าที่', key: 'Sneck' },
  { name: 'กับระเบิด', key: 'Bomb' },
  { name: 'หินถล่ม', key: 'Rock' },
  { name: 'โจร', key: 'Bandit' }
];

// ข้อมูลไพ่ตระกูลอาร์ติแฟกต์ (สมบัติพิเศษที่จะถูกสุ่มเพิ่มเข้ามาเมื่อผ่านไปแต่ละรอบ)
const artifactDefinitions = [
  { name: 'เพชรตาแมว' },
  { name: 'พระพุทธรูปทองคำ' },
  { name: 'กริชอาคม' },
  { name: 'ทับทิมสยาม' },
  { name: 'เหล็กไหล' }
];

// แผนผังสำหรับเรียกใช้งานไฟล์วิดีโอเมื่อผู้เล่นเปิดเจออุปสรรคซ้ำ
const hazardVideoMap = {
  Tiger: 'อุปสรรค/Tiger.mp4',
  Sneck: 'อุปสรรค/Sneck.mp4',
  Bomb: 'อุปสรรค/Bomb.mp4',
  Rock: 'อุปสรรค/Rock.mp4',
  Bandit: 'อุปสรรค/Bandit.mp4'
};

      const testRoom = {
        id: 'TEST-01', name: 'ห้องทดสอบระบบ', capacity: 4,
        players: [
          { id: 'bot-nuch', name: 'นุช · บอทระวัง', isBot: true, botStyle: 'cautious', color: 'Green' },
          { id: 'bot-thee', name: 'ธีร์ · บอทสมดุล', isBot: true, botStyle: 'balanced', color: 'Blue' },
          { id: 'bot-arm', name: 'อาร์ม · บอทกล้าเสี่ยง', isBot: true, botStyle: 'bold', color: 'Yellow' }
        ]
      };

      const elements = {
        authScreen: document.getElementById('authScreen'), lobbyScreen: document.getElementById('lobbyScreen'), roomLobbyScreen: document.getElementById('roomLobbyScreen'), gameScreen: document.getElementById('gameScreen'),
        usernameInput: document.getElementById('usernameInput'), enterLobbyBtn: document.getElementById('enterLobbyBtn'),
        welcomeName: document.getElementById('welcomeName'), colorGrid: document.getElementById('colorGrid'), roomList: document.getElementById('roomList'), logoutBtn: document.getElementById('logoutBtn'), testGameBtn: document.getElementById('testGameBtn'),
        createRoomBtn: document.getElementById('createRoomBtn'), openJoinRoomBtn: document.getElementById('openJoinRoomBtn'),
        createRoomModal: document.getElementById('createRoomModal'), createRoomForm: document.getElementById('createRoomForm'),
        createRoomNameInput: document.getElementById('createRoomNameInput'), createRoomBotCount: document.getElementById('createRoomBotCount'),
        createRoomRemoveBotBtn: document.getElementById('createRoomRemoveBotBtn'), createRoomAddBotBtn: document.getElementById('createRoomAddBotBtn'),
        cancelCreateRoomBtn: document.getElementById('cancelCreateRoomBtn'), joinRoomModal: document.getElementById('joinRoomModal'),
        joinRoomForm: document.getElementById('joinRoomForm'), joinRoomCodeInput: document.getElementById('joinRoomCodeInput'),
        cancelJoinRoomBtn: document.getElementById('cancelJoinRoomBtn'), waitingRoomName: document.getElementById('waitingRoomName'),
        waitingRoomCode: document.getElementById('waitingRoomCode'), waitingPlayerCount: document.getElementById('waitingPlayerCount'),
        waitingRoomStatus: document.getElementById('waitingRoomStatus'), waitingPlayerGrid: document.getElementById('waitingPlayerGrid'),
        waitingOwnerControls: document.getElementById('waitingOwnerControls'), waitingBotCount: document.getElementById('waitingBotCount'),
        addBotBtn: document.getElementById('addBotBtn'), removeBotBtn: document.getElementById('removeBotBtn'),
        startRoomGameBtn: document.getElementById('startRoomGameBtn'), leaveWaitingRoomBtn: document.getElementById('leaveWaitingRoomBtn'),
        waitingColorModal: document.getElementById('waitingColorModal'), waitingColorOptions: document.getElementById('waitingColorOptions'),
        cancelWaitingColorBtn: document.getElementById('cancelWaitingColorBtn'),
        currentRoomName: document.getElementById('currentRoomName'), currentRoomCode: document.getElementById('currentRoomCode'), roundInfo: document.getElementById('roundInfo'),
        turnInfo: document.getElementById('turnInfo'), playerCountInfo: document.getElementById('playerCountInfo'),
        topSeatRow: document.getElementById('topSeatRow'), bottomSeatRow: document.getElementById('bottomSeatRow'),
        gameStatus: document.getElementById('gameStatus'), revealArea: document.getElementById('revealArea'), revealCard: document.getElementById('revealCard'),
        centerStack: document.getElementById('centerStack'), cardPreview: document.getElementById('cardPreview'), looseTreasureCount: document.getElementById('looseTreasureCount'),
        btnContinue: document.getElementById('btnContinue'), btnCamp: document.getElementById('btnCamp'), countdownOverlay: document.getElementById('countdownOverlay'),
        leaveRoomBtn: document.getElementById('leaveRoomBtn'), hazardOverlay: document.getElementById('hazardOverlay'), hazardVideo: document.getElementById('hazardVideo'),
        mobileMenuToggle: document.getElementById('mobileMenuToggle'), mobileGameMenu: document.getElementById('mobileGameMenu'),
        mobileRoomName: document.getElementById('mobileRoomName'), mobileRoomCode: document.getElementById('mobileRoomCode'),
        mobileGameStatus: document.getElementById('mobileGameStatus'), mobileExitBtn: document.getElementById('mobileExitBtn'),
        dismissHazardBtn: document.getElementById('dismissHazardBtn'), gameSummary: document.getElementById('gameSummary'),
        summaryTitle: document.getElementById('summaryTitle'), summaryList: document.getElementById('summaryList'), restartGameBtn: document.getElementById('restartGameBtn'),
        musicToggleBtn: document.getElementById('musicToggleBtn'),
        volumeToggleBtn: document.getElementById('volumeToggleBtn'), volumePopup: document.getElementById('volumePopup'),
        volumeSlider: document.getElementById('volumeSlider'),
      };
      let unsubscribeOpenRooms = null;
      let unsubscribeCurrentRoom = null;
      const bgMusic = new Audio(encodeURI('ดนตรีประกอบ.mp3'));
      bgMusic.loop = true;
      bgMusic.preload = 'auto';
      const coinSound = new Audio(encodeURI('โลหะ.mp3'));
      coinSound.preload = 'auto';

      let audioCtx = null;
      let masterGain = null;
      function initAudio() {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return;
        if (!audioCtx) {
          audioCtx = new AudioContextConstructor();
          masterGain = audioCtx.createGain();
          masterGain.gain.value = state.volume;
          masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
      }
      function playBeep(freq, type, duration, vol = 0.05) {
        if (!audioCtx || !masterGain) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type; oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
        oscillator.connect(gainNode); gainNode.connect(masterGain);
        oscillator.start(); setTimeout(() => oscillator.stop(), duration);
      }

      function playCoinSound() {
        coinSound.volume = state.volume;
        coinSound.currentTime = 0;
        coinSound.play().catch(() => {});
      }

      function setBackgroundMusicEnabled(enabled, startPlayback = false) {
        state.musicEnabled = enabled;
        localStorage.setItem('luna-music-enabled', String(enabled));
        elements.musicToggleBtn.textContent = '♫';
        elements.musicToggleBtn.setAttribute('aria-pressed', String(enabled));
        elements.musicToggleBtn.setAttribute('aria-label', enabled ? 'ปิดดนตรีพื้นหลัง' : 'เปิดดนตรีพื้นหลัง');
        elements.musicToggleBtn.title = enabled ? 'ปิดดนตรีพื้นหลัง' : 'เปิดดนตรีพื้นหลัง';

        if (!enabled) {
          bgMusic.pause();
        } else if (startPlayback) {
          bgMusic.play().catch(() => {});
        }
      }

      function setGameStatus(message, duration = 5000) {
        clearTimeout(state.statusTimer);
        state.statusMessage = message;
        elements.gameStatus.textContent = message;
        elements.mobileGameStatus.textContent = message;
        state.statusTimer = null;

        if (duration > 0) {
          state.statusTimer = setTimeout(() => {
            state.statusTimer = null;
            if (state.statusMessage !== message) return;
            state.statusMessage = '';
            elements.gameStatus.textContent = state.phase === 'decision'
              ? 'กำลังรอผู้เล่นตัดสินใจ'
              : state.phase === 'roundEnd' ? 'รอบนี้จบแล้ว' : '';
            elements.mobileGameStatus.textContent = elements.gameStatus.textContent;
          }, duration);
        }
      }

      function clearGameStatus() {
        clearTimeout(state.statusTimer);
        state.statusTimer = null;
        state.statusMessage = '';
      }

      function closeMobileGameMenu() {
        elements.mobileGameMenu.hidden = true;
        elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }

      function spawnCoins(startX, startY, endX, endY, count) {
        if (count === 0) return Promise.resolve();
        const stagger = Math.min(250, 1000 / count);
        const animations = [];

        for (let index = 0; index < count; index += 1) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 40 + Math.random() * 60;
          const scatterX = Math.cos(angle) * distance;
          const scatterY = Math.sin(angle) * distance;
          const rotation = (Math.random() - 0.5) * 180;
          const coin = document.createElement('img');
          coin.src = 'ไอคอน/พดด้วง.png';
          coin.alt = '';
          coin.setAttribute('aria-hidden', 'true');
          coin.style.cssText = `position:fixed;left:${startX - 12}px;top:${startY - 12}px;width:24px;height:24px;z-index:9999;pointer-events:none;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))`;
          document.body.appendChild(coin);

          const animation = coin.animate([
            { transform: 'translate(0, 0) scale(.3) rotate(0deg)', opacity: 0, offset: 0 },
            { transform: `translate(${scatterX}px, ${scatterY}px) scale(1.4) rotate(${rotation}deg)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(.5) rotate(${rotation + 720}deg)`, opacity: 0, offset: 1 }
          ], {
            duration: 1350,
            delay: index * stagger,
            easing: 'cubic-bezier(.4, 0, .2, 1)'
          });
          animations.push(animation.finished.then(() => {
            playCoinSound();
            coin.remove();
          }));
        }

        return Promise.all(animations);
      }

      function animateTreasureDistribution(card, explorers, share) {
        return new Promise(resolve => {
          const startRect = elements.revealCard.getBoundingClientRect();
          const startX = startRect.left + startRect.width / 2;
          const startY = startRect.top + startRect.height / 2;
          
          let promises = [];
          
          // โยนเหรียญไปให้ผู้เล่นที่ยังอยู่
          if (share > 0) {
            explorers.forEach(p => {
              const seat = document.querySelector(`[data-player-id="${p.id}"] .score-icon`);
              if (seat) {
                const endRect = seat.getBoundingClientRect();
                promises.push(spawnCoins(startX, startY, endRect.left + endRect.width / 2, endRect.top + endRect.height / 2, share));
              }
            });
          }
          
          // โยนเศษเหรียญเข้ากองกลาง
          if (card.remainder > 0) {
            const looseCounter = document.querySelector('#looseTreasureCounter img');
            if (looseCounter) {
              const endRect = looseCounter.getBoundingClientRect();
              promises.push(spawnCoins(startX, startY, endRect.left + endRect.width / 2, endRect.top + endRect.height / 2, card.remainder));
            }
          }
          
          if (promises.length === 0) resolve();
          else Promise.all(promises).then(resolve);
        });
      }

      function saveRooms() {
        const localRooms = state.rooms.filter((room) => room.id === testRoom.id);
        localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(localRooms));
      }
      function setUsername() {
        const value = elements.usernameInput.value.trim();
        state.username = value || 'นักสำรวจ';
        localStorage.setItem(STORAGE_KEYS.username, state.username);
        elements.welcomeName.textContent = state.username;
      }

      function renderColorPicker() {
        elements.colorGrid.innerHTML = '';
        availableColors.forEach(color => {
          const btn = document.createElement('div');
          btn.className = `color-option ${state.color === color ? 'selected' : ''}`;
          
          const img = document.createElement('img');
          img.src = encodeURI(`ไอคอน/${color}.png`);
          btn.appendChild(img);
          
          btn.addEventListener('click', () => {
            state.color = color;
            localStorage.setItem(STORAGE_KEYS.color, color);
            renderColorPicker(); // อัปเดต UI ให้ไฮไลต์สีที่เลือกใหม่
          });
          elements.colorGrid.appendChild(btn);
        });
      }

      function showScreen(screenName) {
        elements.authScreen.classList.toggle('active', screenName === 'auth'); elements.authScreen.classList.toggle('hidden', screenName !== 'auth');
        elements.lobbyScreen.classList.toggle('active', screenName === 'lobby'); elements.lobbyScreen.classList.toggle('hidden', screenName !== 'lobby');
        elements.roomLobbyScreen.classList.toggle('active', screenName === 'roomLobby'); elements.roomLobbyScreen.classList.toggle('hidden', screenName !== 'roomLobby');
        elements.gameScreen.classList.toggle('active', screenName === 'game'); elements.gameScreen.classList.toggle('hidden', screenName !== 'game');
      }

      function renderRoomList() {
        elements.roomList.innerHTML = '';
        // 1. นำเงื่อนไขกรองสถานะออก เพื่อดึงห้องทั้งหมดมาแสดง
        const availableRooms = state.rooms.filter((room) => room.id !== testRoom.id);
        
        if (availableRooms.length === 0) {
          const emptyState = document.createElement('p');
          emptyState.className = 'room-empty';
          emptyState.textContent = 'ยังไม่มีห้องเปิดอยู่';
          elements.roomList.appendChild(emptyState);
          return;
        }
        
        availableRooms.forEach((room) => {
          const card = document.createElement('div'); card.className = 'room-card';
          const meta = document.createElement('div'); meta.className = 'room-meta';
          const name = document.createElement('div'); name.className = 'room-name'; name.textContent = room.name;
          const detail = document.createElement('div'); detail.className = 'room-detail';
          
          const playerCount = room.playerCount ?? room.players.length;
          const botCount = room.botCount ?? room.players.filter((player) => player.isBot).length;
          
          // 2. แสดงข้อความสถานะให้ผู้เล่นคนอื่นทราบว่าห้องนี้รออยู่หรือเล่นไปแล้ว
          const statusText = room.status === 'playing' ? 'กำลังเล่น' : 'รอผู้เล่น';
          detail.textContent = `รหัส ${room.id} · ผู้เล่น ${playerCount}/${room.capacity} คน · สถานะ: ${statusText}`;
          meta.append(name, detail);
          
          const joinBtn = document.createElement('button'); 
          joinBtn.className = 'btn btn-small btn-primary'; 
          
          // 3. ตรวจสอบว่าผู้เล่นคนนี้เคยอยู่ในห้องนี้ก่อนหน้านี้หรือไม่ (กรณีเน็ตหลุด)
          const isAlreadyInRoom = room.players.some(p => !p.isBot && p.name === state.username);
          
          if (room.status === 'playing' && !isAlreadyInRoom) {
            // ถ้าห้องเริ่มไปแล้ว และเราไม่ได้อยู่ในห้องนั้น จะขึ้นปุ่มเทาๆ ปิดการใช้งาน
            joinBtn.textContent = 'กำลังเล่น';
            joinBtn.disabled = true;
            joinBtn.classList.replace('btn-primary', 'btn-ghost');
          } else {
            // ถ้าเราเคยอยู่ในห้องที่เล่นไปแล้ว จะขึ้นให้ "กลับเข้าห้อง"
            joinBtn.textContent = isAlreadyInRoom && room.status === 'playing' ? 'กลับเข้าห้อง' : 'เข้าร่วม';
            joinBtn.disabled = !isAlreadyInRoom && playerCount >= room.capacity;
            joinBtn.addEventListener('click', () => joinRoom(room.id));
          }
          
          card.append(meta, joinBtn); elements.roomList.appendChild(card);
        });
      }

      function updateRoomListFromFirebase(remoteRooms) {
        // แก้ไขจาก loadTestRoom() เป็น testRoom ที่เราประกาศตัวแปรไว้แล้วที่ด้านบนของไฟล์
        const localTestRoom = state.rooms.find((room) => room.id === testRoom.id) || testRoom;
        
        // อัปเดตรายชื่อห้อง โดยเอาห้องทดสอบมารวมกับห้องออนไลน์จาก Firebase
        state.rooms = [localTestRoom, ...remoteRooms.filter((room) => room.id !== testRoom.id)];
        
        // สั่งให้วาดหน้า Lobby ใหม่
        renderRoomList();
      }

      function listenToRoom(roomId) {
        unsubscribeCurrentRoom?.();
        unsubscribeCurrentRoom = window.RoomBackend.subscribeRoom(roomId, (remoteRoom) => {
          if (!remoteRoom) {
            state.rooms = state.rooms.filter((room) => room.id !== roomId);
            if (state.currentRoom?.id === roomId) {
              state.currentRoom = null;
              renderRoomList();
              showScreen('lobby');
            }
            return;
          }

          remoteRoom.players.forEach((player) => {
            player.isMe = !player.isBot && player.uid === window.RoomBackend.uid;
          });
          const roomIndex = state.rooms.findIndex((room) => room.id === roomId);
          if (roomIndex >= 0) state.rooms[roomIndex] = remoteRoom;
          else state.rooms.push(remoteRoom);

          if (state.currentRoom?.id !== roomId) {
            renderRoomList();
            return;
          }
          
          // เพิ่มการป้องกันไม่ให้ข้อมูลเกมของ Host ถูกทับด้วยข้อมูลเริ่มต้นจาก Firebase
          const isPlayingHost = remoteRoom.status === 'playing' && remoteRoom.ownerUid === window.RoomBackend.uid;
          if (isPlayingHost && state.currentRoom?.players) {
            remoteRoom.players = state.currentRoom.players;
          }
          
          state.currentRoom = remoteRoom;

          if (remoteRoom.status === 'waiting' && elements.roomLobbyScreen.classList.contains('active')) {
            const beforeColors = remoteRoom.players.filter((player) => player.isBot).map((player) => player.color).join('|');
            const isHost = remoteRoom.ownerUid === window.RoomBackend.uid;
            if (isHost) {
              rebalanceBotColors(remoteRoom);
              const afterColors = remoteRoom.players.filter((player) => player.isBot).map((player) => player.color).join('|');
              if (beforeColors !== afterColors) {
                window.RoomBackend.updateRoomSettings(remoteRoom).catch((error) => showNotification(error.message));
              }
            }
            renderWaitingRoom();
          } else if (remoteRoom.status === 'playing') {
            if (remoteRoom.ownerUid === window.RoomBackend.uid) {
              processRemoteActions(remoteRoom);
            } else if (remoteRoom.gameState) {
              applyRemoteGameState(remoteRoom);
            } else if (elements.roomLobbyScreen.classList.contains('active')) {
              elements.waitingRoomStatus.textContent = 'เจ้าของห้องกำลังเตรียมเกม';
            }
          }
        }, (error) => showNotification(`เชื่อมต่อห้องไม่สำเร็จ: ${error.message}`));
      }

      function serializeRemoteGameState() {
        return {
          revision: state.gameSyncRevision + 1,
          roundNumber: state.roundNumber,
          turnNumber: state.turnNumber,
          phase: state.phase,
          routeDeck: state.routeDeck,
          pathCards: state.pathCards,
          seenHazards: [...state.seenHazards],
          artifactReserve: state.artifactReserve,
          collectedArtifactCount: state.collectedArtifactCount,
          cardSequence: state.cardSequence,
          decisions: state.decisions,
          revealCardData: state.revealCardData,
          activeHazardKey: state.activeHazardKey,
          players: state.currentRoom.players
        };
      }

      function queueRemoteGameState() {
        const room = state.currentRoom;
        if (state.remoteApplying || !room?.isRemote || room.ownerUid !== window.RoomBackend.uid || room.status !== 'playing') return;
        clearTimeout(state.gameSyncTimer);
        state.gameSyncTimer = setTimeout(() => {
          state.gameSyncRevision += 1;
          const gameState = serializeRemoteGameState();
          gameState.revision = state.gameSyncRevision;
          window.RoomBackend.publishGameState(room.id, gameState).catch((error) => showNotification(`ซิงก์เกมไม่สำเร็จ: ${error.message}`));
        }, 80);
      }

      function applyRemoteGameState(room) {
        const gameState = room.gameState;
        if (!gameState || gameState.revision <= state.lastRemoteGameRevision) return;
        state.remoteApplying = true;
        state.lastRemoteGameRevision = gameState.revision;
        state.currentRoom = room;
        state.currentRoom.players = gameState.players.map((player) => ({
          ...player,
          isMe: !player.isBot && player.uid === window.RoomBackend.uid
        }));
        state.roundNumber = gameState.roundNumber;
        state.turnNumber = gameState.turnNumber;
        state.phase = gameState.phase;
        state.routeDeck = gameState.routeDeck;
        state.pathCards = gameState.pathCards;
        state.seenHazards = new Set(gameState.seenHazards);
        state.artifactReserve = gameState.artifactReserve;
        state.collectedArtifactCount = gameState.collectedArtifactCount;
        state.cardSequence = gameState.cardSequence;
        state.decisions = { ...gameState.decisions };
        state.revealCardData = gameState.revealCardData;
        state.activeHazardKey = gameState.activeHazardKey;
        showScreen('game');
        renderGameBoard();
        if (state.revealCardData && state.phase === 'revealing') {
          elements.revealCard.classList.remove('hidden');
          elements.revealCard.dataset.type = state.revealCardData.type;
          applyCardAsset(elements.revealCard, state.revealCardData);
        } else {
          elements.revealCard.classList.add('hidden');
        }
        if (state.phase === 'hazard' && state.activeHazardKey && elements.hazardOverlay.classList.contains('hidden')) {
          showHazardVideo(state.activeHazardKey);
        } else if (state.phase !== 'hazard') {
          elements.hazardOverlay.classList.add('hidden');
          elements.hazardVideo.pause();
        }
        state.remoteApplying = false;
      }

      function processRemoteActions(room) {
        if (state.phase !== 'decision' || !room.actions) return;

        // แปลงข้อมูลจาก Firebase ให้เป็น Array เสมอ ไม่ว่าจะเป็น Object หรือ Array ก็ตาม
        const actionsList = Array.isArray(room.actions) ? room.actions : Object.values(room.actions);

        actionsList.filter((action) => action.roundNumber === state.roundNumber && action.turnNumber === state.turnNumber)
          .forEach((action) => {
            const player = state.currentRoom.players.find((item) => item.uid === action.uid);
            if (player && !state.decisions[player.id]) {
              // ส่งพารามิเตอร์ true เพื่อบอกว่าเป็นการกดปุ่มจากผู้เล่นเครื่องอื่น
              handleDecision(player.id, action.action, true);
            }
          });
      }

      function persistCurrentRoomSettings(room = state.currentRoom) {
        if (!room) return;
        if (room.isRemote) {
          window.RoomBackend.updateRoomSettings(room).catch((error) => showNotification(error.message));
        } else {
          saveRooms();
        }
      }

      function getOrCreateMyPlayer(room) {
        let me = room.players.find((player) => !player.isBot && player.name === state.username);
        if (!me) {
          if (room.players.length >= room.capacity) return null;
          me = { id: `user-${Date.now()}`, name: state.username, isBot: false, color: state.color };
          room.players.push(me);
        } else {
          me.color = state.color; // อัปเดตสีล่าสุดทุกครั้งที่เข้าห้อง
        }
        room.players.forEach((player) => { player.isMe = player.id === me.id; });
        return me;
      }

      function createRoomCode() {
        let code;
        do {
          code = String(Math.floor(100000 + Math.random() * 900000));
        } while (state.rooms.some((room) => room.id === code));
        return code;
      }

      function createBotPlayer(room) {
        const botNumber = room.players.filter((player) => player.isBot).length + 1;
        const botStyles = [
          { name: 'บอทระวัง', style: 'cautious' },
          { name: 'บอทสมดุล', style: 'balanced' },
          { name: 'บอทกล้าเสี่ยง', style: 'bold' }
        ];
        const profile = botStyles[(botNumber - 1) % botStyles.length];
        return {
          id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: `บอท ${botNumber} · ${profile.name}`,
          isBot: true,
          botStyle: profile.style,
          color: availableColors[0],
          active: true,
          carriedTreasure: 0,
          safeTreasure: 0,
          artifactPoints: 0,
          artifacts: []
        };
      }

      function rebalanceBotColors(room) {
        const usedColors = new Set(room.players.filter((player) => !player.isBot).map((player) => player.color));
        room.players.filter((player) => player.isBot).forEach((bot) => {
          if (usedColors.has(bot.color)) {
            const available = availableColors.filter((color) => !usedColors.has(color));
            bot.color = available[Math.floor(Math.random() * available.length)] || bot.color;
          }
          usedColors.add(bot.color);
        });
      }

      function renderWaitingRoom() {
        const room = state.currentRoom;
        if (!room) return;
        const host = room.players.find((player) => player.id === room.hostId || player.uid === room.ownerUid);
        const isHost = room.isRemote
          ? room.ownerUid === window.RoomBackend.uid
          : host?.name === state.username;
        const botCount = room.players.filter((player) => player.isBot).length;
        elements.waitingRoomName.textContent = room.name;
        elements.waitingRoomCode.textContent = `รหัสห้อง ${room.id}`;
        elements.waitingPlayerCount.textContent = `${room.players.length} / ${room.capacity}`;
        elements.waitingBotCount.textContent = String(botCount);
        elements.waitingOwnerControls.classList.toggle('hidden', !isHost);
        elements.startRoomGameBtn.disabled = !isHost || room.players.length < 3 || room.players.length > room.capacity;
        elements.addBotBtn.disabled = !isHost || room.players.length >= room.capacity;
        elements.removeBotBtn.disabled = !isHost || botCount === 0;
        elements.waitingRoomStatus.textContent = room.players.length < 3
          ? `ต้องมีผู้เล่นอย่างน้อย 3 คน (ขาดอีก ${3 - room.players.length} คน)`
          : isHost ? 'พร้อมแล้ว กดเริ่มเกมได้เลย' : 'รอเจ้าของห้องเริ่มเกม';

        elements.waitingPlayerGrid.replaceChildren();
        room.players.forEach((player) => {
          const card = document.createElement('article');
          card.className = `waiting-player-card ${player.id === room.hostId ? 'is-host' : ''}`;
          const canChooseColor = player.isBot
            ? isHost
            : room.isRemote ? player.uid === window.RoomBackend.uid : player.name === state.username;
          const tent = document.createElement('button');
          tent.type = 'button';
          tent.className = 'waiting-tent-button';
          tent.disabled = !canChooseColor;
          tent.setAttribute('aria-label', `เลือกสีเต็นท์ของ ${player.name}`);
          const image = document.createElement('img');
          image.src = encodeURI(`ไอคอน/${player.color || 'Red'}.png`);
          image.alt = '';
          tent.appendChild(image);
          if (canChooseColor) tent.addEventListener('click', () => openWaitingColorPicker(player.id));

          const info = document.createElement('div');
          info.className = 'waiting-player-info';
          const playerName = document.createElement('strong');
          playerName.textContent = player.name;
          const playerType = document.createElement('span');
          playerType.textContent = player.isBot ? 'บอท' : player.id === room.hostId ? 'เจ้าของห้อง' : 'ผู้เล่น';
          info.append(playerName, playerType);
          card.append(tent, info);
          elements.waitingPlayerGrid.appendChild(card);
        });
      }

      function openWaitingColorPicker(playerId) {
        state.colorTargetPlayerId = playerId;
        const room = state.currentRoom;
        const target = room?.players.find((player) => player.id === playerId);
        if (!target) return;
        const unavailable = new Set(room.players.filter((player) => player.id !== playerId).map((player) => player.color));
        elements.waitingColorOptions.replaceChildren();
        availableColors.forEach((color) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `color-option ${target.color === color ? 'selected' : ''}`;
          button.disabled = target.isBot && unavailable.has(color);
          button.title = color;
          const image = document.createElement('img');
          image.src = encodeURI(`ไอคอน/${color}.png`);
          image.alt = color;
          button.appendChild(image);
          button.addEventListener('click', () => setWaitingPlayerColor(playerId, color));
          elements.waitingColorOptions.appendChild(button);
        });
        elements.waitingColorModal.classList.remove('hidden');
      }

      function setWaitingPlayerColor(playerId, color) {
        const room = state.currentRoom;
        const player = room?.players.find((item) => item.id === playerId);
        if (!player) return;
        if (player.isBot && room.players.some((item) => item.id !== player.id && item.color === color)) return;
        player.color = color;
        if (!player.isBot && player.name === state.username) {
          state.color = color;
          localStorage.setItem(STORAGE_KEYS.color, color);
        }
        rebalanceBotColors(room);
        if (room.isRemote && !player.isBot) {
          window.RoomBackend.setMemberColor(room.id, color).catch((error) => showNotification(error.message));
          if (room.ownerUid === window.RoomBackend.uid) persistCurrentRoomSettings(room);
        } else {
          persistCurrentRoomSettings(room);
        }
        elements.waitingColorModal.classList.add('hidden');
        renderWaitingRoom();
      }

      function addRoomBot() {
        const room = state.currentRoom;
        if (!room || room.players.length >= room.capacity) return;
        room.players.push(createBotPlayer(room));
        rebalanceBotColors(room);
        persistCurrentRoomSettings(room);
        renderWaitingRoom();
      }

      function removeRoomBot() {
        const room = state.currentRoom;
        if (!room) return;
        const botIndex = room.players.map((player) => player.isBot).lastIndexOf(true);
        if (botIndex < 0) return;
        room.players.splice(botIndex, 1);
        rebalanceBotColors(room);
        persistCurrentRoomSettings(room);
        renderWaitingRoom();
      }

      async function createRoomFromForm(event) {
        event.preventDefault();
        const host = {
          id: `user-${Date.now()}`,
          name: state.username || 'นักสำรวจ',
          isBot: false,
          isHost: true,
          color: state.color,
          active: true,
          carriedTreasure: 0,
          safeTreasure: 0,
          artifactPoints: 0,
          artifacts: []
        };
        const room = {
          id: createRoomCode(),
          name: elements.createRoomNameInput.value.trim() || `ห้องของ ${host.name}`,
          capacity: 8,
          status: 'waiting',
          hostId: host.id,
          players: [host]
        };
        for (let index = 0; index < state.roomBotCount; index += 1) room.players.push(createBotPlayer(room));
        rebalanceBotColors(room);
        try {
          const createdRoom = await window.RoomBackend.createRoom(room);
          state.rooms = [...state.rooms.filter((item) => item.id !== createdRoom.id), createdRoom];
          state.currentRoom = createdRoom;
          listenToRoom(createdRoom.id);
        } catch (error) {
          showNotification(error.code === 'ROOM_CODE_EXISTS' ? 'รหัสห้องซ้ำ ลองสร้างใหม่อีกครั้ง' : `สร้างห้องไม่สำเร็จ: ${error.message}`);
          return;
        }
        elements.createRoomModal.classList.add('hidden');
        renderWaitingRoom();
        showScreen('roomLobby');
      }

      async function joinRoomByCode(event) {
        event.preventDefault();
        const roomCode = elements.joinRoomCodeInput.value.trim();
        elements.joinRoomModal.classList.add('hidden');
        
        let room = state.rooms.find((item) => item.id === roomCode && item.id !== testRoom.id);
        if (!room) {
          try { room = await window.RoomBackend.getRoom(roomCode); }
          catch (error) { showNotification(`ค้นหาห้องไม่สำเร็จ: ${error.message}`); return; }
        }
        if (!room) { showNotification('ไม่พบห้องจากรหัสนี้'); return; }
        
        // เช็คว่าเราเคยอยู่ในห้องนี้ไหม
        const isAlreadyInRoom = room.players.some(p => !p.isBot && p.name === state.username);
        
        // อนุญาตให้เข้าห้องได้ถ้าห้องยังรออยู่ "หรือ" ห้องกำลังเล่นแต่ตัวเราอยู่ในห้องนั้นอยู่แล้ว
        if (room.status !== 'waiting' && !isAlreadyInRoom) { 
          showNotification('เกมห้องนี้เริ่มไปแล้ว ไม่สามารถเข้าร่วมใหม่ได้'); 
          return; 
        }
        
        if (!state.rooms.some((item) => item.id === room.id)) state.rooms.push(room);
        joinRoom(room.id);
      }

      async function leaveWaitingRoom() {
        const room = state.currentRoom;
        if (room) {
          if (room.isRemote) {
            try { await window.RoomBackend.leaveRoom(room.id); }
            catch (error) { showNotification(`ออกจากห้องไม่สำเร็จ: ${error.message}`); return; }
            unsubscribeCurrentRoom?.();
            unsubscribeCurrentRoom = null;
            state.rooms = state.rooms.filter((item) => item.id !== room.id);
          } else {
          const player = room.players.find((item) => !item.isBot && item.name === state.username);
          if (player?.id === room.hostId) {
            state.rooms = state.rooms.filter((item) => item.id !== room.id);
          } else if (player) {
            room.players = room.players.filter((item) => item.id !== player.id);
            rebalanceBotColors(room);
          }
          saveRooms();
          }
        }
        state.currentRoom = null;
        elements.waitingColorModal.classList.add('hidden');
        renderRoomList();
        showScreen('lobby');
      }

      async function startRoomGame() {
        const room = state.currentRoom;
        const host = room?.players.find((player) => player.id === room.hostId || player.uid === room.ownerUid);
        const isHost = room?.isRemote ? room.ownerUid === window.RoomBackend.uid : host?.name === state.username;
        
        if (!room || !isHost) return;
        if (room.players.length < 3 || room.players.length > room.capacity) {
          showNotification('ต้องมีผู้เล่นอย่างน้อย 3 คนและไม่เกิน 8 คน');
          return;
        }

        // 1. ปิดการใช้งานปุ่มทันทีเพื่อป้องกันการกดซ้ำ (Double-click)
        elements.startRoomGameBtn.disabled = true;

        if (room.isRemote) {
          state.transitioningRoomId = room.id;
          try { 
            await window.RoomBackend.startRoom(room.id); 
          }
          catch (error) {
            // 2. ดักจับ Error "ROOM_STARTED" 
            // หาก Error เป็น ROOM_STARTED แสดงว่าเกมถูกสั่งเริ่มไปแล้ว ให้ปล่อยผ่านเพื่อเข้าสู่หน้าเกมได้เลย
            if (error.code !== 'ROOM_STARTED' && error.message !== 'ROOM_STARTED') {
              state.transitioningRoomId = null;
              elements.startRoomGameBtn.disabled = false; // เปิดปุ่มให้กดใหม่หากเป็น Error อื่นๆ
              showNotification(`เริ่มเกมไม่สำเร็จ: ${error.message}`);
              return;
            }
          }
        }
        
        room.status = 'playing';
        room.players.forEach((player) => {
          player.isMe = !player.isBot && (room.isRemote ? player.uid === window.RoomBackend.uid : player.name === state.username);
        });
        
        if (!room.isRemote) saveRooms();
        initializeGame();
        showScreen('game');
        state.transitioningRoomId = null;
        renderStack();
      }

      async function joinRoom(roomId) {
        initAudio();
        let room = state.rooms.find((item) => item.id === roomId);
        if (!room) return;
        
        if (room.id !== testRoom.id) {
          try {
            const isAlreadyInRoom = room.status === 'playing' && room.players.some(p => !p.isBot && p.name === state.username);
            let joinedRoom = room;
            
            // ถ้าเกมเริ่มไปแล้วและเราอยู่ในห้องอยู่แล้ว ให้ข้ามการส่งคำขอ Join ไปยัง Backend (ป้องกัน Error ROOM_STARTED)
            if (!isAlreadyInRoom) {
              joinedRoom = await window.RoomBackend.joinRoom(room.id, { name: state.username, color: state.color });
            }
            
            state.currentRoom = joinedRoom;
            state.rooms = [...state.rooms.filter((item) => item.id !== joinedRoom.id), joinedRoom];
            listenToRoom(joinedRoom.id);
            
            // ถ้าห้องกำลังเล่นอยู่ ให้ดึงข้อมูลกระดานล่าสุดมาอัปเดตและพาเข้าหน้าเกมทันที
            if (joinedRoom.status === 'playing') {
              if (joinedRoom.gameState) applyRemoteGameState(joinedRoom);
              showScreen('game');
            } else {
              renderWaitingRoom();
              showScreen('roomLobby');
            }
            
          } catch (error) {
            const messages = { ROOM_STARTED: 'เกมห้องนี้เริ่มไปแล้ว', ROOM_FULL: 'ห้องนี้เต็มแล้ว', ROOM_NOT_FOUND: 'ไม่พบห้องจากรหัสนี้' };
            showNotification(messages[error.code] || `เข้าร่วมห้องไม่สำเร็จ: ${error.message}`);
          }
          return;
        }
  // ... (โค้ดด้านล่างที่เป็นส่วนของ testRoom ปล่อยไว้เหมือนเดิมครับ)
        const otherHuman = room.players.find((player) => !player.isBot && player.name !== state.username);
        if (otherHuman) { showNotification('ห้องทดสอบนี้ใช้ผู้เล่น 1 คนและบอท 3 ตัว'); return; }
        state.currentRoom = room;
        if (!getOrCreateMyPlayer(room)) { state.currentRoom = null; showNotification('ห้องทดสอบเต็มแล้ว'); return; }
        initializeGame(); showScreen('game'); renderStack(); saveRooms();
      }

      function leaveLobby() {
        closeMobileGameMenu();
        clearTimeout(state.revealTimer);
        clearInterval(state.countdownTimer);
        clearTimeout(state.roundTimer);
        clearGameStatus();
        elements.countdownOverlay.classList.remove('active'); elements.hazardVideo.pause();
        elements.hazardOverlay.classList.add('hidden'); elements.gameSummary.classList.add('hidden');
        state.currentRoom = null; state.phase = 'lobby'; showScreen('lobby');
      }

      function renderGameBoard() {
        if (!state.currentRoom) return;
        const room = state.currentRoom;
        elements.currentRoomName.textContent = room.name;
        elements.currentRoomCode.textContent = `รหัส ${room.id}`;
        elements.mobileRoomName.textContent = room.name;
        elements.mobileRoomCode.textContent = `รหัส ${room.id}`;
        elements.roundInfo.textContent = `${Math.max(state.roundNumber, 1)} / 5`;
        elements.turnInfo.textContent = String(state.turnNumber);
        elements.playerCountInfo.textContent = String(room.players.length);

        const players = room.players.slice();
        const topPlayers = players.slice(0, Math.ceil(players.length / 2));
        const bottomPlayers = players.slice(Math.ceil(players.length / 2));

        const createSeat = (player, rowType) => {
          const seat = document.createElement('div');
          seat.className = `seat ${player.isMe ? 'is-me' : ''} seat--${rowType}`;
          seat.dataset.playerId = player.id;

          const avatarWrapper = document.createElement('div');
          avatarWrapper.className = 'seat-avatar-wrapper';
          const avatar = document.createElement('div');
          avatar.className = 'seat-avatar';
          
          const tentImg = document.createElement('img');
          tentImg.src = encodeURI(`ไอคอน/${player.color || 'Red'}.png`);
          avatar.appendChild(tentImg);
          
          // จุดสถานะ
          const statusDot = document.createElement('div');
          statusDot.className = `seat-status ${player.active ? 'active' : 'camped'}`;
          statusDot.title = player.active ? 'กำลังสำรวจ' : 'กลับแคมป์แล้ว';

          avatarWrapper.append(avatar, statusDot);

          const infoWrapper = document.createElement('div');
          infoWrapper.className = 'seat-info';
          const name = document.createElement('div'); name.className = 'seat-name'; name.textContent = player.name;
          const score = document.createElement('div'); score.className = 'seat-score'; score.setAttribute('aria-label', 'แต้มรอบนี้');
          
          // ไอคอนสมบัติ (พดด้วง)
          const icon = document.createElement('img'); icon.className = 'score-icon';
          icon.src = 'ไอคอน/พดด้วง.png'; icon.alt = 'คะแนน';
          score.append(icon, document.createTextNode(String(player.carriedTreasure)));
          
          infoWrapper.append(name, score);
          seat.append(avatarWrapper, infoWrapper);

          if (player.isMe) {
            avatar.classList.add('is-clickable'); avatar.title = 'คลิกเพื่อดูคะแนนที่ซ่อนอยู่';
            const campPanel = document.createElement('div'); campPanel.className = 'seat-camp-panel hidden';
            const campTitle = document.createElement('strong'); campTitle.textContent = 'คะแนนที่ซ่อนอยู่';
            const safeTreasure = document.createElement('span'); safeTreasure.textContent = `สมบัติ ${player.safeTreasure}`;
            const safeArtifacts = document.createElement('span'); safeArtifacts.textContent = `อาติแฟกต์ ${player.artifactPoints}`;
            const safeTotal = document.createElement('strong'); safeTotal.textContent = `รวม ${player.safeTreasure + player.artifactPoints}`;
            campPanel.append(campTitle, safeTreasure, safeArtifacts, safeTotal);

            avatar.classList.add('is-clickable');
            avatar.setAttribute('role', 'button');
            avatar.setAttribute('tabindex', '0');
            avatar.setAttribute('aria-label', 'ดูคะแนนที่ซ่อนอยู่');
            avatar.setAttribute('aria-expanded', 'false');
            seat.append(campPanel);
          }
          return seat;
        };

        elements.topSeatRow.innerHTML = ''; elements.bottomSeatRow.innerHTML = '';
        topPlayers.forEach(p => elements.topSeatRow.appendChild(createSeat(p, 'top')));
        bottomPlayers.forEach(p => elements.bottomSeatRow.appendChild(createSeat(p, 'bottom')));
        
        renderStack(); 
        updateGameStatus(); 
        updateGameControls();
        
        // เพิ่มบรรทัดนี้: สั่งให้ Host ซิงก์หน้าจอไปให้ผู้เล่นคนอื่นเห็นตรงกัน
        queueRemoteGameState(); 
      }

      function createCard(type, data) { state.cardSequence += 1; return { id: state.cardSequence, type, ...data }; }
      function createBaseDeck() {
        const cards = [];
        treasureDistribution.forEach(({ value, count }) => {
          for (let i = 0; i < count; i++) cards.push(createCard('treasure', { name: `สมบัติ ${value}`, value, remainder: 0 }));
        });
        hazardDefinitions.forEach(({ name, key }) => {
          for (let i = 0; i < 3; i++) cards.push(createCard('hazard', { name, key }));
        });
        return cards;
      }
      function shuffle(cards) {
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  
  // เช็คจำนวนไพ่ในกองเพื่อความมั่นใจ (ดูได้ใน Console F12)
  const treasureCount = cards.filter(c => c.type === 'treasure').length;
  const hazardCount = cards.filter(c => c.type === 'hazard').length;
  const artifactCount = cards.filter(c => c.type === 'artifact').length;
  console.log(`[ระบบสับไพ่] กองจั่วมีไพ่ทั้งหมด ${cards.length} ใบ (สมบัติ: ${treasureCount}, อุปสรรค: ${hazardCount}, อาติแฟกต์: ${artifactCount})`);
  
  return cards;
}

function getCardAssetPath(card) {
        if (card.type === 'treasure') return `สมบัติ/${encodeURI(String(card.value))}.png`;
        if (card.type === 'artifact') {
          const artifactFiles = {
            'เพชรตาแมว': 'เพชรตาแมว (10 คะแนน).png', 'พระพุทธรูปทองคำ': 'พระพุทธรูปทองคำ (5 คะแนน).png',
            'กริชอาคม': 'กริชอาคม (5 คะแนน).png', 'ทับทิมสยาม': 'ทับทิมสยาม (5 คะแนน).png', 'เหล็กไหล': 'เหล็กไหล (10 คะแนน).png'
          };
          return `อาติแฟกต์/${encodeURI(artifactFiles[card.name] || 'กริชอาคม (5 คะแนน).png')}`;
        }
        const hazardFiles = { Tiger: 'Tiger.png', Sneck: 'Sneck.png', Bomb: 'Bomb.png', Rock: 'Rock.png', Bandit: 'Bandit.png' };
        return `อุปสรรค/${encodeURI(hazardFiles[card.key] || 'Tiger.png')}`;
      }

      function applyCardAsset(element, card) {
        const assetPath = getCardAssetPath(card);
        element.style.setProperty('--card-asset', `url("${assetPath}")`);
        element.style.backgroundImage = `url("${assetPath}")`;
        element.classList.remove('type-treasure', 'type-artifact', 'type-hazard');
        element.classList.add(`type-${card.type}`);
      }

      function renderStack() {
        hideCardPreview(); elements.centerStack.innerHTML = '';
        const zone = elements.centerStack;
        const styles = window.getComputedStyle(zone);
        const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
        const availableWidth = Math.max(0, zone.clientWidth - horizontalPadding);
        const availableHeight = Math.max(0, zone.clientHeight - verticalPadding);
        const gap = parseFloat(styles.columnGap) || 8;
        let cardWidth = 100;

        if (state.pathCards.length && availableWidth && availableHeight) {
          cardWidth = 16;
          for (let candidate = 100; candidate >= 16; candidate -= 1) {
            const columns = Math.max(1, Math.floor((availableWidth + gap) / (candidate + gap)));
            const rows = Math.ceil(state.pathCards.length / columns);
            const requiredHeight = rows * candidate * 1.5 + (rows - 1) * gap;
            if (requiredHeight <= availableHeight) {
              cardWidth = candidate;
              break;
            }
          }
        }
        zone.style.setProperty('--stack-card-width', `${cardWidth}px`);
        state.pathCards.forEach((card) => {
          const item = document.createElement('div');
          item.className = `stack-card type-${card.type}`;
          item.setAttribute('role', 'img'); item.setAttribute('aria-label', card.name); item.tabIndex = 0;
          applyCardAsset(item, card);
          item.addEventListener('pointerenter', () => showCardPreview(card));
          item.addEventListener('pointerleave', hideCardPreview);
          item.addEventListener('focus', () => showCardPreview(card));
          item.addEventListener('blur', hideCardPreview);
          elements.centerStack.appendChild(item);
        });
      }

      function showCardPreview(card) { elements.cardPreview.setAttribute('aria-label', card.name); applyCardAsset(elements.cardPreview, card); elements.cardPreview.classList.remove('hidden'); }
      function hideCardPreview() { elements.cardPreview.classList.add('hidden'); }

      function getCardStatusMessage(card) {
        if (card.type === 'treasure') return `พบเจอ "เงินพดด้วง" ${card.value} ก้อน ทำการแบ่งสมบัติ!`;
        if (card.type === 'artifact') return `พบเจอ "${card.name}" คณะเดินทางตาลุกวาว!?!!!`;
        const repeated = state.seenHazards.has(card.key);
        return `พบเจอ "${card.name}" ${repeated ? 'คณะเดินทางเสียชีวิต' : 'หลีกเลี่ยงได้สำเร็จ'}`;
      }

      function displayRevealedCard(card) {
        elements.revealCard.classList.remove('hidden'); elements.revealCard.dataset.type = card.type;
        applyCardAsset(elements.revealCard, card); state.revealCardData = card;
        setGameStatus(getCardStatusMessage(card));
        
        clearTimeout(state.revealTimer);
        state.revealTimer = setTimeout(() => finalizeReveal(card), 1500);
      }

      async function finalizeReveal(card) {
        if (state.phase !== 'revealing' || state.revealCardData !== card) return;
        clearTimeout(state.revealTimer); state.revealCardData = null;

        if (card.type === 'hazard' && state.seenHazards.has(card.key)) {
          elements.revealCard.classList.add('hidden');
          state.turnNumber += 1;
          state.phase = 'hazard';
          state.currentRoom.players.forEach(p => { if (p.active) p.carriedTreasure = 0; });
          renderGameBoard();
          showHazardVideo(card.key);
          return;
        }

        if (card.type === 'treasure') {
          initAudio(); // เพื่อให้แน่ใจว่าระบบเสียงถูกปลุกแล้ว
          const explorers = state.currentRoom.players.filter(p => p.active);
          const share = Math.floor(card.value / explorers.length);
          card.remainder = card.value % explorers.length;
          
          // รอให้แอนิเมชันเหรียญพดด้วงบินเสร็จสิ้น ก่อนจะอัปเดตตัวเลขและพับการ์ด
          await animateTreasureDistribution(card, explorers, share);
          
          explorers.forEach(p => p.carriedTreasure += share);
        } else if (card.type === 'hazard') {
          state.seenHazards.add(card.key);
        }

        // ซ่อนการ์ดขนาดใหญ่หลังแจกสมบัติเสร็จ
        elements.revealCard.classList.add('hidden');
        state.turnNumber += 1;
        state.pathCards.push(card);

        renderGameBoard(); enterDecisionPhase();
      }

      function enterDecisionPhase() {
        state.phase = 'decision'; state.decisions = {}; setBotDecisions();
        const activePlayers = state.currentRoom.players.filter(p => p.active);
        const humanActive = activePlayers.find(p => !p.isBot);

        if (!humanActive) {
          resolveDecisions(); // บอทเล่นกันเอง
        } else {
          updateGameControls();
        }
      }

      function showHazardVideo(key) {
        const source = hazardVideoMap[key] || 'อุปสรรค/Tiger.mp4';
        elements.hazardVideo.src = source;
        elements.hazardVideo.playbackRate = 1.25;
        elements.hazardOverlay.classList.remove('hidden');
        elements.hazardVideo.play().catch(() => {});
      }

      function hideHazardVideo() {
        const failed = state.phase === 'hazard';
        elements.hazardOverlay.classList.add('hidden');
        elements.hazardVideo.pause(); elements.hazardVideo.currentTime = 0;
        if (failed) finishRound('failure');
      }

      function showDecisionBubble(playerId, choice) {
        const seat = document.querySelector(`[data-player-id="${playerId}"]`);
        const player = state.currentRoom?.players.find(p => p.id === playerId);
        if (!seat || !player) return;
        const bubble = document.createElement('div');
        bubble.className = `speech-bubble ${choice === 'continue' ? 'good' : 'bad'}`;
        bubble.textContent = `${player.name}: ${choice === 'continue' ? 'ไปกันต่อ~' : 'กลับแคมป์'}`;
        seat.appendChild(bubble);
        setTimeout(() => bubble.remove(), 4200);
      }

      function initializeGame() {
        clearTimeout(state.revealTimer);
        clearInterval(state.countdownTimer);
        clearTimeout(state.roundTimer);
        clearGameStatus();
        elements.countdownOverlay.classList.remove('active');
        state.roundNumber = 0; state.turnNumber = 0; state.phase = 'ready';
        state.routeDeck = shuffle(createBaseDeck()); state.pathCards = []; state.seenHazards = new Set();
        state.artifactReserve = artifactDefinitions.map(a => ({ ...a })); state.collectedArtifactCount = 0;
        elements.gameSummary.classList.add('hidden');
        state.currentRoom.players.forEach(p => { p.safeTreasure = 0; p.artifactPoints = 0; p.artifacts = []; p.carriedTreasure = 0; p.active = true; });
        startNextRound();
      }

      function startNextRound() {
        if (state.roundNumber >= 5) { completeGame(); return; }
        clearGameStatus();
        state.roundNumber += 1; state.turnNumber = 0; state.pathCards = []; state.seenHazards = new Set(); state.decisions = {};
        state.currentRoom.players.forEach(p => { p.carriedTreasure = 0; p.active = true; });
        const nextArtifact = state.artifactReserve.shift();
        if (nextArtifact) state.routeDeck.push(createCard('artifact', nextArtifact));
        shuffle(state.routeDeck);
        
        // ให้ผู้เล่นตัดสินใจตั้งแต่ก่อนเปิดการ์ดใบแรก (แทนที่การจั่วอัตโนมัติ)
        renderGameBoard(); 
        enterDecisionPhase(); 
      }

      function updateGameStatus() {
        if (!state.currentRoom) return;
        const looseTreasure = state.pathCards.reduce((total, card) => total + (card.remainder || 0), 0);
        elements.looseTreasureCount.textContent = String(looseTreasure);
      }

      function updateGameControls() {
        if (!state.currentRoom) return;
        const me = state.currentRoom.players.find(p => p.isMe);
        const isMyTurnToDecide = state.phase === 'decision' && me && me.active && !state.decisions[me.id];
        
        elements.btnContinue.disabled = !isMyTurnToDecide;
        elements.btnCamp.disabled = !isMyTurnToDecide;
        
        if (state.phase === 'decision' && !state.statusMessage) setGameStatus('กำลังรอผู้เล่นตัดสินใจ', 0);
        if (state.phase === 'roundEnd' && !state.statusMessage) setGameStatus('รอบนี้จบแล้ว', 0);
      }

      function startAutoCountdown(campMessage = '') {
        state.phase = 'countdown';
        let count = 3;
        elements.countdownOverlay.textContent = count; elements.countdownOverlay.classList.add('active');
        const updateCountdownMessage = () => {
          const countdownMessage = `ผู้เล่นตัดสินใจแล้ว จะเปิดผลใน ${count}`;
          setGameStatus(campMessage ? `${campMessage}\n${countdownMessage}` : countdownMessage, 0);
        };
        updateCountdownMessage();
        playBeep(440, 'sine', 150);

        state.countdownTimer = setInterval(() => {
          count--;
          if (count > 0) {
            elements.countdownOverlay.textContent = count;
            updateCountdownMessage();
            playBeep(440, 'sine', 150);
          } else {
            clearInterval(state.countdownTimer);
            state.countdownTimer = null;
            elements.countdownOverlay.classList.remove('active');
            playBeep(880, 'sine', 300, 0.1);
            setGameStatus('เดินทางต่อ~', 0);
            state.revealTimer = setTimeout(drawNextCard, 350);
          }
        }, 1000);
      }

      function drawNextCard() {
        clearTimeout(state.revealTimer);
        state.revealTimer = null;
        clearGameStatus();
        if (state.routeDeck.length === 0) { returnExplorersTogether(); return; }
        const card = state.routeDeck.pop(); state.phase = 'revealing'; displayRevealedCard(card); updateGameControls();
      }

      function handleDecision(playerId, action, fromRemote = false) {
        initAudio();
        const room = state.currentRoom;
        const player = room?.players.find(p => p.id === playerId);

        if (state.phase !== 'decision' || !player?.active || state.decisions[playerId]) return;
        clearGameStatus();
        state.decisions[playerId] = action;

        // ส่งข้อมูลให้ Firebase โดยต้องระบุ uid ของเราด้วย
        if (room && room.isRemote && !fromRemote && player.isMe) {
          if (window.RoomBackend && window.RoomBackend.publishAction) {
            window.RoomBackend.publishAction(room.id, {
              uid: window.RoomBackend.uid, // สำคัญมาก: ระบุ uid เพื่อให้ Host รู้ว่าใครเป็นคนกด
              roundNumber: state.roundNumber,
              turnNumber: state.turnNumber,
              action: action
            }).catch(err => console.error("ส่งข้อมูลการตัดสินใจไม่สำเร็จ:", err));
          }
        }

        const activePlayers = room.players.filter(p => p.active);
        const allSelected = activePlayers.every(p => state.decisions[p.id]);
        updateGameControls();

        // เมื่อทุกคนตัดสินใจครบแล้ว ให้ Host (เจ้าของห้อง) เป็นคนสรุปผลเกม
        if (allSelected) {
          const isHost = room?.isRemote ? room.ownerUid === window.RoomBackend.uid : true;
          if (isHost) {
            resolveDecisions();
          }
        }
      }

      function chooseBotDecision(bot) {
        const rp = { cautious: { r: 0.12, l: 0.7 }, balanced: { r: 0.2, l: 1.1 }, bold: { r: 0.3, l: 1.7 } }[bot.botStyle] || { r: 0.2, l: 1.1 };
        const act = Math.max(1, state.currentRoom.players.filter(p => p.active).length);
        const dupRisk = state.routeDeck.filter(c => c.type === 'hazard' && state.seenHazards.has(c.key)).length / Math.max(1, state.routeDeck.length);
        const expTreas = state.routeDeck.reduce((sum, c) => sum + (c.type === 'treasure' ? c.value : 0), 0) / Math.max(1, state.routeDeck.length) / act;
        const loose = state.pathCards.reduce((sum, c) => sum + (c.remainder || 0), 0);
        const expLoss = dupRisk * (bot.carriedTreasure + loose / act);
        const riskLim = Math.max(0.07, rp.r - (Math.max(0, state.roundNumber - 2) * 0.015));
        return (dupRisk >= riskLim || expLoss > Math.max(0.5, expTreas * rp.l)) ? 'camp' : 'continue';
      }

      function setBotDecisions() { state.currentRoom.players.filter(p => p.active && p.isBot).forEach(bot => state.decisions[bot.id] = chooseBotDecision(bot)); }

      function distributeLooseTreasure(players) {
        if (!players.length) return;
        const tc = state.pathCards.filter(c => c.type === 'treasure');
        const share = Math.floor(tc.reduce((s, c) => s + c.remainder, 0) / players.length);
        let rem = share * players.length;
        players.forEach(p => p.carriedTreasure += share);
        tc.forEach(c => { const rm = Math.min(c.remainder, rem); c.remainder -= rm; rem -= rm; });
      }

      function bankPlayers(players, allowArtifact) {
        players.forEach(p => { p.safeTreasure += p.carriedTreasure; p.carriedTreasure = 0; p.active = false; });
        if (allowArtifact && players.length === 1) {
          const idx = state.pathCards.findIndex(c => c.type === 'artifact');
          if (idx !== -1) {
            const art = state.pathCards.splice(idx, 1)[0]; art.score = state.collectedArtifactCount < 3 ? 5 : 10;
            state.collectedArtifactCount++; players[0].artifacts.push(art); players[0].artifactPoints += art.score;
          }
        }
      }

      function formatPlayerNames(players) {
        if (players.length < 2) return players[0]?.name || '';
        if (players.length === 2) return `${players[0].name} และ ${players[1].name}`;
        return `${players.slice(0, -1).map(player => player.name).join(', ')} และ ${players.at(-1).name}`;
      }

      function getCampMessage(campers) {
        if (!campers.length) return '';
        const looseTreasure = state.pathCards
          .filter(card => card.type === 'treasure')
          .reduce((total, card) => total + card.remainder, 0);
        const looseShare = Math.floor(looseTreasure / campers.length);
        const totals = campers.map(player => player.carriedTreasure + looseShare);
        const artifact = campers.length === 1 ? state.pathCards.find(card => card.type === 'artifact') : null;
        let message;

        if (campers.length === 1) {
          const amount = totals[0];
          message = amount
            ? `${campers[0].name} กลับแคมป์ พร้อมคว้าเงินพดด้วง ${amount} ก้อนกลับไปด้วย`
            : `${campers[0].name} กลับแคมป์ พร้อมมือเปล่า`;
        } else if (totals.every(amount => amount === totals[0])) {
          message = `${formatPlayerNames(campers)} กลับแคมป์ พร้อมคว้าเงินพดด้วงคนละ ${totals[0]} ก้อนกลับไปด้วย`;
        } else {
          const returns = campers.map((player, index) =>
            `${player.name} คว้าเงินพดด้วง ${totals[index]} ก้อน`
          );
          message = `${formatPlayerNames(campers)} กลับแคมป์ พร้อมคว้า${returns.join(' และ ')}กลับไปด้วย`;
        }

        if (artifact) message += ` และอาติแฟกต์ "${artifact.name}"`;
        return message;
      }

      function resolveDecisions() {
        const choices = { ...state.decisions };
        const active = state.currentRoom.players.filter(p => p.active);
        const campers = active.filter(p => choices[p.id] === 'camp');
        const continuing = active.filter(p => choices[p.id] === 'continue');

        Object.entries(choices).forEach(([id, choice]) => showDecisionBubble(id, choice));

        const campMessage = getCampMessage(campers);
        distributeLooseTreasure(campers);
        bankPlayers(campers, true);
        state.decisions = {};
        renderGameBoard();
        if (continuing.length === 0) { finishRound('returned', campMessage); return; }
        if (state.routeDeck.length === 0) { returnExplorersTogether(campMessage); return; }
        startAutoCountdown(campMessage);
      }

      function returnExplorersTogether(statusDetail = '') {
        const explorers = state.currentRoom.players.filter(p => p.active);
        distributeLooseTreasure(explorers); bankPlayers(explorers, false); finishRound('returned', statusDetail);
      }

      function finishRound(result, statusDetail = '') {
        state.currentRoom.players.forEach(p => { p.active = false; p.carriedTreasure = 0; });
        state.routeDeck = shuffle([...state.routeDeck, ...state.pathCards]); state.pathCards = []; state.decisions = {};
        state.phase = 'roundEnd'; renderGameBoard();
        const resultMessage = result === 'failure'
          ? 'คณะเดินทางเสียชีวิตจากอุปสรรคซ้ำ สมบัติที่ยังถืออยู่สูญหาย'
          : 'คณะเดินทางกลับแคมป์อย่างปลอดภัย ไม่มีใครเสียชีวิต!';
        setGameStatus([statusDetail, resultMessage].filter(Boolean).join('\n'));
        if (state.roundNumber === 5) completeGame(); else {
          clearTimeout(state.roundTimer);
          state.roundTimer = setTimeout(() => {
            state.roundTimer = null;
            if (state.currentRoom) startNextRound();
          }, 5000);
        }
      }

      function completeGame() {
        state.phase = 'gameOver';
        const ranked = state.currentRoom.players.slice().sort((a, b) => (b.safeTreasure + b.artifactPoints) - (a.safeTreasure + a.artifactPoints) || b.artifacts.length - a.artifacts.length);
        const top = ranked[0].safeTreasure + ranked[0].artifactPoints;
        const winners = ranked.filter(p => p.safeTreasure + p.artifactPoints === top && p.artifacts.length === ranked[0].artifacts.length);
        elements.summaryTitle.textContent = winners.length > 1 ? `เสมอ: ${winners.map(w => w.name).join(', ')}` : `ผู้ชนะ: ${ranked[0].name}`;
        elements.summaryList.replaceChildren();
        ranked.forEach(p => {
          const li = document.createElement('li'); li.textContent = `${p.name}: ${p.safeTreasure + p.artifactPoints} คะแนน (อาติแฟกต์ ${p.artifacts.length})`;
          elements.summaryList.appendChild(li);
        });
        elements.gameSummary.classList.remove('hidden'); saveRooms(); renderGameBoard();
      }

      function init() {
        elements.usernameInput.value = state.username; elements.welcomeName.textContent = state.username || 'ผู้เล่น';
        renderColorPicker();
        showScreen(state.username ? 'lobby' : 'auth'); renderRoomList();
        connectFirebaseRooms();

        elements.createRoomBtn.addEventListener('click', () => {
          state.roomBotCount = 2;
          elements.createRoomBotCount.textContent = String(state.roomBotCount);
          elements.createRoomNameInput.value = `ห้องของ ${state.username || 'นักสำรวจ'}`;
          elements.createRoomModal.classList.remove('hidden');
          elements.createRoomNameInput.focus();
        });
        elements.createRoomRemoveBotBtn.addEventListener('click', () => {
          state.roomBotCount = Math.max(0, state.roomBotCount - 1);
          elements.createRoomBotCount.textContent = String(state.roomBotCount);
        });
        elements.createRoomAddBotBtn.addEventListener('click', () => {
          state.roomBotCount = Math.min(7, state.roomBotCount + 1);
          elements.createRoomBotCount.textContent = String(state.roomBotCount);
        });
        elements.cancelCreateRoomBtn.addEventListener('click', () => elements.createRoomModal.classList.add('hidden'));
        elements.createRoomForm.addEventListener('submit', createRoomFromForm);
        elements.openJoinRoomBtn.addEventListener('click', () => {
          elements.joinRoomCodeInput.value = '';
          elements.joinRoomModal.classList.remove('hidden');
          elements.joinRoomCodeInput.focus();
        });
        elements.joinRoomCodeInput.addEventListener('input', () => {
          elements.joinRoomCodeInput.value = elements.joinRoomCodeInput.value.replace(/\D/g, '').slice(0, 6);
        });
        elements.cancelJoinRoomBtn.addEventListener('click', () => elements.joinRoomModal.classList.add('hidden'));
        elements.joinRoomForm.addEventListener('submit', joinRoomByCode);
        elements.addBotBtn.addEventListener('click', addRoomBot);
        elements.removeBotBtn.addEventListener('click', removeRoomBot);
        elements.startRoomGameBtn.addEventListener('click', startRoomGame);
        elements.leaveWaitingRoomBtn.addEventListener('click', leaveWaitingRoom);
        elements.cancelWaitingColorBtn.addEventListener('click', () => elements.waitingColorModal.classList.add('hidden'));
        [elements.createRoomModal, elements.joinRoomModal, elements.waitingColorModal].forEach((modal) => {
          modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.classList.add('hidden');
          });
        });
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            elements.createRoomModal.classList.add('hidden');
            elements.joinRoomModal.classList.add('hidden');
            elements.waitingColorModal.classList.add('hidden');
          }
        });

        elements.enterLobbyBtn.addEventListener('click', () => {
          initAudio();
          setUsername();
          showScreen('lobby');
          bgMusic.volume = state.volume * 0.35;
          if (state.musicEnabled) bgMusic.play().catch(() => {});
        });
        elements.testGameBtn.addEventListener('click', () => joinRoom(testRoom.id));
        elements.btnContinue.addEventListener('click', () => { const me = state.currentRoom?.players.find(p => p.isMe); if(me) handleDecision(me.id, 'continue'); });
        elements.btnCamp.addEventListener('click', () => { const me = state.currentRoom?.players.find(p => p.isMe); if(me) handleDecision(me.id, 'camp'); });
        elements.logoutBtn.addEventListener('click', () => {
          state.username = '';
          localStorage.removeItem(STORAGE_KEYS.username);
          elements.usernameInput.value = '';
          showScreen('auth');
          bgMusic.pause();
          bgMusic.currentTime = 0;
        });
        document.addEventListener('click', (event) => {
          const clickedElement = event.target instanceof Element ? event.target : null;
          const menuToggle = clickedElement?.closest('#mobileMenuToggle');
          if (menuToggle) {
            const isOpening = elements.mobileGameMenu.hidden;
            elements.mobileGameMenu.hidden = !isOpening;
            elements.mobileMenuToggle.setAttribute('aria-expanded', String(isOpening));
          } else if (!elements.mobileGameMenu.hidden && !elements.mobileGameMenu.contains(clickedElement)) {
            closeMobileGameMenu();
          }

          const avatar = clickedElement?.closest('.seat.is-me .seat-avatar');
          document.querySelectorAll('.seat-camp-panel:not(.hidden)').forEach((panel) => {
            const seat = panel.parentElement;
            if (seat && !seat.contains(clickedElement)) {
              panel.classList.add('hidden');
              seat.querySelector('.seat-avatar')?.setAttribute('aria-expanded', 'false');
            }
          });
          if (avatar) {
            const panel = avatar.closest('.seat')?.querySelector('.seat-camp-panel');
            const isOpen = panel && !panel.classList.contains('hidden');
            panel?.classList.toggle('hidden', Boolean(isOpen));
            avatar.setAttribute('aria-expanded', String(!isOpen));
          }
        });
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') closeMobileGameMenu();
          if (event.key === 'Enter' || event.key === ' ') {
            const avatar = event.target instanceof Element ? event.target.closest('.seat.is-me .seat-avatar') : null;
            if (avatar) {
              event.preventDefault();
              avatar.click();
            }
          }
        });
        elements.leaveRoomBtn.addEventListener('click', leaveLobby);
        elements.mobileExitBtn.addEventListener('click', leaveLobby);
        elements.dismissHazardBtn.addEventListener('click', hideHazardVideo);
        elements.hazardVideo.addEventListener('ended', hideHazardVideo);
        elements.restartGameBtn.addEventListener('click', initializeGame);
        window.addEventListener('resize', renderStack);
        // --- ระบบตั้งค่าเสียง (Global Volume) ---
        setBackgroundMusicEnabled(state.musicEnabled);
        bgMusic.volume = state.volume * 0.35;
        coinSound.volume = state.volume;
        document.querySelectorAll('audio, video').forEach(media => {
          media.volume = state.volume;
        });
        elements.volumeSlider.value = state.volume;
        elements.volumeToggleBtn.addEventListener('click', () => {
          elements.volumePopup.classList.toggle('hidden');
        });
        elements.volumeSlider.addEventListener('input', (event) => {
          state.volume = Number(event.target.value);
          localStorage.setItem('luna-volume', String(state.volume));
          bgMusic.volume = state.volume * 0.35;
          coinSound.volume = state.volume;
          if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(state.volume, audioCtx.currentTime, 0.02);
          document.querySelectorAll('audio, video').forEach(media => {
            media.volume = state.volume;
          });
        });
        elements.musicToggleBtn.addEventListener('click', () => {
          initAudio();
          setBackgroundMusicEnabled(!state.musicEnabled, !state.musicEnabled);
        });
      }

      function connectFirebaseRooms() {
        if (!window.RoomBackend) return;
        window.RoomBackend.ready.then(() => {
          unsubscribeOpenRooms?.();
          unsubscribeOpenRooms = window.RoomBackend.subscribeOpenRooms(updateRoomListFromFirebase, (error) => {
            showNotification(`โหลดห้องจาก Firebase ไม่สำเร็จ: ${error.message}`);
          });
        }).catch((error) => showNotification(`Firebase Auth ยังไม่พร้อม: ${error.message}`));
      }

      init();
      window.addEventListener('room-backend-ready', connectFirebaseRooms, { once: true });
