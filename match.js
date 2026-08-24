import { updateBalance } from './economy.js';

const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');

const DIFFICULTY_SETTINGS = {
    novice: { name: 'Новичок', aiSpeed: 0.6, aiAccuracy: 0.4, maxReward: 20000, botRating: 75 },
    pro: { name: 'Профессионал', aiSpeed: 0.8, aiAccuracy: 0.6, maxReward: 50000, botRating: 85 },
    world_class: { name: 'Мировой Класс', aiSpeed: 1.0, aiAccuracy: 0.8, maxReward: 90000, botRating: 92 },
    legend: { name: 'Легенда', aiSpeed: 1.2, aiAccuracy: 0.9, maxReward: 140000, botRating: 98 },
    ultimate: { name: 'ULTIMATE', aiSpeed: 1.4, aiAccuracy: 1.0, maxReward: 200000, botRating: 105 }
};

const currentDiffKey = localStorage.getItem('rush_difficulty') || 'novice';
const currentDiff = DIFFICULTY_SETTINGS[currentDiffKey];

// --- ВАЛИДАЦИЯ И БЕЗОПАСНОЕ ПОЛУЧЕНИЕ СОСТАВА ---
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
    
    // Если игроков меньше 5, автозаполняем дефолтными для бессбойного старта
    const defaultNames = ['Neymar Jr', 'Messi', 'Griezmann', 'Mbappe', 'Courtois'];
    while (filtered.length < 5) {
        filtered.push({
            name: defaultNames[filtered.length] || `Player ${filtered.length + 1}`,
            rating: 88,
            number: filtered.length + 1
        });
    }
    return filtered.slice(0, 5);
}

const validPlayers = getVerifiedSquad();

// --- СОСТОЯНИЕ МАТЧА ---
const HALF_DURATION = 240;
let matchSeconds = 0;
let currentHalf = 1;
let matchInterval;
let homeScore = 0;
let awayScore = 0;
let gameState = 'PLAYING';

const ball = { x: 550, y: 325, vx: 0, vy: 0, radius: 7, friction: 0.975 };
const joystickDir = { x: 0, y: 0 };
const keys = {};

let isChargingShot = false;
let shotPower = 0;

class Player {
    constructor(x, y, data, isHome, role, number) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 18;
        this.data = data;
        this.isHome = isHome;
        this.role = role;
        this.number = number;

        const rating = data && data.rating ? Number(data.rating) : 80;
        this.speed = (rating / 20) * (isHome ? 1.0 : currentDiff.aiSpeed);

        this.stunnedUntil = 0;
        this.tackleCooldown = 0;
        this.hasImg = false;

        if (data && data.file) {
            this.img = new Image();
            const folder = data.folder || (rating >= 97 ? 'Toty' : 'Champions');
            this.img.src = `${folder}/${data.file}`;
            this.img.onload = () => { this.hasImg = true; };
            this.img.onerror = () => { this.hasImg = false; };
        }
    }

    draw(isActive) {
        const now = Date.now();
        ctx.save();

        // Тень под игроком
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 14, 16, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        // Эффект оглушения
        if (now < this.stunnedUntil) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.fill();
        }

        // Круг игрока
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

        // Маркер активного игрока с векторной стрелкой направления (как на референсе)
        if (isActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Стрелка направления движения
            let speedMag = Math.hypot(this.vx, this.vy);
            let dirX = speedMag > 0.1 ? this.vx / speedMag : (this.isHome ? 1 : -1);
            let dirY = speedMag > 0.1 ? this.vy / speedMag : 0;

            ctx.beginPath();
            ctx.moveTo(this.x + dirX * 22, this.y + dirY * 22);
            ctx.lineTo(this.x + dirX * 38, this.y + dirY * 38);
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.x + dirX * 38, this.y + dirY * 38, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff88';
            ctx.fill();
        }

        // Имя и рейтинг над игроком
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`${this.data.name || 'Bot'} (${this.data.rating || 80})`, this.x, this.y - this.radius - 6);
        ctx.shadowBlur = 0;
    }

    update() {
        const now = Date.now();
        if (now < this.stunnedUntil) return;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.82;
        this.vy *= 0.82;

        this.x = Math.max(35, Math.min(1065, this.x));
        this.y = Math.max(35, Math.min(615, this.y));
    }
}

let homeTeam = [];
let awayTeam = [];
let activeUserPlayer = null;

