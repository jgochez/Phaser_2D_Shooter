

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
/*game.scene.add('PlayScene', PlayScene)*/
