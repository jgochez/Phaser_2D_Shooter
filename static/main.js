
class Laser extends Phaser.Physics.Arcade.Sprite{
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
        })
    }
    fireLaser(x, y) {
        const laser = this.getFirstDead(false);
        if (laser) {
            laser.fire(x, y);
        }
    }
}

function addEvents() {
    
}

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y:30},
            debug: false
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


var game = new Phaser.Game(config);


function preload ()
{
    // loading images
    this.load.image('space', 'static/images/background1.jpeg');
    this.load.image('ship', 'static/images/ship1.png');
    this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
    this.load.image('exhaust', 'static/images/ship-exhaust1.png');
    this.load.image('laser-beam', 'static/images/beams.png');

}


function create ()
{
    // moving space background
    this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
    this.tileSprite.setOrigin(0);
    this.tileSprite.setScrollFactor(0, 1);

    // asteroid handling which depends on level
    var i = 0;
    while (i < 10) {
        i++;
        this.physics.add.sprite(Math.floor(Math.random() * 400), Math.floor(Math.random() * 400), 'big-asteroid' );
    }

    this.add.image(400, 100, 'big-asteroid');
    this.physics.add.sprite(400, 100, 'big-asteroid');

    // main-ship logic
    this.main_ship = this.add.image(400, 630, 'ship');
    this.main_ship.setScale(.2);
    this.main_ship.setDepth(1);
    
    // ship laser-logic
    this.laserGroup = new LaserGroup(this);
    
    // event-listening for laser
    this.input.on( 'pointerdown', pointer => {
        // begin shooting
        this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 20);

    });

    // main-ship boosters logic
    this.emitter
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

    // second ship logic
    second_ship = this.physics.add.sprite(700, 630, 'ship');
    second_ship.setScale(.3);
    second_ship.setCollideWorldBounds(true);   
}


function update ()
{
    // moving background logic
    this.tileSprite.tilePositionY -= 5;

    // moving ship with keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // using keys to direct
    
    const speed = 8;

    if (this.cursors.left.isDown) {
        this.main_ship.x -= speed;
    }

    else if (this.cursors.right.isDown) {
        this.main_ship.x += speed;
    }
    
    else if (this.cursors.up.isDown) {
        this.main_ship.y -= speed;
    }
    else if (this.cursors.down.isDown) {
        this.main_ship.y += speed;
    }
    
    // moving second ship with keys
    let keyA;
    let keyD;
    let keyW;
    let keyS;

    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    if (keyA.isDown) {
        second_ship.setVelocityX(-150);
        second_ship.anims.play('left', true);
    }
    else if (keyD.isDown) {
        second_ship.setVelocityX(150);
        second_ship.anims.play('right', true);
    }
    else if (keyW.isDown) {
        second_ship.setVelocityY(-150);
        second_ship.anims.play( 'up', true);
    }
    else if (keyS.isDown) {
        second_ship.setVelocityY(150);
        second_ship.anims.play('down', true);
    }
}
