import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, push, get, remove, off } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

let userData = JSON.parse(localStorage.getItem('gyaz_user'));
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [];
let matchId = null;
let myRole = ""; 
let searchTimeout = null;

// ФУНКЦИЯ ПОИСКА
window.startOnlineSearch = async function() {
    // 1. ПРОВЕРКА СОСТАВА (Должно быть ровно 5 игроков)
    const validPlayers = activeSquad.filter(p => p !== null);
    if (validPlayers.length < 5) {
        alert("ОШИБКА: В твоем составе должно быть 5 игроков! Зайди в Клуб и выбери команду.");
        return;
    }

    const statusText = document.querySelector('.logo-text');
    statusText.innerText = "ПОИСК СОПЕРНИКА (0:15)...";
    
    const queueRef = ref(db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) {
        // Создаем матч как Хост
        const newMatchRef = push(ref(db, 'matches'));
        matchId = newMatchRef.key;
        myRole = "host";
        
        await set(queueRef, { 
            matchId: matchId, 
            hostName: userData.nickname, 
            hostId: userData.uid 
        });
        
        console.log("Ожидание игрока...");
        listenForOpponent();

        // 2. ТАЙМАУТ ПОИСКА (Если никто не зашел за 15 сек)
        let secondsLeft = 15;
        searchTimeout = setInterval(async () => {
            secondsLeft--;
            statusText.innerText = `ПОИСК СОПЕРНИКА (0:${secondsLeft < 10 ? '0'+secondsLeft : secondsLeft})...`;
            
            if (secondsLeft <= 0) {
                clearInterval(searchTimeout);
                await remove(queueRef); // Удаляем себя из очереди
                await remove(ref(db, `matches/${matchId}`)); // Удаляем матч
                statusText.innerText = "НИКОГО НЕ НАШЛОСЬ";
                alert("Время ожидания истекло. Попробуй позже!");
                setTimeout(() => { statusText.innerText = "READY FOR BATTLE?"; }, 3000);
            }
        }, 1000);

    } else {
        // Заходим как Гость
        const data = snapshot.val();
        
        // Проверка: не пытаемся ли мы играть сами с собой
        if (data.hostId === userData.uid) {
            alert("Ты уже ищешь игру с другого устройства или вкладки!");
            return;
        }

        matchId = data.matchId;
        myRole = "guest";
        
        await remove(queueRef); 
        await update(ref(db, `matches/${matchId}`), {
            guestName: userData.nickname,
            guestId: userData.uid,
            status: "playing"
        });
        
        initGameUI();
    }
};

function listenForOpponent() {
    const statusRef = ref(db, `matches/${matchId}/status`);
    onValue(statusRef, (snap) => {
        if (snap.val() === "playing") {
            clearInterval(searchTimeout); // Останавливаем таймер, если игрок найден
            off(statusRef); // Перестаем слушать статус
            initGameUI();
        }
    });
}

function initGameUI() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('user-coins').innerText = userData.balance;
    // Дальнейшая логика раундов (startRound и т.д. из твоего прошлого кода)
    console.log("Игра началась! Роль:", myRole);
}

// ... ОСТАЛЬНЫЕ ТВОИ ФУНКЦИИ (startRound, processBattle и т.д.) ...
