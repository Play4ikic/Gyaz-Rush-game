import { updateBalance, refreshBalanceDisplay } from './economy.js';

const PRICES = { 
    gold: 1000, 
    champions: 70000, 
    tott: 50000,
    national_stars: 80000,
    time_travels: 100000, 
    chaos: 800000, // Установлена цена 800,000 CY
    toty: 200000 
};

const goldPlayers = [
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

const tottPlayers = [
    { name: 'Bugday', rating: 82, pos: 'GK', club: 'cheer', file: 'Bugday-82.png', folder: 'Tott' },
    { name: 'Elcan', rating: 89, pos: 'CAM', club: 'toxic', file: 'Elcan-89.png', folder: 'Tott' },
    { name: 'Nazrin', rating: 85, pos: 'CB', club: 'toxic', file: 'Nazrin-85.png', folder: 'Tott' },
    { name: 'Tuncay', rating: 92, pos: 'CB', club: 'icon', file: 'Tuncay-92.png', folder: 'Tott' },
    { name: 'Turqay', rating: 89, pos: 'ST', club: 'cheer', file: 'Turqay-89.png', folder: 'Tott' }
];

const championsPlayers = [
    { name: 'Eldjan', rating: 96, pos: 'RW', club: 'toxic', file: 'Elcan-96.png', folder: 'Champions' },
    { name: 'Turqay', rating: 96, pos: 'ST', club: 'cheer', file: 'Turqay-96.png', folder: 'Champions' },
    { name: 'Tuncay', rating: 91, pos: 'DF', club: 'icon', file: 'Tuncay-91.png', folder: 'Champions' },
    { name: 'Bugday', rating: 90, pos: 'GK', club: 'cheer', file: 'Bugday-90.png', folder: 'Champions' },
    { name: 'Nazrin', rating: 88, pos: 'DF', club: 'toxic', file: 'Nazrin-88.png', folder: 'Champions' }
];

const nationalStarsPlayers = [
    { name: 'Bugday', rating: 89, pos: 'GK', club: 'cheer', file: 'Bugday-89.png', folder: 'NationalStars' },
    { name: 'Elcan', rating: 90, pos: 'RW', club: 'toxic', file: 'Elcan-90.png', folder: 'NationalStars' },
    { name: 'Nazrin', rating: 89, pos: 'CB', club: 'toxic', file: 'Nazrin-89.png', folder: 'NationalStars' },
    { name: 'Tuncay', rating: 95, pos: 'CB', club: 'icon', file: 'Tuncay-95.png', folder: 'NationalStars' },
    { name: 'Turqay', rating: 92, pos: 'ST', club: 'cheer', file: 'Turgay-92.png', folder: 'NationalStars' }
];

const timeTravelsPlayers = [
    { name: 'Bugday', rating: 96, pos: 'GK', club: 'cheer', file: 'Bugday-95.png', folder: 'Timetravlers' },
    { name: 'Elcan', rating: 92, pos: 'CAM', club: 'toxic', file: 'Elcan-92.png', folder: 'Timetravlers' },
    { name: 'Nazrin', rating: 87, pos: 'CB', club: 'toxic', file: 'Nazrin-87.png', folder: 'Timetravlers' },
    { name: 'Tuncay', rating: 92, pos: 'CB', club: 'icon', file: 'Tuncay-92.png', folder: 'Timetravlers' },
    { name: 'Turgay', rating: 92, pos: 'ST', club: 'cheer', file: 'Turgay-92.png', folder: 'Timetravlers' }
];

// НОВЫЙ ПУЛ ИГРОКОВ CHAOS (на основе скриншота image_4.png)
// Я предполагаю pos и club на основе существующих игроков
const chaosPlayers = [
    { name: 'Bugday', rating: 99, pos: 'GK', club: 'cheer', file: 'Bugday-99.png', folder: 'CHAOS' },
    { name: 'Elcan', rating: 99, pos: 'RW', club: 'toxic', file: 'Elcan-99.png', folder: 'CHAOS' },
    { name: 'Nazrin', rating: 99, pos: 'DF', club: 'toxic', file: 'Nazrin-99.png', folder: 'CHAOS' },
    { name: 'Tuncay', rating: 99, pos: 'DF', club: 'cheer', file: 'Tuncay-99.png', folder: 'CHAOS' },
    { name: 'Turgay', rating: 99, pos: 'ST', club: 'cheer', file: 'Turgay-99.png', folder: 'CHAOS' }
];

const totyPlayers = [
    { name: 'Eldjan', rating: 97, pos: 'RW', club: 'toxic', file: 'Elcan-97.png', folder: 'Toty' },
    { name: 'Turqay', rating: 97, pos: 'ST', club: 'cheer', file: 'Turqay-97.png', folder: 'Toty' },
    { name: 'Tuncay', rating: 97, pos: 'DF', club: 'icon', file: 'Tuncay-97.png', folder: 'Toty' },
    { name: 'Bugday', rating: 95, pos: 'GK', club: 'cheer', file: 'Bugday-95.png', folder: 'Toty' },
    { name: 'Nazrin', rating: 91, pos: 'DF', club: 'toxic', file: 'Nazrin-91.png', folder: 'Toty' }
];

let currentDroppedPlayer = null;

// --- НОВАЯ ВСТАВКА: Логика шансов ---

/**
 * Определяет "вес" игрока на основе его рейтинга.
 * Чем выше рейтинг, тем меньше вес (меньше шанс выпадения).
 * Это абстрактные числа для расчета пропорций.
 */
function getPlayerWeight(rating) {
    // Настраиваемый баланс:
    if (rating >= 97) return 1;   // Ультра редкие (например, TOTY 97)
    if (rating >= 95) return 3;   // Очень редкие
    if (rating >= 90) return 10;  // Редкие
    if (rating >= 85) return 40;  // Необычные
    if (rating >= 80) return 100; // Частые
    return 250;                   // Очень частые (рейтинг < 80)
}

/**
 * Выбирает игрока из массива, используя веса на основе рейтинга.
 */
function pickPlayerByChance(pool) {
    if (!pool || pool.length === 0) return null;

    // 1. Рассчитываем веса для каждого игрока в текущем пуле
    const weightedPool = pool.map(player => {
        return {
            player: player,
            weight: getPlayerWeight(player.rating)
        };
    });

    // 2. Считаем общий вес всего пула
    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);

    // 3. Выбираем случайное число от 0 до totalWeight
    let randomNum = Math.random() * totalWeight;

    // 4. Перебираем пул, вычитая веса, чтобы найти, куда попало число
    for (let i = 0; i < weightedPool.length; i++) {
        if (randomNum < weightedPool[i].weight) {
            return weightedPool[i].player; // Нашли игрока
        }
        randomNum -= weightedPool[i].weight;
    }

    // Фаллбэк (на всякий случай, если Math.random выдаст ровно 1.0)
    return pool[pool.length - 1];
}

