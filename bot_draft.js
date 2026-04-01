// Убираем импорт, если он ломает загрузку, и используем прямой доступ к localStorage
// Или убедись, что в HTML этот файл подключен как <script type="module" src="bot_draft.js"></script>

const ALL_GAME_CARDS = [
    { name: 'Eldjan', rating: 92, pos: 'RW', file: 'Elcan-92.png', folder: 'Gold' },
    { name: 'Turqay', rating: 92, pos: 'ST', file: 'Turqay-92.png', folder: 'Gold' },
    { name: 'Tuncay', rating: 90, pos: 'CB', file: 'Tuncay-90.png', folder: 'Gold' },
    { name: 'Nazrin', rating: 82, pos: 'CB', file: 'Nazrin-82.png', folder: 'Gold' },
    { name: 'Bugday', rating: 87, pos: 'GK', file: 'Bugday-87.png', folder: 'Gold' }
];

let activeSquad = [];
let round = 1;
let playerScore = 0;
let botScore = 0;
let selectedPlayerCard = null;
let timerInterval;
let usedPlayerIndexes = []; 
let botHand = [];

window.startGameBot = function() {
    console.log("Запуск бота...");
    // Загружаем состав из Клуба
    const savedSquad = localStorage.getItem('activeSquad');
    activeSquad = savedSquad ? JSON.parse(savedSquad) : [];
    
    // Проверка на 5 игроков
    if (activeSquad.filter(p => p !== null).length < 5) {
        alert("Сначала расставь 5 игроков в Клубе!");
        window.location.href = "club.html";
        return;
    }

    // Сброс состояния
    round = 1; playerScore = 0; botScore = 0; usedPlayerIndexes = []; botHand = [];
    
    // Собираем руку бота
    for (let i = 0; i < 5; i++) {
        botHand.push(ALL_GAME_CARDS[Math.floor(Math.random() * ALL_GAME_CARDS.length)]);
    }

    // Переключаем экраны
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // Имена (для бота ставим фиксированные)
    document.getElementById('p-name').innerText = "ИГРОК";
    document.getElementById('opp-name').innerText = "БОТ";

    startRound();
};

function renderHand() {
    const hand = document.getElementById('squad-hand');
    if (!hand) return;
    hand.innerHTML = "";

    activeSquad.forEach((player, index) => {
        if (!player) return;
        const img = document.createElement('img');
        
        // Авто-определение папки, если её нет в объекте
        const folder = player.folder || (player.rating > 96 ? 'Toty' : (player.rating > 89 ? 'Champions' : 'Gold'));
        img.src = `${folder}/${player.file}`;
        
        if (usedPlayerIndexes.includes(index)) {
            img.classList.add('used-card');
        } else {
            img.onclick = () => {
                if (selectedPlayerCard) return; // Нельзя менять выбор в этом раунде
                selectedPlayerCard = { ...player, sIndex: index, folder: folder };
                document.getElementById('player-card-display').innerHTML = `<img src="${folder}/${player.file}" style="width:100%">`;
                img.style.opacity = "0.5";
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
    
    let timeLeft = 10;
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
    const bFolder = botCard.folder || 'Gold';
    botDisplay.innerHTML = `<img src="${bFolder}/${botCard.file}" style="width:100%">`;

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
    }, 2500);
}

function endGame() {
    let reward = playerScore > botScore ? 5000 : 500;
    alert(`МАТЧ ОКОНЧЕН! Счёт ${playerScore}:${botScore}. Награда: ${reward} CY`);
    
    // Обновляем баланс в localStorage напрямую
    let user = JSON.parse(localStorage.getItem('gyaz_user')) || { balance: 0 };
    user.balance = (Number(user.balance) || 0) + reward;
    localStorage.setItem('gyaz_user', JSON.stringify(user));
    
    window.location.href = "index.html";
}