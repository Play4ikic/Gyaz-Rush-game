import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    onDisconnect, 
    update, 
    push, 
    query, 
    limitToLast, 
    onValue 
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

// Данные игрока
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "guest_" + Math.floor(Math.random() * 1000), 
    nickname: "Player" 
};

// Флаг для предотвращения уведомлений при первой загрузке истории
let isInitialLoad = true;

// 🔔 1. ЗАПРОС РАЗРЕШЕНИЯ НА УВЕДОМЛЕНИЯ
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// 🔔 2. ФУНКЦИЯ ПОКАЗА УВЕДОМЛЕНИЯ
function sendBrowserNotification(sender, text) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const chat = document.getElementById('chat-widget');
    const isCollapsed = chat && chat.classList.contains('collapsed');

    // Отправляем уведомление, только если вкладка скрыта ИЛИ чат свёрнут
    if (document.hidden || isCollapsed) {
        const notification = new Notification(`💬 ${sender}`, {
            body: text,
            icon: 'favicon.png', // Ссылка на иконку твоего сайта
            tag: 'chat-msg' // Заменяет предыдущее уведомление новым, чтобы не спамить
        });

        // При клике на уведомление открываем вкладку и разворачиваем чат
        notification.onclick = function() {
            window.focus();
            if (chat && chat.classList.contains('collapsed')) {
                window.toggleChat();
            }
            notification.close();
        };
    }
}

// 3. АВТОМАТИЧЕСКАЯ ВСТАВКА HTML ЧАТА
function injectChatHTML() {
    if (document.getElementById('chat-widget')) return;

    const chatHTML = `
    <div id="chat-widget" class="chat-widget collapsed">
        <div class="chat-header" id="chat-header-btn">
            <div class="chat-header-title">
                <span class="online-status-dot"></span>
                <span>ЧАТ ИГРОКОВ</span>
            </div>
            <button class="chat-toggle-btn" id="chat-toggle-icon">▲</button>
        </div>
        <div class="chat-body">
            <div class="chat-messages" id="chat-messages-list"></div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Напиши сообщение..." maxlength="120">
                <button class="chat-send-btn" id="chat-send-btn">➤</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // Привязка событий + запрос разрешения на уведомления при клике
    document.getElementById('chat-header-btn').addEventListener('click', () => {
        requestNotificationPermission();
        toggleChat();
    });

    document.getElementById('chat-send-btn').addEventListener('click', sendChatMessage);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

// 4. УПРАВЛЕНИЕ ОКНОМ ЧАТА
window.toggleChat = function() {
    const chat = document.getElementById('chat-widget');
    const icon = document.getElementById('chat-toggle-icon');
    if (!chat) return;

    chat.classList.toggle('collapsed');
    
    if (icon) {
        icon.innerText = chat.classList.contains('collapsed') ? '▲' : '▼';
    }
    
    const container = document.getElementById('chat-messages-list');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
};

// 5. УПРАВЛЕНИЕ ОНЛАЙН СТАТУСОМ
function manageStatus() {
    if (!userData.uid) return;
    const myStatusRef = ref(db, `all_players/${userData.uid}`);

    update(myStatusRef, {
        nickname: userData.nickname,
        online: true
    });

    onDisconnect(myStatusRef).update({ online: false });
}

// 6. ТАБЛИЦА ИГРОКОВ (Если есть элемент на странице)
function renderPlayersTable() {
    const container = document.getElementById('online-list');
    if (!container) return;

    const listRef = ref(db, 'all_players');
    onValue(listRef, (snapshot) => {
        container.innerHTML = "";
        if (snapshot.exists()) {
            const players = snapshot.val();
            Object.keys(players).forEach(id => {
                const player = players[id];
                const isOnline = player.online === true;
                const isMe = id === userData.uid;

                const row = document.createElement('div');
                row.style.cssText = `
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 10px 15px; background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px; margin-bottom: 5px;
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
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${isOnline ? '#00ff88' : '#555'};"></div>
                    </div>
                `;
                container.appendChild(row);
            });
        }
    });
}

// 7. ОТПРАВКА И ЧТЕНИЕ СООБЩЕНИЙ С УВЕДОМЛЕНИЯМИ
const chatRef = ref(db, 'global_chat');

window.sendChatMessage = function() {
    requestNotificationPermission(); // Просим разрешение при отправке
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
};

function initGlobalChat() {
    const chatQuery = query(chatRef, limitToLast(50));

    onValue(chatQuery, (snapshot) => {
        const container = document.getElementById('chat-messages-list');
        if (!container) return;

        container.innerHTML = '';
        const myName = userData.nickname || 'Игрок';

        if (snapshot.exists()) {
            const messages = snapshot.val();
            const keys = Object.keys(messages);

            keys.forEach((key, index) => {
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

                // 🔔 Вызываем уведомление, только если это НОВОЕ сообщение (после загрузки) и НЕ от нас
                if (!isInitialLoad && index === keys.length - 1 && !isMe) {
                    sendBrowserNotification(msg.sender, msg.text);
                }
            });
        }

        isInitialLoad = false; // Первая загрузка завершена
        container.scrollTop = container.scrollHeight;
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Запуск при загрузке любой страницы
document.addEventListener('DOMContentLoaded', () => {
    injectChatHTML();
    manageStatus();
    renderPlayersTable();
    initGlobalChat();
});