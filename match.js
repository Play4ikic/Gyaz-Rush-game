import { updateBalance } from './economy.js';

const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');

const DIFFICULTY_SETTINGS = {
    novice: { name: 'Новичок', aiSpeed: 1.1, aiAccuracy: 0.5, maxReward: 20000, cardTier: 'gold' },
    pro: { name: 'Профессионал', aiSpeed: 1.4, aiAccuracy: 0.7, maxReward: 50000, cardTier: 'champions' },
    world_class: { name: 'Мировой Класс', aiSpeed: 1.7, aiAccuracy: 0.85, maxReward: 90000, cardTier: 'toty' },
    legend: { name: 'Легенда', aiSpeed: 2.0, aiAccuracy: 0.94, maxReward: 140000, cardTier: 'chaos' },
    ultimate: { name: 'ULTIMATE', aiSpeed: 2.3, aiAccuracy: 1.0, maxReward: 200000, cardTier: 'ballondor' }
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
        { name: 'Turgay', rating: 97, pos: 'ST', folder: 'Toty', file: 'Turgay-97.png' }
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

const HALF_DURATION = 240;
let matchSeconds = 0;
let currentHalf = 1;
let matchInterval;
let htTimerInterval;
let homeScore = 0;
let awayScore = 0;
let gameState = 'PLAYING';

const ball = { 
    x: 550, y: 325, vx: 0, vy: 0, radius: 8, friction: 0.96, 
    owner: null 
};

let lastTouchPlayer = null; // Фиксация последнего касания для автора гола

const joystickDir = { x: 0, y: 0 };
const keys = {};

let isChargingShot = false;
let shotPower = 0;
let isChargingPass = false;
let passPower = 0;
let passPressStartTime = 0;

let botPassCooldown = 0;
let gkHoldStartTime = 0;

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
        this.data = data;
        this.isHome = isHome;
        this.role = role;
        this.number = number;

        const rating = data && data.rating ? Number(data.rating) : 80;
        this.speed = ((rating / 70) + (isHome ? 1.2 : currentDiff.aiSpeed)) * 0.82;

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

        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 22, 26, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();

        if (now < this.stunnedUntil) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = this.isHome ? 'rgba(0, 210, 255, 0.35)' : 'rgba(255, 51, 102, 0.35)';
        ctx.fill();

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
        ctx.restore();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = this.isHome ? '#00d2ff' : '#ff3366';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.beginPath();
        let markerY = this.y - this.radius - 16;
        ctx.moveTo(this.x - 7, markerY - 8);
        ctx.lineTo(this.x + 7, markerY - 8);
        ctx.lineTo(this.x, markerY);
        ctx.closePath();
        ctx.fillStyle = this.isHome ? '#00ff88' : '#ff3366';
        ctx.fill();

        if (isActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(this.facingAngle) * (this.radius + 2), this.y + Math.sin(this.facingAngle) * (this.radius + 2));
            ctx.lineTo(this.x + Math.cos(this.facingAngle) * (this.radius + 20), this.y + Math.sin(this.facingAngle) * (this.radius + 20));
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(`${this.data.name} (${this.data.rating})`, this.x, this.y - this.radius - 22);
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

        if (this.role === 'GK') {
            if (this.isHome) {
                this.x = Math.max(35 + this.radius, Math.min(195 - this.radius, this.x));
                this.y = Math.max(160 + this.radius, Math.min(490 - this.radius, this.y));
            } else {
                this.x = Math.max(905 + this.radius, Math.min(1065 - this.radius, this.x));
                this.y = Math.max(160 + this.radius, Math.min(490 - this.radius, this.y));
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

// СОЗДАНИЕ ДИНАМИЧЕСКИХ ОКН АНИМАЦИИ И ПЕРЕРЫВА
function createUIOverlays() {
    if (!document.getElementById('goal-overlay')) {
        const goalHtml = `
        <div id="goal-overlay" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:999; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(10px);">
            <h1 style="font-size: 60px; color: #ffcc00; text-shadow: 0 0 25px #ffcc00, 0 0 50px #ff0055; margin-bottom: 20px; font-weight:900; letter-spacing:4px; animation: goalTextAnim 0.8s infinite alternate;">ГООООЛ!</h1>
            <div id="goal-card-container" style="transform: scale(1.15); box-shadow: 0 0 40px rgba(255,204,0,0.8); border-radius:15px; overflow:hidden;"></div>
            <h2 id="goal-scorer-name" style="margin-top:20px; font-size: 28px; color:#fff; text-shadow: 0 2px 10px #000; font-weight:bold;"></h2>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', goalHtml);
    }

    if (!document.getElementById('halftime-overlay')) {
        const htHtml = `
        <div id="halftime-overlay" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(8,10,15,0.92); z-index:999; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(8px);">
            <h1 style="font-size: 36px; color: #00d2ff; font-weight:900; margin-bottom:12px; letter-spacing:1px;">ПЕРЕРЫВ МАТЧА</h1>
            <p style="font-size: 18px; color: #aaa; margin-bottom: 25px;">Второй тайм начнется через: <span id="ht-timer" style="color:#00ff88; font-weight:bold;">60</span> сек</p>
            <button id="btn-resume-half" style="padding: 14px 36px; background: linear-gradient(135deg, #00ff88, #00b359); border:none; border-radius:30px; color:#000; font-weight:900; font-size:16px; cursor:pointer; box-shadow: 0 5px 20px rgba(0,255,136,0.4); transition: transform 0.2s;">ПРОДОЛЖИТЬ МАТЧ</button>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', htHtml);
    }

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes goalTextAnim {
            0% { transform: scale(0.95); text-shadow: 0 0 15px #ffcc00; }
            100% { transform: scale(1.08); text-shadow: 0 0 35px #ff0055, 0 0 50px #ffcc00; }
        }
    `;
    document.head.appendChild(style);
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
    const all = [...homeTeam, ...awayTeam];
    for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
            let p1 = all[i];
            let p2 = all[j];

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
    let currentIndex = homeTeam.indexOf(activeUserPlayer);
    let nextIndex = (currentIndex + 1) % homeTeam.length;
    activeUserPlayer = homeTeam[nextIndex];
}

// АВТОМАТИЧЕСКОЕ ПЕРЕКЛЮЧЕНИЕ НА БЛИЖАЙШЕГО ИГРОКА ПРИ ПОЛЕТЕ МЯЧА
function autoSwitchToClosestPlayer() {
    if (ball.owner) return;

    let closest = null;
    let minDist = Infinity;

    homeTeam.forEach(p => {
        if (Date.now() > p.stunnedUntil) {
            let d = Math.hypot(p.x - ball.x, p.y - ball.y);
            if (d < minDist) {
                minDist = d;
                closest = p;
            }
        }
    });

    if (closest && closest !== activeUserPlayer) {
        activeUserPlayer = closest;
    }
}

function executeTackle(player) {
    const now = Date.now();
    if (now < player.tackleCooldown || now < player.stunnedUntil) return;

    player.tackleCooldown = now + 1200;
    if (player.isHome) {
        document.getElementById('btn-tackle').classList.add('cooldown');
        setTimeout(() => document.getElementById('btn-tackle').classList.remove('cooldown'), 1200);
    }

    let angle = player.facingAngle;
    player.vx = Math.cos(angle) * 13;
    player.vy = Math.sin(angle) * 13;

    const opponents = player.isHome ? awayTeam : homeTeam;
    opponents.forEach(opp => {
        if (opp.role === 'GK' && ball.owner === opp) return;

        let dist = Math.hypot(opp.x - player.x, opp.y - player.y);
        if (dist < 56) {
            opp.stunnedUntil = now + 1600;
            if (ball.owner === opp) {
                ball.owner = player;
                lastTouchPlayer = player;
                if (player.isHome) activeUserPlayer = player;
            }
        }
    });
}

function updateGK(gk) {
    if (gk.isHome && activeUserPlayer === gk) return;

    let targetY = Math.max(200, Math.min(450, ball.y));
    gk.y += (targetY - gk.y) * 0.1;

    let dist = Math.hypot(gk.x - ball.x, gk.y - ball.y);
    if (dist < 55 && !ball.owner) {
        ball.owner = gk;
        lastTouchPlayer = gk;
        ball.vx = 0; ball.vy = 0;
        gkHoldStartTime = Date.now();

        if (gk.isHome) activeUserPlayer = gk;
    }

    if (ball.owner === gk) {
        let heldDuration = Date.now() - gkHoldStartTime;

        if (!gk.isHome && heldDuration > 1200 && heldDuration < 4800) {
            let teammates = awayTeam.filter(p => p !== gk);
            let target = teammates[Math.floor(Math.random() * teammates.length)];
            let angle = Math.atan2(target.y - gk.y, target.x - gk.x);
            ball.owner = null;
            ball.vx = Math.cos(angle) * 15;
            ball.vy = Math.sin(angle) * 15;
        }

        if (heldDuration >= 5000) {
            ball.owner = null;
            let clearDirection = gk.isHome ? 1 : -1;
            ball.vx = clearDirection * (18 + Math.random() * 4);
            ball.vy = (Math.random() - 0.5) * 12;
        }
    }
}

function updateAI() {
    const now = Date.now();

    homeTeam.forEach(p => {
        if (p === activeUserPlayer || p.role === 'GK') return;
        
        let targetX = p.baseX + (ball.x - 550) * 0.3;
        let targetY = p.baseY + (ball.y - 325) * 0.2;

        if (ball.owner && ball.owner.isHome) {
            if (p.role === 'FW') targetX += 90;
            if (p.role === 'MF') targetX += 45;
        } else if (ball.owner && !ball.owner.isHome) {
            targetX -= 40;
        }

        let dx = targetX - p.x;
        let dy = targetY - p.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 15) {
            p.vx = (dx / dist) * (p.speed * 0.75);
            p.vy = (dy / dist) * (p.speed * 0.75);
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
        if (ball.owner === bot) {
            if (bot.x < 360 && Math.random() < 0.05 * currentDiff.aiAccuracy) {
                ball.owner = null;
                let goalY = 280 + Math.random() * 90;
                let angle = Math.atan2(goalY - bot.y, 30 - bot.x);
                ball.vx = Math.cos(angle) * 17;
                ball.vy = Math.sin(angle) * 17;
                return;
            }

            if (now > botPassCooldown && Math.random() < 0.04 * currentDiff.aiAccuracy) {
                let openTeammates = awayTeam.filter(t => t !== bot && t.x < bot.x && now > t.stunnedUntil);
                if (openTeammates.length > 0) {
                    let target = openTeammates[Math.floor(Math.random() * openTeammates.length)];
                    let angle = Math.atan2(target.y - bot.y, target.x - bot.x);
                    ball.owner = null;
                    ball.vx = Math.cos(angle) * 14;
                    ball.vy = Math.sin(angle) * 14;
                    botPassCooldown = now + 1000;
                    return;
                }
            }

            let angle = Math.atan2(325 - bot.y, 35 - bot.x);
            bot.vx = Math.cos(angle) * bot.speed;
            bot.vy = Math.sin(angle) * bot.speed;

        } else if (bot === presser) {
            if (ball.owner && ball.owner.role === 'GK') {
                bot.vx = 0; bot.vy = 0;
            } else {
                let angle = Math.atan2(ball.y - bot.y, ball.x - bot.x);
                bot.vx = Math.cos(angle) * bot.speed;
                bot.vy = Math.sin(angle) * bot.speed;

                if (minDist < 48 && Math.random() < 0.05 * currentDiff.aiAccuracy) {
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
                bot.vx = (dx / dist) * (bot.speed * 0.65);
                bot.vy = (dy / dist) * (bot.speed * 0.65);
            }
        }
        bot.update();
    });
}

function startPassCharge() {
    if (!ball.owner || ball.owner !== activeUserPlayer) return;
    isChargingPass = true;
    passPower = 0;
    passPressStartTime = Date.now();
    document.getElementById('power-bar-container').style.display = 'block';
}

function releasePass() {
    if (!isChargingPass) return;
    isChargingPass = false;
    document.getElementById('power-bar-container').style.display = 'none';

    if (ball.owner !== activeUserPlayer) return;

    const holdDuration = Date.now() - passPressStartTime;

    if (holdDuration < 220 && passPower < 15) {
        let teammates = homeTeam.filter(p => p !== activeUserPlayer);
        if (teammates.length > 0) {
            let target = teammates[0];
            let minDist = Infinity;
            teammates.forEach(p => {
                let d = Math.hypot(p.x - activeUserPlayer.x, p.y - activeUserPlayer.y);
                if (d < minDist) { minDist = d; target = p; }
            });

            let angle = Math.atan2(target.y - activeUserPlayer.y, target.x - activeUserPlayer.x);
            ball.owner = null;
            ball.vx = Math.cos(angle) * 14;
            ball.vy = Math.sin(angle) * 14;
        }
    } else {
        ball.owner = null;
        let powerSpeed = (passPower / 100) * 14 + 10;
        let passAngle = activeUserPlayer.facingAngle;
        if (Math.abs(joystickDir.x) > 0.1 || Math.abs(joystickDir.y) > 0.1) {
            passAngle = Math.atan2(joystickDir.y, joystickDir.x);
        }

        ball.vx = Math.cos(passAngle) * powerSpeed;
        ball.vy = Math.sin(passAngle) * powerSpeed;
    }
}

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
        let pwr = (shotPower / 100) * 18 + 8;
        let angle = Math.atan2(325 - activeUserPlayer.y, 1070 - activeUserPlayer.x);
        
        ball.vx = Math.cos(angle) * pwr;
        ball.vy = Math.sin(angle) * pwr;
    }
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
            activeUserPlayer.update();
        }

        updateAI();
        resolvePlayerCollisions();

        if (ball.owner) {
            let distOffset = ball.owner.radius + 4;
            ball.x = ball.owner.x + Math.cos(ball.owner.facingAngle) * distOffset;
            ball.y = ball.owner.y + Math.sin(ball.owner.facingAngle) * distOffset;
            ball.vx = 0; ball.vy = 0;
        } else {
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.vx *= ball.friction;
            ball.vy *= ball.friction;

            autoSwitchToClosestPlayer(); // Переключение на ближайшего при свободной траектории

            [...homeTeam, ...awayTeam].forEach(p => {
                if (Date.now() < p.stunnedUntil) return;
                let d = Math.hypot(p.x - ball.x, p.y - ball.y);
                if (d < p.radius + 12) {
                    ball.owner = p;
                    lastTouchPlayer = p;
                    if (p.isHome) activeUserPlayer = p;
                }
            });

            if (ball.y < 35 || ball.y > 615) ball.vy *= -1;
            if (ball.x < 35 || ball.x > 1065) {
                if (ball.y < 250 || ball.y > 400) {
                    ball.vx *= -1;
                } else {
                    if (ball.x < 35) handleGoal('away');
                    else handleGoal('home');
                }
            }
        }

        if (isChargingShot) {
            shotPower = Math.min(100, shotPower + 3.5);
            document.getElementById('power-bar-fill').style.width = shotPower + '%';
        } else if (isChargingPass) {
            passPower = Math.min(100, passPower + 4);
            document.getElementById('power-bar-fill').style.width = passPower + '%';
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
    ctx.fillRect(10, 250, 20, 150);
    ctx.strokeRect(10, 250, 20, 150);
    ctx.fillRect(1070, 250, 20, 150);
    ctx.strokeRect(1070, 250, 20, 150);

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
}

// ОБРАБОТКА И АНИМАЦИЯ ГОЛА
function handleGoal(team) {
    if (gameState === 'GOAL_ANIMATION') return;
    gameState = 'GOAL_ANIMATION';

    if (team === 'home') homeScore++; else awayScore++;
    document.getElementById('home-score').innerText = homeScore;
    document.getElementById('away-score').innerText = awayScore;

    const overlay = document.getElementById('goal-overlay');
    const cardBox = document.getElementById('goal-card-container');
    const scorerName = document.getElementById('goal-scorer-name');

    let scorer = lastTouchPlayer;
    if (!scorer || (team === 'home' && !scorer.isHome) || (team === 'away' && scorer.isHome)) {
        scorer = team === 'home' ? homeTeam[4] : awayTeam[4];
    }

    if (scorer && scorer.data) {
        scorerName.innerText = `${scorer.data.name} (${scorer.data.rating})`;
        if (scorer.data.file) {
            cardBox.innerHTML = `<img src="${scorer.data.folder}/${scorer.data.file}" style="width:170px; height:auto; border-radius:12px; border:3px solid #ffcc00;">`;
        } else {
            cardBox.innerHTML = `<div style="width:140px; height:180px; background:${scorer.isHome ? '#0077ff':'#e74c3c'}; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:bold; border:3px solid #fff;">${scorer.number}</div>`;
        }
    }

    overlay.style.display = 'flex';

    setTimeout(() => {
        overlay.style.display = 'none';
        resetPositions();
        gameState = 'PLAYING';
    }, 3000);
}

function resetPositions() {
    ball.owner = null;
    ball.x = 550; ball.y = 325; ball.vx = 0; ball.vy = 0;
    
    homeTeam.forEach(p => { p.x = p.baseX; p.y = p.baseY; p.vx = 0; p.vy = 0; });
    awayTeam.forEach(p => { p.x = p.baseX; p.y = p.baseY; p.vx = 0; p.vy = 0; });
    activeUserPlayer = homeTeam[3];
}

// ПЕРЕРЫВ МЕЖДУ ТАЙМАМИ (1 МИНУТА)
function startHalfTimeBreak() {
    gameState = 'HALF_TIME';
    let htSeconds = 60;
    const htOverlay = document.getElementById('halftime-overlay');
    const htTimerEl = document.getElementById('ht-timer');
    htOverlay.style.display = 'flex';

    htTimerInterval = setInterval(() => {
        htSeconds--;
        if (htTimerEl) htTimerEl.innerText = htSeconds;
        if (htSeconds <= 0) resumeSecondHalf();
    }, 1000);

    document.getElementById('btn-resume-half').onclick = resumeSecondHalf;

    function resumeSecondHalf() {
        clearInterval(htTimerInterval);
        htOverlay.style.display = 'none';
        currentHalf = 2;
        matchSeconds = 0;
        document.getElementById('match-half').innerText = '2-Й ТАЙМ';
        resetPositions();
        gameState = 'PLAYING';
    }
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
                startHalfTimeBreak();
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

document.getElementById('btn-switch').addEventListener('click', switchUserPlayer);
document.getElementById('btn-tackle').addEventListener('click', () => activeUserPlayer && executeTackle(activeUserPlayer));

const passBtn = document.getElementById('btn-pass');
passBtn.addEventListener('mousedown', startPassCharge);
passBtn.addEventListener('touchstart', startPassCharge);

const shotBtn = document.getElementById('btn-shot');
shotBtn.addEventListener('mousedown', startShotCharge);
shotBtn.addEventListener('touchstart', startShotCharge);

window.addEventListener('mouseup', () => { releaseShot(); releasePass(); });
window.addEventListener('touchend', () => { releaseShot(); releasePass(); });

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyQ') switchUserPlayer();
    if (e.code === 'KeyK' && !isChargingPass) startPassCharge();
    if (e.code === 'KeyL' && activeUserPlayer) executeTackle(activeUserPlayer);
    if (e.code === 'KeyJ' && !isChargingShot) startShotCharge();
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'KeyK') releasePass();
    if (e.code === 'KeyJ') releaseShot();
});

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

document.getElementById('bot-team-name').innerText = currentDiff.name.toUpperCase();
createUIOverlays();
initTeams();
startTimer();
requestAnimationFrame(gameLoop);