function initTeams() {
    const homePos = [
        { role: 'GK', x: 80, y: 325, num: 1 },
        { role: 'DF', x: 260, y: 180, num: 2 },
        { role: 'DF', x: 260, y: 470, num: 3 },
        { role: 'MF', x: 450, y: 325, num: 8 },
        { role: 'FW', x: 530, y: 325, num: 10 }
    ];

    homeTeam = homePos.map((p, i) => new Player(p.x, p.y, validPlayers[i], true, p.role, p.num));
    activeUserPlayer = homeTeam[3];

    const awayPos = [
        { role: 'GK', x: 1020, y: 325, num: 1 },
        { role: 'DF', x: 840, y: 180, num: 4 },
        { role: 'DF', x: 840, y: 470, num: 5 },
        { role: 'MF', x: 650, y: 325, num: 6 },
        { role: 'FW', x: 570, y: 325, num: 9 }
    ];

    awayTeam = awayPos.map((p) => new Player(p.x, p.y, { name: 'Bot', rating: currentDiff.botRating }, false, p.role, p.num));
}

function executeTackle(player) {
    const now = Date.now();
    if (now < player.tackleCooldown || now < player.stunnedUntil) return;

    player.tackleCooldown = now + 1800;

    const tackleBtn = document.getElementById('btn-tackle');
    if (player.isHome) {
        tackleBtn.classList.add('cooldown');
        setTimeout(() => tackleBtn.classList.remove('cooldown'), 1800);
    }

    let angle = Math.atan2(ball.y - player.y, ball.x - player.x);
    player.vx = Math.cos(angle) * 13;
    player.vy = Math.sin(angle) * 13;

    const opponents = player.isHome ? awayTeam : homeTeam;
    opponents.forEach(opp => {
        let dist = Math.hypot(opp.x - player.x, opp.y - player.y);
        if (dist < 42) {
            opp.stunnedUntil = now + 1800;
            ball.vx = Math.cos(angle) * 15;
            ball.vy = Math.sin(angle) * 15;
        }
    });
}

function updateAI() {
    const now = Date.now();
    awayTeam.forEach(bot => {
        if (now < bot.stunnedUntil) return;

        if (bot.role === 'GK') {
            bot.y += (ball.y - bot.y) * 0.08 * currentDiff.aiAccuracy;
            bot.y = Math.max(250, Math.min(400, bot.y));
        } else {
            let dx = ball.x - bot.x;
            let dy = ball.y - bot.y;
            let dist = Math.hypot(dx, dy);

            if (dist < 340) {
                bot.vx = (dx / dist) * bot.speed;
                bot.vy = (dy / dist) * bot.speed;
            }

            if (dist < 40 && Math.random() < 0.02 * currentDiff.aiAccuracy) {
                executeTackle(bot);
            }

            if (dist < 220 && bot.x < 380 && Math.random() < 0.035 * currentDiff.aiAccuracy) {
                let err = (1 - currentDiff.aiAccuracy) * (Math.random() - 0.5) * 8;
                ball.vx = -17;
                ball.vy = err;
            }
        }
        bot.update();
    });
}

function checkOutsAndCorners() {
    if (gameState !== 'PLAYING') return;

    if (ball.y < 30 || ball.y > 620) {
        ball.y = ball.y < 30 ? 35 : 615;
        triggerRestart();
        return;
    }

    if (ball.x < 30 || ball.x > 1070) {
        if (ball.y > 250 && ball.y < 400) {
            if (ball.x < 30) handleGoal('away');
            else handleGoal('home');
            return;
        }

        if (ball.x > 1070) {
            ball.x = 1060;
            ball.y = ball.y < 325 ? 35 : 615;
            triggerRestart();
        } else {
            ball.x = 100;
            ball.y = 325;
            triggerRestart();
        }
    }
}

