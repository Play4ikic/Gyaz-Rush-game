const BALANCE_KEY = 'fixone_balance'; 
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];

let round = 1;
let playerScore = 0;
let botScore = 0;
let selectedPlayerCard = null;
let timerInterval;

let usedPlayerIndexes = []; 
let botHand = [];           
let usedBotIndexes = [];    

function startGame() {
    // Проверяем, сколько игроков на поле (нужно 5)
    const validPlayers = activeSquad.filter(p => p !== null);
    
    if (validPlayers.length < 5) {
        alert("Сначала расставь всех 5 игроков в Клубе!");
        window.location.href = "club.html";
        return;
    }

    botHand = [];
    usedBotIndexes = [];
    usedPlayerIndexes = [];
    playerScore = 0;
    botScore = 0;
    round = 1;

    // Генерируем колоду бота (случайные карты из всего твоего клуба)
    let tempInventory = [...playerInventory];
    for (let i = 0; i < 5; i++) {
        if (tempInventory.length === 0) tempInventory = [...validPlayers];
        const randomIndex = Math.floor(Math.random() * tempInventory.length);
        botHand.push(tempInventory[randomIndex]);
        tempInventory.splice(randomIndex, 1);
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    startRound();
}

function renderHand() {
    const hand = document.getElementById('squad-hand');
    hand.innerHTML = "";

    activeSquad.forEach((player, index) => {
        if (!player) return;

        const folder = player.folder || (player.rating > 96 ? 'Toty' : 'Champions');
        const img = document.createElement('img');
        img.src = `${folder}/${player.file}`;
        
        if (usedPlayerIndexes.includes(index)) {
            img.classList.add('used-card');
        } else {
            img.onclick = () => {
                selectedPlayerCard = { ...player, sIndex: index, folder: folder };
                document.getElementById('player-card-display').innerHTML = `<img src="${folder}/${player.file}">`;
                // Подсвечиваем выбранную карту
                document.querySelectorAll('.hand-grid img').forEach(i => i.style.border = "none");
                img.style.border = "2px solid #f1c40f";
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

    let availableBotIndexes = botHand.map((_, i) => i).filter(i => !usedBotIndexes.includes(i));
    const randomIdx = availableBotIndexes[Math.floor(Math.random() * availableBotIndexes.length)];
    const botCard = botHand[randomIdx];
    usedBotIndexes.push(randomIdx);

    const botFolder = botCard.folder || (botCard.rating > 96 ? 'Toty' : 'Champions');
    botDisplay.innerHTML = `<img src="${botFolder}/${botCard.file}">`;

    if (selectedPlayerCard) {
        usedPlayerIndexes.push(selectedPlayerCard.sIndex);
        const pRating = Number(selectedPlayerCard.rating) || 0;
        const bRating = Number(botCard.rating) || 0;

        if (pRating > bRating) playerScore++;
        else if (bRating > pRating) botScore++;
    } else {
        botScore++; // Пропуск хода = балл боту
    }

    document.getElementById('p-score').innerText = playerScore;
    document.getElementById('b-score').innerText = botScore;

    setTimeout(() => {
        round++;
        startRound();
    }, 2500);
}

function endGame() {
    if (playerScore > botScore) {
        const reward = 3000;
        // Если у тебя есть функция обновления баланса в economy.js
        if (window.updateBalance) {
            window.updateBalance(reward);
        } else {
            let bal = Number(localStorage.getItem(BALANCE_KEY)) || 0;
            localStorage.setItem(BALANCE_KEY, bal + reward);
        }
        alert(`ПОБЕДА! Ты разгромил бота и заработал ${reward} CY!`);
    } else if (playerScore === botScore) {
        alert("НИЧЬЯ! Почти получилось.");
    } else {
        alert("БОТ ОКАЗАЛСЯ СИЛЬНЕЕ... Попробуй другой состав.");
    }
    window.location.href = "index.html";
}