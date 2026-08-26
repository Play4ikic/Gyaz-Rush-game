function updateBalance(amount) {
    try {
        let current = parseInt(localStorage.getItem('rush_coins') || '0', 10);
        localStorage.setItem('rush_coins', current + amount);
    } catch(e) {}
}

const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');

// --- ГЛОБАЛЬНОЕ ОТСЛЕЖИВАНИЕ МЫШИ И ОБРАБОТКА КЛИКОВ ---
let mousePos = { x: 1070, y: 325 };

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (e.clientX - rect.left) * scaleX;
    mousePos.y = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { 
        if (isChargingPass) { 
            isChargingPass = false; 
            const bar = document.getElementById('power-bar-container');
            if (bar) bar.style.display = 'none';
        }
        startShotCharge();
    } else if (e.button === 2) { 
        if (isChargingShot) { 
            isChargingShot = false; 
            const bar = document.getElementById('power-bar-container');
            if (bar) bar.style.display = 'none';
        }

        if (ball.owner === activeUserPlayer) {
            if (gameState === 'KICKOFF') {
                if (kickoffState.team === 'home') executeKickoffPass('home');
                return;
            }

            const player = activeUserPlayer;
            let passAngle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);

            player.facingAngle = passAngle;
            player.catchCooldown = Date.now() + 400;

            ball.x = player.x + Math.cos(passAngle) * (player.radius + 12);
            ball.y = player.y + Math.sin(passAngle) * (player.radius + 12);
            ball.owner = null;

            let powerSpeed = 18; 

            ball.vx = Math.cos(passAngle) * powerSpeed;
            ball.vy = Math.sin(passAngle) * powerSpeed;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
        } else {
            let clickedTeammate = homeTeam.find(p => Math.hypot(p.x - mousePos.x, p.y - mousePos.y) <= p.radius + 22);
            if (clickedTeammate) {
                activeUserPlayer = clickedTeammate;
            } else {
                switchUserPlayer();
            }
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) { 
        releaseShot();
    }
});

// --- КЛАСС ВИРТУАЛЬНОГО ДЖОЙСТИКА (MOBILE TOUCH) ---
class VirtualJoystick {
    constructor(canvas) {
        this.canvas = canvas;
        this.touchId = null;
        this.active = false;
        this.baseX = 130;
        this.baseY = canvas.height - 130;
        this.maxRadius = 65;
        this.stickRadius = 30;
        this.stickX = this.baseX;
        this.stickY = this.baseY;
        this.input = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        const getTouchPos = (touch) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
        };

        this.canvas.addEventListener('touchstart', (e) => {
            if (this.active) return;
            for (let touch of e.changedTouches) {
                const pos = getTouchPos(touch);
                if (pos.x < this.canvas.width / 2) {
                    this.touchId = touch.identifier;
                    this.active = true;
                    this.baseX = pos.x;
                    this.baseY = pos.y;
                    this.updateStick(pos.x, pos.y);
                    break;
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.active) return;
            for (let touch of e.changedTouches) {
                if (touch.identifier === this.touchId) {
                    const pos = getTouchPos(touch);
                    this.updateStick(pos.x, pos.y);
                    e.preventDefault();
                    break;
                }
            }
        }, { passive: false });

        const handleTouchEnd = (e) => {
            if (!this.active) return;
            for (let touch of e.changedTouches) {
                if (touch.identifier === this.touchId) {
                    this.reset();
                    break;
                }
            }
        };

        this.canvas.addEventListener('touchend', handleTouchEnd);
        this.canvas.addEventListener('touchcancel', handleTouchEnd);
    }

    updateStick(touchX, touchY) {
        const dx = touchX - this.baseX;
        const dy = touchY - this.baseY;
        const distance = Math.hypot(dx, dy);

        if (distance === 0) {
            this.reset();
            return;
        }

        const clampedDistance = Math.min(distance, this.maxRadius);
        const angle = Math.atan2(dy, dx);

        this.stickX = this.baseX + Math.cos(angle) * clampedDistance;
        this.stickY = this.baseY + Math.sin(angle) * clampedDistance;

        this.input.x = (Math.cos(angle) * clampedDistance) / this.maxRadius;
        this.input.y = (Math.sin(angle) * clampedDistance) / this.maxRadius;
    }

    reset() {
        this.active = false;
        this.touchId = null;
        this.stickX = this.baseX;
        this.stickY = this.baseY;
        this.input = { x: 0, y: 0 };
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.maxRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.stickX, this.stickY, this.stickRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 210, 255, 0.7)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

const joystick = new VirtualJoystick(canvas);

// --- НАСТРОЙКИ СЛОЖНОСТИ И КАРТОЧЕК ---
const DIFFICULTY_SETTINGS = {
    novice: { name: 'Новичок', aiSpeed: 1.2, aiAccuracy: 0.5, maxReward: 20000, cardTier: 'gold' },
    pro: { name: 'Профессионал', aiSpeed: 1.5, aiAccuracy: 0.7, maxReward: 50000, cardTier: 'champions' },
    world_class: { name: 'Мировой Класс', aiSpeed: 1.8, aiAccuracy: 0.85, maxReward: 90000, cardTier: 'toty' },
    legend: { name: 'Легенда', aiSpeed: 2.1, aiAccuracy: 0.94, maxReward: 140000, cardTier: 'chaos' },
    ultimate: { name: 'ULTIMATE', aiSpeed: 2.5, aiAccuracy: 0.98, maxReward: 100000, cardTier: 'ballondor' }
};

const BOT_CARD_POOLS = {
    gold: [
        { name: 'Bugday', rating: 87, pos: 'GK', folder: 'Gold', file: 'Bugday-87.png', ability: 'magnet' },
        { name: 'Selim', rating: 68, pos: 'CB', folder: 'Gold', file: 'Selim-68.png' },
        { name: 'Nazrin', rating: 82, pos: 'CB', folder: 'Gold', file: 'Nazrin-82.png', ability: 'freeze' },
        { name: 'Elcan', rating: 92, pos: 'RW', folder: 'Gold', file: 'Elcan-92.png', ability: 'ghost' },
        { name: 'Turgay', rating: 92, pos: 'ST', folder: 'Gold', file: 'Turqay-92.png', ability: 'power_shot' }
    ],
    champions: [
        { name: 'Bugday', rating: 90, pos: 'GK', folder: 'Champions', file: 'Bugday-90.png', ability: 'magnet' },
        { name: 'Nazrin', rating: 88, pos: 'DF', folder: 'Champions', file: 'Nazrin-88.png', ability: 'freeze' },
        { name: 'Tuncay', rating: 91, pos: 'DF', folder: 'Champions', file: 'Tuncay-91.png', ability: 'push' },
        { name: 'Elcan', rating: 96, pos: 'RW', folder: 'Champions', file: 'Elcan-96.png', ability: 'ghost' },
        { name: 'Turgay', rating: 96, pos: 'ST', folder: 'Champions', file: 'Turqay-96.png', ability: 'power_shot' }
    ],
    toty: [
        { name: 'Bugday', rating: 95, pos: 'GK', folder: 'Toty', file: 'Bugday-95.png', ability: 'magnet' },
        { name: 'Nazrin', rating: 91, pos: 'DF', folder: 'Toty', file: 'Nazrin-91.png', ability: 'freeze' },
        { name: 'Tuncay', rating: 97, pos: 'DF', folder: 'Toty', file: 'Tuncay-97.png', ability: 'push' },
        { name: 'Elcan', rating: 97, pos: 'RW', folder: 'Toty', file: 'Elcan-97.png', ability: 'ghost' },
        { name: 'Turgay', rating: 97, pos: 'ST', folder: 'Toty', file: 'Turgay-97.png', ability: 'power_shot' }
    ],
    chaos: [
        { name: 'Bugday', rating: 99, pos: 'GK', folder: 'CHAOS', file: 'Bugday-99.png', ability: 'magnet' },
        { name: 'Nazrin', rating: 99, pos: 'DF', folder: 'CHAOS', file: 'Nazrin-99.png', ability: 'freeze' },
        { name: 'Tuncay', rating: 99, pos: 'DF', folder: 'CHAOS', file: 'Tuncay-99.png', ability: 'push' },
        { name: 'Elcan', rating: 99, pos: 'RW', folder: 'CHAOS', file: 'Elcan-99.png', ability: 'ghost' },
        { name: 'Turgay', rating: 99, pos: 'ST', folder: 'CHAOS', file: 'Turgay-99.png', ability: 'power_shot' }
    ],
    ballondor: [
        { name: 'Bugday', rating: 105, pos: 'GK', folder: 'GoldenStars', file: 'Bugday-105.png', ability: 'magnet' },
        { name: 'Nazrin', rating: 102, pos: 'CB', folder: 'GoldenStars', file: 'Nazrin-102.png', ability: 'freeze' },
        { name: 'Tuncay', rating: 103, pos: 'CB', folder: 'GoldenStars', file: 'Tuncay-103.png', ability: 'push' },
        { name: 'Elcan', rating: 105, pos: 'CAM', folder: 'GoldenStars', file: 'Elcan-105.png', ability: 'ghost' },
        { name: 'Turgay', rating: 103, pos: 'ST', folder: 'GoldenStars', file: 'Turgay-103.png', ability: 'power_shot' }
    ]
};

const currentDiffKey = localStorage.getItem('rush_difficulty') || 'novice';
const currentDiff = DIFFICULTY_SETTINGS[currentDiffKey];

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
    const defaultNames = ['Elcan', 'Turgay', 'Nazrin', 'Bugday', 'Tuncay'];
    while (filtered.length < 5) {
        filtered.push({ name: defaultNames[filtered.length], rating: 96, number: filtered.length + 1, ability: filtered.length === 0 ? 'ghost' : 'power_shot' });
    }
    return filtered.slice(0, 5);
}

