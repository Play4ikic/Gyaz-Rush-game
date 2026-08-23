// База карт
const goldPlayers = [
    { name: 'Ayla', rating: 30, pos: 'GK', club: 'icon', file: 'Ayla-30.png', folder: 'Gold' },
    { name: 'Raul', rating: 3, pos: 'ST', club: 'icon', file: 'Raul-3.png', folder: 'Gold' },
    { name: 'Selim', rating: 68, pos: 'CB', club: 'icon', file: 'Selim-68.png', folder: 'Gold' },
    { name: 'Chaxangir', rating: 68, pos: 'CB', club: 'icon', file: 'Chaxangir-68.png', folder: 'Gold' },
    { name: 'Bayturan', rating: 85, pos: 'ST', club: 'icon', file: 'Bayturan-85.png', folder: 'Gold' },
    { name: 'Elcan', rating: 92, pos: 'RW', club: 'toxic', file: 'Elcan-92.png', folder: 'Gold' },
    { name: 'Nazrin', rating: 82, pos: 'CB', club: 'toxic', file: 'Nazrin-82.png', folder: 'Gold' },
    { name: 'Turgay', rating: 92, pos: 'ST', club: 'cheer', file: 'Turqay-92.png', folder: 'Gold' },
    { name: 'Tuncay', rating: 90, pos: 'CB', club: 'icon', file: 'Tuncay-90.png', folder: 'Gold' },
    { name: 'Bugday', rating: 87, pos: 'GK', club: 'cheer', file: 'Bugday-87.png', folder: 'Gold' }
];

const tottPlayers = [
    { name: 'Bugday', rating: 82, pos: 'GK', club: 'cheer', file: 'Bugday-82.png', folder: 'Tott' },
    { name: 'Elcan', rating: 89, pos: 'CAM', club: 'toxic', file: 'Elcan-89.png', folder: 'Tott' },
    { name: 'Nazrin', rating: 85, pos: 'CB', club: 'toxic', file: 'Nazrin-85.png', folder: 'Tott' },
    { name: 'Tuncay', rating: 92, pos: 'CB', club: 'icon', file: 'Tuncay-92.png', folder: 'Tott' },
    { name: 'Turgay', rating: 89, pos: 'ST', club: 'cheer', file: 'Turqay-89.png', folder: 'Tott' }
];

const championsPlayers = [
    { name: 'Elcan', rating: 96, pos: 'RW', club: 'toxic', file: 'Elcan-96.png', folder: 'Champions' },
    { name: 'Turgay', rating: 96, pos: 'ST', club: 'cheer', file: 'Turqay-96.png', folder: 'Champions' },
    { name: 'Tuncay', rating: 91, pos: 'DF', club: 'icon', file: 'Tuncay-91.png', folder: 'Champions' },
    { name: 'Bugday', rating: 90, pos: 'GK', club: 'cheer', file: 'Bugday-90.png', folder: 'Champions' },
    { name: 'Nazrin', rating: 88, pos: 'DF', club: 'toxic', file: 'Nazrin-88.png', folder: 'Champions' }
];

const nationalStarsPlayers = [
    { name: 'Bugday', rating: 89, pos: 'GK', club: 'cheer', file: 'Bugday-89.png', folder: 'NationalStars' },
    { name: 'Elcan', rating: 90, pos: 'RW', club: 'toxic', file: 'Elcan-90.png', folder: 'NationalStars' },
    { name: 'Nazrin', rating: 89, pos: 'CB', club: 'toxic', file: 'Nazrin-89.png', folder: 'NationalStars' },
    { name: 'Tuncay', rating: 95, pos: 'CB', club: 'icon', file: 'Tuncay-95.png', folder: 'NationalStars' },
    { name: 'Turgay', rating: 92, pos: 'ST', club: 'cheer', file: 'Turgay-92.png', folder: 'NationalStars' }
];

const timeTravelsPlayers = [
    { name: 'Bugday', rating: 96, pos: 'GK', club: 'toxic', file: 'Bugday-95.png', folder: 'Timetravlers' },
    { name: 'Elcan', rating: 92, pos: 'CAM', club: 'toxic', file: 'Elcan-92.png', folder: 'Timetravlers' },
    { name: 'Nazrin', rating: 87, pos: 'CB', club: 'cheer', file: 'Nazrin-87.png', folder: 'Timetravlers' },
    { name: 'Tuncay', rating: 92, pos: 'CB', club: 'cheer', file: 'Tuncay-92.png', folder: 'Timetravlers' },
    { name: 'Turgay', rating: 92, pos: 'ST', club: 'cheer', file: 'Turgay-92.png', folder: 'Timetravlers' }
];

const chaosPlayers = [
    { name: 'Bugday', rating: 99, pos: 'GK', club: 'cheer', file: 'Bugday-99.png', folder: 'CHAOS' },
    { name: 'Elcan', rating: 99, pos: 'RW', club: 'toxic', file: 'Elcan-99.png', folder: 'CHAOS' },
    { name: 'Nazrin', rating: 99, pos: 'DF', club: 'toxic', file: 'Nazrin-99.png', folder: 'CHAOS' },
    { name: 'Tuncay', rating: 99, pos: 'DF', club: 'cheer', file: 'Tuncay-99.png', folder: 'CHAOS' },
    { name: 'Turgay', rating: 99, pos: 'ST', club: 'cheer', file: 'Turgay-99.png', folder: 'CHAOS' }
];

