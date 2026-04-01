import { updateBalance, refreshBalanceDisplay } from './economy.js';

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

let activeSquad = [];
let round = 1;
let playerScore = 0;
let botScore = 0;
let selectedPlayerCard = null;
let timerInterval;
let usedPlayerIndexes = []; 
let botHand = [];           

// ФУНКЦИЯ ЗАПУСКА
window.startGame = async function() {
    activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [];
    const validPlayers = activeSquad.filter(p => p !== null);
    
    if (validPlayers.length < 5) {
        alert("Эльджан, сначала расставь 5 игроков в Клубе!");
        window.location.href = "club.html";
        return;
    }

    // СПИСЫВАЕМ ДЕНЬГИ ЗА ВХОД
    const entryFee = 3000;
    const canAfford = await updateBalance(-entryFee);
    
    if (!canAfford) {
        alert("Недостаточно CY для входа в Драфт!");
        return;
    }

    // Инициализация игры
    botHand = [];
    usedPlayerIndexes = [];
    playerScore = 0;
    botScore = 0;
    round = 1;

    let fullPool = [...ALL_GAME_CARDS, ...totyPlayers, ...championsPlayers];
    for (let i = 0; i < 5; i++) {
        const rnd = Math.floor(Math.random() * fullPool.length);
        botHand.push(fullPool.splice(rnd, 1)[0]);
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    startRound();
};

function renderHand() {
    const hand = document.getElementById('squad-hand');
    hand.innerHTML = "";
    activeSquad.forEach((player, index) => {
        if (!player) return;
        const img = document.createElement('img');
        img.src = `${player.folder}/${player.file}`;
        if (usedPlayerIndexes.includes(index)) {
            img.classList.add('used-card');
        } else {
            img.onclick = () => {
                selectedPlayerCard = { ...player, sIndex: index };
                document.getElementById('player-card-display').innerHTML = `<img src="${player.folder}/${player.file}">`;
                document.querySelectorAll('#squad-hand img').forEach(i => i.style.border = "none");
                img.style.border = "3px solid #e1b12c";
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
    botDisplay.innerHTML = `<img src="${botCard.folder}/${botCard.file}">`;

    if (selectedPlayerCard) {
        usedPlayerIndexes.push(selectedPlayerCard.sIndex);
        if (Number(selectedPlayerCard.rating) > Number(botCard.rating)) playerScore++;
        else if (Number(botCard.rating) > Number(selectedPlayerCard.rating)) botScore++;
    } else {
        botScore++;
    }

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = botScore;

    setTimeout(() => { round++; startRound(); }, 2500);
}

async function endGame() {
    let msg = "";
    if (playerScore > botScore) {
        await updateBalance(3000);
        msg = "ПОБЕДА! +3000 CY";
    } else if (playerScore === botScore) msg = "НИЧЬЯ!";
    else msg = "БОТ ВЫИГРАЛ...";
    
    alert(msg);
    window.location.href = "index.html";
}

// ПРИВЯЗКА НОВОЙ КНОПКИ
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('start-battle-trigger');
    if (btn) {
        btn.addEventListener('click', window.startGame);
    }
    
    // Показываем баланс игрока на экране драфта
    const bal = localStorage.getItem('fixone_balance') || "0";
    const display = document.getElementById('user-coins-display');
    if (display) display.innerText = parseInt(bal).toLocaleString();
});