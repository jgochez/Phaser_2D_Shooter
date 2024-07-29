class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
    }

    preload () {

        this.load.audio('titleTheme', 'static/audio/titleTheme.mp3');

        this.load.image('background_image', 'static/images/background.jpeg');
        this.load.image('ship', '/static/images/ship1.png');
        this.load.image('exhaust', '/static/images/ship-exhaust1.png');
        this.load.image('laser-beam', '/static/images/beams.png');
        this.load.image('start', '/static/images/start-image2.png');
        
    }
    
    create () {
        // play title theme
        let titleTheme = this.sound.add('titleTheme');
        titleTheme.setLoop(true);
        titleTheme.play();

        // start button
        this.startButton = this.physics.add.sprite(700, 100, 'start')
        this.startButton.setCollideWorldBounds();
        this.startButton.setBounceY(1.1);
        this.startButton.setBounceX(1.1);
        this.startButton.setScale(.2);
        this.startButton.setDepth(1);

        this.startButton.body.velocity.y = 70;
        this.startButton.body.velocity.x = 30;
        this.startButton.body.setMaxVelocity(500);

        // Background
        this.tileSprite = this.add.tileSprite(0, 0, innerWidth*4, innerHeight*4, 'background_image');
        this.tileSprite.setOrigin(0);
        this.tileSprite.setScale(.25);

        // User interface
        this.add.text(150, 300, "2D Space Shooter", { fontSize: '48px' });
        this.add.text(150, 400, "Shoot the Start button, or press enter to play...");
        const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enter.on( 'down', () => {
        this.tweens.add({
            targets: titleTheme,
            volume: { from: 1, to: 0},
            duration: 2000
        });
    });
        // ship controls
        this.ship = this.physics.add.sprite(400, 640, 'ship');
        this.ship.setScale(.2);
        this.ship.setDepth(1);
        this.ship.setCollideWorldBounds( true)
        

    

        // WASD for movement
        this.cursors = this.input.keyboard.addKeys({ up: 'W', left: 'A', down: 'S', right: 'D' });

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

        this.overlapLaser = this.physics.add.overlap(this.laserGroup, this.startButton, function(laser, startButton){
    
            startButton.destroy();
            this.tweens.add({
                targets: titleTheme,
                volume: { from: 1, to: 0},
                duration: 2000
            });
            this.cameras.main.fadeOut(2000, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    this.scene.start('GameScene');
                }
            }, this) 
        }, null, this);

        
    }

    update () {
        const speed = 8;

        if (this.cursors.left.isDown) {
            this.ship.x -= speed;
        } else if (this.cursors.right.isDown) {
            this.ship.x += speed;
        } else if (this.cursors.up.isDown) {
            this.ship.y -= speed;
        } else if (this.cursors.down.isDown) {

            this.ship.y += speed;
        } 
        this.tileSprite.tilePositionY += 1;
        this.tileSprite.tilePositionX += .1;
        const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enter.on( 'down', () => {
            this.cameras.main.fadeOut(2000, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    this.scene.start('GameScene');
                }
            }, this)           
    })
}


}
