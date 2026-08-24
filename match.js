import { updateBalance } from './economy.js';

const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');

// НАСТРОЙКИ СЛОЖНОСТИ И БОТА
const DIFFICULTY_SETTINGS = {
    novice: { name: 'Новичок', aiSpeed: 2.2, aiAccuracy: 0.4, maxReward: 20000, cardTier: 'gold' },
    pro: { name: 'Профессионал', aiSpeed: 2.8, aiAccuracy: 0.65, maxReward: 50000, cardTier: 'champions' },
    world_class: { name: 'Мировой Класс', aiSpeed: 3.4, aiAccuracy: 0.82, maxReward: 90000, cardTier: 'toty' },
    legend: { name: 'Легенда', aiSpeed: 4.0, aiAccuracy: 0.92, maxReward: 140000, cardTier: 'chaos' },
    ultimate: { name: 'ULTIMATE', aiSpeed: 4.6, aiAccuracy: 1.0, maxReward: 200000, cardTier: 'ballondor' }
};

const BOT_CARD_POOLS = {
    gold: [
        { name: 'Bugday', rating: 87, pos: 'GK', folder: 'Gold', file: 'Bugday-87.png' },
        { name: 'Selim', rating: 68, pos: 'CB', folder: 'Gold', file: 'Selim-68.png' },
        { name: 'Nazrin', rating: 82, pos: 'CB', folder: 'Gold', file: 'Nazrin-82.png' },
        { name: 'Elcan', rating: 92, pos: 'RW', folder: 'Gold', file: 'Elcan-92.png' },
        { name: 'Turgay', rating: 92, pos: 'ST', folder: 'Gold', file: 'Turqay-92.png' }
    ],
    champions: [
        { name: 'Bugday', rating: 90, pos: 'GK', folder: 'Champions', file: 'Bugday-90.png' },
        { name: 'Nazrin', rating: 88, pos: 'DF', folder: 'Champions', file: 'Nazrin-88.png' },
        { name: 'Tuncay', rating: 91, pos: 'DF', folder: 'Champions', file: 'Tuncay-91.png' },
        { name: 'Elcan', rating: 96, pos: 'RW', folder: 'Champions', file: 'Elcan-96.png' },
        { name: 'Turgay', rating: 96, pos: 'ST', folder: 'Champions', file: 'Turqay-96.png' }
    ],
    toty: [
        { name: 'Bugday', rating: 95, pos: 'GK', folder: 'Toty', file: 'Bugday-95.png' },
        { name: 'Nazrin', rating: 91, pos: 'DF', folder: 'Toty', file: 'Nazrin-91.png' },
        { name: 'Tuncay', rating: 97, pos: 'DF', folder: 'Toty', file: 'Tuncay-97.png' },
        { name: 'Elcan', rating: 97, pos: 'RW', folder: 'Toty', file: 'Elcan-97.png' },
        { name: 'Turgay', rating: 97, pos: 'ST', folder: 'Toty', file: 'Turqay-97.png' }
    ],
    chaos: [
        { name: 'Bugday', rating: 99, pos: 'GK', folder: 'CHAOS', file: 'Bugday-99.png' },
        { name: 'Nazrin', rating: 99, pos: 'DF', folder: 'CHAOS', file: 'Nazrin-99.png' },
        { name: 'Tuncay', rating: 99, pos: 'DF', folder: 'CHAOS', file: 'Tuncay-99.png' },
        { name: 'Elcan', rating: 99, pos: 'RW', folder: 'CHAOS', file: 'Elcan-99.png' },
        { name: 'Turgay', rating: 99, pos: 'ST', folder: 'CHAOS', file: 'Turgay-99.png' }
    ],
    ballondor: [
        { name: 'Bugday', rating: 105, pos: 'GK', folder: 'GoldenStars', file: 'Bugday-105.png' },
        { name: 'Nazrin', rating: 102, pos: 'CB', folder: 'GoldenStars', file: 'Nazrin-102.png' },
        { name: 'Tuncay', rating: 103, pos: 'CB', folder: 'GoldenStars', file: 'Tuncay-103.png' },
        { name: 'Elcan', rating: 105, pos: 'CAM', folder: 'GoldenStars', file: 'Elcan-105.png' },
        { name: 'Turgay', rating: 103, pos: 'ST', folder: 'GoldenStars', file: 'Turgay-103.png' }
    ]
};

const currentDiffKey = localStorage.getItem('rush_difficulty') || 'novice';
const currentDiff = DIFFICULTY_SETTINGS[currentDiffKey];

