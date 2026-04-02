import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect, update, remove } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "guest_" + Math.floor(Math.random() * 1000), 
    nickname: "Player" 
};

// 1. УПРАВЛЕНИЕ СТАТУСОМ
function manageStatus() {
    if (!userData.uid) return;
    const myStatusRef = ref(db, `all_players/${userData.uid}`);
    update(myStatusRef, { nickname: userData.nickname, online: true });
    onDisconnect(myStatusRef).update({ online: false });
}

// 2. ФУНКЦИЯ ВЫЗОВА НА БОЙ
window.sendChallenge = function(targetId, targetName) {
    const matchId = "match_" + Date.now(); // Создаем ID матча
    const challengeRef = ref(db, `challenges/${targetId}`);
    
    set(challengeRef, {
        fromId: userData.uid,
        fromName: userData.nickname,
        matchId: matchId,
        status: "pending"
    });
    
    alert(`Вызов отправлен игроку ${targetName}! Ожидайте...`);
    
    // Следим, принял ли он
    onValue(challengeRef, (snap) => {
        if (snap.exists() && snap.val().status === "accepted") {
            localStorage.setItem('currentMatchId', matchId);
            localStorage.setItem('myRole', 'host');
            window.location.href = "draft.html"; // Переходим в драфт
        }
    });
};

// 3. СЛЕЖКА ЗА ВХОДЯЩИМИ ВЫЗОВАМИ
function listenForChallenges() {
    const myChallengeRef = ref(db, `challenges/${userData.uid}`);
    onValue(myChallengeRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.status === "pending") {
                const accept = confirm(`Игрок ${data.fromName} вызывает вас на битву в Драфте! Принять?`);
                if (accept) {
                    update(myChallengeRef, { status: "accepted" });
                    localStorage.setItem('currentMatchId', data.matchId);
                    localStorage.setItem('myRole', 'guest');
                    window.location.href = "draft.html";
                } else {
                    remove(myChallengeRef);
                }
            }
        }
    });
}

// 4. РЕНДЕР ТАБЛИЦЫ
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
                row.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 5px; border: 1px solid ${isMe ? '#e1b12c' : 'transparent'};`;

                // Кнопка вызова (только если игрок онлайн и это не я)
                let challengeBtn = "";
                if (isOnline && !isMe) {
                    challengeBtn = `<button onclick="sendChallenge('${id}', '${player.nickname}')" style="background: #e1b12c; color: black; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 10px; margin-right: 10px;">ВЫЗВАТЬ</button>`;
                }

                row.innerHTML = `
                    <span style="color: white; font-weight: bold;">${player.nickname} ${isMe ? '<small style="color:#e1b12c">(Вы)</small>' : ''}</span>
                    <div style="display: flex; align-items: center;">
                        ${challengeBtn}
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${isOnline ? '#00ff88' : '#555'}; box-shadow: ${isOnline ? '0 0 8px #00ff88' : 'none'};"></div>
                    </div>
                `;
                container.appendChild(row);
            });
        }
    });
}

manageStatus();
listenForChallenges();
renderPlayersTable();