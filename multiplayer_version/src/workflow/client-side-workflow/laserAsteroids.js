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
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
let socket;
let asteroids = [];
let lasers = [];
let serverShip1Position = { x: 400, y: 630 };
let serverShip2Position = { x: 700, y: 630 };
let lastUpdatedTime = 0;

function preload() {
    this.load.image('space', 'static/images/background1.jpeg');
    this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
    this.load.image('ship', 'static/images/ship1.png');
    this.load.image('ship-two', 'static/images/space-ship2-1.png');
    this.load.image('exhaust', 'static/images/ship-exhaust1.png');
    this.load.image('exhaust-two', 'static/images/exhaust-effects-blue.jpg');
    this.load.image('laser-beam', 'static/images/beams.png');
}

function create() {
    // Initialize socket connection
    socket = io();

    // Create background 
    this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
    this.tileSprite.setOrigin(0);
    this.tileSprite.setScrollFactor(0, 1);

    // Create asteroid group
    this.asteroidsGroup = this.physics.add.group();

    // Initialize ships
    createShips.call(this);

    // Laser logic
    this.laserGroup = new LaserGroup(this).setDepth(1);
    this.input.on('pointerdown', fireSecondShipLaser, this);

    const spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spacebar.on('down', fireMainShipLaser, this);

    this.overlapLaser = this.physics.add.overlap(this.laserGroup, this.asteroidsGroup, asteroidToLaser);
    this.overlapShip = this.physics.add.overlap(this.main_ship, this.asteroidsGroup, asteroidToShip, null, this);
    this.overlapSecondShip = this.physics.add.overlap(this.second_ship, this.asteroidsGroup, asteroidToShip, null, this);

    socket.on('game_state', (state) => {
        asteroids = state.asteroids;
        lasers = state.lasers;
        serverShip1Position = state.ships.main;
        serverShip2Position = state.ships.second;
        lastUpdatedTime = performance.now();
        renderGameState(this);
    });

    socket.on('update_position', (data) => {
        if (data.player === 'main') {
            serverShip1Position = { x: data.x, y: data.y };
        } else if (data.player === 'second') {
            serverShip2Position = { x: data.x, y: data.y };
        }
        lastUpdatedTime = performance.now();
    });

    socket.on('laser_fired', (laser) => {
        lasers.push(laser);
    });

    socket.on('restart_game', () => {
        resetGame.call(this);
    });

    // Arrow cursors
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    // Restart key
    const restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    restartKey.on('down', () => {
        socket.emit('restart_game');
    });
}

function createShips() {
    // Main ship logic
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

    // Second ship logic
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
}

function fireMainShipLaser() {
    if (this.main_ship.active) {
        this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 50);
        socket.emit('fire_laser', { x: this.main_ship.x, y: this.main_ship.y - 50 });
    }
}

function fireSecondShipLaser() {
    if (this.second_ship.active) {
        this.laserGroup.fireLaser(this.second_ship.x, this.second_ship.y - 50);
        socket.emit('fire_laser', { x: this.second_ship.x, y: this.second_ship.y - 50 });
    }
}

function update() {
    // moving background logic
    this.tileSprite.tilePositionY -= 5;

    // ship movement
    playerMovement.call(this);
    linearInterpolation.call(this);

    // Update lasers
    lasers = lasers.filter((laser) => laser.active);
    for (const laser of lasers) {
        this.laserGroup.fireLaser(laser.x, laser.y);
    }
}

function playerMovement() {
    const speed = 8;

    if (this.cursors.left.isDown) {
        this.main_ship.x -= speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    } else if (this.cursors.right.isDown) {
        this.main_ship.x += speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    } else if (this.cursors.up.isDown) {
        this.main_ship.y -= speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    } else if (this.cursors.down.isDown) {
        this.main_ship.y += speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    }

    if (this.keyA.isDown) {
        this.second_ship.x -= speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    } else if (this.keyD.isDown) {
        this.second_ship.x += speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    } else if (this.keyW.isDown) {
        this.second_ship.y -= speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    } else if (this.keyS.isDown) {
        this.second_ship.y += speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    }
}

function linearInterpolation() {
    let now = performance.now();
    let delta = now - lastUpdatedTime;
    let interpolationFactor = Math.min(delta / 5000, 1);

    this.main_ship.x += (serverShip1Position.x - this.main_ship.x) * interpolationFactor;
    this.main_ship.y += (serverShip1Position.y - this.main_ship.y) * interpolationFactor;

    this.second_ship.x += (serverShip2Position.x - this.second_ship.x) * interpolationFactor;
    this.second_ship.y += (serverShip2Position.y - this.second_ship.y) * interpolationFactor;
}

function renderGameState(scene) {
    // Clear the existing asteroids from the group
    scene.asteroidsGroup.clear(true, true);

    // Add new asteroids based on current game state
    for (let asteroid of asteroids) {
        if (asteroid.active) {
            let a = scene.asteroidsGroup.create(asteroid.x, asteroid.y, 'big-asteroid');
            a.setScale(asteroid.scale);
        }
    }
}

function asteroidToLaser(laser, asteroid) {
    asteroid.destroy();
}

function asteroidToShip(ship, asteroid) {
    if (ship.emitter) {
        ship.emitter.stop();
    }
    if (ship.emitters) {
        ship.emitters.forEach(emitter => emitter.stop());
    }
    ship.setActive(false);
    ship.setVisible(false);
    asteroid.destroy();
}

function resetGame() {
    // Reset game state variables
    asteroids = [];
 
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