const userPlayersData = getVerifiedSquad();
const botPlayersData = BOT_CARD_POOLS[currentDiff.cardTier];

const HALF_DURATION = 240;
let matchSeconds = 0;
let currentHalf = 1;
let matchInterval;
let halftimeInterval = null;
let homeScore = 0;
let awayScore = 0;
let gameState = 'KICKOFF';

let kickoffState = { active: true, team: 'home', timerEnd: 0 };
const ball = {
    x: 550,
    y: 325,
    vx: 0,
    vy: 0,
    radius: 8,
    friction: 0.96,
    owner: null,
    curveForce: 0,
    curveFrames: 0,
    isElcanShot: false,
    curveDir: 1,
    curveGrowth: 0
};

let lastTouchPlayer = null;
let skillCooldown = 0;
let botTeamAbilityCooldown = 0;
const keys = {};

let isChargingShot = false;
let shotPower = 0;
let isChargingPass = false;
let passPower = 0;
let passPressStartTime = 0;
let botPassCooldown = 0;

function isBallInPenaltyBox() {
    const leftBox = ball.x >= 30 && ball.x <= 195 && ball.y >= 160 && ball.y <= 490;
    const rightBox = ball.x >= 905 && ball.x <= 1070 && ball.y >= 160 && ball.y <= 490;
    return leftBox || rightBox;
}

// --- КЛАСС ИГРОКА ---
class Player {
    constructor(x, y, data, isHome, role, number, basePos) {
        this.x = x;
        this.y = y;
        this.baseX = basePos.x;
        this.baseY = basePos.y;
        this.vx = 0;
        this.vy = 0;
        this.facingAngle = isHome ? 0 : Math.PI;
        this.radius = 34;
        this.data = data || {};
        this.isHome = isHome;
        this.role = role;
        this.number = number;

        const rating = this.data && this.data.rating ? Number(this.data.rating) : 80;
        this.baseSpeed = ((rating / 70) + (isHome ? 1.2 : currentDiff.aiSpeed)) * 0.82;
        this.speedBoost = 1.0;

        this.stunnedUntil = 0;
        this.isGhostUntil = 0;
        this.tackleCooldown = 0;
        this.holdStartTime = 0;
        this.catchCooldown = 0;
        this.hasImg = false;

        if (this.data && this.data.file) {
            this.img = new Image();
            this.img.src = `${this.data.folder}/${this.data.file}`;
            this.img.onload = () => { this.hasImg = true; };
        }
    }

    get speed() {
        const now = Date.now();
        const isGhost = now < this.isGhostUntil;
        const ghostMultiplier = isGhost ? 1.45 : 1.0;
        return this.baseSpeed * this.speedBoost * ghostMultiplier;
    }

    draw(isActive) {
        const now = Date.now();
        ctx.save();

        let isGhost = now < this.isGhostUntil;
        if (isGhost) ctx.globalAlpha = 0.35;

        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 22, 26, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();

        if (now < this.stunnedUntil) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 210, 255, 0.55)';
            ctx.fill();
        }

        if (isGhost) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.fill();
        }

        if (isActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.beginPath();
            let markerY = this.y - this.radius - 26;
            ctx.moveTo(this.x - 9, markerY - 9);
            ctx.lineTo(this.x + 9, markerY - 9);
            ctx.lineTo(this.x, markerY);
            ctx.closePath();
            ctx.fillStyle = '#ffff00';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = this.isHome ? 'rgba(0, 210, 255, 0.35)' : 'rgba(255, 51, 102, 0.35)';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.clip();

        if (this.hasImg) {
            ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = this.isHome ? '#0077ff' : '#e74c3c';
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.number, this.x, this.y);
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = isGhost ? '#00ffff' : (isActive ? '#ffff00' : (this.isHome ? '#00d2ff' : '#ff3366'));
        ctx.lineWidth = 3.5;
        ctx.stroke();

        const displayName = this.data.name || this.data.cardName || this.data.title || '';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        ctx.fillText(`${displayName}`, this.x, this.y - this.radius - 22);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    update() {
        const now = Date.now();
        if (now < this.stunnedUntil) return;

        this.x += this.vx;
        this.y += this.vy;

        if (this === activeUserPlayer && (ball.owner === this || isChargingShot || isChargingPass)) {
            this.facingAngle = getCurrentAimAngle(this);
        } else if (Math.hypot(this.vx, this.vy) > 0.2) {
            this.facingAngle = Math.atan2(this.vy, this.vx);
        }

        this.vx *= 0.8;
        this.vy *= 0.8;

        if (this.role === 'GK') {
            if (this.isHome) {
                this.x = Math.max(35 + this.radius, Math.min(240 - this.radius, this.x));
                this.y = Math.max(180 + this.radius, Math.min(470 - this.radius, this.y));
            } else {
                this.x = Math.max(860 + this.radius, Math.min(1065 - this.radius, this.x));
                this.y = Math.max(180 + this.radius, Math.min(470 - this.radius, this.y));
            }
        } else {
            this.x = Math.max(35 + this.radius, Math.min(1065 - this.radius, this.x));
            this.y = Math.max(35 + this.radius, Math.min(615 - this.radius, this.y));
        }
    }
}

