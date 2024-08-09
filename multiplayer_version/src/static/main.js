// TitleScene class
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        // Sprites
        this.load.image('space', 'static/images/background1.jpeg');
        this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
        this.load.image('ship', 'static/images/ship1.png');
        this.load.image('ship-two', 'static/images/space-ship2-1.png');
        this.load.image('exhaust', 'static/images/ship-exhaust1.png');
        this.load.image('exhaust-two', 'static/images/exhaust-effects-blue.jpg');
        this.load.image('laser-beam', 'static/images/beams.png');
        this.load.image('enemy', 'static/images/enemy-ship.webp');
        this.load.image('enemy-laser', 'static/images/enemy-lasers.png');
        // Audio
        this.load.audio('mediumLaser', 'static/audio/mediumFireRateLaser.mp3');
        this.load.audio('asteroidDestroyed', 'static/audio/asteroidDestroy.mp3');
        this.load.audio('secondShipEngine', 'static/audio/engine2.mp3');
        this.load.audio('theme', 'static/audio/theme1.mp3');
    }

    create() {
        // Initialize Background
        this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
        this.tileSprite.setOrigin(0);
        this.tileSprite.setScrollFactor(0, 1);
        // Initialize Titlescreen
        this.titleText = this.add.text(400, 200, 'Galactic Showdown', { fontSize: '64px', fill: '#0fa' }).setOrigin(0.5);
        this.readyTextMain = this.add.text(200, 400, 'Player 1 Ready', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        this.readyTextSecond = this.add.text(600, 400, 'Player 2 Ready', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        // Handle Player Check-in
        this.readyTextMain.on('pointerdown', () => handleReady('main'), this);
        this.readyTextSecond.on('pointerdown', () => handleReady('second'), this);
        // Listener for Player Check-in
        socket.on('player_ready', (state) => {
            readyState = state;
            if (readyState.main) this.readyTextMain.setStyle({ fill: '#0f0' });
            if (readyState.second) this.readyTextSecond.setStyle({ fill: '#0f0' });
        });
        // Listener to Start Game after Check-ins
        socket.on('start_game', () => {
            this.scene.start('GameScene');
        });
    }

    update() {
        // Update Background
        this.tileSprite.tilePositionY -= 2;
    }
}

// GameScene class
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize as False
        this.isGameOver = false;
        // Track Time for Timer
        this.startTime = performance.now(); 
        // Initialize Game
        this.setupGameScene();
        this.setupInputHandlers();
        // Listener to Update Initial Game State
        socket.on('game_state', (state) => {
            if (!this.isGameOver) {
                asteroids = state.asteroids;
                lasers = state.lasers;
                serverShip1Position = state.ships.main;
                serverShip2Position = state.ships.second;
                scoreMain = state.scores.main;
                scoreSecond = state.scores.second;
                enemies = state.enemy_ships;
                enemyLasers = state.enemy_lasers;
                lastUpdatedTime = performance.now();
                renderGameState(this);
                scoreTextMain.setText('Player 1: ' + scoreMain);
                scoreTextSecond.setText('Player 2: ' + scoreSecond);
            }
        });
        // Initialize Game Theme
        this.theme.play();
    }

    setupGameScene() {
        // Instantiate Background
        this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
        this.tileSprite.setOrigin(0);
        this.tileSprite.setScrollFactor(0, 1);
        // Instantiate Asteroids
        this.asteroidsGroup = this.physics.add.group();
        // Instantiate Players 
        createShips.call(this);
        this.laserGroup = new LaserGroup(this).setDepth(1);
        // Instantiate Enemies
        this.enemiesGroup = this.physics.add.group();
        this.enemyLasersGroup = this.physics.add.group();
        // Initialize Score Board
        scoreTextMain = this.add.text(16, 16, 'Player 1: 0', { fontSize: '24px', fill: '#fff' });
        scoreTextSecond = this.add.text(616, 16, 'Player 2: 0', { fontSize: '24px', fill: '#fff' });
        this.timerText = this.add.text(400, 16, '00:00', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5); 
        // Add Sound to Objects
        this.theme = this.sound.add('theme', { volume: 0.2, loop: true });
        this.mediumFireRateLaser = this.sound.add('mediumLaser', { volume: 0.1 });
        this.asteroidDestroyed = this.sound.add('asteroidDestroyed', { volume: 0.2 });
        // Collision Between Players and Enemies
        this.physics.add.overlap(this.main_ship, this.enemiesGroup, enemyToShip, null, this);
        this.physics.add.overlap(this.second_ship, this.enemiesGroup, enemyToShip, null, this);
        this.physics.add.overlap(this.main_ship, this.enemyLasersGroup, laserToShip, null, this);
        this.physics.add.overlap(this.second_ship, this.enemyLasersGroup, laserToShip, null, this);
        this.physics.add.overlap(this.laserGroup, this.enemiesGroup, laserToEnemy, null, this);
    }

    setupInputHandlers() {
        // Laser Input
        const spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spacebar.on('down', fireMainShipLaser, this);
        const keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
        keyL.on('down', fireSecondShipLaser, this);
        // Movement Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    }

    update() {
        // Background Movement
        this.tileSprite.tilePositionY -= 5;

        if (!this.isGameOver) {
            // Update Player Position
            playerMovement.call(this);
            linearInterpolation.call(this);

            // Update Player Lasers
            lasers = lasers.filter((laser) => laser.active);
            for (const laser of lasers) {
                this.laserGroup.fireLaser(laser.x, laser.y);
            }
            // Update Enemy Position
            enemies = enemies.filter((enemy) => enemy.active);
            for (const enemy of enemies) {
                this.enemiesGroup.create(enemy.x, enemy.y, 'enemy').setScale(0.14);
            }
            // Update Enemy Lasers
            enemyLasers = enemyLasers.filter((laser) => laser.active);
            for (const laser of enemyLasers) {
                this.enemyLasersGroup.create(laser.x, laser.y, 'enemy-laser');
            }
            // Check if Players Died
            checkGameOver.call(this);

            // Update the Timer
            const elapsedTime = Math.floor((performance.now() - this.startTime) / 1000);
            const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
            const seconds = String(elapsedTime % 60).padStart(2, '0');
            this.timerText.setText(minutes + ':' + seconds);
        }
    }

    showGameOverPrompt() {
        // Initialize Variables 
        this.isGameOver = true;
        const winner = scoreMain > scoreSecond ? 'Player 1' : (scoreMain < scoreSecond ? 'Player 2' : 'Tie');
        const winnerText = `Winner: ${winner}`;
        const elapsedTime = Math.floor((performance.now() - this.startTime) / 1000);
        const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
        const seconds = String(elapsedTime % 60).padStart(2, '0');
        // Game Over Scene
        this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 400, winnerText, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 450, minutes + ':' + seconds, { fontSize: '42px', fill: '#fff' }).setOrigin(0.5); 
    }
}

