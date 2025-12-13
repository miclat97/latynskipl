// Game Configuration
let TILE_SIZE = 40;
let WORLD_WIDTH = 2000;
let WORLD_HEIGHT = 2000;
let PLAYER_SPEED = 5;
let GAME_DURATION = 60; // seconds

let canvas, ctx;
let score = 0;
let timeLeft = GAME_DURATION;
let scoreElement, timerElement, messageElement, brawoElement;
let gameLoopId;
let lastTime = 0;
let timerInterval;

// Assets
const faceImage = new Image();
faceImage.src = 'face.jpeg';

// Game State
const STATE = {
    MENU: 0,
    OVERWORLD: 1,
    HOUSE: 2,
    GAME_OVER: 3
};
let currentState = STATE.MENU;

// Input State
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false
};

// Camera
const camera = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

// Game Objects
const player = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    color: 'black',
    speed: PLAYER_SPEED,
    dx: 0,
    dy: 0,
    direction: 1 // 1 right, -1 left
};

// Current Active World Data
let currentWalls = [];
let currentCollectibles = []; // Was currentBananas
let currentDoors = []; // Used for entering/leaving
let worldBounds = { w: WORLD_WIDTH, h: WORLD_HEIGHT };

// Persistent World Data
const overworld = {
    walls: [],
    collectibles: [],
    houses: []
};

// Store house interiors
const interiors = [];

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    timerElement = document.getElementById('timer');
    messageElement = document.getElementById('message');
    brawoElement = document.getElementById('brawo-message');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Setup Inputs
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    setupTouchControls();

    // Setup Menu
    document.getElementById('btn-start').addEventListener('click', startGameFromMenu);

    // Initial render (show menu implicitly by not running loop yet or just render once)
    draw();
}

function startGameFromMenu() {
    // Read settings
    const timeVal = parseInt(document.getElementById('setting-time').value);
    const difficulty = document.getElementById('setting-difficulty').value;
    const sizeVal = document.getElementById('setting-size').value;
    const speedVal = parseInt(document.getElementById('setting-speed').value);

    // Apply Settings
    GAME_DURATION = timeVal;
    PLAYER_SPEED = speedVal;
    player.speed = PLAYER_SPEED;

    if (sizeVal === 'small') {
        WORLD_WIDTH = 1000; WORLD_HEIGHT = 1000;
    } else if (sizeVal === 'medium') {
        WORLD_WIDTH = 2000; WORLD_HEIGHT = 2000;
    } else {
        WORLD_WIDTH = 4000; WORLD_HEIGHT = 4000;
    }

    // Hide Menu, Show UI
    document.getElementById('menu-layer').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'block';
    // Show mobile controls if touch device (simple check)
    // We'll leave it simple: just show them. CSS media query handles desktop hiding if wanted
    document.getElementById('mobile-controls').style.display = 'flex';

    startNewGame(difficulty);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.width = canvas.width;
    camera.height = canvas.height;
}

function startNewGame(difficulty) {
    score = 0;
    timeLeft = GAME_DURATION;
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;
    messageElement.innerText = "";
    brawoElement.classList.add('hidden');

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (currentState === STATE.OVERWORLD || currentState === STATE.HOUSE) {
            timeLeft--;
            timerElement.innerText = timeLeft;
            if (timeLeft <= 0) {
                gameOver();
            }
        }
    }, 1000);

    generateOverworld(difficulty);
    enterOverworld();

    currentState = STATE.OVERWORLD;
    lastTime = performance.now();
    gameLoop();
}

function gameOver() {
    currentState = STATE.GAME_OVER;
    clearInterval(timerInterval);
    messageElement.innerText = "KONIEC GRY! Twój wynik: " + score + ". Odśwież stronę.";
    // Optionally show menu again after a delay
}

function handleKey(e, isDown) {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key] = isDown;
    }
}

function setupTouchControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    const addTouch = (elem, key) => {
        elem.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
        elem.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
        elem.addEventListener('mousedown', (e) => { keys[key] = true; });
        elem.addEventListener('mouseup', (e) => { keys[key] = false; });
    };

    addTouch(btnUp, 'ArrowUp');
    addTouch(btnDown, 'ArrowDown');
    addTouch(btnLeft, 'ArrowLeft');
    addTouch(btnRight, 'ArrowRight');
}

// --- Generation Logic ---

