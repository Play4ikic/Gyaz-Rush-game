import { updateBalance, refreshBalanceDisplay } from './economy.js';

const PRICES = { 
    gold: 1000, 
    champions: 70000, 
    tott: 50000,
    national_stars: 80000,
    time_travels: 100000, 
    chaos: 800000,
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
    { name: 'Eldjan', rating: 97, pos: 'RW', club: 'toxic', file: 'Elcan-97.png', folder: 'Toty' },
    { name: 'Turqay', rating: 97, pos: 'ST', club: 'cheer', file: 'Turqay-97.png', folder: 'Toty' },
    { name: 'Tuncay', rating: 97, pos: 'DF', club: 'icon', file: 'Tuncay-97.png', folder: 'Toty' },
    { name: 'Bugday', rating: 95, pos: 'GK', club: 'cheer', file: 'Bugday-95.png', folder: 'Toty' },
    { name: 'Nazrin', rating: 91, pos: 'DF', club: 'toxic', file: 'Nazrin-91.png', folder: 'Toty' }
];

let currentDroppedPlayer = null;

// Помощник паузы для таймингов анимации
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function getPlayerWeight(rating) {
    if (rating >= 97) return 1;
    if (rating >= 95) return 3;
    if (rating >= 90) return 10;
    if (rating >= 85) return 40;
    if (rating >= 80) return 100;
    return 250;
}

function pickPlayerByChance(pool) {
    if (!pool || pool.length === 0) return null;

    const weightedPool = pool.map(player => ({
        player: player,
        weight: getPlayerWeight(player.rating)
    }));

    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (let i = 0; i < weightedPool.length; i++) {
        if (randomNum < weightedPool[i].weight) {
            return weightedPool[i].player;
        }
        randomNum -= weightedPool[i].weight;
    }

    return pool[pool.length - 1];
}

// ОСНОВНАЯ ФУНКЦИЯ ОТКРЫТИЯ
window.openPack = async function(type) {
    const price = PRICES[type];
    
    let pool;
    if (type === 'gold') pool = goldPlayers;
    else if (type === 'tott') pool = tottPlayers;
    else if (type === 'champions') pool = championsPlayers;
    else if (type === 'national_stars') pool = nationalStarsPlayers;
    else if (type === 'time_travels') pool = timeTravelsPlayers;
    else if (type === 'chaos') pool = chaosPlayers;
    else pool = totyPlayers;

    const success = await updateBalance(-price);

    if (success) {
        currentDroppedPlayer = pickPlayerByChance(pool);

        if (type === 'gold') {
            showInstantReveal();
        } else {
            startCinematicReveal(currentDroppedPlayer);
        }
    } else {
        alert("Не хватает CY для открытия пака!");
    }
};

function showInstantReveal() {
    const stage = document.getElementById('reveal-stage');
    const cardDropStage = document.getElementById('card-drop-stage');
    const playerImg = document.getElementById('final-card-img');
    const claimBtn = document.getElementById('claim-btn');

    // Скрываем тизеры
    document.getElementById('teaser-container').classList.add('hidden');
    
    playerImg.src = `${currentDroppedPlayer.folder}/${currentDroppedPlayer.file}`;
    stage.classList.remove('hidden');
    cardDropStage.classList.remove('hidden');
    claimBtn.classList.remove('hidden');

    playerImg.classList.add('flash-effect');
    setupClaimButton();
    setTimeout(() => playerImg.classList.remove('flash-effect'), 1000);
}

// ЭПИЧНАЯ КИНЕМАТОГРАФИЧЕСКАЯ АНИМАЦИЯ
async function startCinematicReveal(player) {
    const stage = document.getElementById('reveal-stage');
    const teaserContainer = document.getElementById('teaser-container');
    const stepCountry = document.getElementById('step-country');
    const stepPos = document.getElementById('step-pos');
    const stepClub = document.getElementById('step-club');
    
    const posBadge = document.getElementById('pos-badge');
    const clubImg = document.getElementById('club-icon-img');
    
    const cardDropStage = document.getElementById('card-drop-stage');
    const cardImg = document.getElementById('final-card-img');
    const shockwave = document.getElementById('impact-shockwave');
    const claimBtn = document.getElementById('claim-btn');

    // Сброс всех прошлых состояний
    teaserContainer.classList.remove('hidden');
    stepCountry.className = 'teaser-step hidden';
    stepPos.className = 'teaser-step hidden';
    stepClub.className = 'teaser-step hidden';
    cardDropStage.classList.add('hidden');
    claimBtn.classList.add('hidden');
    shockwave.classList.remove('active');
    cardImg.className = 'slammed-card';

    // Заполнение данных
    posBadge.innerText = player.pos;
    clubImg.src = `images/${player.club}.png`;
    cardImg.src = `${player.folder}/${player.file}`;

    // Открываем сцену
    stage.classList.remove('hidden');

    // --- ШАГ 1: Показ Флага (Страна) ---
    await sleep(300);
    stepCountry.classList.remove('hidden');
    stepCountry.classList.add('animate-in');
    await sleep(1400);
    stepCountry.classList.replace('animate-in', 'animate-out');
    await sleep(300);
    stepCountry.classList.add('hidden');

    // --- ШАГ 2: Показ Позиции ---
    stepPos.classList.remove('hidden');
    stepPos.classList.add('animate-in');
    await sleep(1400);
    stepPos.classList.replace('animate-in', 'animate-out');
    await sleep(300);
    stepPos.classList.add('hidden');

    // --- ШАГ 3: Показ Клуба ---
    stepClub.classList.remove('hidden');
    stepClub.classList.add('animate-in');
    await sleep(1400);
    stepClub.classList.replace('animate-in', 'animate-out');
    await sleep(400);
    stepClub.classList.add('hidden');
    teaserContainer.classList.add('hidden');

    // --- ШАГ 4: Эпичное падение карточки ---
    cardDropStage.classList.remove('hidden');
    cardImg.classList.add('drop-slam-anim');

    // Эффект удара об землю (Shockwave & Screen Shake)
    setTimeout(() => {
        shockwave.classList.add('active');
        stage.classList.add('screen-shake');
        setTimeout(() => stage.classList.remove('screen-shake'), 400);
    }, 500);

    // Показываем кнопку "Забрать в состав"
    await sleep(1000);
    claimBtn.classList.remove('hidden');
    claimBtn.classList.add('pop-in-btn');
    setupClaimButton();
}

function setupClaimButton() {
    const claimBtn = document.getElementById('claim-btn');
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
    const stage = document.getElementById('reveal-stage');
    stage.classList.add('hidden');
    currentDroppedPlayer = null;
};

document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);