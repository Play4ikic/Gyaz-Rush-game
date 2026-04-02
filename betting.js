import { updateBalance, refreshBalanceDisplay } from './economy.js';

// --- ЛОГИКА КВЕСТОВ ---
let currentBetStreak = parseInt(localStorage.getItem('quest_bet_streak')) || 0;

function addXP(amount) {
    let currentXP = parseInt(localStorage.getItem('playerXP')) || 0;
    localStorage.setItem('playerXP', currentXP + amount);
}

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
const CHANCE_OF_ATTACK = 0.18; 
const GOAL_PROBABILITY = 0.25; 
const MATCH_DURATION_MS = 20000; 
const TICK_RATE = MATCH_DURATION_MS / 90; 

// БЛОКИРОВКА НАВИГАЦИИ
function toggleNavigation(isLocked) {
    const backBtn = document.querySelector('.back-btn'); 
    if (isLocked) {
        if (backBtn) {
            backBtn.style.pointerEvents = "none";
            backBtn.style.opacity = "0.3";
        }
        window.onbeforeunload = () => "Матч еще идет! Ставка сгорит!";
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
    
    if (currentBets[type] === value) {
        currentBets[type] = null;
    } else {
        element.classList.add('selected');
        currentBets[type] = value;
    }
}

function toggleExact() {
    if (gameState.isMatchRunning) return;
    currentBets.exact = !currentBets.exact;
    document.getElementById('exact-btn').classList.toggle('selected');
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

// 4. Проверка результатов (ЛОГИКА ЭКСПРЕССА + КВЕСТ)
async function checkResults(betAmount) {
    const { scoreToxic, scoreCheer } = gameState;
    const totalGoals = scoreToxic + scoreCheer;
    
    let isWin = true; 
    let finalMultiplier = 1; 
    let betCount = 0;

    if (currentBets.winner) {
        betCount++;
        let wonWinner = false;
        if (currentBets.winner === 'toxic' && scoreToxic > scoreCheer) wonWinner = true;
        if (currentBets.winner === 'cheer' && scoreCheer > scoreToxic) wonWinner = true;
        if (currentBets.winner === 'draw' && scoreToxic === scoreCheer) wonWinner = true;
        
        if (wonWinner) finalMultiplier *= 2; 
        else isWin = false;
    }

    if (isWin && currentBets.total) {
        betCount++;
        let wonTotal = false;
        if (currentBets.total === 'under2' && totalGoals <= 2) wonTotal = true;
        if (currentBets.total === 'over3' && totalGoals >= 3) wonTotal = true;

        if (wonTotal) finalMultiplier *= 2; 
        else isWin = false;
    }

    if (isWin && currentBets.exact) {
        betCount++;
        const inputToxic = parseInt(document.getElementById('score-toxic').value) || 0;
        const inputCheer = parseInt(document.getElementById('score-cheer').value) || 0;
        
        if (inputToxic === scoreToxic && inputCheer === scoreCheer) {
            finalMultiplier *= 10; 
        } else {
            isWin = false;
        }
    }

    if (betCount === 0) {
        alert("Ты не выбрал ни одного исхода!");
        return;
    }

    if (isWin) {
        const winAmount = Math.floor(betAmount * finalMultiplier);
        await updateBalance(winAmount); 
        
        // Логика квеста: победа
        currentBetStreak++;
        localStorage.setItem('quest_bet_streak', currentBetStreak);
        
        alert(`🔥 ПОБЕДА! Коэффициент: x${finalMultiplier}. Выигрыш: ${winAmount} CY\nСерия побед: ${currentBetStreak}/5`);

        if (currentBetStreak >= 5) {
            addXP(2000);
            alert("🏆 ЗАДАНИЕ ВЫПОЛНЕНО: 5 побед подряд! +2000 XP");
            currentBetStreak = 0; 
            localStorage.setItem('quest_bet_streak', 0);
        }
    } else {
        // Логика квеста: проигрыш (сброс серии)
        currentBetStreak = 0;
        localStorage.setItem('quest_bet_streak', 0);
        alert(`❌ ПРОИГРЫШ. Серия прервана. Итог матча: ${scoreToxic}:${scoreCheer}`);
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
async function confirmAndStart() {
    const amountInput = document.getElementById('bet-amount');
    const betAmount = parseInt(amountInput.value) || 0;

    if (gameState.isMatchRunning) return;
    
    if (betAmount <= 0) {
        alert("Введи сумму ставки!");
        return;
    }

    const success = await updateBalance(-betAmount);

    if (success) {
        toggleNavigation(true);
        amountInput.style.borderColor = "#444";
        gameState.scoreToxic = 0;
        gameState.scoreCheer = 0;
        gameState.minute = 0;
        gameState.isMatchRunning = true;
        startSimulation();
    } else {
        amountInput.style.borderColor = "red";
        alert("Эльджан, недостаточно CY!");
    }
}

// --- ЭКСПОРТ ДЛЯ HTML ---
window.selectBet = selectBet;
window.toggleExact = toggleExact;
window.confirmAndStart = confirmAndStart;

document.addEventListener('DOMContentLoaded', () => {
    refreshBalanceDisplay();
});