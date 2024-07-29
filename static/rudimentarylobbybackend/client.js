// This file is just a combination of all the other JS modules

class PlayScene extends Phaser.Scene{
    constructor() {
        super('PlayScene')
    }
    preload() {
        this.load.image('asteroid', '/images/asteroids-sprite.png')
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
        })
        
    }

    addAsteroid() {
        let asteroid = new Asteroid (this, 0, 0, 'asteroid', 0).setScale(0.2);
        this.asteroidsGroup.add(asteroid, true);
        this.asteroidArray.push(asteroid);
    }    
}


class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
    }

    preload () {
        this.load.image('background_image', 'static/images/background.jpeg');
    }

    create () {
        let background = this.add.sprite(0, 0, 'background_image');
        background.setOrigin(0,0);
        background.setScale(.25)
        this.add.text(20, 20, "title: press enter to play")
        const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enter.on( 'down', () => {this.scene.start('GameScene');})
    }

    
}



let socket;
let player_role = 0;

class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }
    preload() {
        // loading images
        this.load.image('space', 'static/images/background1.jpeg');
        this.load.image('ship', 'static/images/ship1.png');
        this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
        this.load.image('exhaust', 'static/images/ship-exhaust1.png');
        this.load.image('laser-beam', 'static/images/beams.png');
        
    
        // new images
        this.load.image('enemy', 'static/images/enemy-ship.webp');
        this.load.image('ship-two', 'static/images/space-ship2-1.png');
        this.load.image('exhaust-two', 'static/images/exhaust-effects-blue.jpg')
        this.load.image('expl', 'static/images/exp.jpeg');


        // load audio
        this.load.audio('mediumLaser', 'static/audio/mediumFireRateLaser.mp3');
        this.load.audio('asteroidDestroyed', 'static/audio/asteroidDestroy.mp3');
        this.load.audio('secondShipEngine', 'static/audio/engine2.mp3');
        this.load.audio('theme', 'static/audio/theme1.mp3');
    
    }

    create() {
        // Create client socket
        socket = io(); 

        if (player_role === 0) {
        socket.on("assign_player", (arg) => {
            player_role = arg
            console.log(player_role); 
        });
    };
    
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

        let theme = this.sound.add('theme');
        theme.setLoop(true);
        theme.play();
        
        // main-ship logic
        this.main_ship = this.physics.add.sprite(400, 630, 'ship');
        this.main_ship.setScale(.2);
        this.main_ship.setDepth(1);
        this.main_ship.setCollideWorldBounds();
    
        // laser audio
        let mediumFireRateLaser = this.sound.add('mediumLaser');
    
        // ship laser-logic
        this.laserGroup = new LaserGroup(this);
        this.laserGroup.setDepth(1);
        
        // event-listening for laser for ships
        this.input.on( 'pointerdown', pointer => {
            // begin shooting
            if (player_role=== "main_ship") {
                socket.emit('fire_laser', { x: this.main_ship.x, y: this.main_ship.y - 50 });
                this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 50);
                mediumFireRateLaser.play();
            }
            else if (player_role=== "second_ship") {
                socket.emit('fire_laser', { x: this.second_ship.x, y: this.second_ship.y - 50 });
                this.laserGroup.fireLaser(this.second_ship.x, this.second_ship.y - 50)
                mediumFireRateLaser.play();
        }
    });
        
        
    
        // event-listening for laser for second ship
        // var spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
        // spacebar.on( 'down', pointer => {
        //    this.laserGroup.fireLaser(this.second_ship.x, this.second_ship.y - 50)
        //    mediumFireRateLaser.play();
        //})
    
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
        let asteroidDestroyed = this.sound.add("asteroidDestroyed");
         
         this.overlapLaser = this.physics.add.overlap(this.laserGroup, this.asteroidsGroup, function(laser, asteroid){

            if (laser.active && asteroid.active) {
            asteroid.destroy();
            
            if (!asteroidDestroyed.isPlaying){
            asteroidDestroyed.play();
            }
            // laser.disableBody(false, true)
        }
        }, null, this);


         // ship-asteroid detection
     
         this.overlapShip = this.physics.add.overlap(this.main_ship, this.asteroidsGroup, asteroidToShip);
         this.overlapSecondShip = this.physics.add.overlap(this.second_ship, this.asteroidsGroup, asteroidToShip);
     
     
         // enemy ships
         this.enemy = this.physics.add.sprite(100, 200, 'enemy');
         this.enemy.setScale(.15);
         this.enemy.setCollideWorldBounds(true);
     
     
    
    
        // Listen for position updates
        socket.on('update_position', (data) => {
            if (data.player === 'main') {
                serverShip1Position.x = data.x;
                serverShip1Position.y = data.y;
            }
            else if (data.player === 'sec') {
                serverShip2Position.x = data.x;
                serverShip2Position.y = data.y;
            };
            lastUpdatedTime = performance.now();
        });

        socket.on('laser_fired', (data) => {
            this.laserGroup.fireLaser(data.x, data.y);
        });

        socket.on('destroyed_ship', (data) => {
            destroyed_ship = data['destroyed_ship']
            if (destroyed_ship === "main_ship") {
                this.main_ship.destroy()
            }
            else if (destroyed_ship === "second_ship") {
                this.second_ship.destroy()
            }
        });
    
        // Initialize cursors
        this.cursors = this.input.keyboard.createCursorKeys();
    
        // Initialize movement keys
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    }
    
    update(time, delta) {
        // moving background logic
        this.tileSprite.tilePositionY -= 5;
    
        // Ship Movement
        playerMovement.call(this);
        //linearInterpolation.call(this);
    
    
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
}
let serverShip1Position = { x: 400, y: 630 };
let serverShip2Position = { x: 700, y: 630 };
let lastUpdatedTime = 0;
// let socket;