// Laser Class
class Laser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'laser-beam');
    }

    fire(x, y) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityY(-900);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

// LaserGroup Class
class LaserGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene);
        this.createMultiple({
            classType: Laser,
            frameQuantity: 100,
            active: false,
            visible: false,
            key: 'laser-beam'
        });
    }

    fireLaser(x, y) {
        const laser = this.getFirstDead(false);
        if (laser) {
            laser.fire(x, y);
        }
    }
}

// EnemyShip Class
class EnemyShip extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        this.body.velocity.y = 100;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y > 700) { 
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
    }
}

// EnemyLaser Class
class EnemyLaser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy-laser');
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        this.body.velocity.y = 250;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y > 700) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
    }
}

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 30 },
            debug: false
        }
    },
    scene: [TitleScene, GameScene]
};

var game = new Phaser.Game(config);
let socket = io();
let asteroids = [];
let lasers = [];
let enemies = [];
let enemyLasers = [];
let serverShip1Position = { x: 400, y: 630 };
let serverShip2Position = { x: 700, y: 630 };
let lastUpdatedTime = 0;
let scoreMain = 0;
let scoreSecond = 0;
let scoreTextMain;
let scoreTextSecond;
let readyState = { main: false, second: false };
let mainShipAlive = true;
let secondShipAlive = true;

function handleReady(player) {
    // Connect with Server when Players Check In
    if (socket) {
        socket.emit('player_ready', { player: player });
    }
}