function triggerRestart() {
    gameState = 'OUT_RESTART';
    ball.vx = 0; ball.vy = 0;
    setTimeout(() => {
        if (gameState === 'OUT_RESTART') gameState = 'PLAYING';
    }, 1000);
}

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
        }

        // Автопереключение на ближайшего к мячу полевого игрока
        let minDist = Infinity;
        homeTeam.forEach(p => {
            p.update();
            if (p.role !== 'GK') {
                let d = Math.hypot(p.x - ball.x, p.y - ball.y);
                if (d < minDist) { minDist = d; activeUserPlayer = p; }
            }
        });

        updateAI();

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= ball.friction;
        ball.vy *= ball.friction;

        // Физика столкновения с мячом
        [...homeTeam, ...awayTeam].forEach(p => {
            let d = Math.hypot(p.x - ball.x, p.y - ball.y);
            if (d < p.radius + ball.radius) {
                let angle = Math.atan2(ball.y - p.y, ball.x - p.x);
                ball.vx += Math.cos(angle) * 0.8;
                ball.vy += Math.sin(angle) * 0.8;
            }
        });

        checkOutsAndCorners();

        if (isChargingShot) {
            shotPower = Math.min(100, shotPower + 2.5);
            document.getElementById('power-bar-fill').style.width = shotPower + '%';
        }
    }

    render();
    requestAnimationFrame(gameLoop);
}

// --- ОТРИСОВКА ПОЛЯ И ВСЕХ ЭЛЕМЕНТОВ (В СТИЛЕ TACTICAL MATCH VIEW) ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Полосы газона
    const stripeWidth = 65;
    for (let x = 0; x < canvas.width; x += stripeWidth) {
        ctx.fillStyle = (Math.floor(x / stripeWidth) % 2 === 0) ? '#1d4d2d' : '#174025';
        ctx.fillRect(x, 0, stripeWidth, canvas.height);
    }

    // 2. Белая разметочная линия
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 3;

    // Внешняя граница
    ctx.strokeRect(30, 30, 1040, 590);

    // Центральная линия и круг
    ctx.beginPath();
    ctx.moveTo(550, 30); ctx.lineTo(550, 620);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(550, 325, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(550, 325, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Левая штрафная площадь
    ctx.strokeRect(30, 160, 165, 330);
    ctx.strokeRect(30, 240, 55, 170);

    // Правая штрафная площадь
    ctx.strokeRect(905, 160, 165, 330);
    ctx.strokeRect(1015, 240, 55, 170);

    // Ворота
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(10, 250, 20, 150);
    ctx.strokeRect(10, 250, 20, 150);

    ctx.fillRect(1070, 250, 20, 150);
    ctx.strokeRect(1070, 250, 20, 150);

    // 3. Игроки
    homeTeam.forEach(p => p.draw(p === activeUserPlayer));
    awayTeam.forEach(p => p.draw(false));

    // 4. Мяч с тенью
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

function executePass() {
    if (!activeUserPlayer || Date.now() < activeUserPlayer.stunnedUntil) return;
    let teammate = homeTeam.find(p => p !== activeUserPlayer && p.role !== 'GK');
    if (teammate) {
        let angle = Math.atan2(teammate.y - ball.y, teammate.x - ball.x);
        ball.vx = Math.cos(angle) * 14;
        ball.vy = Math.sin(angle) * 14;
    }
}

function startShotCharge() {
    if (!activeUserPlayer || Date.now() < activeUserPlayer.stunnedUntil) return;
    isChargingShot = true;
    shotPower = 0;
    document.getElementById('power-bar-container').style.display = 'block';
}

function releaseShot() {
    if (!isChargingShot) return;
    isChargingShot = false;
    document.getElementById('power-bar-container').style.display = 'none';

    let accuracyOffset = (shotPower / 100) * (Math.random() - 0.5) * 8;
    let pwr = (shotPower / 100) * 24 + 6;

    let angle = Math.atan2(325 - ball.y, 1070 - ball.x);
    ball.vx = Math.cos(angle) * pwr;
    ball.vy = Math.sin(angle) * pwr + accuracyOffset;
}

document.getElementById('btn-pass').addEventListener('touchstart', executePass);
document.getElementById('btn-pass').addEventListener('click', executePass);

document.getElementById('btn-tackle').addEventListener('click', () => activeUserPlayer && executeTackle(activeUserPlayer));
document.getElementById('btn-tackle').addEventListener('touchstart', () => activeUserPlayer && executeTackle(activeUserPlayer));

const shotBtn = document.getElementById('btn-shot');
shotBtn.addEventListener('mousedown', startShotCharge);
shotBtn.addEventListener('touchstart', startShotCharge);
window.addEventListener('mouseup', releaseShot);
window.addEventListener('touchend', releaseShot);

window.addEventListener('keydown', e => {
    keys[e.code] = true;
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
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
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
                alert("ПЕРЕРЫВ! Начало 2-го тайма.");
                ball.x = 550; ball.y = 325;
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

initTeams();
startTimer();
requestAnimationFrame(gameLoop);