class Asteroid extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'big-asteroid');
        this.speed = Phaser.Math.GetSpeed(100, 1);
        this.orbiting = false;
        this.direction = 0;
        this.factor = 0;
    }
    launch (shipX, shipY) {
        this.orbiting = true;
        this.setActive(true);
        this.setVisible(true);
        let xOrigin = Phaser.Math.RND.between(0, 800);
        let yOrigin = 0;
        this.setPosition(xOrigin, yOrigin);
        if (shipY > xOrigin) {
            let m = (shipY - yOrigin) / (shipX - xOrigin);
            this.direction = Math.atan(m);
        }
        else {
            this.factor = -1;
            let m = (shipY - yOrigin) / (xOrigin - shipX);
            this.direction = Math.atan(m);
        }
        this.angleRotation = Phaser.Math.RND.between(0.2, 0.9);
    }
    
    
      update (time, delta) {
        this.x += this.factor * Math.cos(this.direction) * this.speed * delta;
        this.y += Math.cos(this.direction) * this.speed * delta;
        this.angle += this.angleRotation;
    
        if (this.x < -50 || this.y < -50 || this.x > 800 || this.y > 700 ) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
}
    isOrbiting() {
        return this.orbiting;
    }

}

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

function playerMovement(){
    // moving ship with keys
    const speed = 8;

    if (player_role === "main_ship") {
        if (this.keyA.isDown) {
            this.main_ship.x -= speed;
            socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
        } else if (this.keyD.isDown) {
            this.main_ship.x += speed;
            socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
        } else if (this.keyW.isDown) {
            this.main_ship.y -= speed;
            socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
        } else if (this.keyS.isDown) {
            this.main_ship.y += speed;
            socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
        }
    }
    else if (player_role === "second_ship") {
        if (this.keyA.isDown) {
            this.second_ship.x -= speed;
            socket.emit('player_move', { player: 'sec', x: this.second_ship.x, y: this.second_ship.y });
        } else if (this.keyD.isDown) {
            this.second_ship.x += speed;
            socket.emit('player_move', { player: 'sec', x: this.second_ship.x, y: this.second_ship.y });
        } else if (this.keyW.isDown) {
            this.second_ship.y -= speed;
            socket.emit('player_move', { player: 'sec', x: this.second_ship.x, y: this.second_ship.y });
        } else if (this.keyS.isDown) {
            this.second_ship.y += speed;
            socket.emit('player_move', { player: 'sec', x: this.second_ship.x, y: this.second_ship.y });
        }
}}

// Linear Interpolation for ships
function linearInterpolation() {
    let now = performance.now();
    let delta = now - lastUpdatedTime;
    let interpolationFactor = Math.min(delta / 5000, 1);
    if (player_role === "main_ship") {
        this.second_ship.x = serverShip2Position.x
        this.second_ship.y = serverShip2Position.y
    }
    else if (player_role === "second_ship") {
        this.main_ship.x = serverShip1Position.x
        this.main_ship.y = serverShip1Position.y
    }
    // this.main_ship.x = this.main_ship.x + (serverShip1Position.x - this.main_ship.x) * interpolationFactor;
    // this.main_ship.y = this.main_ship.y + (serverShip1Position.y - this.main_ship.y) * interpolationFactor;

    // this.second_ship.x = this.second_ship.x + (serverShip2Position.x - this.second_ship.x) * interpolationFactor;
    // this.second_ship.y = this.second_ship.y + (serverShip2Position.y - this.second_ship.y) * interpolationFactor;
}



// function asteroidToLaser(laser, asteroid){
    
//    asteroid.destroy();

    // laser.disableBody(false, true)
// }


function asteroidToShip(ship, asteroid) {    

    socket.emit("ship_destroyed", {"ship": player_role});
    ship.destroy();
    asteroid.destroy();

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
    scene: [TitleScene, GameScene, PlayScene]
};

var game = new Phaser.Game(config);
