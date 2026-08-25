function updateBalance(amount) {
    try {
        let current = parseInt(localStorage.getItem('rush_coins') || '0', 10);
        localStorage.setItem('rush_coins', current + amount);
    } catch(e) {}
}

const canvas = document.getElementById('pitchCanvas');
const ctx = canvas.getContext('2d');

const DIFFICULTY_SETTINGS = {
    novice: { name: 'Новичок', aiSpeed: 1.2, aiAccuracy: 0.5, maxReward: 20000, cardTier: 'gold' },
    pro: { name: 'Профессионал', aiSpeed: 1.5, aiAccuracy: 0.7, maxReward: 50000, cardTier: 'champions' },
    world_class: { name: 'Мировой Класс', aiSpeed: 1.8, aiAccuracy: 0.85, maxReward: 90000, cardTier: 'toty' },
    legend: { name: 'Легенда', aiSpeed: 2.1, aiAccuracy: 0.94, maxReward: 140000, cardTier: 'chaos' },
    ultimate: { name: 'ULTIMATE', aiSpeed: 2.5, aiAccuracy: 1.0, maxReward: 200000, cardTier: 'ballondor' }
};

const BOT_CARD_POOLS = {
    gold: [
        { name: 'Bugday', rating: 87, pos: 'GK', folder: 'Gold', file: 'Bugday-87.png' },
        { name: 'Selim', rating: 68, pos: 'CB', folder: 'Gold', file: 'Selim-68.png' },
        { name: 'Nazrin', rating: 82, pos: 'CB', folder: 'Gold', file: 'Nazrin-82.png' },
        { name: 'Elcan', rating: 92, pos: 'RW', folder: 'Gold', file: 'Elcan-92.png', ability: 'power_shot' },
        { name: 'Turgay', rating: 92, pos: 'ST', folder: 'Gold', file: 'Turqay-92.png', ability: 'power_shot' }
    ],
    champions: [
        { name: 'Bugday', rating: 90, pos: 'GK', folder: 'Champions', file: 'Bugday-90.png' },
        { name: 'Nazrin', rating: 88, pos: 'DF', folder: 'Champions', file: 'Nazrin-88.png' },
        { name: 'Tuncay', rating: 91, pos: 'DF', folder: 'Champions', file: 'Tuncay-91.png' },
        { name: 'Elcan', rating: 96, pos: 'RW', folder: 'Champions', file: 'Elcan-96.png', ability: 'power_shot' },
        { name: 'Turgay', rating: 96, pos: 'ST', folder: 'Champions', file: 'Turqay-96.png', ability: 'power_shot' }
    ],
    toty: [
        { name: 'Bugday', rating: 95, pos: 'GK', folder: 'Toty', file: 'Bugday-95.png' },
        { name: 'Nazrin', rating: 91, pos: 'DF', folder: 'Toty', file: 'Nazrin-91.png' },
        { name: 'Tuncay', rating: 97, pos: 'DF', folder: 'Toty', file: 'Tuncay-97.png' },
        { name: 'Elcan', rating: 97, pos: 'RW', folder: 'Toty', file: 'Elcan-97.png', ability: 'power_shot' },
        { name: 'Turgay', rating: 97, pos: 'ST', folder: 'Toty', file: 'Turgay-97.png', ability: 'power_shot' }
    ],
    chaos: [
        { name: 'Bugday', rating: 99, pos: 'GK', folder: 'CHAOS', file: 'Bugday-99.png' },
        { name: 'Nazrin', rating: 99, pos: 'DF', folder: 'CHAOS', file: 'Nazrin-99.png' },
        { name: 'Tuncay', rating: 99, pos: 'DF', folder: 'CHAOS', file: 'Tuncay-99.png' },
        { name: 'Elcan', rating: 99, pos: 'RW', folder: 'CHAOS', file: 'Elcan-99.png', ability: 'power_shot' },
        { name: 'Turgay', rating: 99, pos: 'ST', folder: 'CHAOS', file: 'Turgay-99.png', ability: 'power_shot' }
    ],
    ballondor: [
        { name: 'Bugday', rating: 105, pos: 'GK', folder: 'GoldenStars', file: 'Bugday-105.png' },
        { name: 'Nazrin', rating: 102, pos: 'CB', folder: 'GoldenStars', file: 'Nazrin-102.png' },
        { name: 'Tuncay', rating: 103, pos: 'CB', folder: 'GoldenStars', file: 'Tuncay-103.png' },
        { name: 'Elcan', rating: 105, pos: 'CAM', folder: 'GoldenStars', file: 'Elcan-105.png', ability: 'power_shot' },
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
        filtered.push({ name: defaultNames[filtered.length], rating: 96, number: filtered.length + 1, ability: 'power_shot' });
    }
    return filtered.slice(0, 5);
}

