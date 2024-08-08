class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('space', 'static/images/background1.jpeg');
        this.load.image('enemy', 'static/images/enemy-ship.webp');
        this.load.image('enemy-laser', 'static/images/beams.png');
    }

    create() {
        // Moving space background
        this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
        this.tileSprite.setOrigin(0);
        this.tileSprite.setScrollFactor(0, 1);

        // Enemy ships and lasers
        this.enemies = this.physics.add.group();
        this.enemyLasers = this.physics.add.group();

        socket.on('game_state', (state) => {
            this.enemies.clear(true, true);
            this.enemyLasers.clear(true, true);

            state.enemy_ships.forEach((ship) => {
                let enemy = new EnemyShip(this, ship.x, ship.y);
                this.enemies.add(enemy);
                enemy.setScale(.14);
            });

            state.enemy_lasers.forEach((laser) => {
                let enemyLaser = new EnemyLaser(this, laser.x, laser.y);
                this.enemyLasers.add(enemyLaser);
            });
        });
    }

    update(time, delta) {
        // Moving background logic
        this.tileSprite.tilePositionY -= 5;

        // Update enemy ships and lasers
        this.enemies.children.iterate((enemy) => {
            enemy.update();
        });

        this.enemyLasers.children.iterate((laser) => {
            laser.update();
        });
    }
}

// EnemyShip Class
class EnemyShip extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        this.body.velocity.y = 100;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y > 700) { // Move out of the game screen
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
    }
}

// EnemyLaser Class
class EnemyLaser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy-laser');
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        this.body.velocity.y = 250;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y > 700) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
    }
}

// Main Game Configuration and Initialization
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MainScene]
};

var game = new Phaser.Game(config);
let socket = io();