// ИНИЦИАЛИЗАЦИЯ ИГРОКОВ ПОЛЬЗОВАТЕЛЯ
function getVerifiedSquad() {
    let squad = [];
    try {
        let raw = localStorage.getItem('activeSquad');
        if (raw) {
            while (typeof raw === 'string') {
                try { raw = JSON.parse(raw); } catch(e) { break; }
            }
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) raw = Object.values(raw);
            squad = Array.isArray(raw) ? raw : [];
        }
    } catch(e) {}
    
    let filtered = squad.filter(p => p !== null && typeof p === 'object');
    const defaultNames = ['Neymar Jr', 'Messi', 'Griezmann', 'Mbappe', 'Courtois'];
    while (filtered.length < 5) {
        filtered.push({ name: defaultNames[filtered.length], rating: 88, number: filtered.length + 1 });
    }
    return filtered.slice(0, 5);
}

const userPlayersData = getVerifiedSquad();
const botPlayersData = BOT_CARD_POOLS[currentDiff.cardTier];

// ИГРОВОЕ СОСТОЯНИЕ
const HALF_DURATION = 240;
let matchSeconds = 0;
let currentHalf = 1;
let matchInterval;
let homeScore = 0;
let awayScore = 0;
let gameState = 'PLAYING';

// МЯЧ И ВЛАДЕНИЕ
const ball = { 
    x: 550, y: 325, vx: 0, vy: 0, radius: 7, friction: 0.96, 
    owner: null // Игрок, у которого сейчас мяч
};

const joystickDir = { x: 0, y: 0 };
const keys = {};

let isChargingShot = false;
let shotPower = 0;

class Player {
    constructor(x, y, data, isHome, role, number, basePos) {
        this.x = x;
        this.y = y;
        this.baseX = basePos.x;
        this.baseY = basePos.y;
        this.vx = 0;
        this.vy = 0;
        this.facingAngle = isHome ? 0 : Math.PI;
        this.radius = 18;
        this.data = data;
        this.isHome = isHome;
        this.role = role;
        this.number = number;

        const rating = data && data.rating ? Number(data.rating) : 80;
        this.speed = (rating / 30) + (isHome ? 2.2 : currentDiff.aiSpeed);

        this.stunnedUntil = 0;
        this.tackleCooldown = 0;
        this.hasImg = false;

        if (data && data.file) {
            this.img = new Image();
            this.img.src = `${data.folder}/${data.file}`;
            this.img.onload = () => { this.hasImg = true; };
        }
    }

    draw(isActive) {
        const now = Date.now();
        ctx.save();

        // Тень
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 14, 16, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        // Оглушение при подкате
        if (now < this.stunnedUntil) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.fill();
        }

        // Карточка/Аватар
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.clip();

        if (this.hasImg) {
            ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = this.isHome ? '#0077ff' : '#e74c3c';
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.number, this.x, this.y);
        }
        ctx.restore();

        // Обводка
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = this.isHome ? '#ffffff' : '#ffcc00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Маркер активного игрока
        if (isActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Вектор направления
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(this.facingAngle) * 20, this.y + Math.sin(this.facingAngle) * 20);
            ctx.lineTo(this.x + Math.cos(this.facingAngle) * 35, this.y + Math.sin(this.facingAngle) * 35);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Никнейм над игроком
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`${this.data.name} (${this.data.rating})`, this.x, this.y - this.radius - 6);
        ctx.shadowBlur = 0;
    }

    update() {
        const now = Date.now();
        if (now < this.stunnedUntil) return;

        this.x += this.vx;
        this.y += this.vy;
        
        if (Math.hypot(this.vx, this.vy) > 0.2) {
            this.facingAngle = Math.atan2(this.vy, this.vx);
        }

        this.vx *= 0.8;
        this.vy *= 0.8;

        // Жесткие границы поля (БЕЗ АУТОВ)
        this.x = Math.max(35, Math.min(1065, this.x));
        this.y = Math.max(35, Math.min(615, this.y));
    }
}

let homeTeam = [];
let awayTeam = [];
let activeUserPlayer = null;

function initTeams() {
    const homePos = [
        { role: 'GK', x: 70, y: 325, num: 1 },
        { role: 'DF', x: 260, y: 180, num: 2 },
        { role: 'DF', x: 260, y: 470, num: 3 },
        { role: 'MF', x: 450, y: 325, num: 8 },
        { role: 'FW', x: 530, y: 325, num: 10 }
    ];

    homeTeam = homePos.map((p, i) => new Player(p.x, p.y, userPlayersData[i], true, p.role, p.num, p));
    activeUserPlayer = homeTeam[3]; // Начинаем управление с полузащитника

    const awayPos = [
        { role: 'GK', x: 1030, y: 325, num: 1 },
        { role: 'DF', x: 840, y: 180, num: 4 },
        { role: 'DF', x: 840, y: 470, num: 5 },
        { role: 'MF', x: 650, y: 325, num: 6 },
        { role: 'FW', x: 570, y: 325, num: 9 }
    ];

    awayTeam = awayPos.map((p, i) => new Player(p.x, p.y, botPlayersData[i], false, p.role, p.num, p));
}

