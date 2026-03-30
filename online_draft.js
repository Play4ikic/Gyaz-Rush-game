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

// --- БАЗЫ КАРТ (Идентично твоему коду) ---
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

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let userData = JSON.parse(localStorage.getItem('gyaz_user'));
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
let matchId = null;
let myRole = ""; 
let round = 1;
let playerScore = 0;
let oppScore = 0;
let mySelectedCard = null;
let oppSelectedCard = null;
let timerInterval;
let searchTimerInterval;
let usedIndexes = [];

// --- ПОИСК ОНЛАЙН ИГРЫ ---
window.startOnlineSearch = async function() {
    // 1. Проверка состава (Должно быть 5 игроков)
    const validCount = activeSquad.filter(p => p !== null).length;
    if (validCount < 5) {
        alert("Эльджан, сначала расставь всех 5 игроков в Клубе!");
        return;
    }

    const statusText = document.querySelector('.logo-text');
    statusText.innerText = "ПОИСК СОПЕРНИКА (0:20)...";
    
    const queueRef = ref(db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) {
        // Создаем матч (Хост)
        const newMatchRef = push(ref(db, 'matches'));
        matchId = newMatchRef.key;
        myRole = "host";
        
        await set(queueRef, { matchId, hostId: userData.uid, hostName: userData.nickname });
        listenForOpponent();

        // Таймер отмены (20 секунд)
        let timeLeft = 20;
        searchTimerInterval = setInterval(async () => {
            timeLeft--;
            statusText.innerText = `ПОИСК СОПЕРНИКА (0:${timeLeft < 10 ? '0'+timeLeft : timeLeft})...`;
            if (timeLeft <= 0) {
                clearInterval(searchTimerInterval);
                await remove(queueRef);
                await remove(ref(db, `matches/${matchId}`));
                statusText.innerText = "READY FOR BATTLE?";
                alert("Игрок не найден. Попробуй позже!");
            }
        }, 1000);
    } else {
        // Присоединяемся (Гость)
        const data = snapshot.val();
        if (data.hostId === userData.uid) return;

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

function listenForOpponent() {
    const statusRef = ref(db, `matches/${matchId}/status`);
    onValue(statusRef, (snap) => {
        if (snap.val() === "playing") {
            clearInterval(searchTimerInterval);
            off(statusRef);
            initGameUI();
        }
    });
}

function initGameUI() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.querySelectorAll('.card-zone h3')[1].innerText = "СОПЕРНИК";
    startRound();
}

// --- ИГРОВАЯ ЛОГИКА (Как в твоем коде) ---
function startRound() {
    if (round > 5) return endGame();

    mySelectedCard = null;
    oppSelectedCard = null;
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

    // Слушаем выбор соперника
    const oppPath = myRole === "host" ? `matches/${matchId}/round${round}/guestCard` : `matches/${matchId}/round${round}/hostCard`;
    onValue(ref(db, oppPath), (snap) => {
        if (snap.exists()) oppSelectedCard = snap.val();
    });
}

function renderHand() {
    const hand = document.getElementById('squad-hand');
    hand.innerHTML = "";
    activeSquad.forEach((player, index) => {
        if (!player) return;
        const folder = player.folder || (player.rating > 96 ? 'Toty' : 'Champions');
        const img = document.createElement('img');
        img.src = `${folder}/${player.file}`;
        
        if (usedIndexes.includes(index)) {
            img.style.opacity = "0.3";
            img.style.pointerEvents = "none";
        } else {
            img.onclick = () => {
                if (mySelectedCard) return;
                mySelectedCard = { ...player, sIndex: index, folder };
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

    if (oppSelectedCard) {
        const folder = oppSelectedCard.folder || (oppSelectedCard.rating > 96 ? 'Toty' : 'Champions');
        oppDisplay.innerHTML = `<img src="${folder}/${oppSelectedCard.file}">`;
    } else {
        oppDisplay.innerHTML = "<div style='color:red;padding-top:50px;'>ПРОПУСК</div>";
    }

    const pRating = mySelectedCard ? Number(mySelectedCard.rating) : 0;
    const oRating = oppSelectedCard ? Number(oppSelectedCard.rating) : 0;

    if (pRating > oRating) playerScore++;
    else if (oRating > pRating) oppScore++;

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = oppScore;

    setTimeout(() => { round++; startRound(); }, 2500);
}

async function endGame() {
    let reward = playerScore > oppScore ? 5000 : (playerScore === oppScore ? 1500 : 500);
    alert(`ИГРА ОКОНЧЕНА! Твой счет: ${playerScore}. Награда: ${reward} CY`);

    if (window.updateBalance) {
        window.updateBalance(reward);
    } else {
        userData.balance += reward;
        localStorage.setItem('gyaz_user', JSON.stringify(userData));
    }

    if (myRole === "host") {
        setTimeout(() => remove(ref(db, `matches/${matchId}`)), 2000);
    }
    window.location.href = "index.html";
}