let homeTeam = [];
let awayTeam = [];
let activeUserPlayer = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSkillSound() {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch(e) {}
}

let activeSkillEffects = [];

function createSkillEffect(player, text = 'ABILITY!', color = '#00ffcc') {
    activeSkillEffects.push({
        x: player.x,
        y: player.y,
        player: player,
        radius: player.radius,
        color: color,
        alpha: 1.0,
        text: text,
        textY: player.y - player.radius - 25
    });
}

function drawSkillEffects() {
    for (let i = activeSkillEffects.length - 1; i >= 0; i--) {
        let fx = activeSkillEffects[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(fx.player ? fx.player.x : fx.x, fx.player ? fx.player.y : fx.y, fx.radius, 0, Math.PI * 2);
        ctx.strokeStyle = fx.color;
        ctx.globalAlpha = fx.alpha;
        ctx.lineWidth = 5;
        ctx.stroke();

        if (fx.text) {
            ctx.fillStyle = fx.color;
            ctx.font = '900 16px "Rajdhani", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(fx.text, fx.player ? fx.player.x : fx.x, fx.textY);
            fx.textY -= 0.8;
        }
        ctx.restore();

        fx.radius += 2.2;
        fx.alpha -= 0.035;
        if (fx.alpha <= 0) activeSkillEffects.splice(i, 1);
    }
}

// --- ПРИЦЕЛИВАНИЕ КУРСОРОМ МЫШИ И ОТРИСОВКА ЗАКРУЧЕННОЙ ТРАЕКТОРИИ ---
function getCurrentAimAngle(player) {
    if (joystick.active && (Math.abs(joystick.input.x) > 0.08 || Math.abs(joystick.input.y) > 0.08)) {
        return Math.atan2(joystick.input.y, joystick.input.x);
    }
    return Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
}

// --- ОТРИСОВКА ПЛАВНОЙ БАНАНОВОЙ ТРАЕКТОРИИ (SMOOTH BANANA SHOT) ---
function drawAimingTrajectory() {
    if (!isChargingShot || !ball.owner || ball.owner !== activeUserPlayer) return;

    const player = activeUserPlayer;
    const aimAngle = getCurrentAimAngle(player);
    const powerPercent = shotPower;
    const maxDist = (powerPercent / 100 * 360 + 120);

    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#ff4400';

    const pData = player.data || {};
    const rawName = String(pData.name || pData.cardName || '').toLowerCase();
    const isElcan = rawName.includes('elcan') || rawName.includes('eljan') || pData.ability === 'ghost';
    const isTurgay = rawName.includes('turgay') || rawName.includes('turqay') || pData.ability === 'power_shot';

    const startX = player.x;
    const startY = player.y;

    // Финальная точка прицела (куда указывает курсор / целится игрок)
    const targetX = startX + Math.cos(aimAngle) * maxDist;
    const targetY = startY + Math.sin(aimAngle) * maxDist;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    if (isElcan || isTurgay) {
        // Сторона закрутки: зависит от направления прицеливания (или фиксированная)
        let curveDir = (aimAngle < 0) ? -1 : 1; 
        
        // Сила изгиба (вынос дуги в сторону)
        let curveOffset = isElcan ? 130 : 80;

        // Находим середину между игроком и целью
        let midX = (startX + targetX) / 2;
        let midY = (startY + targetY) / 2;

        // Перпендикулярный угол для создания выпуклой дуги "банана"
        let perpAngle = aimAngle + (Math.PI / 2) * curveDir;

        // Контрольная точка смещена в сторону от прямой
        let controlX = midX + Math.cos(perpAngle) * curveOffset;
        let controlY = midY + Math.sin(perpAngle) * curveOffset;

        // Рисуем одну цельную плавную дугу от ног до цели
        ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
    } else {
        // Прямой удар без подкрутки
        ctx.lineTo(targetX, targetY);
    }

    ctx.stroke();

    // Маркер цели ровно в точке назначения (куда прилетит мяч)
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(targetX, targetY, 14 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 68, 0, 0.4)';
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(targetX - 8, targetY); ctx.lineTo(targetX + 8, targetY);
    ctx.moveTo(targetX, targetY - 8); ctx.lineTo(targetX, targetY + 8);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function triggerSpecialSkill() {
    const now = Date.now();
    if (!activeUserPlayer || now < skillCooldown) return;

    const pData = activeUserPlayer.data || {};
    const rawName = String(pData.name || pData.cardName || pData.title || '').toLowerCase();
    let activated = false;

    if (rawName.includes('elcan') || rawName.includes('eljan') || pData.ability === 'ghost') {
        activeUserPlayer.isGhostUntil = now + 1500;
        createSkillEffect(activeUserPlayer, 'ПРИЗРАК + УСКОРЕНИЕ!', '#00ffff');
        activated = true;
    } else if (rawName.includes('turqay') || rawName.includes('turgay')) {
        if (ball.owner === activeUserPlayer) {
            let aimAngle = getCurrentAimAngle(activeUserPlayer);
            activeUserPlayer.facingAngle = aimAngle;
            activeUserPlayer.catchCooldown = now + 400;
            ball.x = activeUserPlayer.x + Math.cos(aimAngle) * (activeUserPlayer.radius + 12);
            ball.y = activeUserPlayer.y + Math.sin(aimAngle) * (activeUserPlayer.radius + 12);
            ball.owner = null;
            ball.vx = Math.cos(aimAngle) * 38;
            ball.vy = Math.sin(aimAngle) * 38;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
            createSkillEffect(activeUserPlayer, 'ПУШЕЧНЫЙ УДАР!', '#ff9900');
            activated = true;
        }
    } else if (rawName.includes('nazrin')) {
        const opponents = awayTeam;
        opponents.forEach(opp => {
            if (Math.hypot(opp.x - activeUserPlayer.x, opp.y - activeUserPlayer.y) < 230) {
                opp.stunnedUntil = now + 2000;
                if (ball.owner === opp) ball.owner = activeUserPlayer;
            }
        });
        createSkillEffect(activeUserPlayer, 'ЗАМОРОЗКА!', '#00d2ff');
        activated = true;
    } else if (rawName.includes('tuncay')) {
        const opponents = awayTeam;
        opponents.forEach(opp => {
            let dx = opp.x - activeUserPlayer.x;
            let dy = opp.y - activeUserPlayer.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 260 && dist > 0) {
                opp.vx = (dx / dist) * 22;
                opp.vy = (dy / dist) * 22;
                opp.stunnedUntil = now + 1800;
                if (ball.owner === opp) ball.owner = null;
            }
        });
        createSkillEffect(activeUserPlayer, 'ТОЛЧОК!', '#ff3366');
        activated = true;
    } else if (rawName.includes('bugday')) {
        if (isBallInPenaltyBox() && Math.hypot(activeUserPlayer.x - ball.x, activeUserPlayer.y - ball.y) < 320) {
            ball.owner = activeUserPlayer;
            lastTouchPlayer = activeUserPlayer;
            ball.vx = 0; ball.vy = 0;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
            createSkillEffect(activeUserPlayer, 'МАГНИТ!', '#ffff00');
            activated = true;
        }
    }

    if (activated) {
        skillCooldown = now + 8000;
        playSkillSound();
    }
}

function triggerBotAbility(bot) {
    const now = Date.now();
    if (now < botTeamAbilityCooldown || now < bot.stunnedUntil) return;

    const pData = bot.data || {};
    const rawName = String(pData.name || pData.cardName || '').toLowerCase();
    const ability = pData.ability;
    let activated = false;

    if (rawName.includes('elcan') || ability === 'ghost') {
        if (homeTeam.some(p => Math.hypot(p.x - bot.x, p.y - bot.y) < 120)) {
            bot.isGhostUntil = now + 1500;
            createSkillEffect(bot, 'ПРИЗРАК + УСКОРЕНИЕ!', '#00ffff');
            activated = true;
        }
    } else if (rawName.includes('turgay') || ability === 'power_shot') {
        if (ball.owner === bot && bot.x < 480) {
            let angle = Math.atan2(325 - bot.y, 30 - bot.x);
            bot.facingAngle = angle;
            bot.catchCooldown = now + 400;
            ball.x = bot.x + Math.cos(angle) * (bot.radius + 12);
            ball.y = bot.y + Math.sin(angle) * (bot.radius + 12);
            ball.owner = null;
            ball.vx = Math.cos(angle) * 36;
            ball.vy = Math.sin(angle) * 36;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
            createSkillEffect(bot, 'ПУШЕЧНЫЙ УДАР!', '#ff9900');
            activated = true;
        }
    } else if (rawName.includes('nazrin') || ability === 'freeze') {
        if (activeUserPlayer && Math.hypot(activeUserPlayer.x - bot.x, activeUserPlayer.y - bot.y) < 170) {
            activeUserPlayer.stunnedUntil = now + 1800;
            if (ball.owner === activeUserPlayer) ball.owner = bot;
            createSkillEffect(bot, 'ЗАМОРОЗКА!', '#00d2ff');
            activated = true;
        }
    } else if (rawName.includes('tuncay') || ability === 'push') {
        if (activeUserPlayer && Math.hypot(activeUserPlayer.x - bot.x, activeUserPlayer.y - bot.y) < 170) {
            let dx = activeUserPlayer.x - bot.x;
            let dy = activeUserPlayer.y - bot.y;
            let dist = Math.hypot(dx, dy) || 1;
            activeUserPlayer.vx = (dx / dist) * 20;
            activeUserPlayer.vy = (dy / dist) * 20;
            activeUserPlayer.stunnedUntil = now + 1600;
            if (ball.owner === activeUserPlayer) ball.owner = null;
            createSkillEffect(bot, 'ТОЛЧОК!', '#ff3366');
            activated = true;
        }
    } else if (rawName.includes('bugday') || ability === 'magnet') {
        if (isBallInPenaltyBox() && Math.hypot(bot.x - ball.x, bot.y - ball.y) < 260 && !ball.owner) {
            ball.owner = bot;
            lastTouchPlayer = bot;
            ball.vx = 0; ball.vy = 0;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
            createSkillEffect(bot, 'МАГНИТ!', '#ffff00');
            activated = true;
        }
    }

    if (activated) {
        botTeamAbilityCooldown = now + 10000;
        playSkillSound();
    }
}

function initTeams() {
    const homePos = [
        { role: 'GK', x: 70, y: 325, num: 1 },
        { role: 'DF', x: 260, y: 180, num: 2 },
        { role: 'DF', x: 260, y: 470, num: 3 },
        { role: 'MF', x: 450, y: 325, num: 8 },
        { role: 'FW', x: 530, y: 325, num: 10 }
    ];

    homeTeam = homePos.map((p, i) => new Player(p.x, p.y, userPlayersData[i], true, p.role, p.num, p));
    activeUserPlayer = homeTeam[3];

    const awayPos = [
        { role: 'GK', x: 1030, y: 325, num: 1 },
        { role: 'DF', x: 840, y: 180, num: 4 },
        { role: 'DF', x: 840, y: 470, num: 5 },
        { role: 'MF', x: 650, y: 325, num: 6 },
        { role: 'FW', x: 570, y: 325, num: 9 }
    ];

    awayTeam = awayPos.map((p, i) => new Player(p.x, p.y, botPlayersData[i], false, p.role, p.num, p));
}

function resolvePlayerCollisions() {
    const now = Date.now();
    const all = [...homeTeam, ...awayTeam];
    for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
            let p1 = all[i];
            let p2 = all[j];
            if (now < p1.isGhostUntil || now < p2.isGhostUntil) continue;

            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist = Math.hypot(dx, dy);
            let minDist = p1.radius + p2.radius + 2;

            if (dist < minDist) {
                if (dist === 0) { dx = 1; dy = 0; dist = 1; }
                let overlap = minDist - dist;
                let nx = dx / dist;
                let ny = dy / dist;

                p1.x -= nx * (overlap / 2);
                p1.y -= ny * (overlap / 2);
                p2.x += nx * (overlap / 2);
                p2.y += ny * (overlap / 2);
            }
        }
    }
}

