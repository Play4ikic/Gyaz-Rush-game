import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    onValue, 
    onDisconnect, 
    update, 
    push, 
    query, 
    limitToLast 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com", 
    storageBucket: "play4ik-473ef.firebasestorage.app",
    messagingSenderId: "115893557892",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Получаем данные текущего игрока
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "guest_" + Math.floor(Math.random() * 1000), 
    nickname: "Player" 
};

/**
 * 1. УПРАВЛЕНИЕ СТАТУСОМ (Online/Offline)
 */
function manageStatus() {
    if (!userData.uid) return;

    const myStatusRef = ref(db, `all_players/${userData.uid}`);

    update(myStatusRef, {
        nickname: userData.nickname,
        online: true
    });

    onDisconnect(myStatusRef).update({
        online: false
    });
}

/**
 * 2. ВЫВОД ТАБЛИЦЫ ВСЕХ ИГРОКОВ (в модальном окне/iframe)
 */
function renderPlayersTable() {
    const listRef = ref(db, 'all_players');
    const container = document.getElementById('online-list');

    onValue(listRef, (snapshot) => {
        if (!container) return;
        container.innerHTML = "";

        if (snapshot.exists()) {
            const players = snapshot.val();

            Object.keys(players).forEach(id => {
                const player = players[id];
                const isOnline = player.online === true;
                const isMe = id === userData.uid;

                const row = document.createElement('div');
                row.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    margin-bottom: 5px;
                    border: 1px solid ${isMe ? '#e1b12c' : 'transparent'};
                `;

                row.innerHTML = `
                    <span style="color: white; font-weight: bold;">
                        ${escapeHtml(player.nickname)} ${isMe ? '<small style="color:#e1b12c">(Вы)</small>' : ''}
                    </span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: ${isOnline ? '#00ff88' : '#555'}; font-size: 10px; text-transform: uppercase;">
                            ${isOnline ? 'В сети' : 'Оффлайн'}
                        </span>
                        <div style="
                            width: 10px; 
                            height: 10px; 
                            border-radius: 50%; 
                            background: ${isOnline ? '#00ff88' : '#555'};
                            box-shadow: ${isOnline ? '0 0 8px #00ff88' : 'none'};
                        "></div>
                    </div>
                `;
                container.appendChild(row);
            });
        } else {
            container.innerHTML = "<p style='color: #444; text-align: center;'>Список игроков пуст</p>";
        }
    });
}

/**
 * 3. РЕАЛЬНЫЙ ЧАТ МЕЖДУ ИГРОКАМИ (FIREBASE)
 */
const chatRef = ref(db, 'global_chat');

// Отправка сообщения в общую базу
window.sendChatMessage = function() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    push(chatRef, {
        sender: userData.nickname || 'Игрок',
        text: text,
        time: timeStr,
        timestamp: Date.now()
    });

    input.value = '';

    const chat = document.getElementById('chat-widget');
    if (chat && chat.classList.contains('collapsed')) {
        toggleChat();
    }
};

// Слушатель сообщений от всех игроков в реальном времени
function initGlobalChat() {
    const chatQuery = query(chatRef, limitToLast(50));

    onValue(chatQuery, (snapshot) => {
        const container = document.getElementById('chat-messages-list');
        if (!container) return;

        container.innerHTML = '';
        const myName = userData.nickname || 'Игрок';

        if (snapshot.exists()) {
            const messages = snapshot.val();

            Object.keys(messages).forEach(key => {
                const msg = messages[key];
                const isMe = (msg.sender === myName);

                const msgEl = document.createElement('div');
                msgEl.className = `chat-msg ${isMe ? 'my-msg' : 'other-msg'}`;

                msgEl.innerHTML = `
                    <span class="msg-sender">${escapeHtml(msg.sender)}</span>
                    <div class="msg-bubble">
                        ${escapeHtml(msg.text)}
                        <span class="msg-time">${msg.time}</span>
                    </div>
                `;
                container.appendChild(msgEl);
            });
        }
        scrollChatToBottom();
    });
}

// Открытие / Сворачивание виджета чата
window.toggleChat = function() {
    const chat = document.getElementById('chat-widget');
    const icon = document.getElementById('chat-toggle-icon');
    if (!chat) return;

    chat.classList.toggle('collapsed');
    
    if (icon) {
        icon.innerText = chat.classList.contains('collapsed') ? '▲' : '▼';
    }
    scrollChatToBottom();
};

function scrollChatToBottom() {
    const container = document.getElementById('chat-messages-list');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Запуск функций
manageStatus();
renderPlayersTable();
initGlobalChat();