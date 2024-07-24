class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
    }

    preload () {
        this.load.image('background_image', 'static/images/background.jpeg');
    }

    create () {
        // Background
        this.tileSprite = this.add.tileSprite(0, 0, innerWidth*4, innerHeight*4, 'background_image');
        this.tileSprite.setOrigin(0);
        this.tileSprite.setScale(.25);
        //this.tileSprite.setScrollFactor(1, 0);

        // User interface
        this.add.text(150, 300, "2D Space Shooter", { fontSize: '48px' });
        this.add.text(300, 400, "press enter to play...");
        const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enter.on( 'down', () => {this.scene.start('GameScene')});
    }

    update () {
        this.tileSprite.tilePositionY += 1;
        this.tileSprite.tilePositionX += .1;
    }
    
}
