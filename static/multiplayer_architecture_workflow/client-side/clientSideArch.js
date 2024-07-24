// Asteroid Class
class Asteroid extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'big-asteroid');
        this.speed = Phaser.Math.GetSpeed(100, 1);
        this.orbiting = false;
        this.direction = 0;
        this.factor = 0;
    }

    launch(shipX, shipY) {
        this.orbiting = true;
        this.setActive(true);
        this.setVisible(true);
        let xOrigin = Phaser.Math.RND.between(0, 800);
        let yOrigin = 0;
        this.setPosition(xOrigin, yOrigin);
        if (shipY > xOrigin) {
            let m = (shipY - yOrigin) / (shipX - xOrigin);
            this.direction = Math.atan(m);
        } else {
            this.factor = -1;
            let m = (shipY - yOrigin) / (xOrigin - shipX);
            this.direction = Math.atan(m);
        }
        this.angleRotation = Phaser.Math.RND.between(0.2, 0.9);
    }

    update(time, delta) {
        this.x += this.factor * Math.cos(this.direction) * this.speed * delta;
        this.y += Math.cos(this.direction) * this.speed * delta;
        this.angle += this.angleRotation;

        if (this.x < -50 || this.y < -50 || this.x > 800 || this.y > 700) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
    }

    isOrbiting() {
        return this.orbiting;
    }
}

// PlayScene Class
class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }

    preload() {
        this.load.image('asteroid', '/images/asteroids-sprite.png');
    }

    create() {
        this.asteroid = this.physics.add.image(225, 500, '').setScale(.03);
        this.asteroidsGroup = this.physics.add.group();
        this.asteroidArray = [];
        this.asteroidTimedEvent = this.time.addEvent({
            delay: 1000,
            callback: this.addAsteroid,
            callbackScope: this,
            loop: true
        });
    }

    addAsteroid() {
        let asteroid = new Asteroid(this, 0, 0, 'asteroid', 0).setScale(0.2);
        this.asteroidsGroup.add(asteroid, true);
        this.asteroidArray.push(asteroid);
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
game.scene.add('PlayScene', PlayScene);
let serverShip1Position = { x: 400, y: 630 };
let serverShip2Position = { x: 700, y: 630 };
let lastUpdatedTime = 0;
let socket;

function preload() {
    // loading images
    this.load.image('space', 'static/images/background1.jpeg');
    this.load.image('ship', 'static/images/ship1.png');
    this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
    this.load.image('exhaust', 'static/images/ship-exhaust1.png');
    this.load.image('laser-beam', 'static/images/beams.png');
    this.load.audio('mediumLaser', 'static/audio/mediumFireRateLaser.mp3');
    // new images
    this.load.image('enemy', 'static/images/enemy-ship.webp');
    this.load.image('ship-two', 'static/images/space-ship2-1.png');
    this.load.image('exhaust-two', 'static/images/exhaust-effects-blue.jpg');
    this.load.image('expl', 'static/images/exp.jpeg');
}

function create() {
    socket = io();

    // moving space background
    this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
    this.tileSprite.setOrigin(0);
    this.tileSprite.setScrollFactor(0, 1);

    // asteroids handling which depends on level
    this.asteroidsGroup = this.physics.add.group();
    this.asteroidsArray = [];
    this.asteroidTimedEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
            const asteroid = new Asteroid(this, 0, 0, 'big-asteroid').setScale(Math.random());
            this.asteroidsGroup.add(asteroid, true);
            this.asteroidsArray.push(asteroid);
        },
        loop: true
    });

    // main ship logic
    this.main_ship = this.physics.add.sprite(400, 630, 'ship').setScale(.2).setDepth(1).setCollideWorldBounds();
    this.main_ship.emitter = this.add.particles(0, 0, 'exhaust', {
        quantity: 5,
        speedY: { min: 20, max: 50 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.065, end: .0065 },
        follow: this.main_ship,
        scale: 0.01,
        accelerationY: 1000,
        lifespan: { min: 100, max: 300 },
        followOffset: { y: this.main_ship.height * 0.081 }
    });
    this.main_ship.emitter.setDepth(1);

    // second ship logic
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
            scale: { start: 0.065, end: .0065 },
            follow: this.second_ship,
            scale: 0.2,
            accelerationY: 1000,
            lifespan: { min: 100, max: 300 },
            followOffset: { y: this.second_ship.height * 0.075 + boosterOffsetY, x: this.second_ship.width * (booster_count += boosterOffset) },
            alpha: { random: [0.1, 0.8] },
        });
        emitter_two.setDepth(1);
        this.second_ship.emitters.push(emitter_two);
    }

    const mediumFireRateLaser = this.sound.add('mediumLaser');
    this.laserGroup = new LaserGroup(this).setDepth(1);
    this.input.on('pointerdown', fireMainShipLaser, this);

    const spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spacebar.on('down', fireSecondShipLaser, this);

    this.overlapLaser = this.physics.add.overlap(this.laserGroup, this.asteroidsGroup, asteroidToLaser);
    this.overlapShip = this.physics.add.overlap(this.main_ship, this.asteroidsGroup, asteroidToShip, null, this);
    this.overlapSecondShip = this.physics.add.overlap(this.second_ship, this.asteroidsGroup, asteroidToShip, null, this);

    this.enemy = this.physics.add.sprite(100, 200, 'enemy').setScale(.15).setCollideWorldBounds(true);

    socket.on('update_position', (data) => {
        if (data.player === 'main_x') {
            serverShip1Position.x = data.x;
        } else if (data.player === 'main_y') {
            serverShip1Position.y = data.y;
        } else if (data.player === 'sec_x') {
            serverShip2Position.x = data.x;
        } else if (data.player === 'sec_y') {
            serverShip2Position.y = data.y;
        }
        lastUpdatedTime = performance.now();
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
}

function fireMainShipLaser() {
    this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 50);
    this.sound.play('mediumLaser');
}

