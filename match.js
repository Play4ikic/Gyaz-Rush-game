window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pitchCanvas');
    if (!canvas) {
        console.error('Ошибка: Canvas элемента pitchCanvas не найдено!');
        return;
    }
    const ctx = canvas.getContext('2d');

    // Настройки сложности
    const DIFFICULTY_SETTINGS = {
        novice: { name: 'Новичок', aiSpeed: 1.1, aiAccuracy: 0.5, maxReward: 20000, cardTier: 'gold' },
        pro: { name: 'Профессионал', aiSpeed: 1.4, aiAccuracy: 0.7, maxReward: 50000, cardTier: 'champions' },
        world_class: { name: 'Мировой Класс', aiSpeed: 1.7, aiAccuracy: 0.85, maxReward: 90000, cardTier: 'toty' },
        legend: { name: 'Легенда', aiSpeed: 2.0, aiAccuracy: 0.94, maxReward: 140000, cardTier: 'chaos' },
        ultimate: { name: 'ULTIMATE', aiSpeed: 2.3, aiAccuracy: 1.0, maxReward: 200000, cardTier: 'ballondor' }
    };

    const BOT_CARD_POOLS = {
        gold: [
            { name: 'Bugday', rating: 87, pos: 'GK' },
            { name: 'Selim', rating: 68, pos: 'CB' },
            { name: 'Nazrin', rating: 82, pos: 'CB' },
            { name: 'Elcan', rating: 92, pos: 'RW' },
            { name: 'Turgay', rating: 92, pos: 'ST' }
        ]
    };

    const currentDiffKey = localStorage.getItem('rush_difficulty') || 'novice';
    const currentDiff = DIFFICULTY_SETTINGS[currentDiffKey] || DIFFICULTY_SETTINGS.novice;

    // Загрузка состава из localStorage
    function getVerifiedSquad() {
        let squad = [];
        try {
            let raw = localStorage.getItem('activeSquad');
            if (raw) squad = JSON.parse(raw);
        } catch(e) {
            console.warn('Не удалось загрузить activeSquad из localStorage', e);
        }
        const defaultNames = ['Bugday', 'Nazrin', 'Tuncay', 'Elcan', 'Turgay'];
        let res = Array.isArray(squad) ? squad.filter(p => p && typeof p === 'object') : [];
        while (res.length < 5) {
            res.push({ name: defaultNames[res.length], rating: 88, number: res.length + 1 });
        }
        return res.slice(0, 5);
    }

    const userPlayersData = getVerifiedSquad();
    const botPlayersData = BOT_CARD_POOLS[currentDiff.cardTier] || BOT_CARD_POOLS.gold;

    // Параметры матча
    const HALF_DURATION = 240;
    let matchSeconds = 0;
    let currentHalf = 1;
    let matchInterval = null;
    let homeScore = 0;
    let awayScore = 0;
    let gameState = 'PLAYING';

    // Мяч
    const ball = { x: 550, y: 325, vx: 0, vy: 0, radius: 8, friction: 0.96, owner: null };
    let lastTouchPlayer = null;
    let skillCooldown = 0;

    // Управление
    const joystickDir = { x: 0, y: 0 };
    const keys = {};

    let isChargingShot = false, shotPower = 0;
    let isChargingPass = false, passPower = 0;

    // Класс игрока
    class Player {
        constructor(x, y, data, isHome, role, number, basePos) {
            this.x = x; 
            this.y = y;
            this.baseX = basePos.x; 
            this.baseY = basePos.y;
            this.vx = 0; 
            this.vy = 0;
            this.facingAngle = isHome ? 0 : Math.PI;
            this.radius = 26;
            this.data = data;
            this.isHome = isHome;
            this.role = role;
            this.number = number;
            
            const rating = data && data.rating ? Number(data.rating) : 80;
            this.baseSpeed = ((rating / 70) + (isHome ? 1.2 : currentDiff.aiSpeed)) * 0.85;
            this.speedBoost = 1.0;
            this.stunnedUntil = 0;
            this.tackleCooldown = 0;
        }

        get speed() { 
            return this.baseSpeed * this.speedBoost; 
        }

        draw(isActive) {
            ctx.save();
            
            // Тень игрока
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 16, 18, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fill();

            // Тело игрока
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.isHome ? '#0077ff' : '#e74c3c';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Номер игрока
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.number, this.x, this.y);

            // Индикатор активного игрока
            if (isActive) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Имя игрока над головой
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.shadowColor = '#000000'; 
            ctx.shadowBlur = 4;
            ctx.fillText(`${this.data.name}`, this.x, this.y - this.radius - 8);
            ctx.restore();
        }

        update() {
            if (Date.now() < this.stunnedUntil) return;
            this.x += this.vx; 
            this.y += this.vy;
            if (Math.hypot(this.vx, this.vy) > 0.2) {
                this.facingAngle = Math.atan2(this.vy, this.vx);
            }
            this.vx *= 0.8; 
            this.vy *= 0.8;

            // Ограничения поля
            this.x = Math.max(35 + this.radius, Math.min(1065 - this.radius, this.x));
            this.y = Math.max(35 + this.radius, Math.min(615 - this.radius, this.y));
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
        activeUserPlayer = homeTeam[3]; // Полузащитник по умолчанию

        const awayPos = [
            { role: 'GK', x: 1030, y: 325, num: 1 },
            { role: 'DF', x: 840, y: 180, num: 4 },
            { role: 'DF', x: 840, y: 470, num: 5 },
            { role: 'MF', x: 650, y: 325, num: 6 },
            { role: 'FW', x: 570, y: 325, num: 9 }
        ];
        awayTeam = awayPos.map((p, i) => new Player(p.x, p.y, botPlayersData[i], false, p.role, p.num, p));
    }

    // Действия и скиллы
    function triggerSpecialSkill() {
        const now = Date.now();
        if (!activeUserPlayer || now < skillCooldown) return;
        activeUserPlayer.speedBoost = 2.0;
        setTimeout(() => { activeUserPlayer.speedBoost = 1.0; }, 2500);
        skillCooldown = now + 6000;
    }

    function executeTackle(player) {
        if (!player) return;
        const now = Date.now();
        if (now < player.tackleCooldown) return;
        player.tackleCooldown = now + 1000;
        player.vx = Math.cos(player.facingAngle) * 12;
        player.vy = Math.sin(player.facingAngle) * 12;

        const opponents = player.isHome ? awayTeam : homeTeam;
        opponents.forEach(opp => {
            if (Math.hypot(opp.x - player.x, opp.y - player.y) < 50) {
                opp.stunnedUntil = now + 1200;
                if (ball.owner === opp) { 
                    ball.owner = player; 
                    lastTouchPlayer = player; 
                }
            }
        });
    }

    function executeThroughPass() {
        if (!activeUserPlayer || ball.owner !== activeUserPlayer) return;
        ball.owner = null;
        let angle = activeUserPlayer.facingAngle;
        if (Math.abs(joystickDir.x) > 0.1 || Math.abs(joystickDir.y) > 0.1) {
            angle = Math.atan2(joystickDir.y, joystickDir.x);
        }
        ball.vx = Math.cos(angle) * 18;
        ball.vy = Math.sin(angle) * 18;
    }

    function startPassCharge() {
        if (!activeUserPlayer || ball.owner !== activeUserPlayer) return;
        isChargingPass = true; 
        passPower = 0;
        const pb = document.getElementById('power-bar-container');
        if (pb) pb.style.display = 'block';
    }

    function releasePass() {
        if (!isChargingPass) return;
        isChargingPass = false;
        const pb = document.getElementById('power-bar-container');
        if (pb) pb.style.display = 'none';

        if (activeUserPlayer && ball.owner === activeUserPlayer) {
            ball.owner = null;
            let angle = activeUserPlayer.facingAngle;
            if (Math.abs(joystickDir.x) > 0.1 || Math.abs(joystickDir.y) > 0.1) {
                angle = Math.atan2(joystickDir.y, joystickDir.x);
            }
            let pwr = (passPower / 100) * 12 + 10;
            ball.vx = Math.cos(angle) * pwr;
            ball.vy = Math.sin(angle) * pwr;
        }
    }

    function startShotCharge() {
        if (!activeUserPlayer || ball.owner !== activeUserPlayer) return;
        isChargingShot = true; 
        shotPower = 0;
        const pb = document.getElementById('power-bar-container');
        if (pb) pb.style.display = 'block';
    }

    function releaseShot() {
        if (!isChargingShot) return;
        isChargingShot = false;
        const pb = document.getElementById('power-bar-container');
        if (pb) pb.style.display = 'none';

        if (activeUserPlayer && ball.owner === activeUserPlayer) {
            ball.owner = null;
            let pwr = (shotPower / 100) * 18 + 10;
            let angle = Math.atan2(325 - activeUserPlayer.y, 1070 - activeUserPlayer.x);
            ball.vx = Math.cos(angle) * pwr;
            ball.vy = Math.sin(angle) * pwr;
        }
    }

    // Логика AI ботов
    function updateAI() {
        awayTeam.forEach(bot => {
            if (Date.now() < bot.stunnedUntil) return;
            
            if (ball.owner === bot) {
                // Бот ведет мяч к воротам
                let targetX = 30, targetY = 325;
                let angle = Math.atan2(targetY - bot.y, targetX - bot.x);
                bot.vx = Math.cos(angle) * bot.speed;
                bot.vy = Math.sin(angle) * bot.speed;

                // Бот бьет по воротам
                if (bot.x < 250 && Math.abs(bot.y - 325) < 150) {
                    ball.owner = null;
                    ball.vx = Math.cos(angle) * 16;
                    ball.vy = Math.sin(angle) * 16;
                }
            } else if (!ball.owner || ball.owner.isHome) {
                // Бот преследует мяч
                let distToBall = Math.hypot(ball.x - bot.x, ball.y - bot.y);
                if (distToBall < 300) {
                    let angle = Math.atan2(ball.y - bot.y, ball.x - bot.x);
                    bot.vx = Math.cos(angle) * bot.speed;
                    bot.vy = Math.sin(angle) * bot.speed;
                }
            }
            bot.update();
        });
    }

    // Игровой цикл
    function gameLoop() {
        if (gameState === 'PLAYING') {
            let mx = joystickDir.x;
            let my = joystickDir.y;

            if (keys['KeyW'] || keys['ArrowUp']) my = -1;
            if (keys['KeyS'] || keys['ArrowDown']) my = 1;
            if (keys['KeyA'] || keys['ArrowLeft']) mx = -1;
            if (keys['KeyD'] || keys['ArrowRight']) mx = 1;

            if (activeUserPlayer) {
                activeUserPlayer.vx = mx * activeUserPlayer.speed;
                activeUserPlayer.vy = my * activeUserPlayer.speed;
                activeUserPlayer.update();
            }

            homeTeam.forEach(p => { if (p !== activeUserPlayer) p.update(); });
            updateAI();

            // Логика мяча
            if (ball.owner) {
                ball.x = ball.owner.x + Math.cos(ball.owner.facingAngle) * (ball.owner.radius + 4);
                ball.y = ball.owner.y + Math.sin(ball.owner.facingAngle) * (ball.owner.radius + 4);
            } else {
                ball.x += ball.vx; 
                ball.y += ball.vy;
                ball.vx *= ball.friction; 
                ball.vy *= ball.friction;

                // Захват мяча
                [...homeTeam, ...awayTeam].forEach(p => {
                    if (Math.hypot(p.x - ball.x, p.y - ball.y) < p.radius + 8) {
                        ball.owner = p; 
                        lastTouchPlayer = p;
                        if (p.isHome) activeUserPlayer = p;
                    }
                });

                // Рикошеты от стен
                if (ball.y < 35 || ball.y > 615) ball.vy *= -1;
                if (ball.x < 35 || ball.x > 1065) {
                    if (ball.y >= 250 && ball.y <= 400) {
                        handleGoal(ball.x < 35 ? 'away' : 'home');
                    } else {
                        ball.vx *= -1;
                    }
                }
            }

            // Шкала силы
            const fill = document.getElementById('power-bar-fill');
            if (isChargingShot) { 
                shotPower = Math.min(100, shotPower + 3.5); 
                if (fill) fill.style.width = shotPower + '%'; 
            }
            if (isChargingPass) { 
                passPower = Math.min(100, passPower + 4); 
                if (fill) fill.style.width = passPower + '%'; 
            }
        }

        render();
        requestAnimationFrame(gameLoop);
    }

    // Отрисовка
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Поле
        ctx.fillStyle = '#174025'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; 
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, 1040, 590);

        // Разметка
        ctx.beginPath(); ctx.moveTo(550, 30); ctx.lineTo(550, 620); ctx.stroke();
        ctx.beginPath(); ctx.arc(550, 325, 80, 0, Math.PI * 2); ctx.stroke();
        
        // Ворота
        ctx.strokeRect(10, 250, 20, 150);
        ctx.strokeRect(1070, 250, 20, 150);

        // Игроки
        homeTeam.forEach(p => p.draw(p === activeUserPlayer));
        awayTeam.forEach(p => p.draw(false));

        // Мяч
        ctx.beginPath(); 
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; 
        ctx.fill(); 
        ctx.strokeStyle = '#000000'; 
        ctx.stroke();
    }

    function handleGoal(team) {
        if (team === 'home') homeScore++; else awayScore++;
        const hs = document.getElementById('home-score'); if (hs) hs.innerText = homeScore;
        const as = document.getElementById('away-score'); if (as) as.innerText = awayScore;
        
        ball.owner = null; 
        ball.x = 550; 
        ball.y = 325; 
        ball.vx = 0; 
        ball.vy = 0;
    }

    function startTimer() {
        if (matchInterval) clearInterval(matchInterval);
        matchInterval = setInterval(() => {
            if (gameState !== 'PLAYING') return;
            matchSeconds++;
            let rem = HALF_DURATION - matchSeconds;
            if (rem <= 0) rem = 0;
            let m = String(Math.floor(rem / 60)).padStart(2, '0');
            let s = String(rem % 60).padStart(2, '0');
            const mt = document.getElementById('match-timer'); 
            if (mt) mt.innerText = `${m}:${s}`;
        }, 1000);
    }

    // Слушатели кнопок UI (FIFA Mobile / NumPad)
    const bShoot = document.getElementById('btn-shoot');
    const bPass = document.getElementById('btn-pass');
    const bSkill = document.getElementById('btn-skill');
    const bThrough = document.getElementById('btn-through');
    const bTackle = document.getElementById('btn-tackle');

    if (bShoot) { bShoot.addEventListener('mousedown', startShotCharge); bShoot.addEventListener('touchstart', startShotCharge); }
    if (bPass) { bPass.addEventListener('mousedown', startPassCharge); bPass.addEventListener('touchstart', startPassCharge); }
    if (bSkill) { bSkill.addEventListener('click', triggerSpecialSkill); }
    if (bThrough) { bThrough.addEventListener('click', executeThroughPass); }
    if (bTackle) { bTackle.addEventListener('click', () => { if (activeUserPlayer) executeTackle(activeUserPlayer); }); }

    window.addEventListener('mouseup', () => { releaseShot(); releasePass(); });
    window.addEventListener('touchend', () => { releaseShot(); releasePass(); });

    // Клавиатура (8, 4, 5, 6, 2)
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Numpad8' || e.code === 'Digit8' || e.key === '8') startShotCharge();
        if (e.code === 'Numpad4' || e.code === 'Digit4' || e.key === '4') startPassCharge();
        if (e.code === 'Numpad5' || e.code === 'Digit5' || e.key === '5') triggerSpecialSkill();
        if (e.code === 'Numpad6' || e.code === 'Digit6' || e.key === '6') executeThroughPass();
        if (e.code === 'Numpad2' || e.code === 'Digit2' || e.key === '2') executeTackle(activeUserPlayer);
    });

    window.addEventListener('keyup', e => {
        keys[e.code] = false;
        if (e.code === 'Numpad8' || e.code === 'Digit8' || e.key === '8') releaseShot();
        if (e.code === 'Numpad4' || e.code === 'Digit4' || e.key === '4') releasePass();
    });

    // Джойстик
    const joyZone = document.getElementById('joystick-zone');
    const joyStick = document.getElementById('joystick-stick');
    let joyActive = false;

    if (joyZone && joyStick) {
        joyZone.addEventListener('pointerdown', e => { joyActive = true; updateJoy(e); });
        window.addEventListener('pointermove', e => { if (joyActive) updateJoy(e); });
        window.addEventListener('pointerup', () => {
            joyActive = false; 
            joystickDir.x = 0; 
            joystickDir.y = 0;
            joyStick.style.transform = `translate(0px, 0px)`;
        });

        function updateJoy(e) {
            const r = joyZone.getBoundingClientRect();
            let dx = e.clientX - (r.left + r.width / 2);
            let dy = e.clientY - (r.top + r.height / 2);
            let dist = Math.hypot(dx, dy), maxR = 35;
            if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
            joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
            joystickDir.x = dx / maxR; 
            joystickDir.y = dy / maxR;
        }
    }

    // Запуск
    initTeams();
    startTimer();
    requestAnimationFrame(gameLoop);
});