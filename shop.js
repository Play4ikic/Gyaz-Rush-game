const PRICES = { 
    gold: 5000, 
    champions: 50000, 
    toty: 100000 
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

let currentDroppedPlayer = null;

function openPack(type, videoFile) {
    const price = PRICES[type];
    let pool = (type === 'gold') ? goldPlayers : (type === 'champions' ? championsPlayers : totyPlayers);

    if (typeof updateBalance === 'function' && updateBalance(-price)) {
        currentDroppedPlayer = pool[Math.floor(Math.random() * pool.length)];

        // ЛОГИКА ДЛЯ GOLD PACK (Без видео)
        if (type === 'gold') {
            showInstantReveal();
        } else {
            // ЛОГИКА ДЛЯ КРУТЫХ ПАКОВ (С видео)
            startVideoReveal(videoFile);
        }
    } else {
        alert("Эльджан, не хватает CY!");
    }
}

// Мгновенное открытие для золотого пака
function showInstantReveal() {
    const revealScreen = document.getElementById('reveal-screen');
    const playerImg = document.getElementById('card-res-img');

    playerImg.src = `${currentDroppedPlayer.folder}/${currentDroppedPlayer.file}`;
    
    // Добавляем класс для эффекта вспышки
    playerImg.classList.add('flash-effect');
    revealScreen.classList.remove('hidden');

    setupClaimButton();
    
    // Убираем вспышку через секунду, чтобы можно было открыть снова
    setTimeout(() => playerImg.classList.remove('flash-effect'), 1000);
}

// Обычное открытие с видео
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
    
    // Alert удален, просто закрываем экран выпадения
    closeReveal();
}

function closeReveal() {
    document.getElementById('reveal-screen').classList.add('hidden');
    document.getElementById('video-reveal-container').classList.add('hidden');
    currentDroppedPlayer = null;
}