function switchUserPlayer() {
    if (ball.owner === activeUserPlayer) return;
    let currentIndex = homeTeam.indexOf(activeUserPlayer);
    let nextIndex = (currentIndex + 1) % homeTeam.length;
    activeUserPlayer = homeTeam[nextIndex];
}

function autoSwitchToClosestPlayer() {
    if (ball.owner) return;
    let closest = null;
    let minDist = Infinity;

    homeTeam.forEach(p => {
        if (Date.now() > p.stunnedUntil) {
            let d = Math.hypot(p.x - ball.x, p.y - ball.y);
            if (d < minDist) { minDist = d; closest = p; }
        }
    });

    if (closest && closest !== activeUserPlayer) activeUserPlayer = closest;
}

function executeTackle(player) {
    const now = Date.now();
    if (now < player.tackleCooldown || now < player.stunnedUntil) return;

    player.tackleCooldown = now + 15000;
    let angle = player.facingAngle;
    player.vx = Math.cos(angle) * 15;
    player.vy = Math.sin(angle) * 15;

    const opponents = player.isHome ? awayTeam : homeTeam;
    opponents.forEach(opp => {
        if (opp.role === 'GK' && ball.owner === opp) return;
        if (now < opp.isGhostUntil) return;

        if (Math.hypot(opp.x - player.x, opp.y - player.y) < 60) {
            opp.stunnedUntil = now + 1000;
            createSkillEffect(opp, 'ЗАМОРОЗЕН!', '#00d2ff');
            if (ball.owner === opp) {
                ball.owner = player;
                lastTouchPlayer = player;
                ball.isElcanShot = false;
                ball.curveForce = 0;
                ball.curveFrames = 0;
                if (player.isHome) activeUserPlayer = player;
            }
        }
    });
}

