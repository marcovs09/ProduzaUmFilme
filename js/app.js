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
    isHost: false
};

// ============ CONSTANTES ============
const CHARACTERS = ['🦊', '🐱', '🐶', '🐰', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🦄', '🐲', '🦋', '🐙'];

// ============ VARIÁVEIS GLOBAIS ============
let selectedCharacter = null;
let selectedPlayerCount = 4;
let joinCharacter = null;

// ============ FUNÇÕES DE UI (CORRIGIDAS) ============

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    GameState.currentScreen = screenId;
}

// CORRIGIDA: Força atualização mesmo se já estiver na tela de espera
function showWaiting(message, detail = '', emoji = '🎬') {
    if (GameState.currentScreen === 'waitingScreen') {
        document.getElementById('waitingMessage').textContent = message;
        document.getElementById('waitingDetail').textContent = detail;
        document.getElementById('waitingEmoji').textContent = emoji;
        return;
    }
    showScreen('waitingScreen');
    document.getElementById('waitingMessage').textContent = message;
    document.getElementById('waitingDetail').textContent = detail;
    document.getElementById('waitingEmoji').textContent = emoji;
}

// CORRIGIDA: Força atualização mesmo se já estiver na tela de espera
function showWaitingWithMovie(message, detail, emoji = '🎬', movieTitle = '') {
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
    return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
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
                        <div class="character-option join-char" data-char="${char}" style="
                            padding: 10px;
                            border-radius: 8px;
                            border: 2px solid rgba(255,255,255,0.1);
                            background: rgba(255,255,255,0.05);
                            cursor: pointer;
                            text-align: center;
                            font-size: 1.5rem;
                            transition: all 0.3s ease;
                        ">${char}</div>
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
            modal.querySelectorAll('.join-char').forEach(e => e.style.borderColor = 'rgba(255,255,255,0.1)');
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
        if (data.status === 'finished') {
            alert('Esta sala já foi finalizada.');
            return;
        }
        
        const playerCount = Object.keys(data.players || {}).length;
        if (playerCount >= data.maxPlayers) {
            alert('Sala cheia!');
            return;
        }
        
        GameState.playerName = name;
        GameState.character = character;
        GameState.roomId = code;
        GameState.playerId = generatePlayerId();
        GameState.isHost = false;
        GameState.maxPlayers = data.maxPlayers;
        
        const playerData = {
            id: GameState.playerId,
            name: name,
            character: character,
            isHost: false,
            role: null,
            joinedAt: Date.now()
        };
        
        const updates = {};
        updates['players/' + GameState.playerId] = playerData;
        
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
        console.error('Erro ao buscar sala:', err);
        alert('Erro ao buscar sala. Verifique o código.');
    });
}

// ============ CRIAÇÃO DE SALA ============
function setupCharacterSelection() {
    const grid = document.getElementById('characterGrid');
    grid.innerHTML = '';
    CHARACTERS.forEach(char => {
        const div = document.createElement('div');
        div.className = 'character-option';
        div.textContent = char;
        div.dataset.character = char;
        div.addEventListener('click', () => {
            document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            selectedCharacter = char;
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

// ============ LOBBY (VERSÃO CORRIGIDA) ============
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
        
        // ============================================================
        // GERENCIAMENTO DE TELAS - VERSÃO CORRIGIDA
        // ============================================================
        
        // 1. TELA DE SELEÇÃO DE CARGOS
        if (data.status === 'roles') {
            if (GameState.currentScreen !== 'roleSelectionScreen') {
                showScreen('roleSelectionScreen');
                setupRoles(data);
            } else {
                setupRoles(data);
            }
            return;
        }
        
        // 2. JOGO EM ANDAMENTO
        if (data.status === 'playing') {
            const currentStep = data.step;
            const playerRole = GameState.role;
            const playerCount = GameState.maxPlayers;
            const movieTitle = data.gameData?.directorTitle || '';
            
            // --- ETAPA DO DIRETOR ---
            if (currentStep === 'director') {
                if (playerRole === 'director') {
                    showScreen('directorScreen');
                    loadDirectorData(data);
                } else {
                    // Qualquer outro jogador vê tela de espera
                    showWaitingWithMovie(
                        '🎬 O Diretor está escrevendo a cena...',
                        'Aguardando o Diretor finalizar',
                        '🎬',
                        movieTitle
                    );
                }
                return;
            }
            
            // --- ETAPA DO ANIMADOR ---
            if (currentStep === 'animator') {
                if (playerRole === 'animator') {
                    showScreen('animatorScreen');
                    loadAnimatorData(data);
                } else {
                    // Qualquer outro jogador vê tela de espera
                    showWaitingWithMovie(
                        '🎨 O Animador está criando a animação...',
                        'Aguardando o Animador finalizar',
                        '🎨',
                        movieTitle
                    );
                }
                return;
            }
            
            // --- ETAPA DO ROTEIRISTA (APENAS MODO 4) ---
            if (currentStep === 'screenwriter') {
                if (playerCount !== 4) {
                    console.warn('⚠️ Modo sem Roteirista, mas step=screenwriter. Corrigindo...');
                    const roomRefUpdate = db.ref('rooms/' + GameState.roomId);
                    roomRefUpdate.update({ step: 'voice-actor' });
                    return;
                }
                
                if (playerRole === 'screenwriter') {
                    showScreen('screenwriterScreen');
                } else {
                    showWaitingWithMovie(
                        '📝 O Roteirista está escrevendo...',
                        'Aguardando o Roteirista finalizar',
                        '📝',
                        movieTitle
                    );
                }
                return;
            }
            
            // --- ETAPA DO DUBLADOR ---
            if (currentStep === 'voice-actor') {
                if (playerRole === 'voice-actor') {
                    showScreen('voiceActorScreen');
                } else {
                    showWaitingWithMovie(
                        '🎙️ O Dublador está gravando...',
                        'Aguardando o Dublador finalizar',
                        '🎙️',
                        movieTitle
                    );
                }
                return;
            }
            
            // --- RESULTADO FINAL ---
            if (currentStep === 'result') {
                showScreen('resultScreen');
                return;
            }
        }
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
        card.innerHTML = `
            <span class="avatar">${p.character || '🎭'}</span>
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
        const roomRef = db.ref('rooms/' + GameState.roomId + '/players/' + GameState.playerId);
        roomRef.remove();
        if (GameState.isHost) {
            db.ref('rooms/' + GameState.roomId).remove();
        }
    }
    GameState.roomId = null;
    GameState.playerId = null;
    GameState.isHost = false;
    GameState.role = null;
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
                        startGame();
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
    roomRef.update({ status: 'playing', step: 'director' });
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
        showWaitingWithMovie(
            '🎬 Filme enviado para o Animador!',
            `Aguardando o Animador criar a cena`,
            '🎨',
            title
        );
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

// ============ FINALIZAR ANIMAÇÃO ============
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
        
        showWaitingWithMovie(
            waitingMsg,
            'Aguardando a próxima etapa',
            waitingEmoji,
            document.getElementById('animatorMovieTitle').textContent
        );
    }).catch(err => {
        console.error('Erro ao finalizar animação:', err);
        alert('Erro ao finalizar. Tente novamente.');
    });
}

// ============ INICIALIZAÇÃO ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Produza um Filme - Inicializado!');
});
