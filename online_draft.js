import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, push, get, remove } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
// ИМПОРТИРУЕМ ТВОЮ ЭКОНОМИКУ (убедись, что файл economy.js в той же папке)
import { updateBalance } from './economy.js';

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
let userData = JSON.parse(localStorage.getItem('gyaz_user'));
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [];
let matchId = null;
let myRole = ""; 
let currentRound = 1;
let myScore = 0;
let oppScore = 0;
let myCard = null;
let oppCard = null;
let timerInterval;
let usedIndexes = [];

// --- ПОИСК МАТЧА ---
window.startOnlineSearch = async function() {
    if (!userData) { alert("Ошибка авторизации!"); return; }
    
    const statusText = document.querySelector('.logo-text');
    statusText.innerText = "ПОИСК СОПЕРНИКА...";
    
    const queueRef = ref(db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) {
        const newMatchRef = push(ref(db, 'matches'));
        matchId = newMatchRef.key;
        myRole = "host";
        
        await set(queueRef, { 
            matchId: matchId, 
            hostName: userData.nickname, 
            hostId: userData.uid 
        });
        listenForOpponent();
    } else {
        const data = snapshot.val();
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
    onValue(ref(db, `matches/${matchId}/status`), (snap) => {
        if (snap.val() === "playing") initGameUI();
    });
}

function initGameUI() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    startRound();
}

// --- ЛОГИКА РАУНДОВ ---
function startRound() {
    if (currentRound > 5) return endMatch();

    myCard = null;
    oppCard = null;
    document.getElementById('round-num').innerText = currentRound;
    document.getElementById('player-card-display').innerHTML = "";
    document.getElementById('bot-card-display').innerHTML = "";
    document.getElementById('bot-card-display').classList.add('card-back');
    
    renderHand();
    
    let timeLeft = 7;
    document.getElementById('timer').innerText = timeLeft;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            processBattle();
        }
    }, 1000);

    const oppPath = myRole === "host" ? `matches/${matchId}/round${currentRound}/guestCard` : `matches/${matchId}/round${currentRound}/hostCard`;
    onValue(ref(db, oppPath), (snap) => {
        if (snap.exists()) oppCard = snap.val();
    });
}

function renderHand() {
    const hand = document.getElementById('squad-hand');
    hand.innerHTML = "";
    activeSquad.forEach((player, index) => {
        if (!player) return;
        const img = document.createElement('img');
        const folder = player.folder || "Gold";
        img.src = `${folder}/${player.file}`;
        
        if (usedIndexes.includes(index)) {
            img.style.opacity = "0.3";
            img.style.pointerEvents = "none";
        } else {
            img.onclick = () => {
                if (myCard) return;
                myCard = player;
                usedIndexes.push(index);
                document.getElementById('player-card-display').innerHTML = `<img src="${folder}/${player.file}">`;
                
                const myPath = myRole === "host" ? "hostCard" : "guestCard";
                update(ref(db, `matches/${matchId}/round${currentRound}`), { [myPath]: player });
                renderHand();
            };
        }
        hand.appendChild(img);
    });
}

function processBattle() {
    const oppDisplay = document.getElementById('bot-card-display');
    oppDisplay.classList.remove('card-back');

    if (oppCard) {
        const folder = oppCard.folder || "Gold";
        oppDisplay.innerHTML = `<img src="${folder}/${oppCard.file}">`;
    } else {
        oppDisplay.innerHTML = "<div style='color:red; margin-top:50px;'>ПРОПУСК</div>";
    }

    const myRating = myCard ? Number(myCard.rating) : 0;
    const oppRating = oppCard ? Number(oppCard.rating) : 0;

    if (myRating > oppRating) myScore++;
    else if (oppRating > myRating) oppScore++;

    document.getElementById('p-score').innerText = myScore;
    document.getElementById('b-score').innerText = oppScore;

    setTimeout(() => {
        currentRound++;
        startRound();
    }, 3000);
}

// --- ФИНАЛ МАТЧА (ТУТ БЫЛА ОШИБКА) ---
async function endMatch() {
    let reward = 0;
    let message = "";

    if (myScore > oppScore) {
        reward = 5000;
        message = "ПОБЕДА! +5000 CY";
    } else if (myScore < oppScore) {
        reward = 0;
        message = "ПОРАЖЕНИЕ.";
    } else {
        reward = 500;
        message = "НИЧЬЯ. +500 CY";
    }

    // ИСПОЛЬЗУЕМ ФУНКЦИЮ ИЗ ECONOMY.JS
    // Она прибавит награду к текущему балансу, не обнуляя его
    await updateBalance(reward);

    alert(message);
    
    if (myRole === "host") {
        setTimeout(() => remove(ref(db, `matches/${matchId}`)), 3000);
    }
    
    window.location.href = "index.html";
}