function clearanceKick(gk) {
    const targetX = gk.isHome ? 1070 : 30;
    const targetY = 325 + (Math.random() * 160 - 80);

    const angle = Math.atan2(targetY - gk.y, targetX - gk.x);
    const clearancePower = 20;

    gk.facingAngle = angle;
    gk.catchCooldown = Date.now() + 600;

    ball.x = gk.x + Math.cos(angle) * (gk.radius + 12);
    ball.y = gk.y + Math.sin(angle) * (gk.radius + 12);
    ball.owner = null;

    ball.vx = Math.cos(angle) * clearancePower;
    ball.vy = Math.sin(angle) * clearancePower;
    ball.isElcanShot = false;
    ball.curveForce = 0;
    ball.curveFrames = 0;

    createSkillEffect(gk, 'ВЫНОС!', '#ffffff');
}

function updateGK(gk) {
    const now = Date.now();

    if (gk.isHome) {
        gk.holdStartTime = 0;
        gk.update();
        return;
    }

    if (ball.owner === gk) {
        if (!gk.holdStartTime) gk.holdStartTime = now;
        if (now - gk.holdStartTime > 800) {
            clearanceKick(gk);
            gk.holdStartTime = 0;
        }
        gk.update();
        return;
    } else {
        gk.holdStartTime = 0;
    }

    const goalCenterY = 325;
    const goalTopY = 170;
    const goalBottomY = 480;

    const ballSpeed = Math.hypot(ball.vx, ball.vy);
    const distToBall = Math.hypot(gk.x - ball.x, gk.y - ball.y);

    let baseLineX = 1025;
    let maxAdvanceX = 925;
    let advanceRatio = Math.max(0, Math.min(1, (ball.x - 780) / 250));

    let targetX = baseLineX - advanceRatio * (baseLineX - maxAdvanceX);
    let goalYTarget = goalCenterY + (ball.y - goalCenterY) * 0.65;
    goalYTarget = Math.max(goalTopY + gk.radius, Math.min(goalBottomY - gk.radius, goalYTarget));

    let shuffleY = Math.sin(now * 0.008) * 18;
    let shuffleX = Math.cos(now * 0.006) * 10;

    let isShotHeadingToGoal = (ball.vx > 3.0 && ball.x > 500);

    if (isShotHeadingToGoal) {
        let steps = (ball.x - gk.x) / (Math.abs(ball.vx) + 0.1);
        let predictedY = ball.y + ball.vy * Math.max(0, steps);
        predictedY = Math.max(goalTopY, Math.min(goalBottomY, predictedY));

        let dx = targetX - gk.x;
        let dy = predictedY - gk.y;
        let d = Math.hypot(dx, dy) || 1;
        let reactSpeed = gk.speed * 1.8 * currentDiff.aiSpeed;

        gk.vx = (dx / d) * reactSpeed;
        gk.vy = (dy / d) * reactSpeed;
    } else if (distToBall < 160 && !ball.owner && now > gk.catchCooldown) {
        let dx = ball.x - gk.x;
        let dy = ball.y - gk.y;
        let d = Math.hypot(dx, dy) || 1;
        let chargeSpeed = gk.speed * 1.4;

        gk.vx = (dx / d) * chargeSpeed;
        gk.vy = (dy / d) * chargeSpeed;
    } else {
        let finalTargetX = targetX + shuffleX;
        let finalTargetY = goalYTarget + shuffleY;

        let dx = finalTargetX - gk.x;
        let dy = finalTargetY - gk.y;

        gk.vx = dx * 0.22;
        gk.vy = dy * 0.25;
    }

    let catchRadius = (ballSpeed > 22) ? (gk.radius + 12) : (gk.radius + 26);
    if (distToBall < catchRadius && !ball.owner && now > gk.catchCooldown) {
        if (ballSpeed > 24) {
            ball.vx = -ball.vx * 0.45;
            ball.vy = (Math.random() - 0.5) * 14;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
            createSkillEffect(gk, 'СЕЙВ!', '#ffffff');
        } else {
            ball.owner = gk;
            lastTouchPlayer = gk;
            ball.vx = 0; ball.vy = 0;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
            gk.holdStartTime = now;
        }
    }

    gk.update();
}