// ПЕРЕКЛЮЧЕНИЕ ИГРОКОВ (FIFA L1 / KEY Q)
function switchUserPlayer() {
    let fieldPlayers = homeTeam.filter(p => p.role !== 'GK');
    let currentIndex = fieldPlayers.indexOf(activeUserPlayer);
    let nextIndex = (currentIndex + 1) % fieldPlayers.length;
    activeUserPlayer = fieldPlayers[nextIndex];
}

// ВЛАДЕНИЕ МЯЧОМ И ПОДКАДЫ
function executeTackle(player) {
    const now = Date.now();
    if (now < player.tackleCooldown || now < player.stunnedUntil) return;

    player.tackleCooldown = now + 1500;
    if (player.isHome) {
        document.getElementById('btn-tackle').classList.add('cooldown');
        setTimeout(() => document.getElementById('btn-tackle').classList.remove('cooldown'), 1500);
    }

    let angle = player.facingAngle;
    player.vx = Math.cos(angle) * 14;
    player.vy = Math.sin(angle) * 14;

    // Проверяем отбор у соперников
    const opponents = player.isHome ? awayTeam : homeTeam;
    opponents.forEach(opp => {
        let dist = Math.hypot(opp.x - player.x, opp.y - player.y);
        if (dist < 38) {
            opp.stunnedUntil = now + 1600;
            if (ball.owner === opp) {
                ball.owner = null; // Отбираем мяч!
                ball.vx = Math.cos(angle) * 12;
                ball.vy = Math.sin(angle) * 12;
            }
        }
    });
}

// СИЛЬНЫЙ ВРАТАРЬ
function updateGK(gk) {
    let targetY = Math.max(240, Math.min(410, ball.y));
    gk.y += (targetY - gk.y) * 0.18; // Быстрая реакция

    // Сейв или перехват мяча
    let dist = Math.hypot(gk.x - ball.x, gk.y - ball.y);
    if (dist < 45) {
        ball.owner = gk;
        ball.vx = 0; ball.vy = 0;
        
        // Вратарь выбивает мяч через короткую паузу
        setTimeout(() => {
            if (ball.owner === gk) {
                ball.owner = null;
                let clearAngle = gk.isHome ? 0 : Math.PI;
                ball.vx = Math.cos(clearAngle) * 20;
                ball.vy = (Math.random() - 0.5) * 10;
            }
        }, 600);
    }
}

// ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ БОТОВ И СОКОМАНДНИКОВ
function updateAI() {
    const now = Date.now();

    // 1. Неуправляемые игроки игрока (FIFA ИИ)
    homeTeam.forEach(p => {
        if (p === activeUserPlayer || p.role === 'GK') return;
        
        // Держат позицию / открываются
        let targetX = p.baseX + (ball.x - 550) * 0.25;
        let targetY = p.baseY + (ball.y - 325) * 0.25;
        
        let dx = targetX - p.x;
        let dy = targetY - p.y;
        if (Math.hypot(dx, dy) > 20) {
            p.vx = (dx / Math.hypot(dx, dy)) * (p.speed * 0.7);
            p.vy = (dy / Math.hypot(dx, dy)) * (p.speed * 0.7);
        }
        p.update();
    });

    // 2. Вратари
    updateGK(homeTeam[0]);
    updateGK(awayTeam[0]);

    // 3. Активный Бот (Вся команда бота атакует и защищается)
    awayTeam.forEach(bot => {
        if (bot.role === 'GK' || now < bot.stunnedUntil) return;

        let distToBall = Math.hypot(ball.x - bot.x, ball.y - bot.y);

        if (ball.owner === bot) {
            // Бот ведет мяч к воротам игрока и бьет
            let targetX = 30;
            let targetY = 325;
            let angle = Math.atan2(targetY - bot.y, targetX - bot.x);
            bot.vx = Math.cos(angle) * bot.speed;
            bot.vy = Math.sin(angle) * bot.speed;

            // Бот бьет по воротам, если близко
            if (bot.x < 320 && Math.random() < 0.03 * currentDiff.aiAccuracy) {
                ball.owner = null;
                ball.vx = -22;
                ball.vy = (325 - bot.y) * 0.1;
            }
        } else {
            // Прессинг: Бот пытается отбрать мяч
            let angle = Math.atan2(ball.y - bot.y, ball.x - bot.x);
            bot.vx = Math.cos(angle) * bot.speed;
            bot.vy = Math.sin(angle) * bot.speed;

            if (distToBall < 35 && Math.random() < 0.04 * currentDiff.aiAccuracy) {
                executeTackle(bot);
            }
        }
        bot.update();
    });
}

