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
    main_ship = this.physics.add.sprite(400, 630, 'ship');
    main_ship.setScale(.2);
    main_ship.setCollideWorldBounds(true);
   


    

}

function update ()
{
    // moving background logic
    this.tileSprite.tilePositionY -= 5;

    // moving ship with keys
    cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
        main_ship.setVelocityX(-200);
        main_ship.anims.play('left', true);
    }

    else if (cursors.right.isDown) {
        main_ship.setVelocityX(200);
        main_ship.anims.play('right', true);
    }

    if (cursors.up.isDown) {
        main_ship.setVelocityY(-200);
        main_ship.anims.play( 'up', true);
    }
    else if (cursors.down.isDown) {
        main_ship.setVelocityY(200);
        main_ship.anims.play('down', true);
    }
    

}