function updateAI() {
    const now = Date.now();

    homeTeam.forEach(p => {
        if (p === activeUserPlayer || p.role === 'GK') return;
        let targetX = p.baseX + (ball.x - 550) * 0.3;
        let targetY = p.baseY + (ball.y - 325) * 0.2;

        if (ball.owner && ball.owner.isHome) {
            if (p.role === 'FW') { targetX += 170; targetY += (ball.y < 325 ? 50 : -50); }
            if (p.role === 'MF') targetX += 110;
            if (p.role === 'DF') targetX += 45;
        } else if (ball.owner && !ball.owner.isHome) {
            targetX -= 40;
        }

        let dx = targetX - p.x;
        let dy = targetY - p.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 15) {
            p.vx = (dx / dist) * (p.speed * 0.8);
            p.vy = (dy / dist) * (p.speed * 0.8);
        }
        p.update();
    });

    updateGK(homeTeam[0]);
    updateGK(awayTeam[0]);

    let botField = awayTeam.filter(p => p.role !== 'GK' && now > p.stunnedUntil);
    let presser = null;
    let minDist = Infinity;

    botField.forEach(b => {
        let d = Math.hypot(b.x - ball.x, b.y - ball.y);
        if (d < minDist) { minDist = d; presser = b; }
    });

    botField.forEach(bot => {
        triggerBotAbility(bot);

        if (ball.owner === bot) {
            if (bot.x < 380 && Math.random() < 0.07 * currentDiff.aiAccuracy) {
                let goalY = 210 + Math.random() * 230;
                let angle = Math.atan2(goalY - bot.y, 30 - bot.x);
                bot.facingAngle = angle;
                bot.catchCooldown = now + 400;

                ball.x = bot.x + Math.cos(angle) * (bot.radius + 12);
                ball.y = bot.y + Math.sin(angle) * (bot.radius + 12);
                ball.owner = null;

                ball.vx = Math.cos(angle) * 22;
                ball.vy = Math.sin(angle) * 22;

                const pData = bot.data || {};
                const rawName = String(pData.name || pData.cardName || '').toLowerCase();
                const isElcan = rawName.includes('elcan') || rawName.includes('eljan') || pData.ability === 'ghost';
                const isTurgay = rawName.includes('turgay') || rawName.includes('turqay') || pData.ability === 'power_shot';
                let curveDir = (angle < 0) ? -1 : 1;

                if (isElcan) {
                    ball.isElcanShot = true;
                    ball.curveDir = curveDir;
                    ball.curveForce = 0;
                    ball.curveGrowth = 0.028;
                    ball.curveFrames = 50;
                } else if (isTurgay) {
                    ball.isElcanShot = false;
                    ball.curveForce = curveDir * 0.55;
                    ball.curveFrames = 35;
                } else {
                    ball.isElcanShot = false;
                    ball.curveForce = (Math.random() - 0.5) * 0.2;
                    ball.curveFrames = 20;
                }
                return;
            }

            if (now > botPassCooldown && Math.random() < 0.05 * currentDiff.aiAccuracy) {
                let openTeammates = awayTeam.filter(t => t !== bot && t.x < bot.x && now > t.stunnedUntil);
                if (openTeammates.length > 0) {
                    let target = openTeammates[Math.floor(Math.random() * openTeammates.length)];
                    let angle = Math.atan2(target.y - bot.y, target.x - bot.x);
                    bot.facingAngle = angle;
                    bot.catchCooldown = now + 400;

                    ball.x = bot.x + Math.cos(angle) * (bot.radius + 12);
                    ball.y = bot.y + Math.sin(angle) * (bot.radius + 12);
                    ball.owner = null;

                    ball.vx = Math.cos(angle) * 14;
                    ball.vy = Math.sin(angle) * 14;
                    ball.isElcanShot = false;
                    ball.curveForce = 0;
                    ball.curveFrames = 0;
                    botPassCooldown = now + 900;
                    return;
                }
            }

            let angle = Math.atan2(325 - bot.y, 35 - bot.x);
            bot.vx = Math.cos(angle) * (bot.speed * 1.05);
            bot.vy = Math.sin(angle) * (bot.speed * 1.05);

        } else if (bot === presser) {
            if (ball.owner && ball.owner.role === 'GK') {
                bot.vx = 0; bot.vy = 0;
            } else {
                let angle = Math.atan2(ball.y - bot.y, ball.x - bot.x);
                bot.vx = Math.cos(angle) * (bot.speed * 1.1);
                bot.vy = Math.sin(angle) * (bot.speed * 1.1);

                if (minDist < 52 && Math.random() < 0.07 * currentDiff.aiAccuracy) {
                    executeTackle(bot);
                }
            }
        } else {
            let targetX = bot.baseX + (ball.x - 550) * 0.25;
            let targetY = bot.baseY + (ball.y - 325) * 0.25;

            let dx = targetX - bot.x;
            let dy = targetY - bot.y;
            let dist = Math.hypot(dx, dy);

            if (dist > 15) {
                bot.vx = (dx / dist) * (bot.speed * 0.85);
                bot.vy = (dy / dist) * (bot.speed * 0.85);
            }
        }
        bot.update();
    });
}

function executeKickoffPass(team) {
    if (gameState !== 'KICKOFF') return;
    gameState = 'PLAYING';
    kickoffState.active = false;

    let kicker = (team === 'home') ? homeTeam[3] : awayTeam[3];
    let teammates = (team === 'home') ? homeTeam.filter(p => p !== kicker && p.role !== 'GK') : awayTeam.filter(p => p !== kicker && p.role !== 'GK');
    let target = teammates[0];

    let angle = Math.atan2(target.y - kicker.y, target.x - kicker.x);
    kicker.facingAngle = angle;
    kicker.catchCooldown = Date.now() + 400;

    ball.x = kicker.x + Math.cos(angle) * (kicker.radius + 12);
    ball.y = kicker.y + Math.sin(angle) * (kicker.radius + 12);
    ball.owner = null;

    ball.vx = Math.cos(angle) * 13;
    ball.vy = Math.sin(angle) * 13;
    ball.isElcanShot = false;
    ball.curveForce = 0;
    ball.curveFrames = 0;
}

function startPassCharge() {
    if (gameState === 'KICKOFF') {
        if (kickoffState.team === 'home') executeKickoffPass('home');
        return;
    }
    if (!ball.owner || ball.owner !== activeUserPlayer) return;
    isChargingPass = true;
    passPower = 0;
    passPressStartTime = Date.now();
    const bar = document.getElementById('power-bar-container');
    if (bar) bar.style.display = 'block';
}

function releasePass() {
    if (gameState === 'KICKOFF') {
        if (kickoffState.team === 'home') executeKickoffPass('home');
        return;
    }

    if (!isChargingPass) return;
    isChargingPass = false;
    const bar = document.getElementById('power-bar-container');
    if (bar) bar.style.display = 'none';

    if (ball.owner !== activeUserPlayer) return;

    const player = activeUserPlayer;
    let passAngle = getCurrentAimAngle(player);

    player.facingAngle = passAngle;
    player.catchCooldown = Date.now() + 400;

    ball.x = player.x + Math.cos(passAngle) * (player.radius + 12);
    ball.y = player.y + Math.sin(passAngle) * (player.radius + 12);
    ball.owner = null;

    let powerSpeed = (passPower / 100) * 14 + 10;

    ball.vx = Math.cos(passAngle) * powerSpeed;
    ball.vy = Math.sin(passAngle) * powerSpeed;
    ball.isElcanShot = false;
    ball.curveForce = 0;
    ball.curveFrames = 0;
}

function startShotCharge() {
    if (gameState === 'KICKOFF') return;
    if (!ball.owner || ball.owner !== activeUserPlayer) return;
    isChargingShot = true;
    shotPower = 0;
    const bar = document.getElementById('power-bar-container');
    if (bar) bar.style.display = 'block';
}

function releaseShot() {
    if (!isChargingShot) return;
    isChargingShot = false;
    const bar = document.getElementById('power-bar-container');
    if (bar) bar.style.display = 'none';

    if (ball.owner === activeUserPlayer) {
        const player = activeUserPlayer;
        let shotAngle = getCurrentAimAngle(player);

        player.facingAngle = shotAngle;
        player.catchCooldown = Date.now() + 400;

        ball.x = player.x + Math.cos(shotAngle) * (player.radius + 12);
        ball.y = player.y + Math.sin(shotAngle) * (player.radius + 12);
        ball.owner = null;

        let pwr = (shotPower / 100) * 26 + 12;

        if (shotPower > 70) {
            createSkillEffect(player, 'ПУШЕЧНЫЙ УДАР!', '#ff4400');
        }

        ball.vx = Math.cos(shotAngle) * pwr;
        ball.vy = Math.sin(shotAngle) * pwr;

        const pData = player.data || {};
        const rawName = String(pData.name || pData.cardName || '').toLowerCase();
        const isElcan = rawName.includes('elcan') || rawName.includes('eljan') || pData.ability === 'ghost';
        const isTurgay = rawName.includes('turgay') || rawName.includes('turqay') || pData.ability === 'power_shot';
        let curveDir = (shotAngle < 0) ? -1 : 1;

        if (isElcan) {
            ball.isElcanShot = true;
            ball.curveDir = curveDir;
            ball.curveForce = 0;
            ball.curveGrowth = 0.028;
            ball.curveFrames = 50;
        } else if (isTurgay) {
            ball.isElcanShot = false;
            ball.curveForce = curveDir * 0.55;
            ball.curveFrames = 35;
        } else {
            ball.isElcanShot = false;
            ball.curveForce = (Math.random() - 0.5) * 0.18;
            ball.curveFrames = 22;
        }
    }
}