const userPlayersData = getVerifiedSquad();
const botPlayersData = BOT_CARD_POOLS[currentDiff.cardTier];

const HALF_DURATION = 240;
let matchSeconds = 0;
let currentHalf = 1;
let matchInterval;
let homeScore = 0;
let awayScore = 0;
let gameState = 'KICKOFF'; 

let kickoffState = {
    active: true,
    team: 'home',
    timerEnd: 0
};

const ball = { 
    x: 550, y: 325, vx: 0, vy: 0, radius: 8, friction: 0.96, 
    owner: null 
};

let lastTouchPlayer = null;
let skillCooldown = 0;

const joystickDir = { x: 0, y: 0 };
const keys = {};

let isChargingShot = false;
let shotPower = 0;
let isChargingPass = false;
let passPower = 0;
let passPressStartTime = 0;

let botPassCooldown = 0;

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
        this.hasImg = false;

        if (this.data && this.data.file) {
            this.img = new Image();
            this.img.src = `${this.data.folder}/${this.data.file}`;
            this.img.onload = () => { this.hasImg = true; };
        }
    }

    get speed() {
        return this.baseSpeed * this.speedBoost;
    }

    draw(isActive) {
        const now = Date.now();
        ctx.save();

        let isGhost = now < this.isGhostUntil;
        if (isGhost) {
            ctx.globalAlpha = 0.35;
        }

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

        if (isGhost) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.fill();
        } else if (this.speedBoost > 1.3) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 204, 0.5)';
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

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.strokeStyle = isGhost ? '#00ffff' : (this.isHome ? '#00d2ff' : '#ff3366');
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
        
        if (Math.hypot(this.vx, this.vy) > 0.2) {
            this.facingAngle = Math.atan2(this.vy, this.vx);
        }

        this.vx *= 0.8;
        this.vy *= 0.8;

        if (this.role === 'GK') {
            if (this.isHome) {
                this.x = Math.max(35 + this.radius, Math.min(240 - this.radius, this.x));
                this.y = Math.max(160 + this.radius, Math.min(490 - this.radius, this.y));
            } else {
                this.x = Math.max(860 + this.radius, Math.min(1065 - this.radius, this.x));
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
        ctx.shadowColor = fx.color;
        ctx.shadowBlur = 12;
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

        if (fx.alpha <= 0) {
            activeSkillEffects.splice(i, 1);
        }
    }
}

function updateSkillUI() {
    const btnSkill = document.getElementById('btn-skill');
    if (!btnSkill) return;

    const now = Date.now();
    if (now < skillCooldown) {
        const remaining = Math.ceil((skillCooldown - now) / 1000);
        btnSkill.style.filter = 'grayscale(100%)';
        btnSkill.style.opacity = '0.4';
        btnSkill.style.pointerEvents = 'none';
        btnSkill.innerText = `КД (${remaining}с)`;
    } else {
        btnSkill.style.filter = 'none';
        btnSkill.style.opacity = '1';
        btnSkill.style.pointerEvents = 'auto';
        btnSkill.innerText = 'СПОСОБНОСТЬ';
    }
}