const totyPlayers = [
    { name: 'Elcan', rating: 97, pos: 'RW', club: 'toxic', file: 'Elcan-97.png', folder: 'Toty' },
    { name: 'Turgay', rating: 97, pos: 'ST', club: 'cheer', file: 'Turqay-97.png', folder: 'Toty' },
    { name: 'Tuncay', rating: 97, pos: 'DF', club: 'icon', file: 'Tuncay-97.png', folder: 'Toty' },
    { name: 'Bugday', rating: 95, pos: 'GK', club: 'cheer', file: 'Bugday-95.png', folder: 'Toty' },
    { name: 'Nazrin', rating: 91, pos: 'DF', club: 'toxic', file: 'Nazrin-91.png', folder: 'Toty' }
];

const ballondorPlayers = [
    { name: 'Bugday', rating: 105, pos: 'GK', club: 'toxic', file: 'Bugday-105.png', folder: 'GoldenStars' },
    { name: 'Elcan', rating: 105, pos: 'CAM', club: 'toxic', file: 'Elcan-105.png', folder: 'GoldenStars' },
    { name: 'Nazrin', rating: 102, pos: 'CB', club: 'toxic', file: 'Nazrin-102.png', folder: 'GoldenStars' },
    { name: 'Tuncay', rating: 103, pos: 'CB', club: 'cheer', file: 'Tuncay-103.png', folder: 'GoldenStars' },
    { name: 'Turgay', rating: 103, pos: 'ST', club: 'cheer', file: 'Turgay-103.png', folder: 'GoldenStars' }
];


// Объединяем абсолютно все коллекции карт для генерации руки бота
const ALL_GAME_CARDS = [
    ...goldPlayers, 
    ...tottPlayers, 
    ...totyPlayers, 
    ...championsPlayers, 
    ...nationalStarsPlayers,
    ...timeTravelsPlayers, 
    ...chaosPlayers,
    ...ballondor
];

let activeSquad = [];
let round = 1;
let playerScore = 0;
let botScore = 0;
let selectedPlayerCard = null;
let timerInterval;
let usedPlayerIndexes = [];
let botHand = [];

// ГЛАВНАЯ ФУНКЦИЯ СТАРТА ИГРЫ
window.startGameBot = function() {
    console.log("Лог: Запуск игры...");
    const saved = localStorage.getItem('activeSquad');
    activeSquad = saved ? JSON.parse(saved) : [];
    
    if (activeSquad.filter(p => p !== null).length < 5) {
        alert("Сначала расставь 5 игроков в Клубе!");
        window.location.href = "club.html";
        return;
    }

    round = 1;
    playerScore = 0;
    botScore = 0;
    usedPlayerIndexes = [];
    botHand = [];

    // Случайный набор карт для бота из всей коллекции
    for (let i = 0; i < 5; i++) {
        botHand.push(ALL_GAME_CARDS[Math.floor(Math.random() * ALL_GAME_CARDS.length)]);
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    startRound();
};

function renderHand() {
    const hand = document.getElementById('squad-hand');
    if (!hand) return;
    hand.innerHTML = "";
    activeSquad.forEach((player, index) => {
        if (!player) return;
        const img = document.createElement('img');
        img.src = `${player.folder}/${player.file}`;
        
        if (usedPlayerIndexes.includes(index)) {
            img.classList.add('used-card');
        } else {
            img.onclick = () => {
                if (selectedPlayerCard) return;
                selectedPlayerCard = { ...player, sIndex: index };
                document.getElementById('player-card-display').innerHTML = `<img src="${player.folder}/${player.file}" style="width:100%">`;
                img.style.opacity = "0.3";
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
        if (document.getElementById('timer')) {
            document.getElementById('timer').innerText = timeLeft;
        }
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

    const pRating = selectedPlayerCard ? Number(selectedPlayerCard.rating) : 0;
    const bRating = Number(botCard.rating);

    if (selectedPlayerCard) {
        usedPlayerIndexes.push(selectedPlayerCard.sIndex);
    }
    
    if (pRating > bRating) {
        playerScore++;
    } else if (bRating > pRating) {
        botScore++;
    }

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = botScore;
    
    setTimeout(() => { 
        round++; 
        startRound(); 
    }, 5000);
}

function endGame() {
    let win = playerScore > botScore;
    let reward = 0;

    if (win) {
        reward = 3000;
        alert(`ПОБЕДА! Вы выиграли ${reward} CY!`);

        // Засчитываем прогресс квеста драфта
        let draftWins = parseInt(localStorage.getItem('quest_draft_wins')) || 0;
        draftWins++;
        localStorage.setItem('quest_draft_wins', draftWins.toString());

    } else if (playerScore === botScore) {
        reward = 500; 
        alert(`НИЧЬЯ! Утешительный приз: ${reward} CY`);
    } else {
        alert("КОНЕЦ МАТЧА. Попробуйте еще раз!");
    }

    if (reward > 0) {
        let currentBalance = parseInt(localStorage.getItem('fixone_balance')) || 0;
        localStorage.setItem('fixone_balance', (currentBalance + reward).toString());
    }

    window.location.href = "index.html";
}