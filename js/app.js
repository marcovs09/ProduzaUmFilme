// CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBfy9NSEVm_PGvQIIvZquCsxTygnt-uapQ",
    authDomain: "produza-um-filme.firebaseapp.com",
    projectId: "produza-um-filme",
    storageBucket: "produza-um-filme.firebasestorage.app",
    messagingSenderId: "20415251900",
    appId: "1:20415251900:web:3f94757101862baf3997b9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============ ESTADO DO JOGO ============
const GameState = {
    playerId: null,
    roomId: null,
    playerName: '',
    character: '',
    maxPlayers: 4,
    players: {},
    role: null,
    currentScreen: 'home',
    isHost: false,
    lastStep: null,
    resultReady: false
};

// ============ PERSONAGENS PERSONALIZADOS ============
const CHARACTERS = [
    { name: 'Personagem 1', image: 'https://i.ibb.co/mryc6mxS/IMG-20260903-132043.png' },
    { name: 'Personagem 2', image: 'https://i.ibb.co/fzQCzTVq/IMG-20260903-132109.png' },
    { name: 'Personagem 3', image: 'https://i.ibb.co/DHbnWfQW/IMG-20260903-132147.png' },
    { name: 'Personagem 4', image: 'https://i.ibb.co/dCZdGbq/IMG-20260903-132222.png' },
    { name: 'Personagem 5', image: 'https://i.ibb.co/bjs04VQF/IMG-20260903-132251.png' },
    { name: 'Personagem 6', image: 'https://i.ibb.co/MyLxg50s/IMG-20260903-132315.png' },
    { name: 'Personagem 7', image: 'https://i.ibb.co/JRL9vXCt/IMG-20260903-132333.png' },
    { name: 'Personagem 8', image: 'https://i.ibb.co/jPkq23bJ/IMG-20260903-132411.png' },
    { name: 'Personagem 9', image: 'https://i.ibb.co/hx9D7GFT/IMG-20260903-132438.png' },
    { name: 'Personagem 10', image: 'https://i.ibb.co/VWcgP2nZ/IMG-20260903-132504.png' },
    { name: 'Personagem 11', image: 'https://i.ibb.co/gZVTvCC1/IMG-20260903-132544.png' },
    { name: 'Personagem 12', image: 'https://i.ibb.co/DDVKD6vg/IMG-20260903-132605.png' },
    { name: 'Personagem 13', image: 'https://i.ibb.co/3Y04mCrB/IMG-20260903-133215.png' },
    { name: 'Personagem 14', image: 'https://i.ibb.co/HDwxJ2q8/IMG-20260903-133148.png' },
    { name: 'Personagem 15', image: 'https://i.ibb.co/Zpb32fc2/IMG-20260903-133110.png' },
    { name: 'Personagem 16', image: 'https://i.ibb.co/tTvrqGVj/IMG-20260903-133045.png' }
];

// ============ VARIÁVEIS GLOBAIS ============
let selectedCharacter = null;
let selectedPlayerCount = 4;
let joinCharacter = null;

// ============ FUNÇÕES DE UI ============
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    GameState.currentScreen = screenId;
}

function showWaiting(message, detail = '', emoji = '🎬', movieTitle = '') {
    const detailHTML = movieTitle 
        ? `${detail}<br><span style="color: var(--accent); font-weight: 700; display: block; margin-top: 8px;">🎞️ "${movieTitle}"</span>`
        : detail;
    
    if (GameState.currentScreen === 'waitingScreen') {
        document.getElementById('waitingMessage').textContent = message;
        document.getElementById('waitingDetail').innerHTML = detailHTML;
        document.getElementById('waitingEmoji').textContent = emoji;
        return;
    }
    showScreen('waitingScreen');
    document.getElementById('waitingMessage').textContent = message;
    document.getElementById('waitingDetail').innerHTML = detailHTML;
    document.getElementById('waitingEmoji').textContent = emoji;
}

function generatePlayerId() {
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 8);
    const random2 = Math.random().toString(36).substring(2, 5);
    const random3 = Math.random().toString(36).substring(2, 4);
    return 'p_' + timestamp + '_' + random1 + '_' + random2 + '_' + random3;
}

// ============ TELA INICIAL ============
document.getElementById('createRoomBtn').addEventListener('click', () => {
    showScreen('createRoomScreen');
    setupCharacterSelection();
});

document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const code = document.getElementById('roomCode').value.trim().toUpperCase();
    if (code.length >= 3) {
        showJoinModal(code);
    } else {
        alert('Digite um código de sala válido.');
    }
});

document.getElementById('roomCode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('joinRoomBtn').click();
});

document.getElementById('backFromCreate').addEventListener('click', () => {
    showScreen('homeScreen');
});

