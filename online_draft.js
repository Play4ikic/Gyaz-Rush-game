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

// --- БАЗЫ КАРТ (Твои данные) ---
const ALL_GAME_CARDS = [
    { name: 'Ayla', rating: 30, pos: 'GK', club: 'icon', file: 'Ayla-30.png', folder: 'Gold' },
    { name: 'Raul', rating: 3, pos: 'ST', club: 'icon', file: 'Raul-3.png', folder: 'Gold' },
    { name: 'Selim', rating: 68, pos: 'CB', club: 'icon', file: 'Selim-68.png', folder: 'Gold' },
    { name: 'Chaxangir', rating: 68, pos: 'CB', club: 'icon', file: 'Chaxangir-68.png', folder: 'Gold' },
    { name: 'Bayturan', rating: 85, pos: 'ST', club: 'icon', file: 'Bayturan-85.png', folder: 'Gold' },
    { name: 'Eldjan', rating: 92, pos: 'RW', club: 'toxic', file: 'Elcan-92.png', folder: 'Gold' },
    { name: 'Nazrin', rating: 82, pos: 'CB', club: 'toxic', file: 'Nazrin-82.png', folder: 'Gold' },
    { name: 'Turqay', rating: 92, pos: 'ST', club: 'cheer', file: 'Turqay-92.png', folder: 'Gold' },
    { name: 'Tuncay', rating: 90, pos: 'CB', club: 'icon', file: 'Tuncay-90.png', folder: 'Gold' },
    { name: 'Bugday', rating: 87, pos: 'GK', club: 'cheer', file: 'Bugday-87.png', folder: 'Gold' }
];

const totyPlayers = [
    { name: 'Eldjan', rating: 97, pos: 'RW', club: 'toxic', file: 'Elcan-97.png', folder: 'Toty' },
    { name: 'Turqay', rating: 97, pos: 'ST', club: 'cheer', file: 'Turqay-97.png', folder: 'Toty' },
    { name: 'Tuncay', rating: 97, pos: 'DF', club: 'icon', file: 'Tuncay-97.png', folder: 'Toty' },
    { name: 'Bugday', rating: 95, pos: 'GK', club: 'cheer', file: 'Bugday-95.png', folder: 'Toty' },
    { name: 'Nazrin', rating: 91, pos: 'DF', club: 'toxic', file: 'Nazrin-91.png', folder: 'Toty' }
];

const championsPlayers = [
    { name: 'Eldjan', rating: 96, pos: 'RW', club: 'toxic', file: 'Elcan-96.png', folder: 'Champions' },
    { name: 'Turqay', rating: 96, pos: 'ST', club: 'cheer', file: 'Turqay-96.png', folder: 'Champions' },
    { name: 'Tuncay', rating: 91, pos: 'DF', club: 'icon', file: 'Tuncay-91.png', folder: 'Champions' },
    { name: 'Bugday', rating: 90, pos: 'GK', club: 'cheer', file: 'Bugday-90.png', folder: 'Champions' },
    { name: 'Nazrin', rating: 88, pos: 'DF', club: 'toxic', file: 'Nazrin-88.png', folder: 'Champions' }
];

// --- ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
let userData = JSON.parse(localStorage.getItem('gyaz_user'));
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
let matchId = null;
let myRole = ""; 
let isSearching = false; // Защита от двойного клика
let round = 1;
let playerScore = 0;
let oppScore = 0;
let myCard = null;
let oppCard = null;
let timerInterval;
let searchTimeoutInterval;
let usedIndexes = [];

// --- ЗАПУСК ПОИСКА ---
window.startOnlineSearch = async function() {
    if (isSearching) return; // Если уже ищем, второе нажатие игнорируем

    // 1. Проверка состава (ровно 5 игроков)
    const validPlayers = activeSquad.filter(p => p !== null);
    if (validPlayers.length < 5) {
        alert("Эльджан, сначала выбери всех 5 игроков в Клубе!");
        return;
    }

    isSearching = true;
    const statusText = document.querySelector('.logo-text');
    statusText.innerText = "ПОИСК СОПЕРНИКА (0:20)...";
    
    const queueRef = ref(db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) {
        // Создаем матч как Хост
        const newMatchRef = push(ref(db, 'matches'));
        matchId = newMatchRef.key;
        myRole = "host";
        
        await set(queueRef, { matchId, hostId: userData.uid, hostName: userData.nickname });
        
        listenForOpponent();

        // 2. Таймаут: если через 20 секунд никого нет, отменяем
        let timeLeft = 20;
        searchTimeoutInterval = setInterval(async () => {
            timeLeft--;
            statusText.innerText = `ПОИСК СОПЕРНИКА (0:${timeLeft < 10 ? '0'+timeLeft : timeLeft})...`;
            
            if (timeLeft <= 0) {
                stopSearch("Время вышло. Никого нет в сети.");
            }
        }, 1000);
    } else {
        // Присоединяемся как Гость
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
        
        initGameUI();
    }
};

async function stopSearch(reason) {
    clearInterval(searchTimeoutInterval);
    isSearching = false;
    const queueRef = ref(db, 'queue');
    const matchRef = ref(db, `matches/${matchId}`);
    
    await remove(queueRef);
    if (matchId) await remove(matchRef);
    
    document.querySelector('.logo-text').innerText = "READY FOR BATTLE?";
    alert(reason);
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
    document.getElementById('user-coins').innerText = userData.balance || 0;
    startRound();
}

// --- ЛОГИКА БОЯ ---
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
                document.getElementById('player-card-display').innerHTML = `<img src="${folder}/${player.file}">`;
                
                const myPath = myRole === "host" ? "hostCard" : "guestCard";
                update(ref(db, `matches/${matchId}/round${round}`), { [myPath]: player });
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
        const folder = oppCard.folder || (oppCard.rating > 96 ? 'Toty' : (oppCard.rating > 89 ? 'Champions' : 'Gold'));
        oppDisplay.innerHTML = `<img src="${folder}/${oppCard.file}">`;
    } else {
        oppDisplay.innerHTML = "<div style='color:red; margin-top:50px;'>ПРОПУСК</div>";
    }

    const pRating = myCard ? Number(myCard.rating) : 0;
    const oRating = oppCard ? Number(oppCard.rating) : 0;

    if (pRating > oRating) playerScore++;
    else if (oRating > pRating) oppScore++;

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = oppScore;

    setTimeout(() => { round++; startRound(); }, 2500);
}

async function endGame() {
    let reward = playerScore > oppScore ? 5000 : (playerScore === oppScore ? 1500 : 500);
    alert(`МАТЧ ОКОНЧЕН! Счёт: ${playerScore}:${oppScore}. Награда: ${reward} CY`);

    const userRef = ref(db, 'users/' + userData.uid);
    userData.balance += reward;
    await update(userRef, { balance: userData.balance });
    localStorage.setItem('gyaz_user', JSON.stringify(userData));

    if (myRole === "host") {
        setTimeout(() => remove(ref(db, `matches/${matchId}`)), 3000);
    }
    window.location.href = "index.html";
}