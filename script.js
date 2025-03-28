const canvas = document.getElementById('universeCanvas');
        const ctx = canvas.getContext('2d', { alpha: false });
        const stageIndicator = document.getElementById('stageIndicator');
        const infoPanel = document.getElementById('infoPanel');
        const restartBtn = document.getElementById('restartBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const scaleIndicator = document.getElementById('scaleIndicator');
        const pauseOverlay = document.getElementById('pauseOverlay');

        // Настройки canvas
        function resizeCanvas() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const ratio = window.devicePixelRatio || 1;
            
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            
            ctx.scale(ratio, ratio);
        }
        resizeCanvas();

        // Состояния анимации
        const STAGES = {
            QUANTUM_FLUCTUATIONS: 0,
            SINGULARITY: 1,
            INFLATION: 2,
            BIG_BANG: 3,
            GALAXY_FORMATION: 4,
            HUBBLE_VOLUME: 5,
            MILKY_WAY_VIEW: 6,
            SOLAR_SYSTEM: 7
        };

        // Научные константы (в относительных единицах)
        const HUBBLE_RADIUS = Math.min(canvas.width, canvas.height) * 0.4;
        const MILKY_WAY_DIAMETER = HUBBLE_RADIUS * 0.25;
        const SOLAR_SYSTEM_DISTANCE = MILKY_WAY_DIAMETER * 0.3; // Уменьшили расстояние до 30% радиуса

        // Параметры анимации
        let currentStage = STAGES.QUANTUM_FLUCTUATIONS;
        let cameraZoom = 1;
        let cameraPos = { x: canvas.width / 2, y: canvas.height / 2 };
        let targetZoom = 1;
        let targetPos = { x: canvas.width / 2, y: canvas.height / 2 };
        let particles = [];
        let vacuumParticles = [];
        let galaxies = [];
        let lastTime = 0;
        let stageStartTime = 0;
        let isAnimating = true;
        let isPaused = false;
        let inflationFactor = 1;
        let singularitySize = 1;
        let milkyWay = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: MILKY_WAY_DIAMETER,
            arms: [
                { angle: 0, stars: [], spiral: [] },
                { angle: Math.PI, stars: [], spiral: [] }
            ],
            rotation: 0,
            alpha: 1,
            visible: true
        };
        let solarSystem = {
            x: milkyWay.x + SOLAR_SYSTEM_DISTANCE,
            y: milkyWay.y,
            visible: false,
            scale: 0,
            planets: [
                { name: "Меркурий", distance: 60, size: 4, color: '#b5b5b5', angle: 0, speed: 0.0479 },
                { name: "Венера", distance: 80, size: 5, color: '#e6c229', angle: 1.5, speed: 0.0350 },
                { name: "Земля", distance: 100, size: 5, color: '#3498db', angle: 3.0, speed: 0.0298 },
                { name: "Марс", distance: 120, size: 4.5, color: '#e27b58', angle: 4.5, speed: 0.0241 },
                { name: "Юпитер", distance: 160, size: 10, color: '#c88b3a', angle: 6.0, speed: 0.0131 },
                { name: "Сатурн", distance: 200, size: 9, color: '#e4d191', angle: 7.5, speed: 0.0097, rings: true },
                { name: "Уран", distance: 240, size: 7, color: '#d1e7e7', angle: 9.0, speed: 0.0068 },
                { name: "Нептун", distance: 280, size: 7, color: '#5b5ddf', angle: 10.5, speed: 0.0054 }
            ]
        };

        // Оптимизация: кэш для часто используемых значений
        const PI = Math.PI;
        const TWO_PI = PI * 2;
        const HALF_PI = PI / 2;
        const random = Math.random;
        const cos = Math.cos;
        const sin = Math.sin;
        const pow = Math.pow;
        const min = Math.min;
        const max = Math.max;

        // Оптимизация: ограничение количества частиц для мобильных устройств
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const MAX_PARTICLES = isMobile ? 400 : 800;
        const MAX_GALAXIES = isMobile ? 60 : 120;
        const MAX_STARS = isMobile ? 300 : 600;
        const MAX_HUBBLE_GALAXIES = isMobile ? 30 : 60;

        // Инициализация Млечного Пути
        function initMilkyWay() {
            milkyWay.arms.forEach(arm => {
                arm.stars = [];
                arm.spiral = [];
                
                for (let i = 0; i < MAX_STARS; i++) {
                    const distance = pow(random(), 2) * milkyWay.size * 0.5 + milkyWay.size * 0.1;
                    const angleOffset = (random() - 0.5) * 0.8;
                    const armWidth = distance * 0.2;
                    
                    arm.stars.push({
                        x: milkyWay.x + cos(arm.angle + angleOffset) * distance + (random() - 0.5) * armWidth,
                        y: milkyWay.y + sin(arm.angle + angleOffset) * distance + (random() - 0.5) * armWidth,
                        size: random() * 1.5 + 0.5,
                        brightness: random() * 0.7 + 0.3,
                        twinkle: random() * TWO_PI
                    });
                }
                
                for (let i = 0; i < 80; i++) {
                    const t = i / 80;
                    const distance = milkyWay.size * 0.1 + t * milkyWay.size * 0.5;
                    const angle = arm.angle + t * 4 * PI;
                    arm.spiral.push({
                        x: milkyWay.x + cos(angle) * distance,
                        y: milkyWay.y + sin(angle) * distance
                    });
                }
            });

            // Добавляем больше звезд в центральную перемычку
            for (let i = 0; i < (isMobile ? 800 : 1600); i++) {
                const angle = random() * TWO_PI;
                const distance = pow(random(), 3) * milkyWay.size * 0.2; // Уменьшенная перемычка
                milkyWay.arms[0].stars.push({
                    x: milkyWay.x + cos(angle) * distance,
                    y: milkyWay.y + sin(angle) * distance,
                    size: random() * 2 + 1,
                    brightness: random() * 0.5 + 0.5,
                    twinkle: random() * TWO_PI
                });
            }
        }

        // Создание квантовых флуктуаций
        function createQuantumFluctuations() {
            vacuumParticles = [];
            for (let i = 0; i < (isMobile ? 100 : 200); i++) {
                vacuumParticles.push({
                    x: random() * canvas.width,
                    y: random() * canvas.height,
                    size: random() * 3 + 1,
                    vx: (random() - 0.5) * 0.3,
                    vy: (random() - 0.5) * 0.3,
                    life: random() * 100 + 50,
                    maxLife: random() * 100 + 50,
                    isParticle: random() > 0.5,
                    alpha: 0,
                    glow: random() * 0.5 + 0.5
                });
            }
        }

        // Создание галактик для области Хаббла
        function createHubbleGalaxies() {
            galaxies = [];
            for (let i = 0; i < MAX_HUBBLE_GALAXIES; i++) {
                const angle = random() * TWO_PI;
                const distance = pow(random(), 2) * HUBBLE_RADIUS * 0.9;
                galaxies.push({
                    x: canvas.width / 2 + cos(angle) * distance,
                    y: canvas.height / 2 + sin(angle) * distance,
                    size: random() * 15 + 10,
                    stars: Math.floor(random() * 50) + 20,
                    color: `hsl(${random() * 60 + 200}, 70%, 50%)`,
                    rotation: random() * TWO_PI,
                    speed: (random() * 0.5 + 0.5) * 0.002,
                    type: Math.floor(random() * 3)
                });
            }
        }

        // Инициализация
        function init() {
            currentStage = STAGES.QUANTUM_FLUCTUATIONS;
            cameraZoom = 1;
            cameraPos = { x: canvas.width / 2, y: canvas.height / 2 };
            targetZoom = 1;
            targetPos = { x: canvas.width / 2, y: canvas.height / 2 };
            particles = [];
            galaxies = [];
            inflationFactor = 1;
            singularitySize = 1;
            milkyWay.alpha = 1;
            milkyWay.visible = true;
            solarSystem.visible = false;
            solarSystem.scale = 0;
            stageStartTime = Date.now();
            isPaused = false;
            pauseBtn.textContent = "Пауза";
            pauseOverlay.style.display = 'none';
            
            milkyWay.x = canvas.width / 2;
            milkyWay.y = canvas.height / 2;
            milkyWay.size = MILKY_WAY_DIAMETER;
            solarSystem.x = milkyWay.x + SOLAR_SYSTEM_DISTANCE;
            solarSystem.y = milkyWay.y;
            
            createQuantumFluctuations();
            initMilkyWay();
            createHubbleGalaxies();
            updateInfoText();
            updateScaleIndicator();
            animate();
        }

        // Обновление текста информации
        function updateInfoText() {
            const scaleText = getScaleText();
            
            switch(currentStage) {
                case STAGES.QUANTUM_FLUCTUATIONS:
    stageIndicator.textContent = "Квантовые флуктуации";
    infoPanel.textContent = "В квантовом вакууме постоянно рождаются и исчезают пары частиц и античастиц. Эти флуктуации могут содержать огромные энергии в микроскопических масштабах.";
    break;
case STAGES.SINGULARITY:
    stageIndicator.textContent = "Квантовая сингулярность";
    infoPanel.textContent = `Мощная флуктуация создает область с экстремальной плотностью энергии (масштаб: ${scaleText}). Это состояние с бесконечной плотностью могло стать началом Вселенной.`;
    break;
case STAGES.INFLATION:
    stageIndicator.textContent = "Космическая инфляция";
    infoPanel.textContent = `За 10⁻³² секунды Вселенная расширилась в 10²⁶ раз (масштаб: ${scaleText}). Квантовые флуктуации растянулись до космологических масштабов.`;
    break;
case STAGES.BIG_BANG:
    stageIndicator.textContent = "Большой Взрыв";
    infoPanel.textContent = `Высвобождение энергии создало огненный шар с температурой ~10³² K (масштаб: ${scaleText}). Формируются фундаментальные силы и первые частицы.`;
    break;
case STAGES.GALAXY_FORMATION:
    stageIndicator.textContent = "Образование галактик";
    infoPanel.textContent = `Через 300-400 млн лет после Большого Взрыва (масштаб: ${scaleText}). Гравитация усиливает первичные неоднородности.`;
    break;
case STAGES.HUBBLE_VOLUME:
    stageIndicator.textContent = "Область Хаббла";
    infoPanel.textContent = `Сфера диаметром ~93 млрд световых лет (масштаб: ${scaleText}). За её пределами объекты удаляются быстрее скорости света.`;
    break;
case STAGES.MILKY_WAY_VIEW:
    stageIndicator.textContent = "Млечный Путь";
    infoPanel.textContent = `Наша галактика - спиральная с перемычкой, диаметр ~100 000 световых лет (масштаб: ${scaleText}). Мы находимся в рукаве Ориона.`;
    break;
case STAGES.SOLAR_SYSTEM:
    stageIndicator.textContent = "Солнечная система";
    infoPanel.textContent = `Наша космическая обитель (масштаб: ${scaleText}). 8 планет вращаются вокруг Солнца по эллиптическим орбитам.`;
    break;
            }
        }

        function getScaleText() {
            if (cameraZoom < 0.0001) return "1:10²⁶";
            if (cameraZoom < 0.01) return "1:10²⁰";
            if (cameraZoom < 0.1) return "1:10¹⁰";
            if (cameraZoom < 1) return "1:10⁶";
            if (cameraZoom < 10) return "1:10³";
            if (cameraZoom < 100) return "1:10²";
            return "1:1";
        }

        function updateScaleIndicator() {
            scaleIndicator.textContent = `Масштаб: ${getScaleText()}`;
        }

        // Переход к следующей стадии
        function nextStage() {
            if (currentStage < STAGES.SOLAR_SYSTEM) {
                currentStage++;
                stageStartTime = Date.now();
                
                switch(currentStage) {
                    case STAGES.SINGULARITY:
                        targetZoom = 1;
                        singularitySize = 1;
                        break;
                    case STAGES.INFLATION:
                        targetZoom = 0.7;
                        inflationFactor = 1;
                        break;
                    case STAGES.BIG_BANG:
                        targetZoom = 0.5;
                        createBigBangParticles();
                        break;
                    case STAGES.GALAXY_FORMATION:
                        targetZoom = 0.4;
                        createHubbleGalaxies();
                        break;
                    case STAGES.HUBBLE_VOLUME:
                        targetZoom = 0.6;
                        break;
                    case STAGES.MILKY_WAY_VIEW:
                        targetZoom = 1.8;
                        targetPos = { x: milkyWay.x, y: milkyWay.y };
                        break;
                    case STAGES.SOLAR_SYSTEM:
                        targetZoom = 60; // Увеличили зум до 60
                        targetPos = { x: milkyWay.x + SOLAR_SYSTEM_DISTANCE, y: milkyWay.y };
                        break;
                }
                
                updateInfoText();
            }
        }

        function createBigBangParticles() {
            particles = [];
            for (let i = 0; i < MAX_PARTICLES; i++) {
                const angle = random() * TWO_PI;
                const speed = random() * 6 + 2;
                const hue = random() * 60 + 10;
                particles.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    vx: cos(angle) * speed,
                    vy: sin(angle) * speed,
                    size: random() * 4 + 2,
                    life: random() * 150 + 100,
                    color: `hsla(${hue}, 100%, ${random() * 30 + 50}%, 1)`,
                    trail: []
                });
            }
        }

        // Эффекты для стадии инфляции
        function drawInflationEffects() {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const time = Date.now() - stageStartTime;
            
            // Расширяющиеся кольца
            const ringProgress = (time % 2000) / 2000;
            if (ringProgress < 0.8) {
                const ringRadius = ringProgress * 500 * inflationFactor;
                const ringAlpha = 0.8 * (1 - ringProgress);
                
                ctx.strokeStyle = `hsla(200, 100%, 70%, ${ringAlpha})`;
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.arc(centerX, centerY, ringRadius, 0, TWO_PI);
                ctx.stroke();
            }
            
            // Градиентное свечение пространства
            const spaceGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, 400 * inflationFactor
            );
            spaceGradient.addColorStop(0, 'hsla(220, 80%, 60%, 0.1)');
            spaceGradient.addColorStop(0.5, 'hsla(240, 60%, 50%, 0.05)');
            spaceGradient.addColorStop(1, 'hsla(260, 40%, 40%, 0)');
            
            ctx.fillStyle = spaceGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 400 * inflationFactor, 0, TWO_PI);
            ctx.fill();
        }

        // Рисование области Хаббла с плавной анимацией
        function drawHubbleVolume() {
            const timeSinceStart = Date.now() - stageStartTime;
            const fadeDuration = 2000; // Длительность появления в мс
            const drawDuration = 3000; // Длительность рисования круга
            
            // Плавное появление текста
            if (timeSinceStart < fadeDuration) {
                ctx.globalAlpha = timeSinceStart / fadeDuration;
            } else {
                ctx.globalAlpha = 1;
            }
            
            // Текст
            ctx.fillStyle = 'rgba(200, 230, 255, 0.9)';
            ctx.font = `${max(14, 30 / cameraZoom)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('Область Хаббла', canvas.width / 2, canvas.height / 2 - HUBBLE_RADIUS - 50 / cameraZoom);
            
            // Плавное рисование круга
            ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
            ctx.lineWidth = 4 / cameraZoom;
            
            if (timeSinceStart < drawDuration) {
                // Анимация рисования круга
                const progress = timeSinceStart / drawDuration;
                const startAngle = -Math.PI/2; // Начинаем рисовать сверху
                const endAngle = startAngle + progress * TWO_PI;
                
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, HUBBLE_RADIUS, startAngle, endAngle);
                ctx.stroke();
                
                // Добавляем "хвостик" для эффекта рисования
                const tailLength = 0.2; // Длина хвоста в радианах
                const tailStart = Math.max(startAngle, endAngle - tailLength);
                
                if (endAngle > startAngle) {
                    ctx.lineWidth = 6 / cameraZoom;
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, HUBBLE_RADIUS, tailStart, endAngle);
                    ctx.stroke();
                }
            } else {
                // Полностью нарисованный круг с пунктиром
                ctx.setLineDash([20 / cameraZoom, 15 / cameraZoom]);
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, HUBBLE_RADIUS, 0, TWO_PI);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Фоновые галактики (появляются вместе с кругом)
            const galaxiesAlpha = min(0.6, timeSinceStart / fadeDuration * 0.6);
            ctx.globalAlpha = galaxiesAlpha;
            galaxies.forEach(galaxy => {
                ctx.fillStyle = galaxy.color;
                ctx.beginPath();
                
                if (galaxy.type === 0) {
                    ctx.arc(galaxy.x, galaxy.y, galaxy.size * 0.4, 0, TWO_PI);
                } else if (galaxy.type === 1) {
                    ctx.ellipse(galaxy.x, galaxy.y, galaxy.size * 0.5, galaxy.size * 0.3, galaxy.rotation, 0, TWO_PI);
                } else {
                    ctx.moveTo(galaxy.x, galaxy.y);
                    for (let i = 0; i < 5; i++) {
                        const angle = random() * TWO_PI;
                        const dist = galaxy.size * (0.3 + random() * 0.3);
                        ctx.lineTo(galaxy.x + cos(angle) * dist, galaxy.y + sin(angle) * dist);
                    }
                    ctx.closePath();
                }
                
                ctx.fill();
                
                ctx.fillStyle = `hsl(${random() * 30 + 200}, 80%, 60%)`;
                ctx.beginPath();
                ctx.arc(galaxy.x, galaxy.y, galaxy.size * 0.2, 0, TWO_PI);
                ctx.fill();
            });
            
            ctx.globalAlpha = 1;
        }

        // Применение камеры
        function applyCamera() {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, max(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, '#0a0e24');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (!isPaused) {
                let zoomSpeed;
if (currentStage === STAGES.MILKY_WAY_VIEW) {
    zoomSpeed = 0.003; // Медленнее при приближении к галактике
} else if (currentStage === STAGES.SOLAR_SYSTEM) {
    zoomSpeed = 0.002; // Еще медленнее при приближении к солнечной системе
} else {
    zoomSpeed = 0.01; // Стандартная скорость для других стадий
}
                cameraZoom += (targetZoom - cameraZoom) * zoomSpeed;
                
                cameraPos.x += (targetPos.x - cameraPos.x) * 0.01;
                cameraPos.y += (targetPos.y - cameraPos.y) * 0.01;
                
                if (currentStage === STAGES.INFLATION) {
                    singularitySize = min(400, 1 + (Date.now() - stageStartTime) / 10);
                    inflationFactor = min(100, 1 + (Date.now() - stageStartTime) / 50);
                }
                
                if (currentStage === STAGES.SOLAR_SYSTEM) {
                    milkyWay.alpha = max(0, 1 - (cameraZoom - 40) / 20); // Начинаем скрывать галактику при зуме >40
                    solarSystem.scale = min(1, (cameraZoom - 40) / 20); // Плавное появление солнечной системы
                    solarSystem.visible = solarSystem.scale > 0;
                } else {
                    milkyWay.alpha = 1;
                    solarSystem.visible = false;
                    solarSystem.scale = 0;
                }
            }
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(cameraZoom, cameraZoom);
            ctx.translate(-cameraPos.x, -cameraPos.y);
            
            updateScaleIndicator();
        }

        // Рисование Млечного Пути
        function drawMilkyWay() {
            if (!milkyWay.visible || milkyWay.alpha <= 0) return;
            
            ctx.globalAlpha = milkyWay.alpha;
            
            // Центральная перемычка (уменьшенная до 20% диаметра)
            const bulgeGradient = ctx.createRadialGradient(
                milkyWay.x, milkyWay.y, 0,
                milkyWay.x, milkyWay.y, milkyWay.size * 0.2
            );
            bulgeGradient.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
            bulgeGradient.addColorStop(0.7, 'rgba(255, 200, 100, 0.4)');
            bulgeGradient.addColorStop(1, 'rgba(255, 180, 80, 0.1)');
            
            ctx.fillStyle = bulgeGradient;
            ctx.beginPath();
            ctx.arc(milkyWay.x, milkyWay.y, milkyWay.size * 0.2, 0, TWO_PI);
            ctx.fill();
            
            // Звезды в рукавах
            const time = Date.now() * 0.001;
            milkyWay.arms.forEach(arm => {
                const step = isMobile ? 3 : 2;
                for (let i = 0; i < arm.stars.length; i += step) {
                    const star = arm.stars[i];
                    const twinkleFactor = 0.8 + 0.2 * sin(time * 3 + star.twinkle);
                    ctx.globalAlpha = star.brightness * twinkleFactor * milkyWay.alpha;
                    
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size / cameraZoom, 0, TWO_PI);
                    ctx.fill();
                }
            });
            
            // Спиральные рукава
            ctx.strokeStyle = 'rgba(180, 220, 255, 0.3)';
            ctx.lineWidth = 10 / cameraZoom;
            milkyWay.arms.forEach(arm => {
                ctx.beginPath();
                const step = isMobile ? 3 : 2;
                for (let i = 0; i < arm.spiral.length; i += step) {
                    const point = arm.spiral[i];
                    const adjustedX = milkyWay.x + (point.x - milkyWay.x) * cos(milkyWay.rotation) - (point.y - milkyWay.y) * sin(milkyWay.rotation);
                    const adjustedY = milkyWay.y + (point.x - milkyWay.x) * sin(milkyWay.rotation) + (point.y - milkyWay.y) * cos(milkyWay.rotation);
                    
                    if (i === 0) {
                        ctx.moveTo(adjustedX, adjustedY);
                    } else {
                        ctx.lineTo(adjustedX, adjustedY);
                    }
                }
                ctx.stroke();
            });
            
            if (!isPaused) {
                milkyWay.rotation += 0.0002;
            }
            
            ctx.globalAlpha = 1;
        }

        // Красивые эффекты для сингулярности
        function drawSingularity() {
            const time = Date.now() * 0.001;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            const outerGlow = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, 100
            );
            outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
            outerGlow.addColorStop(0.3, 'rgba(200, 240, 255, 0.3)');
            outerGlow.addColorStop(1, 'rgba(100, 180, 255, 0)');
            
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 100, 0, TWO_PI);
            ctx.fill();
            
            const middleGlow = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, 50
            );
            middleGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            middleGlow.addColorStop(0.7, 'rgba(255, 200, 150, 0.6)');
            middleGlow.addColorStop(1, 'rgba(255, 150, 100, 0)');
            
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = middleGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 50, 0, TWO_PI);
            ctx.fill();
            
            const pulse = 0.8 + 0.2 * sin(time * 5);
            const coreGlow = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, 20 * pulse
            );
            coreGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
            coreGlow.addColorStop(1, 'rgba(255, 200, 150, 0.9)');
            
            ctx.globalAlpha = 1;
            ctx.fillStyle = coreGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 15 * pulse, 0, TWO_PI);
            ctx.fill();
            
            if (!isPaused && random() < 0.1) {
                const angle = random() * TWO_PI;
                const dist = random() * 70 + 30;
                const size = random() * 5 + 2;
                
                ctx.globalAlpha = random() * 0.5 + 0.5;
                ctx.fillStyle = `hsl(${random() * 60 + 10}, 100%, 80%)`;
                ctx.beginPath();
                ctx.arc(
                    centerX + cos(angle) * dist,
                    centerY + sin(angle) * dist,
                    size, 0, TWO_PI
                );
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
        }

        // Рисование Солнечной системы
        function drawSolarSystem() {
            if (!solarSystem.visible || solarSystem.scale <= 0) return;
            
            ctx.globalAlpha = solarSystem.scale;
            
            // Солнце
            const sunGradient = ctx.createRadialGradient(
                solarSystem.x, solarSystem.y, 0,
                solarSystem.x, solarSystem.y, 50 / cameraZoom
            );
            sunGradient.addColorStop(0, '#ffff00');
            sunGradient.addColorStop(0.7, '#ffcc00');
            sunGradient.addColorStop(1, '#ff6600');
            
            ctx.globalAlpha = 0.4 * solarSystem.scale;
            ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(solarSystem.x, solarSystem.y, 60 / cameraZoom, 0, TWO_PI);
            ctx.fill();
            
            ctx.globalAlpha = solarSystem.scale;
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(solarSystem.x, solarSystem.y, 50 / cameraZoom, 0, TWO_PI);
            ctx.fill();
            
            // Планеты
            solarSystem.planets.forEach(planet => {
                if (!isPaused) {
                    planet.angle += planet.speed * 0.1;
                }
                
                if (cameraZoom > 25) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * solarSystem.scale})`;
                    ctx.lineWidth = 1 / cameraZoom;
                    ctx.beginPath();
                    ctx.arc(solarSystem.x, solarSystem.y, planet.distance / cameraZoom, 0, TWO_PI);
                    ctx.stroke();
                }
                
                const planetX = solarSystem.x + cos(planet.angle) * planet.distance / cameraZoom;
                const planetY = solarSystem.y + sin(planet.angle) * planet.distance / cameraZoom;
                
                ctx.globalAlpha = solarSystem.scale;
                ctx.fillStyle = planet.color;
                ctx.beginPath();
                ctx.arc(planetX, planetY, planet.size / cameraZoom, 0, TWO_PI);
                ctx.fill();
                
                if (planet.rings && cameraZoom > 30) {
                    ctx.save();
                    ctx.translate(planetX, planetY);
                    ctx.rotate(planet.angle * 3);
                    
                    ctx.strokeStyle = `rgba(210, 180, 140, ${0.5 * solarSystem.scale})`;
                    ctx.lineWidth = 2 / cameraZoom;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, planet.size * 2 / cameraZoom, planet.size * 0.9 / cameraZoom, 0, 0, TWO_PI);
                    ctx.stroke();
                    
                    ctx.restore();
                }
                
                if (cameraZoom > 30) {
                    ctx.fillStyle = planet.color;
                    ctx.font = `${14 / cameraZoom}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        planet.name,
                        planetX,
                        planetY + 25 / cameraZoom
                    );
                }
            });
            
            ctx.globalAlpha = 1;
        }

        // Основной цикл анимации
        function animate() {
            if (!isAnimating) return;
            
            requestAnimationFrame(animate);
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            applyCamera();
            
            switch(currentStage) {
                case STAGES.QUANTUM_FLUCTUATIONS:
                    vacuumParticles.forEach(p => {
                        if (!isPaused) {
                            p.x += p.vx;
                            p.y += p.vy;
                            p.life--;
                            p.alpha = min(1, p.alpha + 0.01);
                            p.glow = 0.5 + 0.5 * sin(Date.now() * 0.005 + p.x * 0.1);
                            
                            if (p.life <= 0) {
                                p.x = random() * canvas.width;
                                p.y = random() * canvas.height;
                                p.life = random() * 100 + 50;
                                p.alpha = 0;
                            }
                        }
                        
                        ctx.globalAlpha = p.alpha * (p.life / p.maxLife);
                        ctx.fillStyle = p.isParticle ? '#00ffff' : '#ff00ff';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
                        ctx.fill();
                    });
                    
                    if (currentTime - stageStartTime > 5000 && !isPaused) {
                        nextStage();
                    }
                    break;
                    
                case STAGES.SINGULARITY:
                    drawSingularity();
                    
                    if (currentTime - stageStartTime > 5000 && !isPaused) {
                        nextStage();
                    }
                    break;
                    
                case STAGES.INFLATION:
                    const gradient = ctx.createRadialGradient(
                        canvas.width / 2, canvas.height / 2, 0,
                        canvas.width / 2, canvas.height / 2, singularitySize
                    );
                    gradient.addColorStop(0, 'rgba(150, 200, 255, 0.9)');
                    gradient.addColorStop(0.3, 'rgba(100, 180, 255, 0.7)');
                    gradient.addColorStop(0.7, 'rgba(50, 150, 255, 0.4)');
                    gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2, canvas.height / 2, singularitySize, 0, TWO_PI);
                    ctx.fill();
                    
                    drawInflationEffects();
                    
                    if (currentTime - stageStartTime > 5000 && !isPaused) {
                        nextStage();
                    }
                    break;
                    
                case STAGES.BIG_BANG:
                    const step = isMobile ? 3 : 2;
                    for (let i = 0; i < particles.length; i += step) {
                        const p = particles[i];
                        if (!isPaused) {
                            p.x += p.vx;
                            p.y += p.vy;
                            p.life--;
                        }
                        
                        ctx.globalAlpha = min(1, p.life / 150);
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
                        ctx.fill();
                    }
                    
                    particles = particles.filter(p => p.life > 0);
                    ctx.globalAlpha = 1;
                    
                    if (currentTime - stageStartTime > 5000 && !isPaused) {
                        nextStage();
                    }
                    break;
                    
                case STAGES.GALAXY_FORMATION:
                    const galaxyStep = isMobile ? 3 : 2;
                    for (let i = 0; i < galaxies.length; i += galaxyStep) {
                        const galaxy = galaxies[i];
                        if (!isPaused) {
                            galaxy.rotation += galaxy.speed;
                        }
                        
                        ctx.save();
                        ctx.translate(galaxy.x, galaxy.y);
                        ctx.rotate(galaxy.rotation);
                        
                        ctx.globalAlpha = 0.8;
                        ctx.fillStyle = galaxy.color;
                        ctx.beginPath();
                        
                        if (galaxy.type === 0) {
                            ctx.arc(0, 0, galaxy.size * 0.4, 0, TWO_PI);
                        } else if (galaxy.type === 1) {
                            ctx.ellipse(0, 0, galaxy.size * 0.5, galaxy.size * 0.3, 0, 0, TWO_PI);
                        } else {
                            ctx.moveTo(0, 0);
                            for (let i = 0; i < 5; i++) {
                                const angle = random() * TWO_PI;
                                const dist = galaxy.size * (0.3 + random() * 0.3);
                                ctx.lineTo(cos(angle) * dist, sin(angle) * dist);
                            }
                            ctx.closePath();
                        }
                        
                        ctx.fill();
                        ctx.restore();
                    }
                    
                    if (currentTime - stageStartTime > 5000 && !isPaused) {
                        nextStage();
                    }
                    break;
                    
                case STAGES.HUBBLE_VOLUME:
                    drawHubbleVolume();
                    
                    if (currentTime - stageStartTime > 5000 && !isPaused) {
                        nextStage();
                    }
                    break;
                    
                case STAGES.MILKY_WAY_VIEW:
                    drawMilkyWay();
                    
                    if (currentTime - stageStartTime > 5000 && !isPaused) {
                        nextStage();
                    }
                    break;
                    
                case STAGES.SOLAR_SYSTEM:
                    drawMilkyWay();
                    drawSolarSystem();
                    break;
            }
            
            pauseOverlay.style.display = isPaused ? 'flex' : 'none';
        }

        // Обработчики событий
        restartBtn.addEventListener('click', init);
        nextBtn.addEventListener('click', nextStage);
        pauseBtn.addEventListener('click', function() {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? "Продолжить" : "Пауза";
            pauseOverlay.style.display = isPaused ? 'flex' : 'none';
        });
        
        window.addEventListener('resize', () => {
            resizeCanvas();
            init();
        });

        // Запуск
        init();