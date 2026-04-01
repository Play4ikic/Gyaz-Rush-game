import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// 1. Твой конфиг Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com", 
    storageBucket: "play4ik-473ef.firebasestorage.app",
    messagingSenderId: "115893557892",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

// 2. Инициализация
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 3. Получаем данные пользователя из localStorage
// Если данных нет, создаем временные (чтобы скрипт не падал)
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "guest_" + Math.floor(Math.random() * 10000), 
    nickname: "Player" 
};

/**
 * ФУНКЦИЯ: Твоё присутствие в сети
 */
function trackMyStatus() {
    if (!userData.uid) return;

    const myStatusRef = ref(db, `online_users/${userData.uid}`);

    // Записываем данные в таблицу online_users
    set(myStatusRef, {
        nickname: userData.nickname || "Аноним",
        status: "online",
        last_seen: serverTimestamp() // Время сервера
    });

    // САМОЕ ВАЖНОЕ: Удалить запись, когда Эльджан закроет вкладку или пропадет интернет
    onDisconnect(myStatusRef).remove();
}

/**
 * ФУНКЦИЯ: Отображение списка всех игроков
 */
function listenToOnlineUsers() {
    const onlineListRef = ref(db, 'online_users');
    const listContainer = document.getElementById('online-list');

    onValue(onlineListRef, (snapshot) => {
        if (!listContainer) return;
        
        listContainer.innerHTML = ""; // Очищаем список перед обновлением

        if (snapshot.exists()) {
            const users = snapshot.val();
            
            // Превращаем объект в массив и перебираем каждого игрока
            Object.keys(users).forEach(userId => {
                const user = users[userId];
                
                const userRow = document.createElement('div');
                userRow.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 10px;
                    margin-bottom: 8px;
                    border-left: 3px solid ${userId === userData.uid ? '#e1b12c' : '#00ff88'};
                `;

                // Если это ты сам, добавим пометку (ВЫ)
                const isMe = userId === userData.uid ? " <span style='color:#e1b12c; font-size:10px;'>(ВЫ)</span>" : "";

                userRow.innerHTML = `
                    <div style="color: white; font-weight: bold;">
                        ${user.nickname}${isMe}
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 8px; height: 8px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 5px #00ff88;"></div>
                        <span style="color: #00ff88; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Online</span>
                    </div>
                `;
                
                listContainer.appendChild(userRow);
            });
        } else {
            listContainer.innerHTML = "<p style='color:#555; text-align:center;'>Сейчас в сети никого нет...</p>";
        }
    });
}

// Запуск функций
trackMyStatus();
listenToOnlineUsers();

console.log("Система 'ЛЮДИ' запущена. Твой ID:", userData.uid);