function createShips() {
    // Destroy ships, if any
    if (this.main_ship && this.main_ship.emitter) {
        this.main_ship.emitter.destroy();
    }
    if (this.second_ship && this.second_ship.emitters) {
        this.second_ship.emitters.forEach(emitter => emitter.destroy());
    }

    // Instantiate Main Ship
    this.main_ship = this.physics.add.sprite(400, 630, 'ship').setScale(.2).setDepth(1).setCollideWorldBounds(true);
    this.main_ship.emitter = this.add.particles(0, 0, 'exhaust', {
        quantity: 5,
        speedY: { min: 20, max: 50 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.01, end: 0.05 },
        follow: this.main_ship,
        accelerationY: 1000,
        lifespan: { min: 100, max: 300 },
        followOffset: { y: this.main_ship.height * 0.081 }
    });
    this.main_ship.emitter.setDepth(1);

    // Instantiate Second Ship
    this.second_ship = this.physics.add.sprite(700, 630, 'ship-two').setScale(.15).setDepth(1).setCollideWorldBounds(true);
    this.second_ship.emitters = [];
    var booster_count = .08;
    var boosterOffset = -.03;
    var boosterOffsetY = -.06;
    for (var i = 1; i < 5; i++) {
        var emitter_two = this.add.particles(0, 0, 'exhaust-two', {
            quantity: 5,
            speedY: { min: 10, max: 30 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.1, end: 0.3 },
            follow: this.second_ship,
            accelerationY: 1000,
            lifespan: { min: 100, max: 300 },
            followOffset: { y: this.second_ship.height * 0.075 + boosterOffsetY, x: this.second_ship.width * (booster_count += boosterOffset) },
            alpha: { random: [0.1, 0.8] },
        });
        emitter_two.setDepth(1);
        this.second_ship.emitters.push(emitter_two);
    }

    // Handle Player and Asteroid Collision
    this.overlapShip = this.physics.add.overlap(this.main_ship, this.asteroidsGroup, asteroidToShip, null, this);
    this.overlapSecondShip = this.physics.add.overlap(this.second_ship, this.asteroidsGroup, asteroidToShip, null, this);
}

function fireMainShipLaser() {
    // Handle Laser Position
    if (this.main_ship.active) {
        this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 50);
        if (socket) {
            socket.emit('fire_laser', { x: this.main_ship.x, y: this.main_ship.y - 50, player: 'main' });
        }
        this.mediumFireRateLaser.play();
    }
}

function fireSecondShipLaser() {
    // Handle Laser Position
    if (this.second_ship.active) {
        this.laserGroup.fireLaser(this.second_ship.x, this.second_ship.y - 50);
        if (socket) {
            socket.emit('fire_laser', { x: this.second_ship.x, y: this.second_ship.y - 50, player: 'second' });
        }
        this.mediumFireRateLaser.play();
    }
}

function playerMovement() {
    // Handle Main Player Velocity 
    const speed = 1;
    let mainDx = 0;
    let mainDy = 0;

    if (this.cursors.left.isDown) {
        mainDx = -speed;
    } else if (this.cursors.right.isDown) {
        mainDx = speed;
    } else if (this.cursors.up.isDown) {
        mainDy = -speed;
    } else if (this.cursors.down.isDown) {
        mainDy = speed;
    }

    if (socket) {
        socket.emit('player_move', { player: 'main', dx: mainDx, dy: mainDy });
    }

    // Handle Second Player Velocity
    let secondDx = 0;
    let secondDy = 0;

    if (this.keyA.isDown) {
        secondDx = -speed;
    } else if (this.keyD.isDown) {
        secondDx = speed;
    } else if (this.keyW.isDown) {
        secondDy = -speed;
    } else if (this.keyS.isDown) {
        secondDy = speed;
    }

    if (socket) {
        socket.emit('player_move', { player: 'second', dx: secondDx, dy: secondDy });
    }
}

function linearInterpolation() {
    // Calculate Interpolation Factor
    let now = performance.now();
    let delta = now - lastUpdatedTime;
    let fps = 16.67;
    let interpolationFactor = Math.min(delta / fps, 1);
    // Interpolating Main Ship
    this.main_ship.x += (serverShip1Position.x - this.main_ship.x) * interpolationFactor;
    this.main_ship.y += (serverShip1Position.y - this.main_ship.y) * interpolationFactor;
    // Interpolating Second Ship
    this.second_ship.x += (serverShip2Position.x - this.second_ship.x) * interpolationFactor;
    this.second_ship.y += (serverShip2Position.y - this.second_ship.y) * interpolationFactor;
}

