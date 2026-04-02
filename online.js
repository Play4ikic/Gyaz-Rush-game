import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

// Получаем данные текущего игрока (Эльджан и т.д.)
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

    // При входе: записываем ник и ставим статус true
    update(myStatusRef, {
        nickname: userData.nickname,
        online: true
    });

    // При закрытии вкладки: меняем статус на false (НЕ УДАЛЯЕМ)
    onDisconnect(myStatusRef).update({
        online: false
    });
}

/**
 * 2. ВЫВОД ТАБЛИЦЫ ВСЕХ ИГРОКОВ
 */
function renderPlayersTable() {
    const listRef = ref(db, 'all_players');
    const container = document.getElementById('online-list');

    onValue(listRef, (snapshot) => {
        if (!container) return;
        container.innerHTML = ""; // Чистим список

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
                        ${player.nickname} ${isMe ? '<small style="color:#e1b12c">(Вы)</small>' : ''}
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

// Запуск
manageStatus();
renderPlayersTable();