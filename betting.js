// 1. Состояние игры
let currentBets = { winner: null, total: null, exact: false };
let gameState = {
    scoreToxic: 0,
    scoreCheer: 0,
    minute: 0,
    isMatchRunning: false,
    interval: null
};

// Константы реализма
const CHANCE_OF_ATTACK = 0.18; // Немного увеличил шанс атаки, так как матч стал короче
const GOAL_PROBABILITY = 0.25; 
const MATCH_DURATION_MS = 20000; // ТЕПЕРЬ 20 СЕКУНД
const TICK_RATE = MATCH_DURATION_MS / 90; 

// БЛОКИРОВКА НАВИГАЦИИ
function toggleNavigation(isLocked) {
    const backBtn = document.querySelector('.back-btn'); 
    
    if (isLocked) {
        if (backBtn) {
            backBtn.style.pointerEvents = "none";
            backBtn.style.opacity = "0.3";
        }
        window.onbeforeunload = function() {
            return "Матч в GYaz Rush еще идет! Если выйдешь сейчас, ставка сгорит.";
        };
    } else {
        if (backBtn) {
            backBtn.style.pointerEvents = "all";
            backBtn.style.opacity = "1";
        }
        window.onbeforeunload = null;
    }
}

// 2. Выбор ставки (интерфейс)
function selectBet(type, value, element) {
    if (gameState.isMatchRunning) return; 

    const parent = element.parentElement;
    const buttons = parent.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    
    currentBets[type] = value;
}

// 3. Симуляция матча
function startSimulation() {
    const timerElement = document.getElementById('match-timer');
    const scoreElement = document.getElementById('match-score');
    const startBtn = document.getElementById('start-btn');

    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";
    startBtn.innerText = "МАТЧ ИДЕТ...";

    gameState.interval = setInterval(() => {
        gameState.minute++;
        
        if (Math.random() < CHANCE_OF_ATTACK) {
            if (Math.random() < GOAL_PROBABILITY) {
                if (Math.random() > 0.5) {
                    gameState.scoreToxic++;
                } else {
                    gameState.scoreCheer++;
                }
            }
        }

        timerElement.innerText = gameState.minute.toString().padStart(2, '0') + "'";
        scoreElement.innerText = `${gameState.scoreToxic} : ${gameState.scoreCheer}`;

        if (gameState.minute >= 90) {
            finishMatch();
        }
    }, TICK_RATE); 
}

// 4. Проверка выигрыша и начисление
function checkResults(betAmount) {
    let totalMultiplier = 0;
    const { scoreToxic, scoreCheer } = gameState;
    const totalGoals = scoreToxic + scoreCheer;

    if (currentBets.winner === 'toxic' && scoreToxic > scoreCheer) totalMultiplier += 2;
    if (currentBets.winner === 'cheer' && scoreCheer > scoreToxic) totalMultiplier += 2;
    if (currentBets.winner === 'draw' && scoreToxic === scoreCheer) totalMultiplier += 2;

    if (currentBets.total === 'under2' && totalGoals <= 2) totalMultiplier += 2;
    if (currentBets.total === 'over3' && totalGoals >= 3) totalMultiplier += 2;

    const inputToxic = parseInt(document.getElementById('score-toxic').value) || 0;
    const inputCheer = parseInt(document.getElementById('score-cheer').value) || 0;
    if (currentBets.exact && inputToxic === scoreToxic && inputCheer === scoreCheer) {
        totalMultiplier += 10;
    }

    if (totalMultiplier > 0) {
        const winAmount = betAmount * totalMultiplier;
        updateBalance(winAmount); 
    }
}

// 5. Завершение матча
function finishMatch() {
    clearInterval(gameState.interval);
    toggleNavigation(false);

    const startBtn = document.getElementById('start-btn');
    const amountInput = document.getElementById('bet-amount');
    const betAmount = parseInt(amountInput.value) || 0;

    checkResults(betAmount); 

    gameState.isMatchRunning = false;
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
    startBtn.innerText = "ПОДТВЕРДИТЬ ЭКСПРЕСС";
}

// 6. Главная кнопка Старта
function confirmAndStart() {
    const amountInput = document.getElementById('bet-amount');
    const betAmount = parseInt(amountInput.value) || 0;

    if (gameState.isMatchRunning) return;
    
    if (betAmount <= 0) {
        alert("Введи сумму ставки!");
        return;
    }

    if (updateBalance(-betAmount)) {
        toggleNavigation(true);

        amountInput.style.borderColor = "#444";
        gameState.scoreToxic = 0;
        gameState.scoreCheer = 0;
        gameState.minute = 0;
        gameState.isMatchRunning = true;

        startSimulation();
    } else {
        amountInput.style.borderColor = "red";
        alert("Эльджан, недостаточно CY для такой ставки!");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof refreshBalanceDisplay === "function") refreshBalanceDisplay();
});