function triggerSpecialSkill() {
    const now = Date.now();
    if (!activeUserPlayer || now < skillCooldown) return;

    const pData = activeUserPlayer.data || {};
    const rawName = String(pData.name || pData.cardName || pData.title || '').toLowerCase();
    let activated = false;

    const isElcan = rawName.includes('elcan') || 
                    rawName.includes('eljan') || 
                    rawName.includes('эльджан') || 
                    pData.ability === 'power_shot';

    const isTurgay = rawName.includes('turqay') || 
                     rawName.includes('turgay') || 
                     rawName.includes('тургай');

    // 1. ELCAN (ЭЛЬДЖАН) / ТУРГАЙ — Пушечный удар
    if (isElcan || isTurgay) {
        if (ball.owner === activeUserPlayer) {
            ball.owner = null;
            let angle = Math.atan2(325 - activeUserPlayer.y, 1070 - activeUserPlayer.x);
            ball.vx = Math.cos(angle) * 35;
            ball.vy = Math.sin(angle) * 35;
            createSkillEffect(activeUserPlayer, 'ПУШЕЧНЫЙ УДАР!', '#ff9900');
            activated = true;
        }

    // 2. НАЗРИН — Заморозка
    } else if (rawName.includes('nazrin') || rawName.includes('назрин')) {
        const opponents = activeUserPlayer.isHome ? awayTeam : homeTeam;
        opponents.forEach(opp => {
            let dist = Math.hypot(opp.x - activeUserPlayer.x, opp.y - activeUserPlayer.y);
            if (dist < 220) {
                opp.stunnedUntil = now + 2000;
                if (ball.owner === opp) {
                    ball.owner = activeUserPlayer;
                    lastTouchPlayer = activeUserPlayer;
                }
            }
        });
        createSkillEffect(activeUserPlayer, 'ЗАМОРОЗКА!', '#00d2ff');
        activated = true;

    // 3. ТУНДЖАЙ — Силовой толчок
    } else if (rawName.includes('tuncay') || rawName.includes('тунджай')) {
        const opponents = activeUserPlayer.isHome ? awayTeam : homeTeam;
        opponents.forEach(opp => {
            let dx = opp.x - activeUserPlayer.x;
            let dy = opp.y - activeUserPlayer.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 250 && dist > 0) {
                let pushForce = 20;
                opp.vx = (dx / dist) * pushForce;
                opp.vy = (dy / dist) * pushForce;
                opp.stunnedUntil = now + 1800;
                if (ball.owner === opp) ball.owner = null;
            }
        });
        createSkillEffect(activeUserPlayer, 'ТОЛЧОК!', '#ff3366');
        activated = true;

    // 4. БУГДАЙ — Магнит
    } else if (rawName.includes('bugday') || rawName.includes('бугдай')) {
        let dist = Math.hypot(activeUserPlayer.x - ball.x, activeUserPlayer.y - ball.y);
        if (dist < 300) {
            ball.owner = activeUserPlayer;
            lastTouchPlayer = activeUserPlayer;
            ball.vx = 0; ball.vy = 0;
            createSkillEffect(activeUserPlayer, 'МАГНИТ!', '#ffff00');
            activated = true;
        }
    }

    if (activated) {
        skillCooldown = now + 8000;
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

            if (now < p1.isGhostUntil || now < p2.isGhostUntil) {
                continue;
            }

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
    let angle = player.facingAngle;
    player.vx = Math.cos(angle) * 13;
    player.vy = Math.sin(angle) * 13;

    const opponents = player.isHome ? awayTeam : homeTeam;
    opponents.forEach(opp => {
        if (opp.role === 'GK' && ball.owner === opp) return;
        if (now < opp.isGhostUntil) return; 

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
    const now = Date.now();
    let gkSpeedMultiplier = gk.isHome ? 1.0 : (1.4 * currentDiff.aiSpeed);

    if (ball.owner === gk) {
        if (!gk.holdStartTime) gk.holdStartTime = now;

        if (now - gk.holdStartTime > 4000) {
            ball.owner = null;
            let kickDirection = gk.isHome ? 1 : -1;
            let randomAngle = (Math.random() - 0.5) * 1.0; 
            let power = 22 + Math.random() * 6;

            ball.vx = Math.cos(randomAngle) * power * kickDirection;
            ball.vy = Math.sin(randomAngle) * power;
            gk.holdStartTime = 0;
        } else if (!gk.isHome && now - gk.holdStartTime > 800) {
            let teammates = awayTeam.filter(p => p !== gk);
            let target = teammates[Math.floor(Math.random() * teammates.length)];
            let angle = Math.atan2(target.y - gk.y, target.x - gk.x);
            ball.owner = null;
            ball.vx = Math.cos(angle) * (18 + Math.random() * 4);
            ball.vy = Math.sin(angle) * (18 + Math.random() * 4);
            gk.holdStartTime = 0;
        }
        return;
    } else {
        gk.holdStartTime = 0;
    }

    if (gk.isHome && activeUserPlayer === gk) return;

    let distToBall = Math.hypot(gk.x - ball.x, gk.y - ball.y);
    let ballSpeed = Math.hypot(ball.vx, ball.vy);
    let isApproaching = gk.isHome ? (ball.vx < -1) : (ball.vx > 1);

    if (!ball.owner && (distToBall < 380 || isApproaching)) {
        let predictSteps = Math.min(16, distToBall / (ballSpeed + 0.1));
        let targetX = ball.x + ball.vx * predictSteps;
        let targetY = ball.y + ball.vy * predictSteps;

        if (gk.isHome) {
            targetX = Math.max(45 + gk.radius, Math.min(220 - gk.radius, targetX));
        } else {
            targetX = Math.max(880 + gk.radius, Math.min(1055 - gk.radius, targetX));
        }
        targetY = Math.max(170 + gk.radius, Math.min(480 - gk.radius, targetY));

        let dx = targetX - gk.x;
        let dy = targetY - gk.y;
        let distToTarget = Math.hypot(dx, dy);

        if (distToTarget > 4) {
            let factor = (ballSpeed > 8) ? 1.85 : 1.25;
            gk.vx = (dx / distToTarget) * (gk.speed * gkSpeedMultiplier * factor);
            gk.vy = (dy / distToTarget) * (gk.speed * gkSpeedMultiplier * factor);
        }
    } else {
        let defaultX = gk.isHome ? 70 : 1030;
        let targetY = Math.max(180, Math.min(470, ball.y));
        gk.x += (defaultX - gk.x) * 0.12;
        gk.y += (targetY - gk.y) * 0.22;
    }

    let catchRadius = (ballSpeed > 9) ? (gk.radius + 30) : (gk.radius + 18);
    if (distToBall < catchRadius && !ball.owner) {
        ball.owner = gk;
        lastTouchPlayer = gk;
        ball.vx = 0; 
        ball.vy = 0;
        gk.holdStartTime = now;

        if (gk.isHome) activeUserPlayer = gk;
    }
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

function executeKickoffPass(team) {
    if (gameState !== 'KICKOFF') return;
    gameState = 'PLAYING';
    kickoffState.active = false;

    let kicker = (team === 'home') ? homeTeam[3] : awayTeam[3];
    let teammates = (team === 'home') ? homeTeam.filter(p => p !== kicker && p.role !== 'GK') : awayTeam.filter(p => p !== kicker && p.role !== 'GK');
    let target = teammates[0];

    let angle = Math.atan2(target.y - kicker.y, target.x - kicker.x);
    ball.owner = null;
    ball.vx = Math.cos(angle) * 13;
    ball.vy = Math.sin(angle) * 13;
}

function startPassCharge() {
    if (gameState === 'KICKOFF') {
        if (kickoffState.team === 'home') {
            executeKickoffPass('home');
        }
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
        if (kickoffState.team === 'home') {
            executeKickoffPass('home');
        }
        return;
    }

    if (!isChargingPass) return;
    isChargingPass = false;
    const bar = document.getElementById('power-bar-container');
    if (bar) bar.style.display = 'none';

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
        ball.owner = null;
        let pwr = (shotPower / 100) * 18 + 8;
        let angle = Math.atan2(325 - activeUserPlayer.y, 1070 - activeUserPlayer.x);
        
        ball.vx = Math.cos(angle) * pwr;
        ball.vy = Math.sin(angle) * pwr;
    }
}

function gameLoop() {
    if (gameState === 'KICKOFF') {
        if (kickoffState.team === 'home' && Date.now() >= kickoffState.timerEnd) {
            executeKickoffPass('home');
        }
    } else if (gameState === 'PLAYING') {
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

            autoSwitchToClosestPlayer();

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

        const fill = document.getElementById('power-bar-fill');
        if (isChargingShot) {
            shotPower = Math.min(100, shotPower + 3.5);
            if (fill) fill.style.width = shotPower + '%';
        } else if (isChargingPass) {
            passPower = Math.min(100, passPower + 4);
            if (fill) fill.style.width = passPower + '%';
        }
    }

    updateSkillUI();
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

    drawSkillEffects();

    if (gameState === 'KICKOFF' && kickoffState.team === 'home') {
        let remaining = Math.max(0, Math.ceil((kickoffState.timerEnd - Date.now()) / 1000));
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(320, 110, 460, 50);
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.strokeRect(320, 110, 460, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`РОЗЫГРЫШ С ЦЕНТРА! НАЖМИТЕ ПАС (${remaining}s)`, 550, 142);
        ctx.restore();
    }
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
    ball.x = 550;
    ball.y = 325;
    ball.vx = 0;
    ball.vy = 0;
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
            if (gameState === 'KICKOFF' && kickoffState.team === 'away') {
                executeKickoffPass('away');
            }
        }, 1000);
    }

    [...homeTeam, ...awayTeam].forEach(p => {
        p.vx = 0;
        p.vy = 0;
        p.stunnedUntil = 0;
        p.isGhostUntil = 0;
        p.speedBoost = 1.0;
        p.holdStartTime = 0;
    });

    gameState = 'KICKOFF';
    kickoffState.active = true;
    kickoffState.team = kickoffTeam;
    kickoffState.timerEnd = Date.now() + 5000;
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
            currentHalf = 2;
            gameState = 'HALF_TIME';
            alert('Перерыв!');
            resetPositions('away');
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

function setupControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Digit8' || e.code === 'Numpad8') startShotCharge();
        if (e.code === 'Digit4' || e.code === 'Numpad4') startPassCharge();
        if (e.code === 'Digit5' || e.code === 'Numpad5' || e.code === 'Space' || e.code === 'KeyE' || e.code === 'ShiftLeft') triggerSpecialSkill();
        if (e.code === 'Digit6' || e.code === 'Numpad6' || e.code === 'KeyQ') switchUserPlayer();
        if (e.code === 'Digit2' || e.code === 'Numpad2') executeTackle(activeUserPlayer);
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        if (e.code === 'Digit8' || e.code === 'Numpad8') releaseShot();
        if (e.code === 'Digit4' || e.code === 'Numpad4') releasePass();
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