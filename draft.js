// База карт
const goldPlayers = [
    { name: 'Ayla', rating: 30, file: 'Ayla-30.png', folder: 'Gold' },
    { name: 'Raul', rating: 3, file: 'Raul-3.png', folder: 'Gold' },
    { name: 'Selim', rating: 68, file: 'Selim-68.png', folder: 'Gold' },
    { name: 'Chaxangir', rating: 68, file: 'Chaxangir-68.png', folder: 'Gold' },
    { name: 'Bayturan', rating: 85, file: 'Bayturan-85.png', folder: 'Gold' },
    { name: 'Eldjan', rating: 92, file: 'Elcan-92.png', folder: 'Gold' },
    { name: 'Nazrin', rating: 82, file: 'Nazrin-82.png', folder: 'Gold' },
    { name: 'Turqay', rating: 92, file: 'Turqay-92.png', folder: 'Gold' },
    { name: 'Tuncay', rating: 90, file: 'Tuncay-90.png', folder: 'Gold' },
    { name: 'Bugday', rating: 87, file: 'Bugday-87.png', folder: 'Gold' }
];

const totyPlayers = [
    { name: 'Eldjan', rating: 97, file: 'Elcan-97.png', folder: 'Toty' },
    { name: 'Turqay', rating: 97, file: 'Turqay-97.png', folder: 'Toty' },
    { name: 'Tuncay', rating: 97, file: 'Tuncay-97.png', folder: 'Toty' },
    { name: 'Bugday', rating: 95, file: 'Bugday-95.png', folder: 'Toty' },
    { name: 'Nazrin', rating: 91, file: 'Nazrin-91.png', folder: 'Toty' }
];

const championsPlayers = [
    { name: 'Eldjan', rating: 96, file: 'Elcan-96.png', folder: 'Champions' },
    { name: 'Turqay', rating: 96, file: 'Turqay-96.png', folder: 'Champions' },
    { name: 'Tuncay', rating: 91, file: 'Tuncay-91.png', folder: 'Champions' },
    { name: 'Bugday', rating: 90, file: 'Bugday-90.png', folder: 'Champions' },
    { name: 'Nazrin', rating: 88, file: 'Nazrin-88.png', folder: 'Champions' }
];

const ALL_GAME_CARDS = [...goldPlayers, ...totyPlayers, ...championsPlayers];

let activeSquad = [], round = 1, playerScore = 0, botScore = 0, selectedPlayerCard = null, timerInterval, usedPlayerIndexes = [], botHand = [];

// ГЛАВНАЯ ФУНКЦИЯ
window.startGameBot = function() {
    console.log("Лог: Запуск игры...");
    const saved = localStorage.getItem('activeSquad');
    activeSquad = saved ? JSON.parse(saved) : [];
    
    if (activeSquad.filter(p => p !== null).length < 5) {
        alert("Сначала расставь 5 игроков в Клубе!");
        window.location.href = "club.html";
        return;
    }

    round = 1; playerScore = 0; botScore = 0; usedPlayerIndexes = []; botHand = [];
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
        if (usedPlayerIndexes.includes(index)) img.classList.add('used-card');
        else {
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
        if(document.getElementById('timer')) document.getElementById('timer').innerText = timeLeft;
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

    if (selectedPlayerCard) usedPlayerIndexes.push(selectedPlayerCard.sIndex);
    if (pRating > bRating) playerScore++;
    else if (bRating > pRating) botScore++;

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = botScore;
    setTimeout(() => { round++; startRound(); }, 2500);
}

function endGame() {
    let win = playerScore > botScore;
    let reward = 0;

    if (win) {
        reward = 3000;
        alert(`ПОБЕДА! Вы выиграли ${reward} CY!`);
    } else if (playerScore === botScore) {
        reward = 500; // Бонус за ничью
        alert(`НИЧЬЯ! Утешительный приз: ${reward} CY`);
    } else {
        alert("КОНЕЦ МАТЧА. Попробуйте еще раз!");
    }

    // Если есть награда, обновляем баланс в localStorage
    if (reward > 0) {
        let currentBalance = parseInt(localStorage.getItem('fixone_balance')) || 0;
        localStorage.setItem('fixone_balance', (currentBalance + reward).toString());
    }

    window.location.href = "index.html";
}