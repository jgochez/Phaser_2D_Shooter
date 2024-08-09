class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
    }


    preload () {
        this.load.image('background_image', '/static/images/background1.jpeg');
        this.load.image('ship', '/static/images/ship1.png');
        this.load.image('exhaust', '/static/images/ship-exhaust1.png');
        this.load.image('laser-beam', '/static/images/beams.png');
        this.load.image('start', '/static/images/start-image2.png');



    }

    create () {

        // start button
        // this.startButton = this.add.group({
        //     key: 'start',
        //     repeat: 2,
        //     setScale: .2
        // });

        this.startButton = this.physics.add.sprite(700, 100, 'start')
        this.startButton.setCollideWorldBounds();
        this.startButton.setBounceY(1.1);
        this.startButton.setBounceX(1.1);
        this.startButton.setScale(.2);
        this.startButton.setDepth(1);

        this.startButton.body.velocity.y = 70;
        this.startButton.body.velocity.x = 30;

        // this.startButton.children.iterate(function (child) {

        //     child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        
        // });
        // this.startButton.setScale(.2);
        // this.startButton.setDepth(1);
        // this.startButton.setCollideWorldBounds(true);
        // this.startButton = this.physics.add.group({ setCollideWorldBounds: true })


        // startButton follow


        // this.buttonOverlap = this.physics.add.overlap(this.startButton, this.laserGroup, function(start, laser) {

        //     start.destroy()

        // }, null, this);
        

        // ship controls
        this.ship = this.physics.add.sprite(400, 640, 'ship');
        this.ship.setScale(.2);
        this.ship.setDepth(1);
        this.ship.setCollideWorldBounds( true)
        

        // background image code
        let background = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'background_image');
        background.setOrigin(0);
        background.setDepth(0);
        // background.setScale();
        this.add.text(20, 20, "title: press enter to play")
        const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enter.on( 'down', () => {this.scene.start('EnemyShips');})
    

        // cursors for movement
        this.cursors = this.input.keyboard.createCursorKeys();

        // exhuast for main menu ship
        this.emitter;
        this.emitter = this.add.particles(0, 0, 'exhaust',{
    
            quantity: 5,
            speedY: { min: 20, max: 50 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.085, end: .0075 },
            follow: this.ship,
            scale: 0.01,
            accelerationY: 1000,
            lifespan: { min: 100, max: 300 },
            followOffset: { y: this.ship.height * 0.081}
    
        })
        this.emitter.setDepth(1);
    
   

        // ship laser-logic
        this.laserGroup = new LaserGroup(this);
        this.laserGroup.setDepth(1);
        // event-listening for laser for main ship
        this.input.on( 'pointerdown', pointer => {
            // begin shooting
            this.laserGroup.fireLaser(this.ship.x, this.ship.y - 50);
            // mediumFireRateLaser.play();
        });




    } 


        


    update() {

        
        const speed = 8;

        if (this.cursors.left.isDown) {
            this.ship.x -= speed;
            // socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
        } else if (this.cursors.right.isDown) {
            this.ship.x += speed;
            // socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
        } else if (this.cursors.up.isDown) {
            this.ship.y -= speed;
        } else if (this.cursors.down.isDown) {

            this.ship.y += speed;
        }




        // move start button
        // if (this.startButton.velcityX < 800) {
        //     this.startButton.anims.play('left', true);
        // } else if (this.startButton.velocityY < 700) {
        //     this.startButton.anims.play('right', true)
        // } else {

        // }




    }


    asteroidToShip(ship, asteroid) {    

        ship.destroy();
        console.log("hello")
        // asteroid.destroy();
    
    }
    
    
    // initStartButton ( ) {
    
    //     for (var i = 0; i < 2; i++) {
    //         for (var r = 0; r < 3; r++) {
    //             var buttonX = (i * ( 40 + 1 ))
    //             var buttonY = (r * (20 + 1))
    //         }
    //     }

    //     this.startButton.create( buttonX, buttonY, 'start')
    // }
        

    
    //  moveStartButton () {

    //     var xTimes = 0;
    //     var yTimes = 0;
    //     var dir = 'right';
    
    //     if (xTimes == 20) {
    //         if ( dir === 'right' ) {
    //             dir = 'left';
    //             xTimes = 0;
    //         } else {
    //             dir = 'right';
    //             xTimes = 0;
    //         }
    //     }
    //     if (dir === 'right') {
    //         startButton.each( function (moveStart)  {
    
    //             moveStart.x = moveStart.x + 10;
    //             moveStart.body.reset(moveStart.x, moveStart.y);
    //         }, this);
    //         xTimes++;   
    //     } else {
    //         startButton.each( function ( moveStart ) {
    //             moveStart.x = moveStart.x - 10;
    //             moveStart.body.reset(moveStart.x, moveStart.y);
    
    //         }, this);
    //         xTimes++;
    //     }
    
    // }
    
     



    
}

