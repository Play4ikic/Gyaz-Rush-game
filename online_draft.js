import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, push, get, remove } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// ТВОЙ КОНФИГ (Проверь databaseURL!)
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
let currentRound = 1;
let myScore = 0;
let oppScore = 0;
let myCard = null;
let oppCard = null;
let timerInterval;
let usedIndexes = [];

// ФУНКЦИЯ ПОИСКА (Привязана к кнопке)
window.startOnlineSearch = async function() {
    const statusText = document.querySelector('.logo-text');
    statusText.innerText = "ПОИСК СОПЕРНИКА...";
    
    const queueRef = ref(db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) {
        // Создаем новый матч как Хост
        const newMatchRef = push(ref(db, 'matches'));
        matchId = newMatchRef.key;
        myRole = "host";
        
        await set(queueRef, { 
            matchId: matchId, 
            hostName: userData.nickname, 
            hostId: userData.uid 
        });
        
        console.log("Ждем гостя в матче:", matchId);
        listenForOpponent();
    } else {
        // Присоединяемся как Гость
        const data = snapshot.val();
        matchId = data.matchId;
        myRole = "guest";
        
        await remove(queueRef); // Очередь занята
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
    document.querySelectorAll('.card-zone h3')[1].innerText = "СОПЕРНИК";
    startRound();
}

function startRound() {
    if (currentRound > 5) return endMatch();

    myCard = null;
    oppCard = null;
    document.getElementById('round-num').innerText = currentRound;
    document.getElementById('player-card-display').innerHTML = "";
    document.getElementById('bot-card-display').innerHTML = "";
    document.getElementById('bot-card-display').classList.add('card-back');
    
    renderHand();
    
    let timeLeft = 7; // Твои 7 секунд
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

    // Слушаем ход врага в реальном времени
    const oppPath = myRole === "host" ? `matches/${matchId}/round${currentRound}/guestCard` : `matches/${matchId}/round${currentRound}/hostCard`;
    onValue(ref(db, oppPath), (snap) => {
        if (snap.exists()) {
            oppCard = snap.val();
            console.log("Враг выбрал карту!");
        }
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
            img.classList.add('used-card');
        } else {
            img.onclick = () => {
                if (myCard) return; // Нельзя менять выбор в раунде
                myCard = player;
                usedIndexes.push(index);
                
                document.getElementById('player-card-display').innerHTML = `<img src="${folder}/${player.file}">`;
                
                const myPath = myRole === "host" ? "hostCard" : "guestCard";
                update(ref(db, `matches/${matchId}/round${currentRound}`), { [myPath]: player });
                
                renderHand(); // Затенить выбранную карту
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
        oppDisplay.innerHTML = "<div style='color:red; font-weight:bold; margin-top:50px;'>ПРОПУСК</div>";
    }

    const myRating = myCard ? Number(myCard.rating) : 0;
    const oppRating = oppCard ? Number(oppCard.rating) : 0;

    if (myRating > oppRating) {
        myScore++;
        showRoundResult("ВЫИГРАЛ РАУНД!");
    } else if (oppRating > myRating) {
        oppScore++;
        showRoundResult("ПРОИГРАЛ РАУНД");
    } else {
        showRoundResult("НИЧЬЯ");
    }

    document.getElementById('p-score').innerText = myScore;
    document.getElementById('b-score').innerText = oppScore;

    setTimeout(() => {
        currentRound++;
        startRound();
    }, 3000);
}

function showRoundResult(text) {
    const timerBox = document.getElementById('timer-box');
    const originalContent = timerBox.innerHTML;
    timerBox.innerHTML = `<span style="color:#00ff88">${text}</span>`;
    setTimeout(() => { timerBox.innerHTML = originalContent; }, 2500);
}

async function endMatch() {
    let resultText = "";
    let reward = 0;

    if (myScore > oppScore) {
        resultText = "ПОБЕДА В ОНЛАЙНЕ! +5000 CY";
        reward = 5000;
    } else if (myScore < oppScore) {
        resultText = "ПОРАЖЕНИЕ. +500 CY";
        reward = 500;
    } else {
        resultText = "НИЧЬЯ! +1500 CY";
        reward = 1500;
    }

    // Обновляем баланс в Firebase
    const userRef = ref(db, 'users/' + userData.uid);
    userData.balance += reward;
    await update(userRef, { balance: userData.balance });
    localStorage.setItem('gyaz_user', JSON.stringify(userData));

    alert(resultText);
    
    // Чистим за собой в базе
    if (myRole === "host") {
        setTimeout(() => remove(ref(db, `matches/${matchId}`)), 5000);
    }
    
    window.location.href = "index.html";
}