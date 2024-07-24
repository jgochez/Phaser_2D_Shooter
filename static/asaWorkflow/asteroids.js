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
let socket;
let asteroids = [];

function preload() {
    this.load.image('space', 'static/images/background1.jpeg');
    this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
}

function create() {
    socket = io();

    // Create background 
    this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
    this.tileSprite.setOrigin(0);
    this.tileSprite.setScrollFactor(0, 1);

    // Create asteroid group
    this.asteroidsGroup = this.physics.add.group();

    // Listener to update game state
    socket.on('game_state', (state) => {
        asteroids = state.asteroids;
        renderGameState(this);
    });

    // Arrow cursors
    this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    this.tileSprite.tilePositionY -= 5;
}

function renderGameState(scene) {
    // Clear the existing asteroids from the group
    scene.asteroidsGroup.clear(true, true);

    // Add new asteroids based on current game state
    for (let asteroid of asteroids) {
        if (asteroid.active) {
            let a = scene.asteroidsGroup.create(asteroid.x, asteroid.y, 'big-asteroid');
            a.setScale(asteroid.scale);
        }
    }
}
