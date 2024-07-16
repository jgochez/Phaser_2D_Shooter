import Asteroid from "./asteroids.js"


export default class PlayScene extends Phaser.Scene{
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