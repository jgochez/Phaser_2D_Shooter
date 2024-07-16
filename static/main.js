import Asteroid from "./asteroids.js";
import PlayScene from "./playscene.js";


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

function addEventd(){

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
game.scene.add('PlayScene', PlayScene)
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
    this.load.image('exhaust-two', 'static/images/exhaust-effects-blue.jpg')
    this.load.image('expl', 'static/images/exp.jpeg');

}

function create() {
    // Create client socket
    socket = io(); 

    // moving space background
    this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
    this.tileSprite.setOrigin(0);
    this.tileSprite.setScrollFactor(0, 1);

    // asteroid handling which depends on level
    this.asteroidsGroup = this.physics.add.group();
    this.asteroidsArray = [];
    this.asteroidTimedEvent = this.time.addEvent({
        delay: 1000,
        callback: this.addAsteroid,
        callbackScope: this,
        loop: true
    })
    
    // main-ship logic
    this.main_ship = this.physics.add.sprite(400, 630, 'ship');
    this.main_ship.setScale(.2);
    this.main_ship.setDepth(1);
    this.main_ship.setCollideWorldBounds();


    // ship laser-logic
    this.laserGroup = new LaserGroup(this);
    this.laserGroup.setDepth(1);
    // event-listening for laser for main ship
    this.input.on( 'pointerdown', pointer => {
        // begin shooting
        this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 50);

    });
    
    // laser audio
    let mediumFireRateLaser = this.sound.add('mediumLaser');

    // event-listening for laser for second ship
    var spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    spacebar.on( 'down', pointer => {
        this.laserGroup.fireLaser(this.second_ship.x, this.second_ship.y - 50)
    })

    // main-ship boosters logic
    this.emitter;
    this.emitter = this.add.particles(0, 0, 'exhaust',{

        quantity: 5,
        speedY: { min: 20, max: 50 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.065, end: .0065 },
        follow: this.main_ship,
        scale: 0.01,
        accelerationY: 1000,
        lifespan: { min: 100, max: 300 },
        followOffset: { y: this.main_ship.height * 0.081}

    })
    this.emitter.setDepth(1);

    // second ship logic

    this.second_ship = this.physics.add.sprite(700, 630, 'ship-two');
    this.second_ship.setScale(.15);
    this.second_ship.setDepth(1);
    this.second_ship.setCollideWorldBounds(true);

    // second ship boosters
    
    var booster_count = .08
    var boosterOffset = -.03
    var boosterOffsetY = -.06
    for (var i = 1; i < 5; i++) {
    this.emitter_two = this.add.particles(0, 0, 'exhaust-two',{
        quantity: 5,
        speedY: { min: 10, max: 30 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.065, end: .0065 },
        follow: this.second_ship,
        scale: 0.2,
        accelerationY: 1000,
        lifespan: { min: 100, max: 300 },
        followOffset: { y: this.second_ship.height * 0.075 + boosterOffsetY , x: this.second_ship.width * (booster_count += boosterOffset)},
        alpha: { random: [0.1, 0.8] },
        
    })
    this.emitter_two.setDepth(1);
}

     // laser-asteroid detection

     this.overlapLaser = this.physics.add.overlap(this.laserGroup, this.asteroidsGroup, asteroidToLaser);
    
     // ship-asteroid detection
 
     this.overlapShip = this.physics.add.overlap(this.main_ship, this.asteroidsGroup, asteroidToShip);
     this.overlapSecondShip = this.physics.add.overlap(this.second_ship, this.asteroidsGroup, asteroidToShip);
 
 
     // enemy ships
     this.enemy = this.physics.add.sprite(100, 200, 'enemy');
     this.enemy.setScale(.15);
     this.enemy.setCollideWorldBounds(true);
 
 


    // Listen for position updates
    socket.on('update_position', (data) => {
        if (data.player === 'main_x') {
            serverShip1Position.x = data.x;
        } else if (data.player === 'main_y') {
            serverShip1Position.y = data.y;
        }
        lastUpdatedTime = performance.now();
    });

    socket.on('update_position', (data) => {
        if (data.player === 'sec_x') {
            serverShip2Position.x = data.x;
        } else if (data.player === 'sec_y') {
            serverShip2Position.y = data.y;
        }
        lastUpdatedTime = performance.now();
    });

    // Initialize cursors
    this.cursors = this.input.keyboard.createCursorKeys();

    // Initialize movement keys
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
}

function update(time, delta) {
    // moving background logic
    this.tileSprite.tilePositionY -= 5;

    // Ship Movement
    playerMovement.call(this);
    linearInterpolation.call(this);


    // asteroid movement and additions

    this.asteroidsArray = this.asteroidsArray.filter((asteroid)=> asteroid.active );
    for (const asteroid of this.asteroidsArray) {
        if (!asteroid.isOrbiting()){
            asteroid.launch(this.main_ship.x, this.main_ship.y);
            asteroid.launch(this.second_ship.x, this.second_ship.y);
        }
        asteroid.update(time, delta);
    }

    const asteroid = new Asteroid(this, 0, 0, 'big-asteroid', 0).setScale(Math.random() * 1);
    this.asteroidsGroup.add(asteroid, true);
    this.asteroidsArray.push(asteroid);


    
}


function playerMovement(){
    // moving ship with keys
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

    // moving second ship with keys
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

// Linear Interpolation for ships
function linearInterpolation() {
    let now = performance.now();
    let delta = now - lastUpdatedTime;
    let interpolationFactor = Math.min(delta / 5000, 1);

    this.main_ship.x = this.main_ship.x + (serverShip1Position.x - this.main_ship.x) * interpolationFactor;
    this.main_ship.y = this.main_ship.y + (serverShip1Position.y - this.main_ship.y) * interpolationFactor;

    this.second_ship.x = this.second_ship.x + (serverShip2Position.x - this.second_ship.x) * interpolationFactor;
    this.second_ship.y = this.second_ship.y + (serverShip2Position.y - this.second_ship.y) * interpolationFactor;
}


function asteroidToLaser(laser, asteroid){
    
    asteroid.destroy();
    
    // laser.disableBody(false, true)
}


function asteroidToShip(ship, asteroid) {    

    ship.destroy();
    asteroid.destroy();

}
