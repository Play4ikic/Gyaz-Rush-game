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

let isInitialLoad = true;

// 1. ЗАПРОС РАЗРЕШЕНИЯ НА УВЕДОМЛЕНИЯ
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// 2. ОТПРАВКА БРАУЗЕРНЫХ УВЕДОМЛЕНИЙ
function sendBrowserNotification(sender, text) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const chat = document.getElementById('chat-widget');
    const isCollapsed = chat && chat.classList.contains('collapsed');

    if (document.hidden || isCollapsed) {
        const notification = new Notification(`💬 ${sender}`, {
            body: text,
            icon: 'favicon.png',
            tag: 'chat-msg'
        });

        notification.onclick = function() {
            window.focus();
            if (chat && chat.classList.contains('collapsed')) {
                window.toggleChat();
            }
            notification.close();
        };
    }
}

// 3. АВТОМАШИЧЕСКАЯ ВСТАВКА HTML ЧАТА (ЕСЛИ ОТСУТСТВУЕТ)
function injectChatHTML() {
    if (!document.getElementById('chat-widget')) {
        const chatHTML = `
        <div id="chat-widget" class="chat-widget collapsed">
            <div class="chat-header">
                <div class="chat-header-title" id="chat-header-btn">
                    <span class="online-status-dot"></span>
                    <span>ЧАТ ИГРОКОВ</span>
                </div>
                <div class="chat-controls">
                    <button class="chat-control-btn" id="chat-size-btn" title="Увеличить размер">⤢</button>
                    <button class="chat-control-btn" id="chat-toggle-icon" title="Свернуть/Развернуть">▲</button>
                </div>
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
    }

    bindChatEvents();
}

// 4. ПРИВЯЗКА СОБЫТИЙ
function bindChatEvents() {
    const headerBtn = document.getElementById('chat-header-btn');
    const toggleIcon = document.getElementById('chat-toggle-icon');
    const sizeBtn = document.getElementById('chat-size-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');

    if (headerBtn) {
        headerBtn.addEventListener('click', () => {
            requestNotificationPermission();
            toggleChat();
        });
    }

    if (toggleIcon) {
        toggleIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleChat();
        });
    }

    if (sizeBtn) {
        sizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleChatSize();
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
}

// 5. СВЕРНУТЬ / РАЗВЕРНУТЬ ЧАТ
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

// 6. ИЗМЕНИТЬ РАЗМЕР ЧАТА (УВЕЛИЧИТЬ / УМЕНЬШИТЬ)
window.toggleChatSize = function() {
    const chat = document.getElementById('chat-widget');
    const sizeBtn = document.getElementById('chat-size-btn');
    if (!chat) return;

    if (chat.classList.contains('collapsed')) {
        chat.classList.remove('collapsed');
        const icon = document.getElementById('chat-toggle-icon');
        if (icon) icon.innerText = '▼';
    }

    chat.classList.toggle('expanded');

    if (sizeBtn) {
        sizeBtn.innerText = chat.classList.contains('expanded') ? '❐' : '⤢';
        sizeBtn.title = chat.classList.contains('expanded') ? 'Уменьшить' : 'Увеличить';
    }

    const container = document.getElementById('chat-messages-list');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
};

// 7. СТАТУС ОНЛАЙН
function manageStatus() {
    if (!userData.uid) return;
    const myStatusRef = ref(db, `all_players/${userData.uid}`);

    update(myStatusRef, {
        nickname: userData.nickname,
        online: true
    });

    onDisconnect(myStatusRef).update({ online: false });
}

// 8. ОТПРАВКА И СЛУШАТЕЛЬ ЧАТА
const chatRef = ref(db, 'global_chat');

window.sendChatMessage = function() {
    requestNotificationPermission();
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

                if (!isInitialLoad && index === keys.length - 1 && !isMe) {
                    sendBrowserNotification(msg.sender, msg.text);
                }
            });
        }

        isInitialLoad = false;
        container.scrollTop = container.scrollHeight;
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    injectChatHTML();
    manageStatus();
    initGlobalChat();
});