// ============ MODAL DE ENTRADA ============
function showJoinModal(roomCode) {
    const modal = document.createElement('div');
    modal.id = 'joinModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(10px);
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: rgba(255,255,255,0.05);
            padding: 40px;
            border-radius: 16px;
            max-width: 400px;
            width: 90%;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            animation: slideUp 0.3s ease;
        ">
            <h2 style="font-family: 'Fredoka One', cursive; font-size: 1.5rem; margin-bottom: 20px; text-align: center; color: var(--accent);">
                🎬 Entrar na Sala
            </h2>
            <p style="text-align: center; color: rgba(255,255,255,0.6); margin-bottom: 20px;">
                Código: <strong style="color: white;">${roomCode}</strong>
            </p>
            
            <div class="form-group">
                <label>Seu nome</label>
                <input type="text" id="joinNameInput" class="input-field" placeholder="Digite seu nickname" maxlength="20" />
            </div>
            
            <div class="form-group">
                <label>Escolha seu personagem</label>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px;">
                    ${CHARACTERS.map(char => `
                        <div class="character-option join-char" data-char="${char.image}" style="
                            padding: 8px;
                            border-radius: 8px;
                            border: 2px solid rgba(255,255,255,0.1);
                            background: rgba(255,255,255,0.05);
                            cursor: pointer;
                            text-align: center;
                            transition: all 0.3s ease;
                        ">
                            <img src="${char.image}" alt="${char.name}" style="width: 40px; height: 40px; object-fit: contain; display: block; margin: 0 auto;" />
                            <span style="font-size: 0.6rem; color: rgba(255,255,255,0.5); display: block; margin-top: 2px;">${char.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button id="confirmJoinBtn" class="btn btn-primary" style="flex: 1;">✅ ENTRAR</button>
                <button id="cancelJoinBtn" class="btn btn-secondary" style="flex: 1;">❌ CANCELAR</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.join-char').forEach(el => {
        el.addEventListener('click', () => {
            modal.querySelectorAll('.join-char').forEach(e => {
                e.style.borderColor = 'rgba(255,255,255,0.1)';
                e.style.background = 'rgba(255,255,255,0.05)';
            });
            el.style.borderColor = 'var(--primary)';
            el.style.background = 'rgba(108, 60, 225, 0.2)';
            joinCharacter = el.dataset.char;
        });
    });
    
    document.getElementById('confirmJoinBtn').addEventListener('click', () => {
        const name = document.getElementById('joinNameInput').value.trim();
        if (!name) { alert('Digite seu nome!'); return; }
        if (!joinCharacter) { alert('Escolha um personagem!'); return; }
        
        document.body.removeChild(modal);
        executeJoinRoom(roomCode, name, joinCharacter);
    });
    
    document.getElementById('cancelJoinBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function executeJoinRoom(code, name, character) {
    const roomRef = db.ref('rooms/' + code);
    
    roomRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            alert('Sala não encontrada!');
            return;
        }
        
        const data = snapshot.val();
        const players = data.players || {};
        const playerIds = Object.keys(players);
        const maxPlayers = data.maxPlayers || 4;
        
        const currentPlayerCount = playerIds.length;
        if (currentPlayerCount >= maxPlayers) {
            alert('Sala cheia!');
            return;
        }
        
        const newPlayerId = generatePlayerId();
        
        if (players[newPlayerId]) {
            console.warn('⚠️ ID duplicado detectado, gerando outro...');
            return executeJoinRoom(code, name, character);
        }
        
        GameState.playerName = name;
        GameState.character = character;
        GameState.roomId = code;
        GameState.playerId = newPlayerId;
        GameState.isHost = false;
        GameState.maxPlayers = data.maxPlayers;
        
        const playerData = {
            id: newPlayerId,
            name: name,
            character: character,
            isHost: false,
            role: null,
            joinedAt: Date.now()
        };
        
        const updates = {};
        updates['players/' + newPlayerId] = playerData;
        
        roomRef.update(updates).then(() => {
            document.getElementById('roomCodeDisplay').textContent = code;
            updateLobby();
            showScreen('lobbyScreen');
            listenRoomChanges();
        }).catch(err => {
            console.error('Erro ao entrar na sala:', err);
            alert('Erro ao entrar na sala.');
        });
    }).catch(err => {
        console.error('Erro ao verificar sala:', err);
        alert('Erro ao verificar sala. Tente novamente.');
    });
}

// ============ CRIAÇÃO DE SALA ============
function setupCharacterSelection() {
    const grid = document.getElementById('characterGrid');
    grid.innerHTML = '';
    CHARACTERS.forEach(char => {
        const div = document.createElement('div');
        div.className = 'character-option';
        div.innerHTML = `
            <img src="${char.image}" alt="${char.name}" loading="lazy" />
            <span class="char-name">${char.name}</span>
        `;
        div.dataset.character = char.image;
        div.addEventListener('click', () => {
            document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            selectedCharacter = char.image;
        });
        grid.appendChild(div);
    });
}

document.querySelectorAll('.count-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.count-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedPlayerCount = parseInt(btn.dataset.count);
    });
});

document.getElementById('confirmCreateRoom').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    if (!name) { alert('Digite seu nome!'); return; }
    if (!selectedCharacter) { alert('Escolha um personagem!'); return; }
    
    GameState.playerName = name;
    GameState.character = selectedCharacter;
    GameState.maxPlayers = selectedPlayerCount;
    createRoom();
});

function createRoom() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    GameState.roomId = code;
    GameState.playerId = generatePlayerId();
    GameState.isHost = true;
    
    const roomRef = db.ref('rooms/' + code);
    const playerData = {
        id: GameState.playerId,
        name: GameState.playerName,
        character: GameState.character,
        isHost: true,
        role: null,
        joinedAt: Date.now()
    };
    
    roomRef.set({
        createdAt: Date.now(),
        maxPlayers: GameState.maxPlayers,
        status: 'waiting',
        players: {
            [GameState.playerId]: playerData
        },
        gameData: {
            directorTitle: '',
            directorDescription: '',
            frames: [],
            script: '',
            audio: null
        },
        step: 'lobby'
    }).then(() => {
        document.getElementById('roomCodeDisplay').textContent = code;
        updateLobby();
        showScreen('lobbyScreen');
        listenRoomChanges();
    }).catch(err => {
        console.error('Erro ao criar sala:', err);
        alert('Erro ao criar sala. Tente novamente.');
    });
}

// ============ LOBBY ============
function listenRoomChanges() {
    const roomRef = db.ref('rooms/' + GameState.roomId);
    roomRef.on('value', snapshot => {
        if (!snapshot.exists()) {
            alert('A sala foi encerrada.');
            showScreen('homeScreen');
            return;
        }
        
        const data = snapshot.val();
        
        if (data.maxPlayers) {
            GameState.maxPlayers = data.maxPlayers;
        }
        
        if (data.players) {
            GameState.players = data.players;
            if (data.players[GameState.playerId]) {
                const newRole = data.players[GameState.playerId].role;
                if (newRole !== GameState.role) {
                    GameState.role = newRole;
                }
            }
            updateLobby();
        }
        
        const currentStep = data.step || 'lobby';
        const playerRole = GameState.role;
        const playerCount = GameState.maxPlayers;
        const movieTitle = data.gameData?.directorTitle || '';
        
        if (data.status === 'roles') {
            if (GameState.currentScreen !== 'roleSelectionScreen') {
                showScreen('roleSelectionScreen');
                setupRoles(data);
            } else {
                setupRoles(data);
            }
            GameState.lastStep = 'roles';
            return;
        }
        
        if (data.status === 'playing') {
            if (currentStep === 'director') {
                if (playerCount === 2) {
                    const roomRefUpdate = db.ref('rooms/' + GameState.roomId);
                    roomRefUpdate.update({ step: 'animator' });
                    GameState.lastStep = currentStep;
                    return;
                }
                
                if (playerRole === 'director') {
                    showScreen('directorScreen');
                    loadDirectorData(data);
                } else {
                    showWaiting('🎬 O Diretor está escrevendo a cena...', 'Aguardando o Diretor finalizar', '🎬', movieTitle);
                }
                GameState.lastStep = currentStep;
                return;
            }
            
            if (currentStep === 'animator') {
                if (playerRole === 'animator') {
                    showScreen('animatorScreen');
                    loadAnimatorData(data);
                } else {
                    showWaiting('🎨 O Animador está criando a animação...', 'Aguardando o Animador finalizar', '🎨', movieTitle);
                }
                GameState.lastStep = currentStep;
                return;
            }
            
            if (currentStep === 'screenwriter') {
                if (playerCount !== 4) {
                    const roomRefUpdate = db.ref('rooms/' + GameState.roomId);
                    roomRefUpdate.update({ step: 'voice-actor' });
                    GameState.lastStep = currentStep;
                    return;
                }
                
                if (playerRole === 'screenwriter') {
                    showScreen('screenwriterScreen');
                    loadScreenwriterData(data);
                } else {
                    showWaiting('📝 O Roteirista está escrevendo...', 'Aguardando o Roteirista finalizar', '📝', movieTitle);
                }
                GameState.lastStep = currentStep;
                return;
            }
            
            if (currentStep === 'voice-actor') {
                if (playerRole === 'voice-actor') {
                    showScreen('voiceActorScreen');
                    loadVoiceActorData(data);
                } else {
                    showWaiting('🎙️ O Dublador está gravando...', 'Aguardando o Dublador finalizar', '🎙️', movieTitle);
                }
                GameState.lastStep = currentStep;
                return;
            }
            
            if (currentStep === 'result') {
                // 🔧 CORREÇÃO: Mostra o resultado para TODOS
                showScreen('resultScreen');
                loadResultData(data);
                GameState.lastStep = currentStep;
                return;
            }
        }
        
        GameState.lastStep = currentStep;
    });
}

function updateLobby() {
    const grid = document.getElementById('playersGrid');
    grid.innerHTML = '';
    
    const players = GameState.players || {};
    const playerCount = Object.keys(players).length;
    const maxPlayers = GameState.maxPlayers || 4;
    
    Object.values(players).forEach(p => {
        const card = document.createElement('div');
        card.className = 'player-card';
        
        const avatarHtml = p.character && p.character.startsWith('http') 
            ? `<img src="${p.character}" alt="${p.name}" />`
            : `<span style="font-size: 2rem;">${p.character || '🎭'}</span>`;
        
        card.innerHTML = `
            <div class="avatar">${avatarHtml}</div>
            <div class="name">${p.name}</div>
            <div class="status">${p.isHost ? '👑 Criador' : '🎭 Jogador'}</div>
        `;
        grid.appendChild(card);
    });
    
    for (let i = playerCount; i < maxPlayers; i++) {
        const card = document.createElement('div');
        card.className = 'player-card empty';
        card.innerHTML = `
            <span class="avatar">❓</span>
            <div class="name">Aguardando...</div>
            <div class="status">vazio</div>
        `;
        grid.appendChild(card);
    }
    
    const status = document.getElementById('lobbyStatus');
    if (playerCount >= maxPlayers) {
        status.textContent = '✅ Sala cheia! Pronto para começar!';
        document.getElementById('startGameBtn').disabled = false;
    } else {
        status.textContent = `👥 ${playerCount}/${maxPlayers} jogadores aguardando...`;
        document.getElementById('startGameBtn').disabled = true;
    }
}

// ============ AÇÕES DO LOBBY ============
document.getElementById('startGameBtn').addEventListener('click', () => {
    if (!GameState.isHost) return;
    const roomRef = db.ref('rooms/' + GameState.roomId);
    roomRef.update({ status: 'roles', step: 'roles' });
});

document.getElementById('copyCodeBtn').addEventListener('click', () => {
    const code = document.getElementById('roomCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyCodeBtn');
        btn.textContent = '✅ COPIADO!';
        setTimeout(() => btn.textContent = '📋 COPIAR', 2000);
    }).catch(() => {
        alert('Código: ' + code);
    });
});

document.getElementById('leaveLobbyBtn').addEventListener('click', leaveRoom);

function leaveRoom() {
    if (GameState.roomId && GameState.playerId) {
        const roomRef = db.ref('rooms/' + GameState.roomId);
        const playerRef = roomRef.child('players/' + GameState.playerId);
        playerRef.remove().then(() => {
            roomRef.once('value').then(snapshot => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const players = data.players || {};
                    const playerCount = Object.keys(players).length;
                    if (playerCount === 0) {
                        roomRef.remove().catch(err => {
                            console.error('Erro ao remover sala:', err);
                        });
                    }
                }
            });
        }).catch(err => {
            console.error('Erro ao remover jogador:', err);
        });
    }
    
    GameState.roomId = null;
    GameState.playerId = null;
    GameState.isHost = false;
    GameState.role = null;
    GameState.lastStep = null;
    GameState.players = {};
    GameState.maxPlayers = 4;
    
    showScreen('homeScreen');
}

// ============ SELEÇÃO DE CARGOS ============
function getRolesForMode(playerCount) {
    if (playerCount === 2) {
        return [
            { id: 'animator', name: 'Animador', icon: '🎨', desc: 'Transforme a ideia em uma animação quadro a quadro.' },
            { id: 'voice-actor', name: 'Dublador', icon: '🎙️', desc: 'Receba o roteiro e dê voz aos personagens.' }
        ];
    } else if (playerCount === 3) {
        return [
            { id: 'director', name: 'Diretor', icon: '🎬', desc: 'Crie a ideia da cena.' },
            { id: 'animator', name: 'Animador', icon: '🎨', desc: 'Transforme a ideia em animação.' },
            { id: 'voice-actor', name: 'Dublador', icon: '🎙️', desc: 'Receba o roteiro e dê voz.' }
        ];
    } else {
        return [
            { id: 'director', name: 'Diretor', icon: '🎬', desc: 'Crie a ideia da cena.' },
            { id: 'animator', name: 'Animador', icon: '🎨', desc: 'Transforme a ideia em animação.' },
            { id: 'screenwriter', name: 'Roteirista', icon: '📝', desc: 'Observe a animação e escreva as falas.' },
            { id: 'voice-actor', name: 'Dublador', icon: '🎙️', desc: 'Receba o roteiro e dê voz.' }
        ];
    }
}

function setupRoles(data) {
    const grid = document.getElementById('rolesGrid');
    grid.innerHTML = '';
    
    const maxPlayers = data.maxPlayers || GameState.maxPlayers || 4;
    const availableRoles = getRolesForMode(maxPlayers);
    const takenRoles = {};
    
    if (data.players) {
        Object.values(data.players).forEach(p => {
            if (p.role) {
                takenRoles[p.role] = p.name;
            }
        });
    }
    
    const myRole = GameState.role;
    
    availableRoles.forEach(role => {
        const card = document.createElement('div');
        card.className = 'role-card';
        const isTaken = takenRoles[role.id];
        const isMine = (myRole === role.id);
        
        if (isTaken && !isMine) {
            card.classList.add('taken');
            card.innerHTML = `
                <span class="role-icon">${role.icon}</span>
                <div class="role-name">${role.name}</div>
                <div class="taken-by">🔒 ${isTaken}</div>
                <div class="role-desc">${role.desc}</div>
            `;
            card.style.cursor = 'not-allowed';
        } else if (isMine) {
            card.classList.add('selected');
            card.style.borderColor = 'var(--primary)';
            card.style.background = 'rgba(108, 60, 225, 0.2)';
            card.innerHTML = `
                <span class="role-icon">${role.icon}</span>
                <div class="role-name">${role.name}</div>
                <div class="taken-by" style="color: var(--success);">✅ Você</div>
                <div class="role-desc">${role.desc}</div>
            `;
            card.style.cursor = 'default';
        } else {
            card.innerHTML = `
                <span class="role-icon">${role.icon}</span>
                <div class="role-name">${role.name}</div>
                <div class="role-desc">${role.desc}</div>
            `;
            card.style.cursor = 'pointer';
            card.addEventListener('click', function(e) {
                e.stopPropagation();
                selectRole(role.id);
            });
        }
        
        grid.appendChild(card);
    });
    
    const totalRoles = availableRoles.length;
    const takenCount = Object.keys(takenRoles).length;
    
    if (takenCount >= totalRoles) {
        document.getElementById('rolesStatus').textContent = '✅ Todos os cargos escolhidos! Iniciando...';
        setTimeout(() => {
            const roomRef = db.ref('rooms/' + GameState.roomId);
            roomRef.once('value').then(snap => {
                if (snap.exists()) {
                    const freshData = snap.val();
                    const freshPlayers = freshData.players || {};
                    let freshTaken = 0;
                    Object.values(freshPlayers).forEach(p => {
                        if (p.role) freshTaken++;
                    });
                    if (freshTaken >= totalRoles) {
                        const playerCount = GameState.maxPlayers;
                        let firstStep;
                        if (playerCount === 2) {
                            firstStep = 'animator';
                        } else {
                            firstStep = 'director';
                        }
                        console.log('🎬 Iniciando partida com', playerCount, 'jogadores - Primeira etapa:', firstStep);
                        const roomRefUpdate = db.ref('rooms/' + GameState.roomId);
                        roomRefUpdate.update({ status: 'playing', step: firstStep });
                    }
                }
            });
        }, 1500);
    } else {
        document.getElementById('rolesStatus').textContent = `📢 Escolha seu cargo (${takenCount}/${totalRoles})`;
    }
}

function selectRole(roleId) {
    const roomRef = db.ref('rooms/' + GameState.roomId);
    
    roomRef.once('value').then(snapshot => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        const players = data.players || {};
        
        let alreadyTaken = false;
        let takenByName = '';
        Object.values(players).forEach(p => {
            if (p.role === roleId && p.id !== GameState.playerId) {
                alreadyTaken = true;
                takenByName = p.name;
            }
        });
        
        if (alreadyTaken) {
            alert(`🔒 O cargo de "${getRoleName(roleId)}" já foi escolhido por ${takenByName}!`);
            roomRef.once('value').then(snap => {
                if (snap.exists()) setupRoles(snap.val());
            });
            return;
        }
        
        if (GameState.role) {
            const releaseUpdate = {};
            releaseUpdate['players/' + GameState.playerId + '/role'] = null;
            roomRef.update(releaseUpdate);
        }
        
        const newUpdates = {};
        newUpdates['players/' + GameState.playerId + '/role'] = roleId;
        roomRef.update(newUpdates).then(() => {
            GameState.role = roleId;
            roomRef.once('value').then(snap => {
                if (snap.exists()) {
                    setupRoles(snap.val());
                }
            });
        });
    }).catch(err => {
        console.error('Erro ao escolher cargo:', err);
        alert('Erro ao escolher cargo. Tente novamente.');
    });
}

function getRoleName(roleId) {
    const names = {
        'director': 'Diretor',
        'animator': 'Animador',
        'screenwriter': 'Roteirista',
        'voice-actor': 'Dublador'
    };
    return names[roleId] || roleId;
}

function startGame() {
    const roomRef = db.ref('rooms/' + GameState.roomId);
    const playerCount = GameState.maxPlayers;
    let firstStep;
    if (playerCount === 2) {
        firstStep = 'animator';
    } else {
        firstStep = 'director';
    }
    roomRef.update({ status: 'playing', step: firstStep });
}

// ============ DIRETOR ============
document.getElementById('submitDirectorBtn').addEventListener('click', () => {
    const title = document.getElementById('movieTitle').value.trim();
    const description = document.getElementById('movieDescription').value.trim();

    if (!title) {
        alert('🎞️ Digite o nome do filme!');
        document.getElementById('movieTitle').focus();
        return;
    }

    if (!description) {
        alert('📝 Digite a descrição da animação!');
        document.getElementById('movieDescription').focus();
        return;
    }

    if (description.length < 10) {
        alert('📝 A descrição deve ter pelo menos 10 caracteres!');
        document.getElementById('movieDescription').focus();
        return;
    }

    const roomRef = db.ref('rooms/' + GameState.roomId);
    roomRef.update({
        'gameData/directorTitle': title,
        'gameData/directorDescription': description,
        step: 'animator'
    }).then(() => {
        showWaiting('🎬 Filme enviado para o Animador!', 'Aguardando o Animador criar a cena', '🎨', title);
    }).catch(err => {
        console.error('Erro ao enviar filme:', err);
        alert('Erro ao enviar. Tente novamente.');
    });
});

function loadDirectorData(data) {
    if (data.gameData && data.gameData.directorTitle) {
        document.getElementById('movieTitle').value = data.gameData.directorTitle;
        document.getElementById('movieDescription').value = data.gameData.directorDescription;
    }
}

// ============ ANIMADOR ============
let animatorFrames = [];
let currentFrameIndex = 0;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'pen';
let currentColor = '#000000';
let currentSize = 4;
let isAnimatorInitialized = false;
let previewInterval = null;
let isPreviewing = false;

function loadAnimatorData(data) {
    console.log('🔄 Animador carregado com dados:', data);
    
    if (data.gameData) {
        document.getElementById('animatorMovieTitle').textContent = data.gameData.directorTitle || 'Sem título';
        document.getElementById('animatorMovieDesc').textContent = data.gameData.directorDescription || 'Sem descrição';
    }
    
    if (data.gameData && data.gameData.frames && data.gameData.frames.length > 0) {
        animatorFrames = data.gameData.frames;
        currentFrameIndex = 0;
    } else {
        animatorFrames = [];
        addNewFrame();
    }
    
    if (!isAnimatorInitialized) {
        initAnimatorCanvas();
        isAnimatorInitialized = true;
    }
    
    loadFrame(currentFrameIndex);
    updateFrameList();
}

function initAnimatorCanvas() {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 600;
    canvas.height = 400;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', endDraw);
    
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });
    
    document.getElementById('colorPicker').addEventListener('change', (e) => {
        currentColor = e.target.value;
    });
    
    document.getElementById('brushSize').addEventListener('change', (e) => {
        currentSize = parseInt(e.target.value);
    });
    
    document.getElementById('undoBtn').addEventListener('click', undoFrame);
    document.getElementById('redoBtn').addEventListener('click', redoFrame);
    document.getElementById('clearBtn').addEventListener('click', clearCurrentFrame);
    document.getElementById('addFrameBtn').addEventListener('click', addNewFrame);
    document.getElementById('duplicateFrameBtn').addEventListener('click', duplicateFrame);
    document.getElementById('deleteFrameBtn').addEventListener('click', deleteFrame);
    document.getElementById('previewAnimationBtn').addEventListener('click', togglePreview);
    document.getElementById('finishAnimationBtn').addEventListener('click', finishAnimation);
}

function startDraw(e) {
    isDrawing = true;
    const canvas = document.getElementById('animationCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
}

function draw(e) {
    if (!isDrawing) return;
    
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    
    if (currentTool === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = currentSize * 2;
    } else {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentSize;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    lastX = x;
    lastY = y;
}

function endDraw() {
    if (isDrawing) {
        isDrawing = false;
        saveCurrentFrame();
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    startDraw(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    draw(mouseEvent);
}

function saveCurrentFrame() {
    const canvas = document.getElementById('animationCanvas');
    if (animatorFrames[currentFrameIndex] !== undefined) {
        animatorFrames[currentFrameIndex] = canvas.toDataURL();
    }
}

function loadFrame(index) {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    
    if (index >= 0 && index < animatorFrames.length && animatorFrames[index]) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = animatorFrames[index];
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    currentFrameIndex = index;
    updateFrameList();
}

function updateFrameList() {
    const list = document.getElementById('frameList');
    list.innerHTML = '';
    
    animatorFrames.forEach((frame, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'frame-thumb';
        if (index === currentFrameIndex) thumb.classList.add('active');
        
        if (frame) {
            thumb.style.backgroundImage = `url(${frame})`;
            thumb.style.backgroundSize = 'cover';
            thumb.style.backgroundPosition = 'center';
        } else {
            thumb.style.background = 'white';
            thumb.style.border = '2px dashed rgba(255,255,255,0.2)';
        }
        
        const number = document.createElement('span');
        number.className = 'frame-number';
        number.textContent = index + 1;
        thumb.appendChild(number);
        
        thumb.addEventListener('click', () => {
            saveCurrentFrame();
            loadFrame(index);
        });
        
        list.appendChild(thumb);
    });
}

function addNewFrame() {
    saveCurrentFrame();
    const canvas = document.getElementById('animationCanvas');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    animatorFrames.push(tempCanvas.toDataURL());
    
    currentFrameIndex = animatorFrames.length - 1;
    loadFrame(currentFrameIndex);
    updateFrameList();
}

function duplicateFrame() {
    const canvas = document.getElementById('animationCanvas');
    animatorFrames.push(canvas.toDataURL());
    currentFrameIndex = animatorFrames.length - 1;
    loadFrame(currentFrameIndex);
    updateFrameList();
}

function deleteFrame() {
    if (animatorFrames.length <= 1) {
        alert('Você precisa ter pelo menos um quadro!');
        return;
    }
    
    if (confirm('Tem certeza que deseja remover este quadro?')) {
        animatorFrames.splice(currentFrameIndex, 1);
        if (currentFrameIndex >= animatorFrames.length) {
            currentFrameIndex = animatorFrames.length - 1;
        }
        loadFrame(currentFrameIndex);
        updateFrameList();
    }
}

function undoFrame() {
    loadFrame(currentFrameIndex);
}

function redoFrame() {
    loadFrame(currentFrameIndex);
}

function clearCurrentFrame() {
    if (confirm('Tem certeza que deseja limpar este quadro?')) {
        const canvas = document.getElementById('animationCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveCurrentFrame();
        updateFrameList();
    }
}

function togglePreview() {
    if (isPreviewing) {
        stopPreview();
    } else {
        startPreview();
    }
}

function startPreview() {
    if (animatorFrames.length === 0 || animatorFrames.every(f => f === null)) {
        alert('Crie pelo menos um quadro antes de pré-visualizar!');
        return;
    }
    
    isPreviewing = true;
    document.getElementById('previewAnimationBtn').textContent = '⏹ PARAR PRÉ-VISUALIZAÇÃO';
    
    saveCurrentFrame();
    let index = 0;
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');
    const delay = 200;
    
    previewInterval = setInterval(() => {
        if (index >= animatorFrames.length) {
            index = 0;
        }
        
        const frame = animatorFrames[index];
        if (frame) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = frame;
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        index++;
    }, delay);
}

function stopPreview() {
    isPreviewing = false;
    document.getElementById('previewAnimationBtn').textContent = '▶️ PRÉ-VISUALIZAR';
    if (previewInterval) {
        clearInterval(previewInterval);
        previewInterval = null;
    }
    loadFrame(currentFrameIndex);
}

function finishAnimation() {
    if (animatorFrames.length === 0 || animatorFrames.every(f => f === null)) {
        alert('Crie pelo menos um quadro antes de finalizar!');
        return;
    }
    
    if (!confirm('Tem certeza que deseja finalizar sua animação? Não será possível editar depois.')) {
        return;
    }
    
    if (isPreviewing) {
        stopPreview();
    }
    
    saveCurrentFrame();
    
    const validFrames = animatorFrames.filter(f => f !== null);
    if (validFrames.length === 0) {
        alert('Crie pelo menos um quadro com desenho!');
        return;
    }
    
    const roomRef = db.ref('rooms/' + GameState.roomId);
    const playerCount = GameState.maxPlayers;
    
    let nextStep;
    if (playerCount === 4) {
        nextStep = 'screenwriter';
    } else {
        nextStep = 'voice-actor';
    }
    
    console.log('🔀 Próxima etapa:', nextStep, 'para', playerCount, 'jogadores');
    
    roomRef.update({
        'gameData/frames': validFrames,
        step: nextStep
    }).then(() => {
        let waitingMsg, waitingEmoji;
        
        if (nextStep === 'screenwriter') {
            waitingMsg = '📝 O Roteirista está escrevendo...';
            waitingEmoji = '📝';
        } else {
            waitingMsg = '🎙️ O Dublador está gravando...';
            waitingEmoji = '🎙️';
        }
        
        showWaiting(waitingMsg, 'Aguardando a próxima etapa', waitingEmoji, document.getElementById('animatorMovieTitle').textContent);
    }).catch(err => {
        console.error('Erro ao finalizar animação:', err);
        alert('Erro ao finalizar. Tente novamente.');
    });
}

// ============ ROTEIRISTA ============
let previewFrames = [];
let isPreviewPlaying = false;
let previewIntervalId = null;
let currentPreviewFrame = 0;

function loadScreenwriterData(data) {
    console.log('🔄 Roteirista carregado com dados:', data);
    
    if (data.gameData && data.gameData.frames && data.gameData.frames.length > 0) {
        previewFrames = data.gameData.frames;
    } else {
        previewFrames = [];
    }
    
    if (data.gameData && data.gameData.script) {
        document.getElementById('scriptText').value = data.gameData.script;
    }
    
    setupPreviewCanvas();
    updateFrameCounter();
}

function setupPreviewCanvas() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;
    
    if (previewFrames.length > 0 && previewFrames[0]) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = previewFrames[0];
    } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '20px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎬 Aguardando animação...', canvas.width/2, canvas.height/2);
    }
    
    document.getElementById('playBtn').addEventListener('click', playPreview);
    document.getElementById('pauseBtn').addEventListener('click', pausePreview);
    document.getElementById('restartBtn').addEventListener('click', restartPreview);
    
    document.getElementById('fpsSlider').addEventListener('input', (e) => {
        document.getElementById('fpsValue').textContent = e.target.value + ' FPS';
        if (isPreviewPlaying) {
            pausePreview();
            playPreview();
        }
    });
    
    document.getElementById('submitScriptBtn').addEventListener('click', submitScript);
}

function updateFrameCounter() {
    const total = previewFrames.length;
    const current = Math.min(currentPreviewFrame + 1, total);
    document.getElementById('frameCounter').textContent = `Quadro ${current} / ${total}`;
}

function playPreview() {
    if (previewFrames.length === 0) {
        alert('Ainda não há animação para visualizar!');
        return;
    }
    
    if (isPreviewPlaying) return;
    
    isPreviewPlaying = true;
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const fps = parseInt(document.getElementById('fpsSlider').value);
    const delay = 1000 / fps;
    
    if (currentPreviewFrame >= previewFrames.length) {
        currentPreviewFrame = 0;
    }
    
    previewIntervalId = setInterval(() => {
        if (currentPreviewFrame >= previewFrames.length) {
            currentPreviewFrame = 0;
        }
        
        const frame = previewFrames[currentPreviewFrame];
        if (frame) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = frame;
        } else {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        currentPreviewFrame++;
        updateFrameCounter();
    }, delay);
}

function pausePreview() {
    isPreviewPlaying = false;
    if (previewIntervalId) {
        clearInterval(previewIntervalId);
        previewIntervalId = null;
    }
}

function restartPreview() {
    pausePreview();
    currentPreviewFrame = 0;
    updateFrameCounter();
    
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    if (previewFrames.length > 0 && previewFrames[0]) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = previewFrames[0];
    }
}

function submitScript() {
    const script = document.getElementById('scriptText').value.trim();
    
    if (!script) {
        alert('📝 Escreva o roteiro de dublagem!');
        document.getElementById('scriptText').focus();
        return;
    }
    
    if (script.length < 5) {
        alert('📝 O roteiro deve ter pelo menos 5 caracteres!');
        document.getElementById('scriptText').focus();
        return;
    }
    
    const roomRef = db.ref('rooms/' + GameState.roomId);
    roomRef.update({
        'gameData/script': script,
        step: 'voice-actor'
    }).then(() => {
        if (isPreviewPlaying) {
            pausePreview();
        }
        
        showWaiting('🎙️ O Dublador está gravando...', 'Aguardando o Dublador finalizar', '🎙️', document.getElementById('animatorMovieTitle')?.textContent || '');
    }).catch(err => {
        console.error('Erro ao enviar roteiro:', err);
        alert('Erro ao enviar roteiro. Tente novamente.');
    });
}

// ============ DUBLADOR (CORRIGIDO - BARRA DE TEMPO COM LIMITE) ============
let mediaRecorder = null;
let audioChunks = [];
let recordedAudio = null;
let isRecording = false;
let recordingStartTime = 0;
let recordingTimerInterval = null;
let audioDuration = 0;
let isRecordingFinished = false;

let voicePreviewFrames = [];
let voiceIsPlaying = false;
let voiceIntervalId = null;
let voiceCurrentFrame = 0;

let timeBarElement = null;
let timeProgressElement = null;
let currentTimeDisplay = null;
let totalTimeDisplay = null;

function loadVoiceActorData(data) {
    console.log('🔄 Dublador carregado com dados:', data);
    console.log('📝 Modo:', GameState.maxPlayers, 'jogadores');
    
    // Reseta o estado de gravação
    isRecordingFinished = false;
    
    timeBarElement = document.getElementById('timeBar');
    timeProgressElement = document.getElementById('timeProgress');
    currentTimeDisplay = document.getElementById('currentTimeDisplay');
    totalTimeDisplay = document.getElementById('totalTimeDisplay');
    
    // Calcula a duração da animação
    if (data.gameData && data.gameData.frames && data.gameData.frames.length > 0) {
        voicePreviewFrames = data.gameData.frames;
        const totalFrames = voicePreviewFrames.length;
        const fps = 6;
        audioDuration = totalFrames / fps;
        totalTimeDisplay.textContent = formatTime(audioDuration);
        console.log('🎬 Duração da animação:', audioDuration, 'segundos');
    } else {
        voicePreviewFrames = [];
        audioDuration = 0;
        totalTimeDisplay.textContent = '00:00';
    }
    
    setupVoicePreviewCanvas();
    resetTimeline();
    
    // Mostra o roteiro ou modo improviso
    if (data.gameData && data.gameData.script) {
        document.getElementById('scriptDisplay').textContent = data.gameData.script;
        document.getElementById('recordingStatus').textContent = '🎙️ Pronto para gravar!';
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('recordBtn').textContent = '🔴 GRAVAR';
        document.getElementById('finishVoiceBtn').disabled = true;
    } else {
        const playerCount = GameState.maxPlayers;
        
        if (playerCount === 2 || playerCount === 3) {
            document.getElementById('scriptDisplay').textContent = '🎭 Modo improviso! Assista à animação e crie suas próprias falas!';
            document.getElementById('recordingStatus').textContent = '🎙️ Modo improviso - grave sua dublagem!';
            document.getElementById('recordBtn').disabled = false;
            document.getElementById('recordBtn').textContent = '🔴 GRAVAR';
            document.getElementById('finishVoiceBtn').disabled = true;
        } else {
            document.getElementById('scriptDisplay').textContent = 'Aguardando roteiro do Roteirista...';
            document.getElementById('recordingStatus').textContent = 'Aguardando roteiro do Roteirista...';
            document.getElementById('recordBtn').disabled = true;
        }
    }
    
    // Configura eventos
    document.getElementById('recordBtn').onclick = startRecording;
    document.getElementById('stopBtn').onclick = stopRecording;
    document.getElementById('playbackBtn').onclick = playRecordedAudio;
    document.getElementById('retryBtn').onclick = resetRecording;
    document.getElementById('finishVoiceBtn').onclick = finishVoice;
    
    document.getElementById('voicePlayBtn').onclick = playVoicePreview;
    document.getElementById('voicePauseBtn').onclick = pauseVoicePreview;
    document.getElementById('voiceRestartBtn').onclick = restartVoicePreview;
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimeline(currentTime) {
    if (!timeProgressElement || !currentTimeDisplay) return;
    const progress = audioDuration > 0 ? Math.min((currentTime / audioDuration) * 100, 100) : 0;
    timeProgressElement.style.width = progress + '%';
    currentTimeDisplay.textContent = formatTime(currentTime);
}

function resetTimeline() {
    if (timeProgressElement) timeProgressElement.style.width = '0%';
    if (currentTimeDisplay) currentTimeDisplay.textContent = '00:00';
}

function setupVoicePreviewCanvas() {
    const canvas = document.getElementById('voicePreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;
    
    if (voicePreviewFrames.length > 0 && voicePreviewFrames[0]) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = voicePreviewFrames[0];
    } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '20px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎬 Aguardando animação...', canvas.width/2, canvas.height/2);
    }
}

function playVoicePreview() {
    if (voicePreviewFrames.length === 0) {
        alert('Ainda não há animação para visualizar!');
        return;
    }
    
    if (voiceIsPlaying) return;
    
    voiceIsPlaying = true;
    const canvas = document.getElementById('voicePreviewCanvas');
    const ctx = canvas.getContext('2d');
    const delay = 1000 / 6;
    let elapsed = 0;
    
    if (voiceCurrentFrame >= voicePreviewFrames.length) {
        voiceCurrentFrame = 0;
        elapsed = 0;
    }
    
    voiceIntervalId = setInterval(() => {
        if (voiceCurrentFrame >= voicePreviewFrames.length) {
            voiceCurrentFrame = 0;
            elapsed = 0;
        }
        
        const frame = voicePreviewFrames[voiceCurrentFrame];
        if (frame) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = frame;
        }
        voiceCurrentFrame++;
        elapsed += delay / 1000;
        updateTimeline(elapsed);
    }, delay);
}

function pauseVoicePreview() {
    voiceIsPlaying = false;
    if (voiceIntervalId) {
        clearInterval(voiceIntervalId);
        voiceIntervalId = null;
    }
}

function restartVoicePreview() {
    pauseVoicePreview();
    voiceCurrentFrame = 0;
    resetTimeline();
    const canvas = document.getElementById('voicePreviewCanvas');
    const ctx = canvas.getContext('2d');
    if (voicePreviewFrames.length > 0 && voicePreviewFrames[0]) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = voicePreviewFrames[0];
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecordingFinished = false;
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            recordedAudio = new Blob(audioChunks, { type: 'audio/wav' });
            document.getElementById('playbackBtn').disabled = false;
            document.getElementById('finishVoiceBtn').disabled = false;
            document.getElementById('recordingStatus').textContent = '✅ Gravação concluída!';
            document.getElementById('recordingStatus').className = 'recording-status';
            document.getElementById('recordBtn').textContent = '🔴 GRAVAR';
            isRecordingFinished = true;
            if (recordingTimerInterval) {
                clearInterval(recordingTimerInterval);
                recordingTimerInterval = null;
            }
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordingStartTime = Date.now();
        
        document.getElementById('recordBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('recordingStatus').textContent = '🔴 Gravando...';
        document.getElementById('recordingStatus').className = 'recording-status recording';
        document.getElementById('recordBtn').textContent = '⏳ GRAVANDO...';
        
        resetTimeline();
        recordingTimerInterval = setInterval(() => {
            const elapsed = (Date.now() - recordingStartTime) / 1000;
            updateTimeline(elapsed);
            
            // 🔥 CORREÇÃO: Para automaticamente quando atingir a duração da animação
            if (elapsed >= audioDuration && audioDuration > 0) {
                stopRecording();
                document.getElementById('recordingStatus').textContent = '⏹️ Gravação finalizada automaticamente!';
                document.getElementById('recordingStatus').className = 'recording-status';
            }
        }, 100);
        
    } catch (err) {
        console.error('Erro ao acessar microfone:', err);
        alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        document.getElementById('recordBtn').textContent = '🔴 REGRAVAR';
        if (recordingTimerInterval) {
            clearInterval(recordingTimerInterval);
            recordingTimerInterval = null;
        }
    }
}

function playRecordedAudio() {
    if (recordedAudio) {
        const audio = new Audio(URL.createObjectURL(recordedAudio));
        audio.play();
        document.getElementById('recordingStatus').textContent = '▶️ Reproduzindo...';
        
        resetTimeline();
        const startTime = Date.now();
        const duration = audio.duration || audioDuration || 3;
        
        const playbackInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= duration) {
                clearInterval(playbackInterval);
                updateTimeline(duration);
                document.getElementById('recordingStatus').textContent = '✅ Gravação concluída!';
                return;
            }
            updateTimeline(elapsed);
        }, 100);
        
        audio.onended = () => {
            document.getElementById('recordingStatus').textContent = '✅ Gravação concluída!';
            updateTimeline(duration);
        };
    }
}

function resetRecording() {
    recordedAudio = null;
    audioChunks = [];
    isRecordingFinished = false;
    document.getElementById('playbackBtn').disabled = true;
    document.getElementById('finishVoiceBtn').disabled = true;
    document.getElementById('recordingStatus').textContent = '🎙️ Pronto para gravar!';
    document.getElementById('recordingStatus').className = 'recording-status';
    document.getElementById('recordBtn').textContent = '🔴 GRAVAR';
    document.getElementById('recordBtn').disabled = false;
    resetTimeline();
}

function finishVoice() {
    if (!recordedAudio) {
        alert('Grave o áudio primeiro!');
        return;
    }
    
    // Verifica se a gravação tem o tamanho adequado
    if (audioDuration > 0) {
        // Não bloqueia, apenas avisa
        console.log('📊 Duração da animação:', audioDuration, 's | Áudio gravado');
    }
    
    const reader = new FileReader();
    reader.onload = () => {
        const audioData = reader.result;
        const roomRef = db.ref('rooms/' + GameState.roomId);
        roomRef.update({
            'gameData/audio': audioData,
            step: 'result'
        }).then(() => {
            // 🔧 CORREÇÃO: Mostra a tela de espera para TODOS
            const title = document.getElementById('animatorMovieTitle')?.textContent || '';
            showWaiting('🎬 Filme sendo finalizado...', 'Preparando o resultado final para todos', '🎬', title);
        }).catch(err => {
            console.error('Erro ao enviar áudio:', err);
            alert('Erro ao enviar áudio. Tente novamente.');
        });
    };
    reader.readAsDataURL(recordedAudio);
}

// ============ RESULTADO FINAL (CORRIGIDO - VISÍVEL PARA TODOS) ============

function loadResultData(data) {
    console.log('🔄 Resultado carregado com dados:', data);
    
    const video = document.getElementById('finalVideo');
    
    if (data.gameData) {
        const title = data.gameData.directorTitle || 'Filme sem título';
        document.getElementById('resultMovieTitle').textContent = `🎞️ "${title}"`;
        
        const frames = data.gameData.frames || [];
        let audioBlob = null;
        
        if (data.gameData.audio) {
            const audioData = data.gameData.audio.split(',')[1];
            if (audioData) {
                try {
                    const byteCharacters = atob(audioData);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    audioBlob = new Blob([byteArray], { type: 'audio/wav' });
                    console.log('✅ Áudio carregado, tamanho:', audioBlob.size, 'bytes');
                } catch (e) {
                    console.error('Erro ao decodificar áudio:', e);
                }
            }
        }
        
        // 🔧 CORREÇÃO: Mostra o vídeo para TODOS que estão na tela de resultado
        createVideoFromFramesAndAudio(frames, audioBlob, video);
    }
    
    // Configura os botões
    document.getElementById('playMovieBtn').onclick = function() {
        if (window.__movieControls && window.__movieControls.play) {
            window.__movieControls.play();
        }
    };
    document.getElementById('pauseMovieBtn').onclick = function() {
        if (window.__movieControls && window.__movieControls.pause) {
            window.__movieControls.pause();
        }
    };
    document.getElementById('restartMovieBtn').onclick = function() {
        if (window.__movieControls && window.__movieControls.restart) {
            window.__movieControls.restart();
        }
    };
    document.getElementById('downloadBtn').onclick = downloadMovie;
    document.getElementById('playAgainBtn').onclick = playAgain;
    document.getElementById('exitResultBtn').onclick = exitResult;
}

function createVideoFromFramesAndAudio(frames, audioBlob, videoElement) {
    if (!frames || frames.length === 0) {
        videoElement.innerHTML = '<source src="" type="video/mp4">';
        videoElement.textContent = '🎬 Aguardando filme...';
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    const stream = canvas.captureStream(6);
    
    let audioContext = null;
    let audioSource = null;
    let audioDestination = null;
    let isAudioReady = false;
    let audioBufferDuration = 0;
    
    if (audioBlob) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    audioBufferDuration = audioBuffer.duration;
                    console.log('✅ Áudio decodificado, duração:', audioBufferDuration);
                    
                    audioSource = audioContext.createBufferSource();
                    audioSource.buffer = audioBuffer;
                    audioDestination = audioContext.createMediaStreamDestination();
                    audioSource.connect(audioDestination);
                    
                    const audioTracks = audioDestination.stream.getAudioTracks();
                    audioTracks.forEach(track => {
                        stream.addTrack(track);
                    });
                    
                    isAudioReady = true;
                    console.log('✅ Áudio adicionado ao stream');
                } catch (err) {
                    console.error('Erro ao processar áudio:', err);
                }
            };
            reader.readAsArrayBuffer(audioBlob);
        } catch (err) {
            console.error('Erro ao configurar áudio:', err);
        }
    }
    
    let frameIndex = 0;
    let animationInterval = null;
    let isPlaying = false;
    let audioStarted = false;
    let animationStartTime = 0;
    let pausedTime = 0;
    
    if (frames[0]) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = frames[0];
    }
    
    function playAnimation() {
        if (isPlaying) return;
        isPlaying = true;
        
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        if (audioSource && isAudioReady && !audioStarted) {
            try {
                audioSource.start(0);
                audioStarted = true;
                console.log('🎵 Áudio iniciado');
                audioSource.onended = () => {
                    console.log('🎵 Áudio terminou');
                    pauseAnimation();
                };
            } catch (e) {
                console.warn('Áudio já foi iniciado ou erro:', e);
            }
        }
        
        animationStartTime = Date.now() - pausedTime * 1000;
        const delay = 1000 / 6;
        
        if (frameIndex >= frames.length) {
            frameIndex = 0;
        }
        
        animationInterval = setInterval(() => {
            if (isAudioReady && audioBufferDuration > 0) {
                const elapsed = (Date.now() - animationStartTime) / 1000;
                if (elapsed >= audioBufferDuration) {
                    pauseAnimation();
                    return;
                }
            }
            
            if (frameIndex >= frames.length) {
                frameIndex = 0;
                if (audioSource && isAudioReady && audioStarted) {
                    try {
                        audioSource.start(0);
                    } catch (e) {}
                }
            }
            
            const frame = frames[frameIndex];
            if (frame) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = frame;
            }
            frameIndex++;
        }, delay);
    }
    
    function pauseAnimation() {
        isPlaying = false;
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        if (audioSource && isAudioReady) {
            try {
                audioSource.stop();
                audioStarted = false;
                pausedTime = (Date.now() - animationStartTime) / 1000;
            } catch (e) {}
        }
        if (audioContext) {
            audioContext.suspend();
        }
    }
    
    function restartAnimation() {
        pauseAnimation();
        frameIndex = 0;
        pausedTime = 0;
        audioStarted = false;
        
        if (frames[0]) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = frames[0];
        }
        
        if (audioBlob && isAudioReady) {
            try {
                audioSource = audioContext.createBufferSource();
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    audioSource.buffer = audioBuffer;
                    audioSource.connect(audioDestination);
                    isAudioReady = true;
                };
                reader.readAsArrayBuffer(audioBlob);
            } catch (e) {}
        }
        
        setTimeout(() => playAnimation(), 300);
    }
    
    window.__movieControls = {
        play: playAnimation,
        pause: pauseAnimation,
        restart: restartAnimation,
        video: videoElement,
        canvas: canvas,
        stream: stream
    };
    
    videoElement.srcObject = stream;
    videoElement.muted = false;
    videoElement.autoplay = true;
    videoElement.controls = false;
    videoElement.style.width = '100%';
    videoElement.style.maxHeight = '400px';
    videoElement.style.background = '#0a0a1a';
    videoElement.style.borderRadius = '10px';
    
    setTimeout(() => {
        playAnimation();
    }, 800);
    
    videoElement.textContent = '🎬 Carregando filme...';
    setTimeout(() => {
        videoElement.textContent = '';
    }, 2000);
}

function downloadMovie() {
    alert('⬇️ Download do vídeo será implementado em breve!\n\n(Dica: Grave a tela ou use um gravador de tela)');
}

function playAgain() {
    if (window.__movieControls) {
        if (window.__movieControls.pause) {
            window.__movieControls.pause();
        }
        if (window.__movieControls.video) {
            window.__movieControls.video.srcObject = null;
        }
        if (window.__movieControls.stream) {
            window.__movieControls.stream.getTracks().forEach(track => track.stop());
        }
    }
    
    const roomRef = db.ref('rooms/' + GameState.roomId);
    roomRef.update({
        status: 'waiting',
        step: 'lobby',
        'gameData/directorTitle': '',
        'gameData/directorDescription': '',
        'gameData/frames': [],
        'gameData/script': '',
        'gameData/audio': null
    }).then(() => {
        const players = GameState.players || {};
        Object.keys(players).forEach(playerId => {
            roomRef.child('players/' + playerId + '/role').remove();
        });
        GameState.role = null;
        showScreen('lobbyScreen');
        updateLobby();
    }).catch(err => {
        console.error('Erro ao reiniciar:', err);
        alert('Erro ao reiniciar. Tente novamente.');
    });
}

function exitResult() {
    if (window.__movieControls) {
        if (window.__movieControls.pause) {
            window.__movieControls.pause();
        }
        if (window.__movieControls.video) {
            window.__movieControls.video.srcObject = null;
        }
        if (window.__movieControls.stream) {
            window.__movieControls.stream.getTracks().forEach(track => track.stop());
        }
    }
    leaveRoom();
}

// ============ INICIALIZAÇÃO ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Produza um Filme - Inicializado!');
});