// ПАС ТОЛЬКО НА СВОИХ
function executePass() {
    if (!ball.owner || ball.owner !== activeUserPlayer) return;

    let teammates = homeTeam.filter(p => p !== activeUserPlayer && p.role !== 'GK');
    if (teammates.length === 0) return;

    // Находим ближайшего партнера по направлению
    let target = teammates[0];
    let minDist = Infinity;
    teammates.forEach(p => {
        let d = Math.hypot(p.x - activeUserPlayer.x, p.y - activeUserPlayer.y);
        if (d < minDist) { minDist = d; target = p; }
    });

    let angle = Math.atan2(target.y - activeUserPlayer.y, target.x - activeUserPlayer.x);
    ball.owner = null;
    ball.vx = Math.cos(angle) * 17;
    ball.vy = Math.sin(angle) * 17;
}

// УДАР ПО ВОРОТАМ (Только когда мяч у игрока)
function startShotCharge() {
    if (!ball.owner || ball.owner !== activeUserPlayer) return;
    isChargingShot = true;
    shotPower = 0;
    document.getElementById('power-bar-container').style.display = 'block';
}

function releaseShot() {
    if (!isChargingShot) return;
    isChargingShot = false;
    document.getElementById('power-bar-container').style.display = 'none';

    if (ball.owner === activeUserPlayer) {
        ball.owner = null;
        let pwr = (shotPower / 100) * 20 + 8;
        let angle = Math.atan2(325 - activeUserPlayer.y, 1070 - activeUserPlayer.x);
        
        ball.vx = Math.cos(angle) * pwr;
        ball.vy = Math.sin(angle) * pwr;
    }
}

// ОСНОВНОЙ ИГРОВОЙ ЦИКЛ
function gameLoop() {
    if (gameState === 'PLAYING') {
        let moveX = joystickDir.x;
        let moveY = joystickDir.y;

        if (keys['KeyW'] || keys['ArrowUp']) moveY = -1;
        if (keys['KeyS'] || keys['ArrowDown']) moveY = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

        if (activeUserPlayer && Date.now() > activeUserPlayer.stunnedUntil) {
            activeUserPlayer.vx = moveX * activeUserPlayer.speed;
            activeUserPlayer.vy = moveY * activeUserPlayer.speed;
            activeUserPlayer.update();
        }

        updateAI();

        // ФИЗИКА И ВЛАДЕНИЕ МЯЧОМ (ПРИЦЕП)
        if (ball.owner) {
            // Мяч идет прямо за владельцем
            let distOffset = 20;
            ball.x = ball.owner.x + Math.cos(ball.owner.facingAngle) * distOffset;
            ball.y = ball.owner.y + Math.sin(ball.owner.facingAngle) * distOffset;
            ball.vx = 0; ball.vy = 0;
        } else {
            // Движение свободного мяча
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.vx *= ball.friction;
            ball.vy *= ball.friction;

            // Захват свободнаго мяча игроками
            [...homeTeam, ...awayTeam].forEach(p => {
                if (Date.now() < p.stunnedUntil) return;
                let d = Math.hypot(p.x - ball.x, p.y - ball.y);
                if (d < p.radius + 10) {
                    ball.owner = p;
                }
            });

            // БЕЗ АУТОВ И УГЛОВЫХ: Мяч отскакивает от бортов
            if (ball.y < 35 || ball.y > 615) ball.vy *= -1;
            if (ball.x < 35 || ball.x > 1065) {
                // Если не попал в ворота — отскакивает
                if (ball.y < 250 || ball.y > 400) {
                    ball.vx *= -1;
                } else {
                    // ГОЛ
                    if (ball.x < 35) handleGoal('away');
                    else handleGoal('home');
                }
            }
        }

        if (isChargingShot) {
            shotPower = Math.min(100, shotPower + 3);
            document.getElementById('power-bar-fill').style.width = shotPower + '%';
        }
    }

    render();
    requestAnimationFrame(gameLoop);
}