function gameLoop() {
    if (gameState === 'KICKOFF') {
        if (kickoffState.team === 'home' && Date.now() >= kickoffState.timerEnd) {
            executeKickoffPass('home');
        }
    } else if (gameState === 'PLAYING') {
        let moveX = joystick.input.x;
        let moveY = joystick.input.y;

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
        resolvePlayerCollisions();

        if (ball.owner) {
            let distOffset = ball.owner.radius + 4;
            ball.x = ball.owner.x + Math.cos(ball.owner.facingAngle) * distOffset;
            ball.y = ball.owner.y + Math.sin(ball.owner.facingAngle) * distOffset;
            ball.vx = 0; ball.vy = 0;
            ball.isElcanShot = false;
            ball.curveForce = 0;
            ball.curveFrames = 0;
        } else {
            if (ball.curveFrames > 0) {
                const currentSpeed = Math.hypot(ball.vx, ball.vy);
                let currentAngle = Math.atan2(ball.vy, ball.vx);

                if (ball.isElcanShot) {
                    ball.curveForce += ball.curveGrowth * ball.curveDir;
                    currentAngle += ball.curveForce * 0.04;
                } else {
                    currentAngle += ball.curveForce * 0.04;
                }

                ball.vx = Math.cos(currentAngle) * currentSpeed;
                ball.vy = Math.sin(currentAngle) * currentSpeed;
                ball.curveFrames--;
            }

            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.vx *= ball.friction;
            ball.vy *= ball.friction;

            autoSwitchToClosestPlayer();

            const now = Date.now();
            [...homeTeam, ...awayTeam].forEach(p => {
                if (now < p.stunnedUntil || now < p.catchCooldown) return;
                let d = Math.hypot(p.x - ball.x, p.y - ball.y);
                if (d < p.radius + 12) {
                    ball.owner = p;
                    lastTouchPlayer = p;
                    ball.isElcanShot = false;
                    ball.curveForce = 0;
                    ball.curveFrames = 0;
                    if (p.isHome) activeUserPlayer = p;
                }
            });

            if (ball.y < 35 || ball.y > 615) ball.vy *= -1;

            if (ball.x < 35 || ball.x > 1065) {
                if (ball.y < 200 || ball.y > 450) {
                    ball.vx *= -1;
                } else {
                    if (ball.x < 35) handleGoal('away');
                    else handleGoal('home');
                }
            }
        }

        const fill = document.getElementById('power-bar-fill');
        if (isChargingShot) {
            shotPower = Math.min(100, shotPower + 3.5);
            if (fill) fill.style.width = shotPower + '%';
        } else if (isChargingPass) {
            passPower = Math.min(100, passPower + 4);
            if (fill) fill.style.width = passPower + '%';
        }
    }

    render();
    requestAnimationFrame(gameLoop);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stripeWidth = 65;
    for (let x = 0; x < canvas.width; x += stripeWidth) {
        ctx.fillStyle = (Math.floor(x / stripeWidth) % 2 === 0) ? '#1d4d2d' : '#174025';
        ctx.fillRect(x, 0, stripeWidth, canvas.height);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1040, 590);

    ctx.beginPath();
    ctx.moveTo(550, 30); ctx.lineTo(550, 620);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(550, 325, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeRect(30, 160, 165, 330);
    ctx.strokeRect(905, 160, 165, 330);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(10, 200, 20, 250);
    ctx.strokeRect(10, 200, 20, 250);
    ctx.fillRect(1070, 200, 20, 250);
    ctx.strokeRect(1070, 200, 20, 250);

    homeTeam.forEach(p => p.draw(p === activeUserPlayer));
    awayTeam.forEach(p => p.draw(false));

    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + 5, ball.radius, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawAimingTrajectory();
    drawSkillEffects();
    joystick.draw(ctx);
}

function handleGoal(scoringTeam) {
    if (gameState === 'GOAL_ANIMATION') return;
    gameState = 'GOAL_ANIMATION';

    if (scoringTeam === 'home') homeScore++; else awayScore++;
    const homeEl = document.getElementById('home-score');
    const awayEl = document.getElementById('away-score');
    if (homeEl) homeEl.innerText = homeScore;
    if (awayEl) awayEl.innerText = awayScore;

    const overlay = document.getElementById('goal-overlay');
    const teamBanner = document.getElementById('goal-team-banner');
    const cardBox = document.getElementById('goal-card-container');
    const scorerName = document.getElementById('goal-scorer-name');

    let scorer = lastTouchPlayer;
    if (!scorer || (scoringTeam === 'home' ? !scorer.isHome : scorer.isHome)) {
        scorer = scoringTeam === 'home' ? homeTeam[4] : awayTeam[4];
    }

    if (scoringTeam === 'home') {
        teamBanner.innerText = "ВЫ ЗАБИЛИ ГОЛ!";
        teamBanner.style.color = "#00ff88";
    } else {
        teamBanner.innerText = "ПРОПУЩЕННЫЙ ГОЛ!";
        teamBanner.style.color = "#ff3366";
    }

    if (cardBox) {
        if (scorer && scorer.hasImg) {
            cardBox.innerHTML = `<img src="${scorer.data.folder}/${scorer.data.file}" style="width:140px; height:auto; display:block;">`;
        } else {
            cardBox.innerHTML = `<div style="width:120px; height:160px; background:#222; border:2px solid #ffcc00; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:24px;">${scorer ? scorer.number : ''}</div>`;
        }
    }

    if (scorerName) {
        const sData = scorer && scorer.data ? scorer.data : {};
        scorerName.innerText = sData.name || sData.cardName || sData.title || '';
    }

    if (overlay) overlay.style.display = 'flex';

    const concedingTeam = (scoringTeam === 'home') ? 'away' : 'home';
    setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
        resetPositions(concedingTeam);
    }, 3000);
}

