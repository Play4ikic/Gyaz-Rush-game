import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, off } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com", 
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { uid: "guest_" + Math.floor(Math.random()*1000), nickname: "Player", balance: 0 };
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

let matchId = localStorage.getItem('currentMatchId'); 
let myRole = localStorage.getItem('myRole'); 

let round = 1;
let playerScore = 0;
let oppScore = 0;
let myCard = null;
let oppCard = null;
let timerInterval;
let usedIndexes = [];

// СТАРТ ПРИ ЗАГРУЗКЕ
window.onload = async function() {
    if (matchId && myRole) {
        // Сразу скрываем меню и показываем арену
        const setup = document.getElementById('setup-screen');
        if(setup) setup.classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        const statusText = document.querySelector('.logo-text');
        if (statusText) statusText.innerText = "ПОДКЛЮЧЕНИЕ К БОЮ...";

        if (myRole === "guest") {
            // Гость обновляет матч, чтобы Хост увидел его вход
            await update(ref(db, `matches/${matchId}`), {
                guestId: userData.uid,
                guestName: userData.nickname,
                status: "playing"
            });
            initGameUI();
        } else {
            // Хост ждет, пока Гость зайдет (статус станет playing)
            listenForOpponent();
        }
    }
};

function listenForOpponent() {
    const statusRef = ref(db, `matches/${matchId}/status`);
    onValue(statusRef, (snap) => {
        if (snap.val() === "playing") {
            off(statusRef);
            initGameUI();
        }
    });
}

function initGameUI() {
    startRound();
}

function startRound() {
    if (round > 5) return endGame();
    myCard = null; oppCard = null;
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
        if (timeLeft <= 0) { clearInterval(timerInterval); processBattle(); }
    }, 1000);

    const oppPath = myRole === "host" ? `matches/${matchId}/round${round}/guestCard` : `matches/${matchId}/round${round}/hostCard`;
    onValue(ref(db, oppPath), (snap) => { if (snap.exists()) oppCard = snap.val(); });
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
            img.style.opacity = "0.2"; img.style.pointerEvents = "none";
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
    if (oppCard) oppDisplay.innerHTML = `<img src="${oppCard.folder}/${oppCard.file}" style="width:100%">`;
    else oppDisplay.innerHTML = "<div style='color:red; font-weight:bold; margin-top:50px;'>ПРОПУСК</div>";

    const pRating = myCard ? Number(myCard.rating) : 0;
    const oRating = oppCard ? Number(oppCard.rating) : 0;
    
    if (pRating > oRating) playerScore++; 
    else if (oRating > pRating) oppScore++;

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = oppScore;
    setTimeout(() => { round++; startRound(); }, 2500);
}

async function endGame() {
    let reward = (playerScore > oppScore) ? 5000 : (playerScore === oppScore ? 500 : 0);
    alert(`МАТЧ ОКОНЧЕН! Счёт: ${playerScore}:${oppScore}. Награда: ${reward} CY`);
    
    let currentBalance = parseInt(localStorage.getItem('fixone_balance')) || 0;
    const newBalance = currentBalance + reward;
    localStorage.setItem('fixone_balance', newBalance.toString());

    if (userData.uid) {
        await update(ref(db, 'users/' + userData.uid), { balance: newBalance });
        userData.balance = newBalance;
        localStorage.setItem('gyaz_user', JSON.stringify(userData));
    }

    // ОЧИСТКА ДАННЫХ
    localStorage.removeItem('currentMatchId');
    localStorage.removeItem('myRole');
    remove(ref(db, `challenges/${userData.uid}`));

    if (myRole === "host" && matchId) {
        setTimeout(() => { remove(ref(db, `matches/${matchId}`)); }, 3000);
    }
    window.location.href = "index.html";
}