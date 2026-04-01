import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// 1. Конфигурация твоего Firebase
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

// 2. Получаем текущего пользователя (Эльджан, Тургай и т.д.)
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "guest_" + Math.floor(Math.random() * 1000), 
    nickname: "Аноним" 
};

// --- ЛОГИКА ТАБЛИЦЫ ---

/**
 * Отправляем данные о том, что МЫ в сети
 */
function enterOnline() {
    if (!userData.uid) return;
    const myRef = ref(db, `online_users/${userData.uid}`);

    set(myRef, {
        nickname: userData.nickname,
        last_active: serverTimestamp(),
        isOnline: true
    });

    // Если закрыл вкладку — удаляем из таблицы автоматически
    onDisconnect(myRef).remove();
}

/**
 * Слушаем базу и рисуем таблицу
 */
function syncOnlineTable() {
    const listRef = ref(db, 'online_users');
    const container = document.getElementById('online-list');

    onValue(listRef, (snapshot) => {
        if (!container) return;
        container.innerHTML = ""; // Очистка

        if (snapshot.exists()) {
            const users = snapshot.val();
            
            // Создаем шапку таблицы (визуально)
            const tableHeader = document.createElement('div');
            tableHeader.style.cssText = "display: flex; justify-content: space-between; padding: 5px 15px; color: #555; font-size: 12px; border-bottom: 1px solid #222; margin-bottom: 10px;";
            tableHeader.innerHTML = "<span>ИГРОК</span><span>СТАТУС</span>";
            container.appendChild(tableHeader);

            // Перебираем всех, кто в базе
            Object.keys(users).forEach(id => {
                const user = users[id];
                const isMe = id === userData.uid;

                const row = document.createElement('div');
                row.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: ${isMe ? 'rgba(225, 177, 44, 0.1)' : 'rgba(255,255,255,0.03)'};
                    border-radius: 10px;
                    margin-bottom: 5px;
                    border: 1px solid ${isMe ? '#e1b12c' : 'transparent'};
                `;

                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; background: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">
                            ${user.nickname.charAt(0).toUpperCase()}
                        </div>
                        <span style="color: white; font-weight: bold;">${user.nickname} ${isMe ? '<small>(Вы)</small>' : ''}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="width: 8px; height: 8px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 8px #00ff88;"></div>
                        <span style="color: #00ff88; font-size: 11px; font-weight: 900;">LIVE</span>
                    </div>
                `;
                container.appendChild(row);
            });
        } else {
            container.innerHTML = "<p style='text-align:center; color:#444; margin-top:20px;'>В сети никого нет</p>";
        }
    });
}

// Запуск
enterOnline();
syncOnlineTable();