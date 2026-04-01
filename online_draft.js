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

// --- ДАННЫЕ И СОСТОЯНИЕ ---
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { uid: "guest_" + Math.floor(Math.random()*1000), nickname: "Player", balance: 0 };
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
let matchId = null;
let myRole = ""; 
let isSearching = false; 
let round = 1;
let playerScore = 0;
let oppScore = 0;
let myCard = null;
let oppCard = null;
let timerInterval;
let searchTimeoutInterval;
let usedIndexes = [];

// --- ФУНКЦИЯ ПОИСКА ---
window.startOnlineSearch = async function() {
    if (isSearching) return;

    const validPlayers = activeSquad.filter(p => p !== null);
    if (validPlayers.length < 5) {
        alert(" сначала выбери всех 5 игроков в Клубе!");
        return;
    }

    isSearching = true;
    const statusText = document.querySelector('.logo-text');
    
    // 1. ЗАПУСКАЕМ ТАЙМЕР СРАЗУ (Визуально)
    let timeLeft = 20;
    if (statusText) statusText.innerText = `ПОИСК СОПЕРНИКА (0:${timeLeft})...`;
    
    clearInterval(searchTimeoutInterval);
    searchTimeoutInterval = setInterval(() => {
        timeLeft--;
        const currentStatus = document.querySelector('.logo-text');
        if (currentStatus) {
            currentStatus.innerText = `ПОИСК СОПЕРНИКА (0:${timeLeft < 10 ? '0'+timeLeft : timeLeft})...`;
        }
        if (timeLeft <= 0) {
            stopSearch("Время вышло. Никого нет в сети.");
        }
    }, 1000);

    // 2. РАБОТА С FIREBASE
    try {
        const queueRef = ref(db, 'queue');
        const snapshot = await get(queueRef);

        if (!snapshot.exists()) {
            // Режим ХОСТА
            const newMatchRef = push(ref(db, 'matches'));
            matchId = newMatchRef.key;
            myRole = "host";
            
            await set(queueRef, { 
                matchId, 
                hostId: userData.uid, 
                hostName: userData.nickname 
            });
            
            listenForOpponent();
        } else {
            // Режим ГОСТЯ
            const data = snapshot.val();
            if (data.hostId === userData.uid) {
                isSearching = false;
                return;
            }

            matchId = data.matchId;
            myRole = "guest";
            
            await remove(queueRef); 
            await update(ref(db, `matches/${matchId}`), {
                guestId: userData.uid,
                guestName: userData.nickname,
                status: "playing"
            });
            
            clearInterval(searchTimeoutInterval);
            initGameUI();
        }
    } catch (err) {
        console.error("Ошибка Firebase:", err);
        stopSearch("Ошибка сети. Проверь интернет.");
    }
};

async function stopSearch(reason) {
    clearInterval(searchTimeoutInterval);
    isSearching = false;
    const queueRef = ref(db, 'queue');
    await remove(queueRef);
    
    const statusText = document.querySelector('.logo-text');
    if (statusText) statusText.innerText = "READY FOR BATTLE?";
    if (reason) alert(reason);
}

function listenForOpponent() {
    const statusRef = ref(db, `matches/${matchId}/status`);
    onValue(statusRef, (snap) => {
        if (snap.val() === "playing") {
            clearInterval(searchTimeoutInterval);
            off(statusRef);
            initGameUI();
        }
    });
}

function initGameUI() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const coinEl = document.getElementById('user-coins');
    if (coinEl) coinEl.innerText = userData.balance || 0;
    
    startRound();
}

function startRound() {
    if (round > 5) return endGame();

    myCard = null;
    oppCard = null;
    document.getElementById('round-num').innerText = round;
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

    const oppPath = myRole === "host" ? `matches/${matchId}/round${round}/guestCard` : `matches/${matchId}/round${round}/hostCard`;
    onValue(ref(db, oppPath), (snap) => {
        if (snap.exists()) oppCard = snap.val();
    });
}


function renderHand() {
    const hand = document.getElementById('squad-hand');
    if (!hand) return;
    hand.innerHTML = "";
    activeSquad.forEach((player, index) => {
        if (!player) return;
        
        const folder = player.folder || (player.rating > 96 ? 'Toty' : (player.rating > 89 ? 'Champions' : 'Gold'));
        const img = document.createElement('img');
        img.src = `${folder}/${player.file}`;
        
        if (usedIndexes.includes(index)) {
            img.style.opacity = "0.2";
            img.style.pointerEvents = "none";
        } else {
            img.onclick = () => {
                if (myCard) return;
                myCard = { ...player, folder };
                usedIndexes.push(index);
                document.getElementById('player-card-display').innerHTML = `<img src="${folder}/${player.file}" style="width:100%">`;
                
                const myPath = myRole === "host" ? "hostCard" : "guestCard";
                update(ref(db, `matches/${matchId}/round${round}`), { [myPath]: myCard });
                renderHand();
            };
        }
        hand.appendChild(img);
    });
}

function processBattle() {
    const oppDisplay = document.getElementById('bot-card-display');
    if (!oppDisplay) return;
    oppDisplay.classList.remove('card-back');

    if (oppCard) {
        const folder = oppCard.folder || (oppCard.rating > 96 ? 'Toty' : (oppCard.rating > 89 ? 'Champions' : 'Gold'));
        oppDisplay.innerHTML = `<img src="${folder}/${oppCard.file}" style="width:100%">`;
    } else {
        oppDisplay.innerHTML = "<div style='color:red; font-weight:bold; margin-top:50px;'>ПРОПУСК</div>";
    }

    const pRating = myCard ? Number(myCard.rating) : 0;
    const oRating = oppCard ? Number(oppCard.rating) : 0;

    if (pRating > oRating) playerScore++;
    else if (oRating > pRating) oppScore++;

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = oppScore;

    setTimeout(() => { 
        round++; 
        startRound(); 
    }, 2500);
}

async function endGame() {
    let reward = playerScore > oppScore ? 5000 : (playerScore === oppScore ? 1500 : 500);
    alert(`МАТЧ ОКОНЧЕН! Счёт: ${playerScore}:${oppScore}. Награда: ${reward} CY`);

    const userRef = ref(db, 'users/' + userData.uid);
    userData.balance = (Number(userData.balance) || 0) + reward;
    
    try {
        await update(userRef, { balance: userData.balance });
        localStorage.setItem('gyaz_user', JSON.stringify(userData));
    } catch (e) { console.error("Ошибка сохранения баланса"); }

    if (myRole === "host") {
        setTimeout(() => remove(ref(db, `matches/${matchId}`)), 5000);
    }
    window.location.href = "index.html";
}