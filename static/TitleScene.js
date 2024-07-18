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