function resetPositions(kickoffTeam = 'home') {
    ball.x = 550; ball.y = 325; ball.vx = 0; ball.vy = 0;
    ball.isElcanShot = false; ball.curveForce = 0; ball.curveFrames = 0;
    lastTouchPlayer = null;

    if (kickoffTeam === 'home') {
        homeTeam[3].x = 540; homeTeam[3].y = 325;
        homeTeam[0].x = 70;  homeTeam[0].y = 325;
        homeTeam[1].x = 240; homeTeam[1].y = 180;
        homeTeam[2].x = 240; homeTeam[2].y = 470;
        homeTeam[4].x = 410; homeTeam[4].y = 325;

        awayTeam[0].x = 1030; awayTeam[0].y = 325;
        awayTeam[1].x = 840;  awayTeam[1].y = 180;
        awayTeam[2].x = 840;  awayTeam[2].y = 470;
        awayTeam[3].x = 670;  awayTeam[3].y = 250;
        awayTeam[4].x = 670;  awayTeam[4].y = 400;

        ball.owner = homeTeam[3];
        activeUserPlayer = homeTeam[3];
    } else {
        awayTeam[3].x = 560; awayTeam[3].y = 325;
        awayTeam[0].x = 1030; awayTeam[0].y = 325;
        awayTeam[1].x = 840;  awayTeam[1].y = 180;
        awayTeam[2].x = 840;  awayTeam[2].y = 470;
        awayTeam[4].x = 680;  awayTeam[4].y = 325;

        homeTeam[0].x = 70;  homeTeam[0].y = 325;
        homeTeam[1].x = 240; homeTeam[1].y = 180;
        homeTeam[2].x = 240; homeTeam[2].y = 470;
        homeTeam[3].x = 430; homeTeam[3].y = 250;
        homeTeam[4].x = 430; homeTeam[4].y = 400;

        ball.owner = awayTeam[3];
        activeUserPlayer = homeTeam[3];

        setTimeout(() => {
            if (gameState === 'KICKOFF' && kickoffState.team === 'away') executeKickoffPass('away');
        }, 1000);
    }

    [...homeTeam, ...awayTeam].forEach(p => {
        p.vx = 0; p.vy = 0;
        p.stunnedUntil = 0; p.isGhostUntil = 0; p.speedBoost = 1.0; p.holdStartTime = 0; p.catchCooldown = 0;
    });

    gameState = 'KICKOFF';
    kickoffState.active = true;
    kickoffState.team = kickoffTeam;
    kickoffState.timerEnd = Date.now() + 5000;
}

function showHalftimeOverlay() {
    gameState = 'HALF_TIME';

    let overlay = document.getElementById('halftime-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'halftime-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;color:#fff;font-family:"Rajdhani",sans-serif;';
        document.body.appendChild(overlay);
    }

    let remainingTime = 60;
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div style="background:#111827;padding:35px 50px;border-radius:20px;border:3px solid #00d2ff;text-align:center;box-shadow:0 0 30px rgba(0,210,255,0.5);max-width:420px;width:90%;">
            <h2 style="font-size:36px;margin:0 0 10px;color:#00d2ff;letter-spacing:1px;">ПЕРЕРЫВ</h2>
            <p style="font-size:20px;margin:15px 0 25px;color:#e2e8f0;">Игра начнётся через: <b id="ht-sec" style="color:#ffff00;font-size:28px;">60</b> сек.</p>
            <button id="btn-resume-match" style="background:#00ff88;color:#000;border:none;padding:14px 32px;font-size:20px;font-weight:900;border-radius:10px;cursor:pointer;width:100%;box-shadow:0 0 15px rgba(0,255,136,0.4);transition:transform 0.1s;">ПРОДОЛЖИТЬ ИГРУ</button>
        </div>
    `;

    halftimeInterval = setInterval(() => {
        remainingTime--;
        const timerEl = document.getElementById('ht-sec');
        if (timerEl) timerEl.innerText = remainingTime;

        if (remainingTime <= 0) resumeFromHalftime();
    }, 1000);

    const btnResume = document.getElementById('btn-resume-match');
    if (btnResume) btnResume.onclick = resumeFromHalftime;
}

function resumeFromHalftime() {
    if (halftimeInterval) {
        clearInterval(halftimeInterval);
        halftimeInterval = null;
    }
    const overlay = document.getElementById('halftime-overlay');
    if (overlay) overlay.style.display = 'none';

    currentHalf = 2;
    resetPositions('away');
}

function updateTimerUI() {
    const timerEl = document.getElementById('match-timer');
    if (!timerEl) return;
    const mins = Math.floor(matchSeconds / 60).toString().padStart(2, '0');
    const secs = (matchSeconds % 60).toString().padStart(2, '0');
    timerEl.innerText = `${mins}:${secs}`;
}

function startTimer() {
    matchInterval = setInterval(() => {
        if (gameState !== 'PLAYING') return;

        matchSeconds++;
        updateTimerUI();

        if (matchSeconds >= HALF_DURATION && currentHalf === 1) {
            showHalftimeOverlay();
        } else if (matchSeconds >= HALF_DURATION * 2 && currentHalf === 2) {
            clearInterval(matchInterval);
            finishMatch();
        }
    }, 1000);
}

function finishMatch() {
    gameState = 'FINISHED';
    let reward = 0;
    if (homeScore > awayScore) {
        reward = currentDiff.maxReward;
    } else if (homeScore === awayScore) {
        reward = Math.floor(currentDiff.maxReward * 0.4);
    } else {
        reward = Math.floor(currentDiff.maxReward * 0.1);
    }

    updateBalance(reward);
    alert(`Матч окончен!\nСчет: ${homeScore} - ${awayScore}\nНаграда: ${reward} монет`);
    window.location.href = 'index.html';
}

// --- СИСТЕМА УПРАВЛЕНИЯ КЛАВИАТУРОЙ ---
function setupControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Space') triggerSpecialSkill(); 
        if (e.code === 'ShiftLeft') executeTackle(activeUserPlayer); 
        if (e.code === 'CapsLock') {
            e.preventDefault();
            switchUserPlayer(); 
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    const btnShot = document.getElementById('btn-shot');
    const btnPass = document.getElementById('btn-pass');
    const btnSkill = document.getElementById('btn-skill');
    const btnSwitch = document.getElementById('btn-switch');
    const btnTackle = document.getElementById('btn-tackle');

    if (btnShot) {
        btnShot.addEventListener('mousedown', startShotCharge);
        btnShot.addEventListener('mouseup', releaseShot);
        btnShot.addEventListener('touchstart', (e) => { e.preventDefault(); startShotCharge(); });
        btnShot.addEventListener('touchend', (e) => { e.preventDefault(); releaseShot(); });
    }

    if (btnPass) {
        btnPass.addEventListener('mousedown', startPassCharge);
        btnPass.addEventListener('mouseup', releasePass);
        btnPass.addEventListener('touchstart', (e) => { e.preventDefault(); startPassCharge(); });
        btnPass.addEventListener('touchend', (e) => { e.preventDefault(); releasePass(); });
    }

    if (btnSkill) {
        btnSkill.addEventListener('click', triggerSpecialSkill);
        btnSkill.addEventListener('touchstart', (e) => { e.preventDefault(); triggerSpecialSkill(); });
    }

    if (btnSwitch) {
        btnSwitch.addEventListener('click', switchUserPlayer);
        btnSwitch.addEventListener('touchstart', (e) => { e.preventDefault(); switchUserPlayer(); });
    }

    if (btnTackle) {
        btnTackle.addEventListener('click', () => executeTackle(activeUserPlayer));
        btnTackle.addEventListener('touchstart', (e) => { e.preventDefault(); executeTackle(activeUserPlayer); });
    }
}

function init() {
    initTeams();
    setupControls();
    startTimer();
    resetPositions('home');
    requestAnimationFrame(gameLoop);
}

init();