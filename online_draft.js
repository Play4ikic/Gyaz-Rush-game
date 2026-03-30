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
let currentRound = 1;
let myScore = 0;
let oppScore = 0;
let myCard = null;
let oppCard = null;
let timerInterval;
let searchTimerInterval;
let usedIndexes = [];

// 1. ГЛАВНАЯ ФУНКЦИЯ ПОИСКА
window.startOnlineSearch = async function() {
    // Проверка состава (должно быть 5 игроков)
    const validPlayers = activeSquad.filter(p => p !== null);
    if (validPlayers.length < 5) {
        alert("В твоем составе должно быть 5 игроков! Проверь Клуб.");
        return;
    }

    const statusText = document.querySelector('.logo-text');
    statusText.innerText = "ПОИСК СОПЕРНИКА (0:20)...";
    
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
        
        listenForOpponent();

        // Таймер отмены поиска (20 секунд)
        let timeLeft = 20;
        searchTimerInterval = setInterval(async () => {
            timeLeft--;
            statusText.innerText = `ПОИСК СОПЕРНИКА (0:${timeLeft < 10 ? '0' + timeLeft : timeLeft})...`;
            
            if (timeLeft <= 0) {
                clearInterval(searchTimerInterval);
                await remove(queueRef);
                await remove(ref(db, `matches/${matchId}`));
                statusText.innerText = "READY FOR BATTLE?";
                alert("Соперник не найден. Попробуй позже!");
            }
        }, 1000);

    } else {
        // Присоединяемся как Гость
        const data = snapshot.val();
        if (data.hostId === userData.uid) return alert("Ты уже в очереди!");

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
            clearInterval(searchTimerInterval);
            initGameUI();
            off(statusRef);
        }
    });
}

function initGameUI() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('user-coins').innerText = userData.balance;
    document.querySelectorAll('.card-zone h3')[1].innerText = "СОПЕРНИК";
    startRound();
}

// 2. ЛОГИКА РАУНДОВ
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
        if (snap.exists()) {
            oppCard = snap.val();
        }
    });
}

function renderHand() {
    const hand = document.getElementById('squad-hand');
    hand.innerHTML = "";
    activeSquad.forEach((player, index) => {
        if (!player) return;
        const img = document.createElement('img');
        
        // Определяем папку по рейтингу (как в club.js)
        let folder = "Gold";
        if (player.rating >= 97) folder = "Toty";
        else if (player.rating >= 90) folder = "Champions";

        img.src = `${folder}/${player.file}`;
        
        if (usedIndexes.includes(index)) {
            img.classList.add('used-card');
        } else {
            img.onclick = () => {
                if (myCard) return;
                myCard = player;
                usedIndexes.push(index);
                document.getElementById('player-card-display').innerHTML = `<img src="${folder}/${player.file}" style="width:100%">`;
                
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
        let folder = oppCard.rating >= 97 ? "Toty" : (oppCard.rating >= 90 ? "Champions" : "Gold");
        oppDisplay.innerHTML = `<img src="${folder}/${oppCard.file}" style="width:100%">`;
    } else {
        oppDisplay.innerHTML = "<div style='color:red; font-weight:bold; margin-top:50px;'>ПРОПУСК</div>";
    }

    const myRating = myCard ? Number(myCard.rating) : 0;
    const oppRating = oppCard ? Number(oppCard.rating) : 0;

    if (myRating > oppRating) { myScore++; showRoundResult("ВЫИГРАЛ РАУНД!"); }
    else if (oppRating > myRating) { oppScore++; showRoundResult("ПРОИГРАЛ РАУНД"); }
    else { showRoundResult("НИЧЬЯ"); }

    document.getElementById('p-score').innerText = myScore;
    document.getElementById('b-score').innerText = oppScore;

    setTimeout(() => {
        currentRound++;
        startRound();
    }, 3000);
}

function showRoundResult(text) {
    const timerBox = document.getElementById('timer-box');
    const original = timerBox.innerHTML;
    timerBox.innerHTML = `<span style="color:#00ff88; font-weight:bold;">${text}</span>`;
    setTimeout(() => { timerBox.innerHTML = original; }, 2500);
}

async function endMatch() {
    let reward = myScore > oppScore ? 5000 : (myScore < oppScore ? 500 : 1500);
    alert(`МАТЧ ОКОНЧЕН! Твой счет: ${myScore}. Награда: ${reward} CY`);

    const userRef = ref(db, 'users/' + userData.uid);
    userData.balance += reward;
    await update(userRef, { balance: userData.balance });
    localStorage.setItem('gyaz_user', JSON.stringify(userData));

    if (myRole === "host") {
        setTimeout(() => remove(ref(db, `matches/${matchId}`)), 3000);
    }
    window.location.href = "index.html";
}