function renderGameState(scene) {
    // Update Asteroids
    if (scene.asteroidsGroup) {
        scene.asteroidsGroup.clear(true, true);
    }

    for (let asteroid of asteroids) {
        if (asteroid.active) {
            let a = scene.asteroidsGroup.create(asteroid.x, asteroid.y, 'big-asteroid');
            a.setScale(asteroid.scale);
        }
    }

    scene.laserGroup.children.iterate(function (laser) {
        if (laser.active && !lasers.some(l => l.x === laser.x && l.y === laser.y && l.active)) {
            laser.setActive(false);
            laser.setVisible(false);
        }
    });
    // Update Enemies
    if (scene.enemiesGroup) {
        scene.enemiesGroup.clear(true, true);
    }

    for (let enemy of enemies) {
        if (enemy.active) {
            scene.enemiesGroup.create(enemy.x, enemy.y, 'enemy').setScale(0.14);
        }
    }

    if (scene.enemyLasersGroup) {
        scene.enemyLasersGroup.clear(true, true);
    }

    for (let laser of enemyLasers) {
        if (laser.active) {
            scene.enemyLasersGroup.create(laser.x, laser.y, 'enemy-laser');
        }
    }
    // Update Scores
    if (scoreTextMain) {
        scoreTextMain.setText('Player 1: ' + scoreMain);
    }
    if (scoreTextSecond) {
        scoreTextSecond.setText('Player 2: ' + scoreSecond);
    }
}

function asteroidToLaser(laser, asteroid) {
    // Destroy asteroid & Laser
    asteroid.destroy();
    laser.setActive(false);
    laser.setVisible(false);
    // Check who scored
    if (laser.player === 'main') {
        scoreMain += 10;
    } else if (laser.player === 'second') {
        scoreSecond += 10;
    }
    this.asteroidDestroyed.play();
}

function asteroidToShip(ship, asteroid) {
    // Handle Emitters 
    if (ship.emitter) {
        ship.emitter.stop();
        ship.emitter.destroy();
    }
    if (ship.emitters) {
        ship.emitters.forEach(emitter => {
            emitter.stop();
            emitter.destroy();
        });
    }
    // Handle Ship and Asteroid 
    ship.destroy();
    asteroid.destroy();
    if (ship === this.main_ship) {
        mainShipAlive = false;
    } else if (ship === this.second_ship) {
        secondShipAlive = false;
    }
    // Call Game Over Scene
    checkGameOver.call(this);
}

function enemyToShip(ship, enemy) {
    // Handle Emitters 
    if (ship.emitter) {
        ship.emitter.stop();
        ship.emitter.destroy();
    }
    if (ship.emitters) {
        ship.emitters.forEach(emitter => {
            emitter.stop();
            emitter.destroy();
        });
    }
    // Handle Ship and Enemy Ship
    ship.destroy();
    enemy.destroy();
    if (ship === this.main_ship) {
        mainShipAlive = false;
    } else if (ship === this.second_ship) {
        secondShipAlive = false;
    }
    // Call Game Over Scene
    checkGameOver.call(this);
}

function laserToShip(ship, laser) {
    // Handle Emitter
    if (ship.emitter) {
        ship.emitter.stop();
        ship.emitter.destroy();
    }
    if (ship.emitters) {
        ship.emitters.forEach(emitter => {
            emitter.stop();
            emitter.destroy()});
    }
    // Handle Ship and Enemy Laser
    ship.destroy();
    laser.destroy();
    if (ship === this.main_ship) {
        mainShipAlive = false;
    } else if (ship === this.second_ship) {
        secondShipAlive = false;
    }
    // Call Game Over Scene
    checkGameOver.call(this);
}

function laserToEnemy(laser, enemy) {
    // Handle Player Laser and Enemy Ship
    laser.setActive(false);
    laser.setVisible(false);
    enemy.destroy();
    // Check which Player killed Enemy
    if (laser.player === 'main') {
        scoreMain += 10;
    } else if (laser.player === 'second') {
        scoreSecond += 10;
    }
}

function checkGameOver() {
    // Call Game Over Scene if both players dead
    if (!mainShipAlive && !secondShipAlive) {
        this.showGameOverPrompt();
    }
}
