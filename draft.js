import { updateBalance } from './economy.js';

// Карты (кратко для примера, оставь свои полные списки)
const ALL_GAME_CARDS = [
    { name: 'Eldjan', rating: 92, pos: 'RW', club: 'toxic', file: 'Elcan-92.png', folder: 'Gold' },
    { name: 'Turqay', rating: 92, pos: 'ST', club: 'cheer', file: 'Turqay-92.png', folder: 'Gold' },
    { name: 'Tuncay', rating: 90, pos: 'CB', club: 'icon', file: 'Tuncay-90.png', folder: 'Gold' },
    { name: 'Nazrin', rating: 82, pos: 'CB', club: 'toxic', file: 'Nazrin-82.png', folder: 'Gold' },
    { name: 'Bugday', rating: 87, pos: 'GK', club: 'cheer', file: 'Bugday-87.png', folder: 'Gold' }
];

let activeSquad = [];
let round = 1;
let playerScore = 0;
let botScore = 0;
let selectedPlayerCard = null;
let timerInterval;
let usedPlayerIndexes = []; 
let botHand = [];           

// ПРИВЯЗКА К ОКНУ - ЭТО САМОЕ ВАЖНОЕ
window.startGameBot = function() {
    console.log("Запуск игры против бота...");
    activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [];
    
    if (activeSquad.filter(p => p !== null).length < 5) {
        alert("Расставь 5 игроков в Клубе!");
        window.location.href = "club.html";
        return;
    }

    // Сброс и запуск
    round = 1; playerScore = 0; botScore = 0; usedPlayerIndexes = []; botHand = [];
    
    let pool = [...ALL_GAME_CARDS];
    for (let i = 0; i < 5; i++) {
        botHand.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // Обновляем баланс визуально
    const bal = localStorage.getItem('fixone_balance') || "0";
    document.getElementById('user-coins').innerText = bal;

    startRound();
};

function renderHand() {
    const hand = document.getElementById('squad-hand');
    hand.innerHTML = "";
    activeSquad.forEach((player, index) => {
        if (!player) return;
        const img = document.createElement('img');
        img.src = `${player.folder}/${player.file}`;
        if (usedPlayerIndexes.includes(index)) img.classList.add('used-card');
        else {
            img.onclick = () => {
                selectedPlayerCard = { ...player, sIndex: index };
                document.getElementById('player-card-display').innerHTML = `<img src="${player.folder}/${player.file}" style="width:100%">`;
                document.querySelectorAll('#squad-hand img').forEach(i => i.style.border = "none");
                img.style.border = "2px solid gold";
            };
        }
        hand.appendChild(img);
    });
}

function startRound() {
    if (round > 5) return endGame();
    document.getElementById('round-num').innerText = round;
    document.getElementById('player-card-display').innerHTML = "";
    document.getElementById('bot-card-display').innerHTML = "";
    document.getElementById('bot-card-display').classList.add('card-back');
    selectedPlayerCard = null;
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
}

function processBattle() {
    const botDisplay = document.getElementById('bot-card-display');
    botDisplay.classList.remove('card-back');
    const botCard = botHand[round - 1]; 
    botDisplay.innerHTML = `<img src="${botCard.folder}/${botCard.file}" style="width:100%">`;

    if (selectedPlayerCard) {
        usedPlayerIndexes.push(selectedPlayerCard.sIndex);
        if (Number(selectedPlayerCard.rating) > Number(botCard.rating)) playerScore++;
        else if (Number(botCard.rating) > Number(selectedPlayerCard.rating)) botScore++;
    } else botScore++;

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = botScore;
    setTimeout(() => { round++; startRound(); }, 2000);
}

async function endGame() {
    if (playerScore > botScore) {
        await updateBalance(3000);
        alert("Победа! +3000 CY");
    } else alert("Игра окончена!");
    window.location.href = "index.html";
}