function checkCollision(x, y, w, h, obstacles) {
    for (const obs of obstacles) {
        if (rectIntersect(x, y, w, h, obs.x, obs.y, obs.width, obs.height)) {
            return true;
        }
    }
    return false;
}

function getSafePosition(w, h, obstacles, boundsW, boundsH) {
    let safe = false;
    let x, y;
    let attempts = 0;
    while (!safe && attempts < 1000) {
        x = Math.random() * (boundsW - w);
        y = Math.random() * (boundsH - h);
        if (!checkCollision(x, y, w, h, obstacles)) {
            safe = true;
        }
        attempts++;
    }
    return { x, y };
}

function generateOverworld(difficulty) {
    overworld.walls = [];
    overworld.collectibles = [];
    overworld.houses = [];
    interiors.length = 0;

    // Difficulty Modifiers
    let houseCount = 8;
    let treeCount = 30;
    let itemLimit = 20;

    if (difficulty === 'easy') {
        houseCount = 5; treeCount = 15; itemLimit = 30;
    } else if (difficulty === 'hard') {
        houseCount = 12; treeCount = 50; itemLimit = 15;
    }

    // Scale somewhat with world size too
    const areaScale = (WORLD_WIDTH * WORLD_HEIGHT) / (2000 * 2000);
    houseCount = Math.floor(houseCount * areaScale);
    treeCount = Math.floor(treeCount * areaScale);
    itemLimit = Math.floor(itemLimit * areaScale);

    // Generate Houses (Exterior)
    for (let i = 0; i < houseCount; i++) {
        let w = 200 + Math.random() * 100;
        let h = 150 + Math.random() * 100;
        let pos = getSafePosition(w, h, overworld.houses, WORLD_WIDTH, WORLD_HEIGHT);

        const house = {
            id: i,
            x: pos.x,
            y: pos.y,
            width: w,
            height: h,
            color: '#795548',
            door: {
                x: pos.x + w/2 - 20,
                y: pos.y + h - 10,
                width: 40,
                height: 15
            }
        };
        overworld.houses.push(house);
        generateInterior(i);
    }

    // Obstacles
    const obstacles = [...overworld.houses];
    for (let i = 0; i < treeCount; i++) {
        let w = 40 + Math.random() * 40;
        let h = 40 + Math.random() * 40;
        let pos = getSafePosition(w, h, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
        const tree = {
            x: pos.x,
            y: pos.y,
            width: w,
            height: h,
            color: '#2e7d32'
        };
        overworld.walls.push(tree);
        obstacles.push(tree);
    }

    // Spawn Collectibles (Bananas, Apples, etc.)
    for (let i = 0; i < itemLimit; i++) {
        spawnCollectible(overworld.collectibles, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
    }

    // Spawn Special Character (Face) - rare
    // 10% chance per 2000x2000 area? Or just spawn 1-3.
    const specialCount = Math.max(1, Math.floor(3 * areaScale)); // 1 to 3 depending on size
    for(let i=0; i<specialCount; i++) {
        // Low chance to actually appear? User said "sometimes (but not very often)".
        // Let's just spawn them, but maybe in obscure places.
        // Or we could use a random chance to decide IF we spawn them.
        if (Math.random() > 0.3) { // 70% chance to spawn at least one
             spawnSpecial(overworld.collectibles, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
        }
    }

    // Player Start
    let pPos = getSafePosition(player.width, player.height, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
    player.x = pPos.x;
    player.y = pPos.y;
}

function spawnCollectible(list, obstacles, w, h) {
    let pos = getSafePosition(20, 20, obstacles, w, h);

    // Random Type
    const r = Math.random();
    let type = 'banana';
    let color = '#ffeb3b';
    let points = 1;

    if (r > 0.7 && r < 0.9) {
        type = 'apple';
        color = '#f44336'; // Red
        points = 2;
    } else if (r >= 0.9) {
        type = 'cherry';
        color = '#9c27b0'; // Purple/Dark Red
        points = 3;
    }

    list.push({
        type: type,
        x: pos.x,
        y: pos.y,
        size: 15,
        color: color,
        points: points
    });
}

function spawnSpecial(list, obstacles, w, h) {
    let pos = getSafePosition(40, 40, obstacles, w, h);
    list.push({
        type: 'special',
        x: pos.x,
        y: pos.y,
        size: 25, // bigger
        points: 10
    });
}

function generateInterior(houseId) {
    const w = 800;
    const h = 600;
    const walls = [];
    const items = [];

    const furnitureCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < furnitureCount; i++) {
        let fw = 50 + Math.random() * 80;
        let fh = 50 + Math.random() * 80;
        let pos = getSafePosition(fw, fh, walls, w, h);
        if (Math.abs(pos.x - w/2) < 60 && pos.y > h - 100) continue;

        walls.push({
            x: pos.x,
            y: pos.y,
            width: fw,
            height: fh,
            color: '#5d4037'
        });
    }

    for (let i = 0; i < 5; i++) {
        spawnCollectible(items, walls, w, h);
    }

    // Rare chance for special in house too
    if (Math.random() < 0.1) {
        spawnSpecial(items, walls, w, h);
    }

    interiors[houseId] = {
        width: w,
        height: h,
        walls: walls,
        collectibles: items,
        door: {
            x: w/2 - 20,
            y: h - 10,
            width: 40,
            height: 20
        }
    };
}

function enterOverworld() {
    currentState = STATE.OVERWORLD;
    currentWalls = overworld.walls;
    currentCollectibles = overworld.collectibles;
    worldBounds = { w: WORLD_WIDTH, h: WORLD_HEIGHT };

    currentWalls = [...overworld.walls, ...overworld.houses];

    currentDoors = overworld.houses.map(h => ({
        ...h.door,
        targetId: h.id,
        type: 'enter'
    }));
}

function enterHouse(houseId) {
    currentState = STATE.HOUSE;
    const interior = interiors[houseId];
    currentWalls = interior.walls;
    currentCollectibles = interior.collectibles;
    worldBounds = { w: interior.width, h: interior.height };

    player.x = interior.door.x;
    player.y = interior.door.y - player.height - 10;

    currentDoors = [{
        ...interior.door,
        targetId: houseId,
        type: 'exit'
    }];
}

function update(dt) {
    if (currentState === STATE.GAME_OVER || currentState === STATE.MENU) return;

    // Movement
    player.dx = 0;
    player.dy = 0;

    if (keys.ArrowUp || keys.w) player.dy = -player.speed;
    if (keys.ArrowDown || keys.s) player.dy = player.speed;
    if (keys.ArrowLeft || keys.a) {
        player.dx = -player.speed;
        player.direction = -1;
    }
    if (keys.ArrowRight || keys.d) {
        player.dx = player.speed;
        player.direction = 1;
    }

    if (player.dx !== 0 && player.dy !== 0) {
        player.dx *= 0.707;
        player.dy *= 0.707;
    }

    let nextX = player.x + player.dx;
    let nextY = player.y + player.dy;

    // Bounds
    if (nextX < 0) nextX = 0;
    if (nextX + player.width > worldBounds.w) nextX = worldBounds.w - player.width;
    if (nextY < 0) nextY = 0;
    if (nextY + player.height > worldBounds.h) nextY = worldBounds.h - player.height;

    // Collision
    let hitWallX = false;
    let hitWallY = false;

    for (const wall of currentWalls) {
        if (rectIntersect(nextX, player.y, player.width, player.height, wall.x, wall.y, wall.width, wall.height)) {
            hitWallX = true;
            break;
        }
    }
    for (const wall of currentWalls) {
        if (rectIntersect(player.x, nextY, player.width, player.height, wall.x, wall.y, wall.width, wall.height)) {
            hitWallY = true;
            break;
        }
    }

    if (!hitWallX) player.x = nextX;
    if (!hitWallY) player.y = nextY;

    // Camera
    camera.x = player.x - camera.width / 2 + player.width / 2;
    camera.y = player.y - camera.height / 2 + player.height / 2;
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;
    if (camera.x + camera.width > worldBounds.w) camera.x = worldBounds.w - camera.width;
    if (camera.y + camera.height > worldBounds.h) camera.y = worldBounds.h - camera.height;

    // Collectibles
    for (let i = currentCollectibles.length - 1; i >= 0; i--) {
        const c = currentCollectibles[i];
        const dist = Math.hypot((player.x + player.width/2) - c.x, (player.y + player.height/2) - c.y);

        // Hitbox size logic
        let hitDist = player.width/2 + c.size;

        if (dist < hitDist) {
            // Collect
            score += c.points;
            scoreElement.innerText = score;

            if (c.type === 'special') {
                showBrawo();
            }

            currentCollectibles.splice(i, 1);
        }
    }

    // Doors
    for (const door of currentDoors) {
        if (rectIntersect(player.x, player.y, player.width, player.height, door.x, door.y, door.width, door.height)) {
            if (door.type === 'enter') {
                enterHouse(door.targetId);
            } else if (door.type === 'exit') {
                const house = overworld.houses[door.targetId];
                enterOverworld();
                player.x = house.door.x;
                player.y = house.door.y + 20;
            }
            break;
        }
    }
}

function showBrawo() {
    brawoElement.classList.remove('hidden');
    // Hide after 2 seconds
    setTimeout(() => {
        brawoElement.classList.add('hidden');
    }, 2000);
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentState === STATE.MENU) {
        // Just clear, HTML menu is overlay
        return;
    }

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // BG
    if (currentState === STATE.HOUSE) {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, worldBounds.w, worldBounds.h);
        drawGrid('#ccc');
    } else {
        ctx.fillStyle = '#8bc34a';
        ctx.fillRect(0, 0, worldBounds.w, worldBounds.h);
        drawGrid('rgba(0,0,0,0.1)');
    }

    // Houses
    if (currentState === STATE.OVERWORLD) {
        for (const house of overworld.houses) {
            ctx.fillStyle = house.color;
            ctx.fillRect(house.x, house.y, house.width, house.height);
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2;
            ctx.strokeRect(house.x, house.y, house.width, house.height);

            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.moveTo(house.x - 10, house.y);
            ctx.lineTo(house.x + house.width/2, house.y - 40);
            ctx.lineTo(house.x + house.width + 10, house.y);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('DOM SĄSIADA', house.x + house.width/2, house.y + house.height/2);

            ctx.fillStyle = '#4e342e';
            ctx.fillRect(house.door.x, house.door.y, house.door.width, house.door.height);
        }
    }

    // Walls
    for (const wall of currentWalls) {
        if (wall.id !== undefined && currentState === STATE.OVERWORLD) continue;
        ctx.fillStyle = wall.color;
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Doors Inside
    if (currentState === STATE.HOUSE) {
        for (const door of currentDoors) {
            ctx.fillStyle = 'black';
            ctx.fillRect(door.x, door.y, door.width, door.height);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText('EXIT', door.x + door.width/2, door.y + 12);
        }
    }

    // Collectibles
    for (const c of currentCollectibles) {
        if (c.type === 'special') {
            // Draw face image
            ctx.save();
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI*2);
            ctx.clip();
            ctx.drawImage(faceImage, c.x - c.size, c.y - c.size, c.size*2, c.size*2);
            ctx.restore();
            // glow
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI*2);
            ctx.stroke();
        } else {
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Stem for fruit
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - c.size);
            if (c.type === 'banana') {
                 ctx.lineTo(c.x + 5, c.y - c.size - 5);
            } else {
                 ctx.lineTo(c.x, c.y - c.size - 5);
            }
            ctx.stroke();
        }
    }

    // Player
    drawPlayer();

    ctx.restore();

    // Game Over Overlay handled in update logic or check here
    if (currentState === STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KONIEC GRY', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '24px Arial';
        ctx.fillText('Wynik: ' + score, canvas.width/2, canvas.height/2 + 20);
    }
}

function drawGrid(color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for(let x=0; x<worldBounds.w; x+=TILE_SIZE) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, worldBounds.h); ctx.stroke();}
    for(let y=0; y<worldBounds.h; y+=TILE_SIZE) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(worldBounds.w, y); ctx.stroke();}
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    if (player.direction === -1) {
        ctx.scale(-1, 1);
    }

    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.width/2, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(-15, -25);
    ctx.lineTo(-2, -14);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(15, -25);
    ctx.lineTo(2, -14);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-6, -2, 4, 6, 0, 0, Math.PI*2);
    ctx.ellipse(6, -2, 4, 6, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(-6, -2, 2, 0, Math.PI*2);
    ctx.arc(6, -2, 2, 0, Math.PI*2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, 5); ctx.lineTo(-20, 5);
    ctx.moveTo(-5, 8); ctx.lineTo(-20, 10);
    ctx.moveTo(5, 5); ctx.lineTo(20, 5);
    ctx.moveTo(5, 8); ctx.lineTo(20, 10);
    ctx.stroke();

    ctx.restore();
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

window.onload = init;