// ОТРИСОВКА ПОЛЯ И ЭЛЕМЕНТОВ
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Газон
    const stripeWidth = 65;
    for (let x = 0; x < canvas.width; x += stripeWidth) {
        ctx.fillStyle = (Math.floor(x / stripeWidth) % 2 === 0) ? '#1d4d2d' : '#174025';
        ctx.fillRect(x, 0, stripeWidth, canvas.height);
    }

    // Разметка
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1040, 590);

    ctx.beginPath();
    ctx.moveTo(550, 30); ctx.lineTo(550, 620);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(550, 325, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Штрафные
    ctx.strokeRect(30, 160, 165, 330);
    ctx.strokeRect(905, 160, 165, 330);

    // Ворота
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(10, 250, 20, 150);
    ctx.strokeRect(10, 250, 20, 150);
    ctx.fillRect(1070, 250, 20, 150);
    ctx.strokeRect(1070, 250, 20, 150);

    // Отрисовка команд
    homeTeam.forEach(p => p.draw(p === activeUserPlayer));
    awayTeam.forEach(p => p.draw(false));

    // Мяч
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + 5, ball.radius, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

// ОБРАБОТЧИКИ УПРАВЛЕНИЯ
document.getElementById('btn-switch').addEventListener('click', switchUserPlayer);
document.getElementById('btn-pass').addEventListener('click', executePass);
document.getElementById('btn-tackle').addEventListener('click', () => activeUserPlayer && executeTackle(activeUserPlayer));

const shotBtn = document.getElementById('btn-shot');
shotBtn.addEventListener('mousedown', startShotCharge);
shotBtn.addEventListener('touchstart', startShotCharge);
window.addEventListener('mouseup', releaseShot);
window.addEventListener('touchend', releaseShot);

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyQ') switchUserPlayer();
    if (e.code === 'KeyK') executePass();
    if (e.code === 'KeyL' && activeUserPlayer) executeTackle(activeUserPlayer);
    if (e.code === 'KeyJ' && !isChargingShot) startShotCharge();
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'KeyJ') releaseShot();
});

// ДЖОЙСТИК
const joyZone = document.getElementById('joystick-zone');
const joyStick = document.getElementById('joystick-stick');
let joyActive = false;

joyZone.addEventListener('pointerdown', e => { joyActive = true; updateJoystick(e); });
window.addEventListener('pointermove', e => { if (joyActive) updateJoystick(e); });
window.addEventListener('pointerup', () => {
    joyActive = false;
    joystickDir.x = 0; joystickDir.y = 0;
    joyStick.style.transform = `translate(0px, 0px)`;
});

function updateJoystick(e) {
    const rect = joyZone.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    let dist = Math.hypot(dx, dy);
    let maxR = 40;

    if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
    }

    joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
    joystickDir.x = dx / maxR;
    joystickDir.y = dy / maxR;
}

function handleGoal(team) {
    if (team === 'home') homeScore++; else awayScore++;
    document.getElementById('home-score').innerText = homeScore;
    document.getElementById('away-score').innerText = awayScore;
    ball.owner = null;
    ball.x = 550; ball.y = 325; ball.vx = 0; ball.vy = 0;
}

function startTimer() {
    matchInterval = setInterval(() => {
        if (gameState !== 'PLAYING') return;
        matchSeconds++;
        let remaining = HALF_DURATION - matchSeconds;
        let m = String(Math.floor(remaining / 60)).padStart(2, '0');
        let s = String(remaining % 60).padStart(2, '0');
        document.getElementById('match-timer').innerText = `${m}:${s}`;

        if (matchSeconds >= HALF_DURATION) {
            if (currentHalf === 1) {
                currentHalf = 2; matchSeconds = 0;
                document.getElementById('match-half').innerText = '2-Й ТАЙМ';
                ball.owner = null; ball.x = 550; ball.y = 325;
            } else {
                endMatch();
            }
        }
    }, 1000);
}

async function endMatch() {
    clearInterval(matchInterval);
    gameState = 'ENDED';

    let reward = 0;
    if (homeScore > awayScore) {
        reward = currentDiff.maxReward;
        alert(`ПОБЕДА! Награда: +${reward.toLocaleString()} CY`);
    } else if (homeScore === awayScore) {
        reward = Math.floor(currentDiff.maxReward * 0.3);
        alert(`НИЧЬЯ! Награда: +${reward.toLocaleString()} CY`);
    } else {
        alert("ПОРАЖЕНИЕ!");
    }

    if (reward > 0) await updateBalance(reward);
    window.location.href = 'rush.html';
}

// Запуск
document.getElementById('bot-team-name').innerText = currentDiff.name.toUpperCase();
initTeams();
startTimer();
requestAnimationFrame(gameLoop);