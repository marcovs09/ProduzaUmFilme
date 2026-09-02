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

// ============ FUNÇÕES DE UI ============
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    GameState.currentScreen = screenId;
}

function showWaiting(message, detail = '', emoji = '🎬') {
    showScreen('waitingScreen');
    document.getElementById('waitingMessage').textContent = message;
    document.getElementById('waitingDetail').textContent = detail;
    document.getElementById('waitingEmoji').textContent = emoji;
}

function showWaitingWithMovie(message, detail, emoji = '🎬', movieTitle = '') {
    showScreen('waitingScreen');
    document.getElementById('waitingMessage').textContent = message;
    if (movieTitle) {
        document.getElementById('waitingDetail').innerHTML = `${detail}<br><span style="color: var(--accent); font-weight: 700; display: block; margin-top: 8px;">🎞️ "${movieTitle}"</span>`;
    } else {
        document.getElementById('waitingDetail').textContent = detail;
    }
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
        // Mostra o modal de entrada
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

// ============ MODAL DE ENTRADA (SUBSTITUI O PROMPT FEIO) ============
function showJoinModal(roomCode) {
    // Cria o modal dinamicamente
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
    
    // Selecionar personagem no modal
    modal.querySelectorAll('.join-char').forEach(el => {
        el.addEventListener('click', () => {
            modal.querySelectorAll('.join-char').forEach(e => e.style.borderColor = 'rgba(255,255,255,0.1)');
            el.style.borderColor = 'var(--primary)';
            el.style.background = 'rgba(108, 60, 225, 0.2)';
            joinCharacter = el.dataset.char;
        });
    });
    
    // Confirmar entrada
    document.getElementById('confirmJoinBtn').addEventListener('click', () => {
        const name = document.getElementById('joinNameInput').value.trim();
        if (!name) { alert('Digite seu nome!'); return; }
        if (!joinCharacter) { alert('Escolha um personagem!'); return; }
        
        document.body.removeChild(modal);
        // Chama a função de entrar na sala com os dados
        executeJoinRoom(roomCode, name, joinCharacter);
    });
    
    document.getElementById('cancelJoinBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Função separada para executar a entrada na sala
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
        GameState.maxPlayers = data.maxPlayers; // IMPORTANTE: pega do Firebase
        
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
        
        // Atualiza o maxPlayers a partir do Firebase (importante para modos 2/3)
        if (data.maxPlayers) {
            GameState.maxPlayers = data.maxPlayers;
        }
        
        if (data.players) {
            GameState.players = data.players;
            updateLobby();
        }
        
        // Transições de estado
        if (data.status === 'roles' && GameState.currentScreen !== 'roleSelectionScreen') {
            showScreen('roleSelectionScreen');
            setupRoles(data);
        }
        
        // ============ TELA DO DIRETOR ============
        if (data.step === 'director') {
            if (GameState.role === 'director') {
                showScreen('directorScreen');
                loadDirectorData(data);
            } else if (GameState.currentScreen !== 'waitingScreen') {
                showWaiting('🎬 O Diretor está escrevendo a cena...', 'Aguardando o Diretor finalizar', '🎬');
            }
        }
        
        // ============ TELA DO ANIMADOR ============
        if (data.step === 'animator') {
            if (GameState.role === 'animator') {
                showScreen('animatorScreen');
                loadAnimatorData(data);
            } else if (GameState.currentScreen !== 'waitingScreen') {
                const title = data.gameData?.directorTitle || '';
                showWaitingWithMovie(
                    '🎨 O Animador está criando a animação...',
                    'Aguardando o Animador finalizar',
                    '🎨',
                    title
                );
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

// ============ SELEÇÃO DE CARGOS (CORRIGIDA) ============
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
    
    // Usa o maxPlayers do Firebase, não o do estado local
    const maxPlayers = data.maxPlayers || GameState.maxPlayers || 4;
    const availableRoles = getRolesForMode(maxPlayers);
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
            // CORREÇÃO: Adiciona o evento de clique diretamente
            card.addEventListener('click', function(e) {
                e.stopPropagation();
                selectRole(role.id);
            });
            // Adiciona estilo de cursor pointer para indicar que é clicável
            card.style.cursor = 'pointer';
        }
        grid.appendChild(card);
    });
    
    const allTaken = availableRoles.every(r => takenRoles[r.id]);
    if (allTaken) {
        document.getElementById('rolesStatus').textContent = '✅ Todos os cargos escolhidos! Iniciando...';
        // Inicia o jogo após um pequeno delay para garantir que todos viram
        setTimeout(() => startGame(), 1000);
    } else {
        document.getElementById('rolesStatus').textContent = `📢 Escolha seu cargo (${Object.keys(takenRoles).length}/${availableRoles.length})`;
    }
}

function selectRole(roleId) {
    // Verifica se o cargo já foi escolhido por outro jogador
    const roomRef = db.ref('rooms/' + GameState.roomId);
    roomRef.once('value').then(snapshot => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        const players = data.players || {};
        
        // Verifica se alguém já pegou este cargo
        let alreadyTaken = false;
        Object.values(players).forEach(p => {
            if (p.role === roleId && p.id !== GameState.playerId) {
                alreadyTaken = true;
            }
        });
        
        if (alreadyTaken) {
            alert('🔒 Este cargo já foi escolhido por outro jogador!');
            return;
        }
        
        // Se o jogador já tem um cargo, libera o anterior
        if (GameState.role) {
            const updates = {};
            updates['players/' + GameState.playerId + '/role'] = null;
            roomRef.update(updates);
        }
        
        // Escolhe o novo cargo
        const newUpdates = {};
        newUpdates['players/' + GameState.playerId + '/role'] = roleId;
        roomRef.update(newUpdates).then(() => {
            GameState.role = roleId;
            // Atualiza a tela de cargos para todos
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

// ============ ANIMADOR (PLACEHOLDER) ============
function loadAnimatorData(data) {
    console.log('🔄 Animador carregado com dados:', data);
}

// ============ INICIALIZAÇÃO ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Produza um Filme - Inicializado!');
});