// --- КОНЕЦ НОВОЙ ВСТАВКИ ---


// ОСНОВНАЯ ФУНКЦИЯ ОТКРЫТИЯ
window.openPack = async function(type, videoFile) {
    const price = PRICES[type];
    
    let pool;
    if (type === 'gold') {
        pool = goldPlayers;
    } else if (type === 'tott') {
        pool = tottPlayers;
    } else if (type === 'champions') {
        pool = championsPlayers;
    } else if (type === 'national_stars') {
        pool = nationalStarsPlayers;
    } else if (type === 'time_travels') {
        pool = timeTravelsPlayers;
    } else if (type === 'chaos') { // Обработка нового типа пака
        pool = chaosPlayers;
    } else {
        pool = totyPlayers;
    }

    const success = await updateBalance(-price);

    if (success) {
        // --- ИЗМЕНЕНО: Теперь используем функцию с шансами ---
        // Было: currentDroppedPlayer = pool[Math.floor(Math.random() * pool.length)];
        currentDroppedPlayer = pickPlayerByChance(pool);
        // ---------------------------------------------------

        if (type === 'gold') {
            showInstantReveal();
        } else {
            startVideoReveal(videoFile);
        }
    } else {
        alert("Не хватает CY для открытия пака!");
    }
};

function showInstantReveal() {
    const revealScreen = document.getElementById('reveal-screen');
    const playerImg = document.getElementById('card-res-img');

    playerImg.src = `${currentDroppedPlayer.folder}/${currentDroppedPlayer.file}`;
    playerImg.classList.add('flash-effect');
    revealScreen.classList.remove('hidden');

    setupClaimButton();
    setTimeout(() => playerImg.classList.remove('flash-effect'), 1000);
}

function startVideoReveal(videoFile) {
    const videoContainer = document.getElementById('video-reveal-container');
    const video = document.getElementById('pack-video');
    const overlay = document.getElementById('video-overlay');
    
    video.querySelector('source').src = `images/${videoFile}`;
    document.querySelectorAll('.reveal-text').forEach(el => el.classList.remove('show-text'));
    overlay.classList.add('hidden');

    document.getElementById('reveal-pos').innerText = currentDroppedPlayer.pos;
    document.getElementById('reveal-club-icon').src = `images/${currentDroppedPlayer.club}.png`; 

    videoContainer.classList.remove('hidden');
    video.load(); 
    video.play();

    setTimeout(() => { 
        overlay.classList.remove('hidden');
        document.getElementById('reveal-country-cont').classList.add('show-text'); 
    }, 3000); 
    setTimeout(() => document.getElementById('reveal-pos').classList.add('show-text'), 5000); 
    setTimeout(() => document.getElementById('reveal-club-img-cont').classList.add('show-text'), 6500); 

    setTimeout(() => {
        overlay.classList.add('hidden'); 
        document.getElementById('card-res-img').src = `${currentDroppedPlayer.folder}/${currentDroppedPlayer.file}`;
        document.getElementById('reveal-screen').classList.remove('hidden');
        setupClaimButton();
    }, 8300); 
}

function setupClaimButton() {
    const claimBtn = document.querySelector('.claim-button');
    if (claimBtn) {
        claimBtn.onclick = () => saveToInventory(currentDroppedPlayer);
    }
}

function saveToInventory(player) {
    if (!player) return;
    let inventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
    inventory.push(player);
    localStorage.setItem('myPlayers', JSON.stringify(inventory));
    closeReveal();
}

window.closeReveal = function() {
    document.getElementById('reveal-screen').classList.add('hidden');
    document.getElementById('video-reveal-container').classList.add('hidden');
    currentDroppedPlayer = null;
};

document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);