function fireSecondShipLaser() {
    this.laserGroup.fireLaser(this.second_ship.x, this.second_ship.y - 50);
    this.sound.play('mediumLaser');
}

function update(time, delta) {
    // moving background logic
    this.tileSprite.tilePositionY -= 5;

    // ship movement
    playerMovement.call(this);
    linearInterpolation.call(this);

    // handling asteroids
    this.asteroidsArray = this.asteroidsArray.filter((asteroid) => asteroid.active);
    for (const asteroid of this.asteroidsArray) {
        if (!asteroid.isOrbiting()) {
            asteroid.launch(this.main_ship.x, this.main_ship.y);
            asteroid.launch(this.second_ship.x, this.second_ship.y);
        }
        asteroid.update(time, delta);
    }

    const asteroid = new Asteroid(this, 0, 0, 'big-asteroid', 0).setScale(Math.random() * 1);
    this.asteroidsGroup.add(asteroid, true);
    this.asteroidsArray.push(asteroid);
}

function playerMovement() {
    const speed = 8;

    if (this.cursors.left.isDown) {
        this.main_ship.x -= speed;
        socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
    } else if (this.cursors.right.isDown) {
        this.main_ship.x += speed;
        socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
    } else if (this.cursors.up.isDown) {
        this.main_ship.y -= speed;
        socket.emit('player_move', { player: 'main_y', y: this.main_ship.y });
    } else if (this.cursors.down.isDown) {
        this.main_ship.y += speed;
        socket.emit('player_move', { player: 'main_y', y: this.main_ship.y });
    }

    if (this.keyA.isDown) {
        this.second_ship.x -= speed;
        socket.emit('player_move', { player: 'sec_x', x: this.second_ship.x });
    } else if (this.keyD.isDown) {
        this.second_ship.x += speed;
        socket.emit('player_move', { player: 'sec_x', x: this.second_ship.x });
    } else if (this.keyW.isDown) {
        this.second_ship.y -= speed;
        socket.emit('player_move', { player: 'sec_y', y: this.second_ship.y });
    } else if (this.keyS.isDown) {
        this.second_ship.y += speed;
        socket.emit('player_move', { player: 'sec_y', y: this.second_ship.y });
    }
}

function linearInterpolation() {
    let now = performance.now();
    let delta = now - lastUpdatedTime;
    let interpolationFactor = Math.min(delta / 5000, 1);

    this.main_ship.x = this.main_ship.x + (serverShip1Position.x - this.main_ship.x) * interpolationFactor;
    this.main_ship.y = this.main_ship.y + (serverShip1Position.y - this.main_ship.y) * interpolationFactor;

    this.second_ship.x = this.second_ship.x + (serverShip2Position.x - this.second_ship.x) * interpolationFactor;
    this.second_ship.y = this.second_ship.y + (serverShip2Position.y - this.second_ship.y) * interpolationFactor;
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
    ship.destroy();
    asteroid.destroy();

    // Remove event listeners for laser firing
    if (ship === this.main_ship) {
        this.input.off('pointerdown', fireMainShipLaser, this);
    } else if (ship === this.second_ship) {
        const spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spacebar.off('down', fireSecondShipLaser, this);
    }
}
