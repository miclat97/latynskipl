/* koci_bananiarz/game.js - ES5 / EdgeHTML-friendly */

(function () {
  // --- Polyfills / fallbacki dla starszych przeglądarek (EdgeHTML/Win10M) ---
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame =
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame =
      window.webkitCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function (id) { clearTimeout(id); };
  }

  // performance.now fallback
  if (!window.performance) window.performance = {};
  if (!window.performance.now) {
    window.performance.now = function () { return Date.now(); };
  }

  function hypot2(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  }

  function clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  // --- Konfiguracja gry ---
  var TILE_SIZE = 40;
  var WORLD_WIDTH = 2000;
  var WORLD_HEIGHT = 2000;
  var PLAYER_SPEED = 5;
  var GAME_DURATION = 60; // seconds

  var canvas, ctx;
  var score = 0;
  var timeLeft = GAME_DURATION;
  var scoreElement, timerElement, messageElement, brawoElement;
  var gameLoopId = null;
  var lastTime = 0;
  var timerInterval = null;

  // Assets
  var faceImage = new Image();
  faceImage.src = 'face.jpeg';

  // Game State
  var STATE = { MENU: 0, OVERWORLD: 1, HOUSE: 2, GAME_OVER: 3 };
  var currentState = STATE.MENU;

  // Input State
  var keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false
  };

  // Camera
  var camera = { x: 0, y: 0, width: 0, height: 0 };

  // Player
  var player = {
    x: 0, y: 0,
    width: 30, height: 30,
    color: 'black',
    speed: PLAYER_SPEED,
    dx: 0, dy: 0,
    direction: 1 // 1 right, -1 left
  };

  // Dog
  var dogs = []; // Array of dog objects

  // Current Active World Data
  var currentWalls = [];
  var currentCollectibles = [];
  var currentDoors = [];
  var worldBounds = { w: WORLD_WIDTH, h: WORLD_HEIGHT };

  // Persistent World Data
  var overworld = { walls: [], collectibles: [], houses: [] };
  var interiors = [];

  // --- Start ---
  function init() {
    // Expose for testing
    window.__TEST_ACCESS__ = {
      player: player,
      dogs: dogs,
      getScore: function() { return score; },
      setScore: function(s) { score = s; scoreElement.innerText = score; },
      overworld: overworld
    };

    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    scoreElement = document.getElementById('score');
    timerElement = document.getElementById('timer');
    messageElement = document.getElementById('message');
    brawoElement = document.getElementById('brawo-message');

    // Restart button
    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
        btnRestart.addEventListener('click', function() {
            window.location.reload();
        });
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Inputs
    window.addEventListener('keydown', function (e) { handleKey(e, true); });
    window.addEventListener('keyup', function (e) { handleKey(e, false); });
    setupTouchControls();

    // Menu
    var btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.addEventListener('click', startGameFromMenu);

    draw();
  }

  function startGameFromMenu() {
    // Read settings
    var timeVal = parseInt(document.getElementById('setting-time').value, 10);
    var difficulty = document.getElementById('setting-difficulty').value;
    var sizeVal = document.getElementById('setting-size').value;
    var speedVal = parseInt(document.getElementById('setting-speed').value, 10);

    if (!isFinite(timeVal) || timeVal <= 0) timeVal = 60;
    if (!isFinite(speedVal) || speedVal <= 0) speedVal = 5;

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
    var menuLayer = document.getElementById('menu-layer');
    var uiLayer = document.getElementById('ui-layer');
    var mobileControls = document.getElementById('mobile-controls');

    if (menuLayer) menuLayer.style.display = 'none';
    if (uiLayer) uiLayer.style.display = 'block';
    if (mobileControls) mobileControls.style.display = 'flex';

    startNewGame(difficulty);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth || document.documentElement.clientWidth || 320;
    canvas.height = window.innerHeight || document.documentElement.clientHeight || 480;
    camera.width = canvas.width;
    camera.height = canvas.height;
  }

  function startNewGame(difficulty) {
    score = 0;
    timeLeft = GAME_DURATION;

    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;
    messageElement.innerText = '';
    if (brawoElement && brawoElement.classList) brawoElement.classList.add('hidden');
    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.style.display = 'none';

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(function () {
      if (currentState === STATE.OVERWORLD || currentState === STATE.HOUSE) {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) gameOver();
      }
    }, 1000);

    generateOverworld(difficulty);
    enterOverworld();
    currentState = STATE.OVERWORLD;

    lastTime = window.performance.now();
    gameLoop(lastTime);
  }

  function gameOver() {
    currentState = STATE.GAME_OVER;
    if (timerInterval) clearInterval(timerInterval);
    messageElement.innerText = 'KONIEC GRY! Twój wynik: ' + score + '.';
    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.style.display = 'block';
  }

  function handleKey(e, isDown) {
    if (!e || !e.key) return;
    var k = e.key;
    var kl = (k && k.toLowerCase) ? k.toLowerCase() : k;

    if (keys.hasOwnProperty(k)) keys[k] = isDown;
    if (keys.hasOwnProperty(kl)) keys[kl] = isDown;
  }

  function setupTouchControls() {
    var btnUp = document.getElementById('btn-up');
    var btnDown = document.getElementById('btn-down');
    var btnLeft = document.getElementById('btn-left');
    var btnRight = document.getElementById('btn-right');

    function addTouch(elem, key) {
      if (!elem) return;

      elem.addEventListener('touchstart', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        keys[key] = true;
      }, { passive: false });

      elem.addEventListener('touchend', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        keys[key] = false;
      }, { passive: false });

      elem.addEventListener('touchcancel', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        keys[key] = false;
      }, { passive: false });

      elem.addEventListener('mousedown', function () { keys[key] = true; });
      elem.addEventListener('mouseup', function () { keys[key] = false; });
      elem.addEventListener('mouseleave', function () { keys[key] = false; });
    }

    addTouch(btnUp, 'ArrowUp');
    addTouch(btnDown, 'ArrowDown');
    addTouch(btnLeft, 'ArrowLeft');
    addTouch(btnRight, 'ArrowRight');
  }

  // --- Generation Logic ---
  function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (x2 < x1 + w1) && (x2 + w2 > x1) && (y2 < y1 + h1) && (y2 + h2 > y1);
  }

  function checkCollision(x, y, w, h, obstacles) {
    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      if (rectIntersect(x, y, w, h, obs.x, obs.y, obs.width, obs.height)) return true;
    }
    return false;
  }

  function getSafePosition(w, h, obstacles, boundsW, boundsH) {
    var safe = false;
    var x = 0, y = 0;
    var attempts = 0;

    while (!safe && attempts < 1000) {
      x = Math.random() * (boundsW - w);
      y = Math.random() * (boundsH - h);
      if (!checkCollision(x, y, w, h, obstacles)) safe = true;
      attempts++;
    }

    return { x: x, y: y };
  }

  function generateOverworld(difficulty) {
    overworld.walls = [];
    overworld.collectibles = [];
    overworld.houses = [];
    interiors.length = 0;
    dogs.length = 0;

    // Difficulty Modifiers
    var houseCount = 8;
    var treeCount = 30;
    var itemLimit = 20;

    if (difficulty === 'easy') {
      houseCount = 5; treeCount = 15; itemLimit = 30;
    } else if (difficulty === 'hard') {
      houseCount = 12; treeCount = 50; itemLimit = 15;
    }

    var areaScale = (WORLD_WIDTH * WORLD_HEIGHT) / (2000 * 2000);
    houseCount = Math.floor(houseCount * areaScale);
    treeCount = Math.floor(treeCount * areaScale);
    itemLimit = Math.floor(itemLimit * areaScale);

    if (houseCount < 1) houseCount = 1;
    if (treeCount < 1) treeCount = 1;
    if (itemLimit < 1) itemLimit = 1;

    // Generate Houses
    for (var i = 0; i < houseCount; i++) {
      var w = 200 + Math.random() * 100;
      var h = 150 + Math.random() * 100;

      // Uwaga: tu przeszkodą są same domy, żeby się nie nakładały
      var pos = getSafePosition(w, h, overworld.houses, WORLD_WIDTH, WORLD_HEIGHT);

      var house = {
        id: i,
        x: pos.x, y: pos.y,
        width: w, height: h,
        color: '#795548',
        door: { x: pos.x + w / 2 - 20, y: pos.y + h - 10, width: 40, height: 15 }
      };

      overworld.houses.push(house);
      generateInterior(i);
    }

    // obstacles = domy + drzewa
    var obstacles = [];
    for (var oi = 0; oi < overworld.houses.length; oi++) obstacles.push(overworld.houses[oi]);

    for (var t = 0; t < treeCount; t++) {
      var tw = 40 + Math.random() * 40;
      var th = 40 + Math.random() * 40;
      var tpos = getSafePosition(tw, th, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
      var tree = { x: tpos.x, y: tpos.y, width: tw, height: th, color: '#2e7d32' };
      overworld.walls.push(tree);
      obstacles.push(tree);
    }

    for (var it = 0; it < itemLimit; it++) {
      spawnCollectible(overworld.collectibles, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
    }

    var specialCount = Math.floor(3 * areaScale);
    if (specialCount < 1) specialCount = 1;

    for (var sp = 0; sp < specialCount; sp++) {
      if (Math.random() > 0.3) {
        spawnSpecial(overworld.collectibles, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
      }
    }

    // Player Start
    var pPos = getSafePosition(player.width, player.height, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
    player.x = pPos.x;
    player.y = pPos.y;

    // Dog Start
    var dogCount = 1;
    if (difficulty === 'easy') dogCount = 0;
    if (difficulty === 'hard') dogCount = 2;

    for (var i = 0; i < dogCount; i++) {
      var d = {
        x: 0, y: 0,
        width: 30, height: 30,
        color: '#8d6e63', // Brown
        speed: 3
      };
      var dPos = getSafePosition(d.width, d.height, obstacles, WORLD_WIDTH, WORLD_HEIGHT);
      d.x = dPos.x;
      d.y = dPos.y;
      dogs.push(d);
    }
  }

  function spawnCollectible(list, obstacles, w, h) {
    var pos = getSafePosition(20, 20, obstacles, w, h);

    var r = Math.random();
    var type = 'banana';
    var color = '#ffeb3b';
    var points = 1;

    if (r > 0.7 && r < 0.9) {
      type = 'apple'; color = '#f44336'; points = -1;
    } else if (r >= 0.9) {
      type = 'cherry'; color = '#9c27b0'; points = -1;
    }

    list.push({ type: type, x: pos.x, y: pos.y, size: 15, color: color, points: points });
  }

  function spawnSpecial(list, obstacles, w, h) {
    var pos = getSafePosition(40, 40, obstacles, w, h);
    list.push({ type: 'special', x: pos.x, y: pos.y, size: 25, points: 10 });
  }

  function generateInterior(houseId) {
    var w = 800;
    var h = 600;
    var walls = [];
    var items = [];
    var furnitureCount = 5 + Math.floor(Math.random() * 5);

    for (var i = 0; i < furnitureCount; i++) {
      var fw = 50 + Math.random() * 80;
      var fh = 50 + Math.random() * 80;
      var pos = getSafePosition(fw, fh, walls, w, h);

      // nie blokuj wejścia - strefa bezpieczna wokół drzwi i spawnu gracza
      // Drzwi są na środku (w/2 - 20), gracz spawnuje się nieco wyżej
      var safeZoneX = w / 2 - 60;
      var safeZoneY = h - 150;
      var safeZoneW = 120;
      var safeZoneH = 150;

      if (rectIntersect(pos.x, pos.y, fw, fh, safeZoneX, safeZoneY, safeZoneW, safeZoneH)) continue;

      walls.push({ x: pos.x, y: pos.y, width: fw, height: fh, color: '#5d4037' });
    }

    for (var j = 0; j < 5; j++) spawnCollectible(items, walls, w, h);

    if (Math.random() < 0.1) spawnSpecial(items, walls, w, h);

    interiors[houseId] = {
      width: w,
      height: h,
      walls: walls,
      collectibles: items,
      door: { x: w / 2 - 20, y: h - 10, width: 40, height: 20 }
    };
  }

  function enterOverworld() {
    currentState = STATE.OVERWORLD;

    // currentWalls = drzewa + domy (żeby kolizje działały na domach)
    currentWalls = [];
    for (var i = 0; i < overworld.walls.length; i++) currentWalls.push(overworld.walls[i]);
    for (var j = 0; j < overworld.houses.length; j++) currentWalls.push(overworld.houses[j]);

    currentCollectibles = overworld.collectibles;
    worldBounds = { w: WORLD_WIDTH, h: WORLD_HEIGHT };

    currentDoors = [];
    for (var d = 0; d < overworld.houses.length; d++) {
      var h = overworld.houses[d];
      currentDoors.push({
        x: h.door.x, y: h.door.y, width: h.door.width, height: h.door.height,
        targetId: h.id,
        type: 'enter'
      });
    }
  }

  function enterHouse(houseId) {
    currentState = STATE.HOUSE;

    var interior = interiors[houseId];
    currentWalls = interior.walls;
    currentCollectibles = interior.collectibles;
    worldBounds = { w: interior.width, h: interior.height };

    player.x = interior.door.x;
    player.y = interior.door.y - player.height - 10;

    currentDoors = [{
      x: interior.door.x, y: interior.door.y, width: interior.door.width, height: interior.door.height,
      targetId: houseId,
      type: 'exit'
    }];
  }

  // --- Floating texts ---
  var floatingTexts = [];

  function showFloatingText(text, x, y) {
    floatingTexts.push({ text: String(text), x: x, y: y, life: 60 });
  }

  function showBrawo() {
    if (!brawoElement || !brawoElement.classList) return;
    brawoElement.classList.remove('hidden');
    setTimeout(function () {
      brawoElement.classList.add('hidden');
    }, 2000);
  }

  // --- Update/Draw ---
  function update(dt) {
    if (currentState === STATE.GAME_OVER || currentState === STATE.MENU) return;

    // Movement
    player.dx = 0;
    player.dy = 0;

    if (keys.ArrowUp || keys.w) player.dy = -player.speed;
    if (keys.ArrowDown || keys.s) player.dy = player.speed;
    if (keys.ArrowLeft || keys.a) { player.dx = -player.speed; player.direction = -1; }
    if (keys.ArrowRight || keys.d) { player.dx = player.speed; player.direction = 1; }

    if (player.dx !== 0 && player.dy !== 0) {
      player.dx *= 0.707;
      player.dy *= 0.707;
    }

    var nextX = player.x + player.dx;
    var nextY = player.y + player.dy;

    // Bounds
    nextX = clamp(nextX, 0, worldBounds.w - player.width);
    nextY = clamp(nextY, 0, worldBounds.h - player.height);

    // Collision
    var hitWallX = false;
    var hitWallY = false;

    for (var i = 0; i < currentWalls.length; i++) {
      var wall = currentWalls[i];
      if (rectIntersect(nextX, player.y, player.width, player.height, wall.x, wall.y, wall.width, wall.height)) {
        hitWallX = true; break;
      }
    }
    for (var j = 0; j < currentWalls.length; j++) {
      var wall2 = currentWalls[j];
      if (rectIntersect(player.x, nextY, player.width, player.height, wall2.x, wall2.y, wall2.width, wall2.height)) {
        hitWallY = true; break;
      }
    }

    if (!hitWallX) player.x = nextX;
    if (!hitWallY) player.y = nextY;

    // Camera
    if (worldBounds.w < camera.width) {
      camera.x = -(camera.width - worldBounds.w) / 2;
    } else {
      camera.x = player.x - camera.width / 2 + player.width / 2;
      camera.x = clamp(camera.x, 0, worldBounds.w - camera.width);
    }

    if (worldBounds.h < camera.height) {
      camera.y = -(camera.height - worldBounds.h) / 2;
    } else {
      camera.y = player.y - camera.height / 2 + player.height / 2;
      camera.y = clamp(camera.y, 0, worldBounds.h - camera.height);
    }

    // Dog Logic (only in Overworld)
    if (currentState === STATE.OVERWORLD) {
      for (var i = 0; i < dogs.length; i++) {
        var d = dogs[i];
        // Move towards player
        var dx = (player.x + player.width / 2) - (d.x + d.width / 2);
        var dy = (player.y + player.height / 2) - (d.y + d.height / 2);
        var dist = hypot2(dx, dy);

        if (dist > 5) { // Don't jitter when on top
          var angle = Math.atan2(dy, dx);
          d.x += Math.cos(angle) * d.speed;
          d.y += Math.sin(angle) * d.speed;
        }

        // Dog-Player Collision
        if (rectIntersect(player.x, player.y, player.width, player.height, d.x, d.y, d.width, d.height)) {
          score -= 5;
          scoreElement.innerText = score;
          showFloatingText("-5", player.x, player.y - 20);

          // Respawn dog
          var newPos = getSafePosition(d.width, d.height, currentWalls, worldBounds.w, worldBounds.h);
          d.x = newPos.x;
          d.y = newPos.y;
        }
      }
    }

    // Collectibles
    for (var cidx = currentCollectibles.length - 1; cidx >= 0; cidx--) {
      var c = currentCollectibles[cidx];
      var dx = (player.x + player.width / 2) - c.x;
      var dy = (player.y + player.height / 2) - c.y;
      var dist = hypot2(dx, dy);

      var hitDist = (player.width / 2) + c.size;
      if (dist < hitDist) {
        score += c.points;
        scoreElement.innerText = score;

        if (c.type === 'special') showBrawo();
        if (c.points < 0) showFloatingText(c.points, c.x, c.y);

        currentCollectibles.splice(cidx, 1);
      }
    }

    // Doors
    for (var didx = 0; didx < currentDoors.length; didx++) {
      var door = currentDoors[didx];
      if (rectIntersect(player.x, player.y, player.width, player.height, door.x, door.y, door.width, door.height)) {
        if (door.type === 'enter') {
          enterHouse(door.targetId);
        } else if (door.type === 'exit') {
          var house = overworld.houses[door.targetId];
          enterOverworld();
          player.x = house.door.x;
          player.y = house.door.y + 20;
        }
        break;
      }
    }
  }

  function drawGrid(color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (var x = 0; x < worldBounds.w; x += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, worldBounds.h);
      ctx.stroke();
    }
    for (var y = 0; y < worldBounds.h; y += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(worldBounds.w, y);
      ctx.stroke();
    }
  }

  function drawDog(d) {
    ctx.save();
    ctx.translate(d.x + d.width / 2, d.y + d.height / 2);

    // Face player roughly
    if (player.x < d.x) ctx.scale(-1, 1);

    // Body
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(0, 0, d.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Ears (floppy)
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.ellipse(-10, -5, 6, 12, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, -5, 6, 12, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-5, -2, 3, 0, Math.PI * 2);
    ctx.arc(5, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-5, -2, 1, 0, Math.PI * 2);
    ctx.arc(5, -2, 1, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(0, 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    if (player.direction === -1) ctx.scale(-1, 1);

    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
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
    ctx.ellipse(-6, -2, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -2, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(-6, -2, 2, 0, Math.PI * 2);
    ctx.arc(6, -2, 2, 0, Math.PI * 2);
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

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentState === STATE.MENU) return;

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

    // Houses (only overworld)
    if (currentState === STATE.OVERWORLD) {
      for (var i = 0; i < overworld.houses.length; i++) {
        var house = overworld.houses[i];

        ctx.fillStyle = house.color;
        ctx.fillRect(house.x, house.y, house.width, house.height);

        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(house.x, house.y, house.width, house.height);

        // Roof
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(house.x - 10, house.y);
        ctx.lineTo(house.x + house.width / 2, house.y - 40);
        ctx.lineTo(house.x + house.width + 10, house.y);
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DOM SĄSIADA', house.x + house.width / 2, house.y + house.height / 2);

        // Door
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(house.door.x, house.door.y, house.door.width, house.door.height);
      }
    }

    // Walls/obstacles
    for (var w = 0; w < currentWalls.length; w++) {
      var wall = currentWalls[w];

      // jeśli to obiekt "dom" w overworld, to już go narysowaliśmy wyżej
      if (currentState === STATE.OVERWORLD && typeof wall.id !== 'undefined') continue;

      ctx.fillStyle = wall.color;
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Doors inside house
    if (currentState === STATE.HOUSE) {
      for (var d = 0; d < currentDoors.length; d++) {
        var door = currentDoors[d];
        ctx.fillStyle = 'black';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', door.x + door.width / 2, door.y + 12);
      }
    }

    // Collectibles
    for (var c = 0; c < currentCollectibles.length; c++) {
      var it = currentCollectibles[c];

      if (it.type === 'special') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.size, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(faceImage, it.x - it.size, it.y - it.size, it.size * 2, it.size * 2);
        ctx.restore();

        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (it.type === 'banana') {
          // Emoji w starych silnikach bywa różnie, ale to nie zabije gry
          ctx.font = (it.size * 2) + 'px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🍌', it.x, it.y);
        } else {
          // Stem
          ctx.beginPath();
          ctx.moveTo(it.x, it.y - it.size);
          ctx.lineTo(it.x, it.y - it.size - 5);
          ctx.stroke();
        }
      }
    }

    // Dog
    if (currentState === STATE.OVERWORLD) {
      for (var i = 0; i < dogs.length; i++) {
        drawDog(dogs[i]);
      }
    }

    // Player
    drawPlayer();

    // Floating texts
    for (var fi = floatingTexts.length - 1; fi >= 0; fi--) {
      var ft = floatingTexts[fi];
      ctx.fillStyle = 'red';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(ft.text, ft.x, ft.y);

      ft.y -= 1;
      ft.life--;

      if (ft.life <= 0) floatingTexts.splice(fi, 1);
    }

    ctx.restore();

    // Game over overlay
    if (currentState === STATE.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('KONIEC GRY', canvas.width / 2, canvas.height / 2 - 20);

      ctx.font = '24px Arial';
      ctx.fillText('Wynik: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    draw();

    gameLoopId = requestAnimationFrame(gameLoop);
  }

  window.onload = init;
})();
