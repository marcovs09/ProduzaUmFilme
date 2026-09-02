// CONFIGURAÇÃO DO FIREBASE
// ⚠️ ATENÇÃO: Você precisa substituir com seus próprios dados do Firebase!
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ESTADO DO JOGO
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

// PERSONAGENS DISPONÍVEIS
const CHARACTERS = ['🦊', '🐱', '🐶', '🐰', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🦄', '🐲', '🦋', '🐙'];

// VARIÁVEIS DE SELEÇÃO
let selectedCharacter = null;
let selectedPlayerCount = 4;

// REFERÊNCIAS DAS TELAS
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    GameState.currentScreen = screenId;
}

// MOSTRAR TELA DE ESPERA
function showWaiting(message, detail = '', emoji = '🎬') {
    showScreen('waitingScreen');
    document.getElementById('waitingMessage').textContent = message;
    document.getElementById('waitingDetail').textContent = detail;
    document.getElementById('waitingEmoji').textContent = emoji;
}

// GERAR ID DO JOGADOR
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
        joinRoom(code);
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

// ============ SISTEMA DE SALAS ============
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

function joinRoom(code) {
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
        
        // Verifica se a sala está cheia
        const playerCount = Object.keys(data.players || {}).length;
        if (playerCount >= data.maxPlayers) {
            alert('Sala cheia!');
            return;
        }
        
        const name = prompt('Digite seu nome:');
        if (!name) return;
        
        const char = prompt('Escolha um personagem (digite o emoji):\n' + CHARACTERS.join(' '));
        if (!char) return;
        
        GameState.playerName = name;
        GameState.character = char;
        GameState.roomId = code;
        GameState.playerId = generatePlayerId();
        GameState.isHost = false;
        
        const playerData = {
            id: GameState.playerId,
            name: name,
            character: char,
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
        
        if (data.players) {
            GameState.players = data.players;
            updateLobby();
        }
        
        // Transições de estado
        if (data.status === 'roles' && GameState.currentScreen !== 'roleSelectionScreen') {
            showScreen('roleSelectionScreen');
            setupRoles(data);
        }
        
        // Tela de espera para etapas
        if (data.step === 'director') {
            if (GameState.role === 'director') {
                showScreen('directorScreen');
            } else if (GameState.currentScreen !== 'waitingScreen') {
                showWaiting('🎬 O Diretor está escrevendo a cena...', 'Aguardando o Diretor finalizar', '🎬');
            }
        }
        
        if (data.step === 'animator') {
            if (GameState.role === 'animator') {
                showScreen('animatorScreen');
            } else if (GameState.currentScreen !== 'waitingScreen') {
                showWaiting('🎨 O Animador está criando a animação...', 'Aguardando o Animador finalizar', '🎨');
            }
        }
        
        if (data.step === 'screenwriter') {
            if (GameState.role === 'screenwriter') {
                showScreen('screenwriterScreen');
            } else if (GameState.currentScreen !== 'waitingScreen') {
                showWaiting('📝 O Roteirista está escrevendo...', 'Aguardando o Roteirista finalizar', '📝');
            }
        }
        
        if (data.step === 'voice-actor') {
            if (GameState.role === 'voice-actor') {
                showScreen('voiceActorScreen');
            } else if (GameState.currentScreen !== 'waitingScreen') {
                showWaiting('🎙️ O Dublador está gravando...', 'Aguardando o Dublador finalizar', '🎙️');
            }
        }
        
        if (data.step === 'result') {
            showScreen('resultScreen');
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
    
    const availableRoles = getRolesForMode(GameState.maxPlayers);
    const takenRoles = {};
    
    if (data.players) {
        Object.values(data.players).forEach(p => {
            if (p.role) takenRoles[p.role] = p.name;
        });
    }
    
    availableRoles.forEach(role => {
        const card = document.createElement('div');
        card.className = 'role-card';
        const isTaken = takenRoles[role.id];
        
        if (isTaken) {
            card.classList.add('taken');
            card.innerHTML = `
                <span class="role-icon">${role.icon}</span>
                <div class="role-name">${role.name}</div>
                <div class="taken-by">🔒 ${isTaken}</div>
                <div class="role-desc">${role.desc}</div>
            `;
        } else {
            card.innerHTML = `
                <span class="role-icon">${role.icon}</span>
                <div class="role-name">${role.name}</div>
                <div class="role-desc">${role.desc}</div>
            `;
            card.addEventListener('click', () => selectRole(role.id));
        }
        grid.appendChild(card);
    });
    
    const allTaken = availableRoles.every(r => takenRoles[r.id]);
    if (allTaken) {
        document.getElementById('rolesStatus').textContent = '✅ Todos os cargos escolhidos! Iniciando...';
        startGame();
    } else {
        document.getElementById('rolesStatus').textContent = `📢 Escolha seu cargo (${Object.keys(takenRoles).length}/${availableRoles.length})`;
    }
}

function selectRole(roleId) {
    const roomRef = db.ref('rooms/' + GameState.roomId);
    const updates = {};
    updates['players/' + GameState.playerId + '/role'] = roleId;
    roomRef.update(updates).then(() => {
        GameState.role = roleId;
    });
}

function startGame() {
    const roomRef = db.ref('rooms/' + GameState.roomId);
    roomRef.update({ status: 'playing', step: 'director' });
}

// ============ DIRETOR ============
// Placeholder: será implementado na próxima fase
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Produza um Filme - Inicializado!');
});
