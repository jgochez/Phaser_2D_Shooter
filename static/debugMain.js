// This file is just a combination of all the other JS modules

class PlayScene extends Phaser.Scene{
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

        // highscore
        this.highscore = this.add.text(16, 16, `highscore: ${highscore}`, { fontSize: '32px' });
        this.highscore.setDepth(10);

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

var theme;
var highscore = 0;
var totalAsteroids;

class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }
    preload() {
        // loading images
        this.load.image('space', 'static/images/background1.jpeg');
        this.load.image('ship', 'static/images/ship1.png');
        this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
        this.load.image('exhaust', 'static/images/ship-exhaust1.png');
        this.load.image('laser-beam', 'static/images/beams.png');
        
    
        // new images
        this.load.image('enemy', 'static/images/enemy-ship.webp');
        this.load.image('ship-two', 'static/images/space-ship2-1.png');
        this.load.image('exhaust-two', 'static/images/exhaust-effects-blue.jpg')
        this.load.image('expl1', 'static/images/exp.jpeg');
        this.load.image('expl1crop', 'static/images/explncrop.png');
        this.load.image('expl2', 'static/images/ship-exhaust1.png');
        this.load.image('enemy-laser', '/static/images/extra-lasers.png');


        // load audio
        this.load.audio('mediumLaser', 'static/audio/mediumFireRateLaser.mp3');
        this.load.audio('asteroidDestroyed', 'static/audio/asteroidDestroy.mp3');
        this.load.audio('secondShipEngine', 'static/audio/engine2.mp3');
        this.load.audio('theme', 'static/audio/theme1.mp3');
        this.load.audio('enemyLaserBlast', 'static/audio/enemylaser1.mp3');
        this.load.audio('enemyExplode', 'static/audio/enemyexplode.mp3');
    
    }
    
    create() {
        // Create client socket
        socket = io(); 

    
        // moving space background
        this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
        this.tileSprite.setOrigin(0);
        this.tileSprite.setScrollFactor(0, 1);
        this.mainDead = false;
        this.secondDead = false;
    
        // asteroid handling which depends on level
        this.asteroidsGroup = this.physics.add.group();
        this.asteroidsArray = [];
        this.asteroidTimedEvent = this.time.addEvent({
            delay: 1000,
            callback: this.addAsteroid,
            callbackScope: this,
            loop: true
        })

        // Score display
        score1 = 0
        score2 = 0;
        
        this.totalScore = 0;

        totalAsteroids = 0;
        this.maxAsteroids = [1, 2, 3, 4, 5, 6, 7, 8, 10]
        this.maxAsteroidsIndex = 0;

        this.scoreText1 = this.add.text(16, 16, 'score: 0', { fontSize: '32px' });
        this.scoreText1.setDepth(10);
        this.scoreText2 = this.add.text(550, 16, 'score: 0', { fontSize: '32px'});
        this.scoreText2.setDepth(10);

        // enemy lasers
        this.enemies = this.add.group();
        this.enemyLasers = this.add.group();

        this.time.addEvent({
            delay: 1100, 
            callback: function() {
              var enemyNew = new GunShip(
                this,
                Phaser.Math.Between(0, this.game.config.width),
                0
              );
              this.enemies.add(enemyNew);
              enemyNew.setScale(.14);
              

            },
            callbackScope: this,
            loop: true
          });

        
        theme = this.sound.add('theme');
        theme.setLoop(true);
        theme.play();
        
        // main-ship logic
        this.main_ship = this.physics.add.sprite(400, 630, 'ship');
        this.main_ship.setScale(.2);
        this.main_ship.setDepth(1);
        this.main_ship.setCollideWorldBounds();
    
        // laser audio
        let mediumFireRateLaser = this.sound.add('mediumLaser');
        this.enemyLaserSound = this.sound.add('enemyLaserBlast');
        this.enemyExplode = this.sound.add('enemyExplode');
    
        // ship laser-logic
        this.laserGroup = new LaserGroup(this);
        this.laserGroup2 = new LaserGroup(this);
        this.laserGroup.setDepth(1);
        // event-listening for laser for main ship
        this.input.on( 'pointerdown', pointer => {
            // begin shooting
            if (!mainIsDead) {
            this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 50);
            mediumFireRateLaser.play();
            }
        });
        
        
    
        // event-listening for laser for second ship
        var spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
        spacebar.on( 'down', pointer => {
            if (!secondIsDead) {
            this.laserGroup2.fireLaser(this.second_ship.x, this.second_ship.y - 50)
            mediumFireRateLaser.play();
            }
        })
    
        // main-ship boosters logic
        this.emitter;
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
        this.emitter.setDepth(1);
        mainShipEngines.push(this.emitter)
    
        // second ship logic
    
        this.second_ship = this.physics.add.sprite(700, 630, 'ship-two');
        this.second_ship.setScale(.15);
        this.second_ship.setDepth(1);
        this.second_ship.setCollideWorldBounds(true);
    
        // second ship boosters
        
        
        var booster_count = .08
        var boosterOffset = -.0275
        var boosterOffsetY = -.06
        //for (var i = 1; i < 5; i++) {
        this.emitter_two = createBoosters(booster_count, boosterOffset, boosterOffsetY, this)
        this.emitter_two.setDepth(1);
        booster_count += boosterOffset;
        secondShipEngines.push(this.emitter_two);
        this.emitter_three = createBoosters(booster_count, boosterOffset, boosterOffsetY, this)
        this.emitter_three.setDepth(1);
        booster_count += boosterOffset;
        secondShipEngines.push(this.emitter_three);
        this.emitter_four = createBoosters(booster_count, boosterOffset, boosterOffsetY, this)
        this.emitter_four.setDepth(1);
        booster_count += boosterOffset;
        secondShipEngines.push(this.emitter_four);
        this.emitter_five = createBoosters(booster_count, boosterOffset, boosterOffsetY, this)
        this.emitter_five.setDepth(1);
        booster_count += boosterOffset;
        secondShipEngines.push(this.emitter_five);
        this.emitter_six = createBoosters(booster_count, boosterOffset, boosterOffsetY, this)
        this.emitter_six.setDepth(1);
        secondShipEngines.push(this.emitter_six);
        
    //}

    
    
         // laser-asteroid detection
        let asteroidDestroyed = this.sound.add("asteroidDestroyed");
         
         this.overlapLaser = this.physics.add.overlap(this.laserGroup, this.asteroidsGroup, function(laser, asteroid){
            if (laser.active && asteroid.active) {
            let asteroid_explosion
            // this.asteroid_explosion = this.physics.add.sprite(asteroid.x, asteroid.y, 'expl2');
            let asteroidTween = this.tweens.add({
                targets: asteroid,
                alpha: {from: 1, to: 0},
                duration: 100
            });
            
            asteroid_explosion = this.physics.add.sprite(asteroid.x, asteroid.y, 'expl2');
            asteroid_explosion.setScale(.2);
            asteroid_explosion.setDepth(1);
            
            let asteroidExplTween = this.tweens.add({
                targets: asteroid_explosion,
                alpha: {from: 0, to: 1},
                duration: 100,
                yoyo: true
            });

            
            asteroidTween.on('complete', () => {
                asteroid.destroy();
                score1 += 10;
                this.totalScore += 10;
            })
            asteroidExplTween.on('complete', () => {
                asteroid_explosion.destroy();
            })
            // asteroid.destroy();
            // this.asteroid_explosion.destroy();
            
            if (!asteroidDestroyed.isPlaying){
            asteroidDestroyed.play();
            }
            totalAsteroids -= 1;
        }
            // laser.disableBody(false, true)
        }, null, this);



        this.overlapLaser = this.physics.add.overlap(this.laserGroup2, this.asteroidsGroup, function(laser, asteroid){
            if (laser.active && asteroid.active) {
            let asteroid_explosion
            // this.asteroid_explosion = this.physics.add.sprite(asteroid.x, asteroid.y, 'expl2');
            let asteroidTween = this.tweens.add({
                targets: asteroid,
                alpha: {from: 1, to: 0},
                duration: 100
            });
            
            asteroid_explosion = this.physics.add.sprite(asteroid.x, asteroid.y, 'expl2');
            asteroid_explosion.setScale(.2);
            asteroid_explosion.setDepth(1);
            
            let asteroidExplTween = this.tweens.add({
                targets: asteroid_explosion,
                alpha: {from: 0, to: 1},
                duration: 100,
                yoyo: true
            });

            
            asteroidTween.on('complete', () => {
                asteroid.destroy();
                score2 += 10;
                this.totalScore += 10;
            })
            asteroidExplTween.on('complete', () => {
                asteroid_explosion.destroy();
            })
            // asteroid.destroy();
            // this.asteroid_explosion.destroy();
            
            if (!asteroidDestroyed.isPlaying){
            asteroidDestroyed.play();
            }
            totalAsteroids -= 1;

        }
            // laser.disableBody(false, true)
        }, null, this);


         // ship-asteroid detection
     
         this.overlapShip = this.physics.add.overlap(this.main_ship, this.asteroidsGroup, function(ship, asteroid){ 

            if (!mainIsDead) {
                
                mainIsDead = true;
                 destroyPlayerShip(this, ship, mainShipEngines, 1);//ship.destroy()
            }
                
                asteroid.destroy();
                totalAsteroids -= 1;
            
            
         }, null, this);
         this.overlapSecondShip = this.physics.add.overlap(this.second_ship, this.asteroidsGroup, function(ship, asteroid){ 

            if (!secondIsDead) {
                
                
                secondIsDead = true;
                destroyPlayerShip(this, ship, secondShipEngines, 2);//ship.destroy()
            }
            asteroid.destroy();
            totalAsteroids -= 1;
        
        
     }, null, this);
     
     
         // enemy ships
         this.enemy = this.physics.add.sprite(100, 200, 'enemy');
         this.enemy.setScale(.15);
         this.enemy.setCollideWorldBounds(true);
     
     
    
    
        // Listen for position updates
        socket.on('update_position', (data) => {
            if (data.player === 'main_x') {
                serverShip1Position.x = data.x;
            } else if (data.player === 'main_y') {
                serverShip1Position.y = data.y;
            }
            lastUpdatedTime = performance.now();
        });
    
        socket.on('update_position', (data) => {
            if (data.player === 'sec_x') {
                serverShip2Position.x = data.x;
            } else if (data.player === 'sec_y') {
                serverShip2Position.y = data.y;
            }
            lastUpdatedTime = performance.now();
        });
    
        // Initialize cursors
        this.cursors = this.input.keyboard.createCursorKeys();
    
        // Initialize movement keys
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);


                // overlap enemy laser
                this.overlapEnemyLaser = this.physics.add.overlap(this.enemyLasers, this.main_ship, function(laser, ship){
    
                    if (!mainIsDead) {
                        
                        mainIsDead = true;
                        destroyPlayerShip(this, ship, mainShipEngines, 1);//ship.destroy()
                    }
                    //this.emitter.stop();
                    laser.destroy();
                    
                }, null, this);
        
                this.overlapEnemyLaserOne = this.physics.add.overlap(this.enemyLasers, this.second_ship, function(laser, ship) {
        
                    if (!secondIsDead) {
                        
                        
                        secondIsDead = true;
                        destroyPlayerShip(this, ship, secondShipEngines, 2);//ship.destroy()
                    }
                  //  this.emitter_two.destroy();
                    laser.destroy();
                    
        
                }, null, this );
        
                // laser versus enemy ship
                var count = 0
                this.overlapLaserEnemy = this.physics.add.overlap(this.enemies, this.laserGroup, function(laser, enemy) {
                    score1 += 100
                    this.totalScore += 100;
                    let enemy_explosion
                    // this.asteroid_explosion = this.physics.add.sprite(asteroid.x, asteroid.y, 'expl2');
                    let enemyTween = this.tweens.add({
                        targets: enemy,
                        alpha: {from: 1, to: 0},
                        duration: 100
                    });
                    enemyTween.on('complete', () => {
                        enemy.destroy(true);
                        this.enemyExplode.play();
                    })
                    let coordArr = [-100, -75, - 50]
                    for (const coord of coordArr ) {

                    
                    enemy_explosion = this.physics.add.sprite(enemy.x, enemy.y + coord, 'expl1crop');
                    enemy_explosion.setScale(.5);
                    enemy_explosion.setDepth(1);
                    
                    let enemyExplTween = this.tweens.add({
                        targets: enemy_explosion,
                        alpha: {from: 0, to: 1},
                        duration: 200,
                        yoyo: true
                    });
                    enemyExplTween.on('complete', () => {
                        enemy_explosion.destroy();
                    })

                }
        
                    
                    
                    
                    // asteroid.destroy();
                    // this.asteroid_explosion.destroy();
                    
                   // if (!asteroidDestroyed.isPlaying){     PUT ENEMY DEAD SOUND HERE
                   // asteroidDestroyed.play();
                   // }
                        count++
                        laser.destroy(true);
                        
                        // if (count >= 5) {
                        //     this.scene.start("GameScene")
                            
                        // }
                
        
                }, null, this);

                this.overlapLaserEnemy2 = this.physics.add.overlap(this.enemies, this.laserGroup2, function(laser, enemy) {
                    score2 += 100
                    this.totalScore += 100;
                    let enemy_explosion
                    // this.asteroid_explosion = this.physics.add.sprite(asteroid.x, asteroid.y, 'expl2');
                    let enemyTween = this.tweens.add({
                        targets: enemy,
                        alpha: {from: 1, to: 0},
                        duration: 100
                    });
                    enemyTween.on('complete', () => {
                        enemy.destroy(true);
                        this.enemyExplode.play();
                    })
                    let coordArr = [-100, -75, - 50]
                    for (const coord of coordArr ) {

                    
                    enemy_explosion = this.physics.add.sprite(enemy.x, enemy.y + coord, 'expl1crop');
                    enemy_explosion.setScale(.5);
                    enemy_explosion.setDepth(1);
                    
                    let enemyExplTween = this.tweens.add({
                        targets: enemy_explosion,
                        alpha: {from: 0, to: 1},
                        duration: 200,
                        yoyo: true
                    });
                    enemyExplTween.on('complete', () => {
                        enemy_explosion.destroy();
                    })

                }
        
                    
                    
                    
                    // asteroid.destroy();
                    // this.asteroid_explosion.destroy();
                    
                   // if (!asteroidDestroyed.isPlaying){     PUT ENEMY DEAD SOUND HERE
                   // asteroidDestroyed.play();
                   // }
                        count++
                        laser.destroy(true);
                        
                        // if (count >= 5) {
                        //     this.scene.start("GameScene")
                            
                        // }
                
        
                }, null, this);
        
                
        
                // main ship versus enemy ship
                this.overlapEnemyMain = this.physics.add.overlap(this.main_ship, this.enemies, function(ship, enemy) {
                    
        
                    if (!mainIsDead) {
                        
                        mainIsDead = true;
                        destroyPlayerShip(this, ship, mainShipEngines, 1);//ship.destroy()
                    }
                    enemy.destroy()
                    this.enemyExplode.play();
                    //this.emitter.stop()
        
        
                }, null, this);
        
                 // second ship versus enemy ship
                 this.overlapEnemySecond = this.physics.add.overlap(this.second_ship, this.enemies, function(ship, enemy) {
                    
                    if (!secondIsDead) {
                        
                        
                        secondIsDead = true;
                        destroyPlayerShip(this, ship, secondShipEngines, 2);//ship.destroy()
                    }
                    enemy.destroy()
                    this.enemyExplode.play();
                    //this.emitter_two.stop()
                        
                    
        
                }, null, this);
    

        
            
    }


    
    update(time, delta) {
        // moving background logic
        
        if (totalAsteroids < 0) {
            totalAsteroids = 0;
        }
        if (this.maxAsteroidsIndex < 8 && this.totalScore >= this.maxAsteroids[this.maxAsteroidsIndex] * 1000) {
            this.maxAsteroidsIndex += 1
        }
        
        if (this.mainDead && this.secondDead) {
           
            if (score1 > score2 && score1 > highscore) {
                highscore = score1;
            }
            else if (score2 > score1 && score1 > highscore) {
                highscore = score2;
            }
           //endGame(this, theme);
           this.mainDead = false;
           this.secondDead = false;
           mainIsDead = false;
           secondIsDead = false;
           
            theme.stop();
            this.scene.start('TitleScene')
        
    }


        this.tileSprite.tilePositionY -= 5;
    
        // Ship Movement
        playerMovement.call(this);
        linearInterpolation.call(this);


        // Score update
        this.scoreText1.setText('score: ' + score1);
        this.scoreText2.setText('score: ' + score2);  // to-do: score1 is rising to 1200 before any lasers fired
    
    
        // asteroid movement and additions
    
        this.asteroidsArray = this.asteroidsArray.filter((asteroid)=> asteroid.active );
        for (const asteroid of this.asteroidsArray) {
            if (!asteroid.isOrbiting()){
                asteroid.launch(this.main_ship.x, this.main_ship.y);
                asteroid.launch(this.second_ship.x, this.second_ship.y);
            }
            asteroid.update(time, delta);
        }
    
        if (totalAsteroids <= this.maxAsteroids[this.maxAsteroidsIndex]) {
            console.log(totalAsteroids, this.maxAsteroids[this.maxAsteroidsIndex])
        
        let mathRandom = Math.random()
        
        // set minimum size for asteroid
        while (mathRandom < 0.4) {
            mathRandom = Math.random()
        }
        
        
        const asteroid = new Asteroid(this, 0, 0, 'big-asteroid', 0).setScale(mathRandom * 1);
        this.asteroidsGroup.add(asteroid, true);
        this.asteroidsArray.push(asteroid);
        totalAsteroids += 1
    }

        this.enemyShoot()

        for (var i = 0; i < this.enemies.getChildren().length; i++) {
            var enemy = this.enemies.getChildren()[i];
      
            enemy.update(this);
          }
    
    
        
    }
    enemyShoot() {

        for(var i = 0; i < this.enemies.getChildren().length; i++) { //goes through every single enemy
            var randomEnemyShoot = Phaser.Math.Between(1, 150);
            if (randomEnemyShoot == 1) { //10% chance to shoot
                var laser = new EnemyLaser(this, this.enemies.getChildren()[i]);
                this.enemyLasers.add(laser);
                
                if (!this.enemyLaserSound.isPlaying) {
                this.enemyLaserSound.play();
                }
                
            }
        }
    }

}
//function playLaser (context) {
//    let enemyLaserSound = context.sound.add('enemyLaserBlast');
//    enemyLaserSound.play();
//}

function endGame(context, music) {
    context.tweens.add({
        targets: music,
         volume: { from: 1, to: 0},
           duration: 1800
        });
    music.stop();
        
    context.cameras.main.fadeOut(2000, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                context.scene.start('TitleScene');
                
            }
        }, context) 
}

let serverShip1Position = { x: 400, y: 630 };
let serverShip2Position = { x: 700, y: 630 };
let lastUpdatedTime = 0;
let socket;
var score1 = 0;
var score2 = 0;
var mainIsDead = false;
var secondIsDead = false;
var mainShipEngines = [];
var secondShipEngines = [];

class Asteroid extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'big-asteroid');
        this.speed = Phaser.Math.GetSpeed(100, 1);
        this.orbiting = false;
        this.direction = 0;
        this.factor = 0;
    }
    launch (shipX, shipY) {
        this.orbiting = true;
        this.setActive(true);
        this.setVisible(true);
        let xOrigin = Phaser.Math.RND.between(0, 800);
        let yOrigin = 0;
        this.setPosition(xOrigin, yOrigin);
        if (shipY > xOrigin) {
            let m = (shipY - yOrigin) / (shipX - xOrigin);
            this.direction = Math.atan(m);
        }
        else {
            this.factor = -1;
            let m = (shipY - yOrigin) / (xOrigin - shipX);
            this.direction = Math.atan(m);
        }
        this.angleRotation = Phaser.Math.RND.between(0.2, 0.9);
    }
    
    
      update (time, delta) {
        this.x += this.factor * Math.cos(this.direction) * this.speed * delta;
        this.y += Math.cos(this.direction) * this.speed * delta;
        this.angle += this.angleRotation;
    
        if (this.x < -50 || this.y < -50 || this.x > 800 || this.y > 700 ) {
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
            totalAsteroids -= 1
        }
}
    isOrbiting() {
        return this.orbiting;
    }

}

class Laser extends Phaser.Physics.Arcade.Sprite {
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
        });
    }

    fireLaser(x, y) {
        const laser = this.getFirstDead(false);
        if (laser) {
            laser.fire(x, y);
        }
    }
}

function addEventd(){

}

function playerMovement(){
    // moving ship with keys
    const speed = 8;
    //let secondShipEngine = this.sound.add("secondShipEngine");
    if (this.keyA.isDown) {
        this.main_ship.x -= speed;
        socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
    } else if (this.keyD.isDown) {
        this.main_ship.x += speed;
        socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
    } else if (this.keyW.isDown) {
        this.main_ship.y -= speed;
        socket.emit('player_move', { player: 'main_y', y: this.main_ship.y });
    } else if (this.keyS.isDown) {
        this.main_ship.y += speed;
        socket.emit('player_move', { player: 'main_y', y: this.main_ship.y });
    }

    //if (secondShipEngine.isPlaying){
    //    secondShipEngine.stop();
   // }
    // moving second ship with keys
    if  (this.cursors.left.isDown){
        this.second_ship.x -= speed;
    //    secondShipEngine.play();
        socket.emit('player_move', { player: 'sec_x', x: this.second_ship.x });
    } else if  (this.cursors.right.isDown){
        this.second_ship.x += speed;
        socket.emit('player_move', { player: 'sec_x', x: this.second_ship.x });
    } else if  (this.cursors.up.isDown){
        this.second_ship.y -= speed;
        socket.emit('player_move', { player: 'sec_y', y: this.second_ship.y });
    } else if (this.cursors.down.isDown){
        this.second_ship.y += speed;
        socket.emit('player_move', { player: 'sec_y', y: this.second_ship.y });
    }

}

// Linear Interpolation for ships
function linearInterpolation() {
    let now = performance.now();
    let delta = now - lastUpdatedTime;
    let interpolationFactor = Math.min(delta / 5000, 1);

    this.main_ship.x = this.main_ship.x + (serverShip1Position.x - this.main_ship.x) * interpolationFactor;
    this.main_ship.y = this.main_ship.y + (serverShip1Position.y - this.main_ship.y) * interpolationFactor;

    this.second_ship.x = this.second_ship.x + (serverShip2Position.x - this.second_ship.x) * interpolationFactor;
    this.second_ship.y = this.second_ship.y + (serverShip2Position.y - this.second_ship.y) * interpolationFactor;
}


// const ipAddress = socket.handshake.headers["x-forwarded-for"].split(",")[0];

// function asteroidToLaser(laser, asteroid){
    
//    asteroid.destroy();

    // laser.disableBody(false, true)
// }


function asteroidToShip(ship, asteroid) {    

    destroyPlayerShip(this, ship);//ship.destroy()
    asteroid.destroy();

}



function createBoosters(count, offset, offesty, context){
    let newBooster = context.add.particles(0, 0, 'exhaust-two',{
        quantity: 5,
        speedY: { min: 10, max: 30 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.065, end: .0065 },
        follow: context.second_ship,
        scale: 0.2,
        accelerationY: 1000,
        lifespan: { min: 100, max: 300 },
        followOffset: { y: context.second_ship.height * 0.075 + offesty , x: context.second_ship.width * (count += offset)},
        alpha: { random: [0.1, 0.8] },
        
    })
    return newBooster;
}


function destroyPlayerShip(context, ship, engineArr, player) {

    let shipExplTween = context.tweens.add({
        targets: ship,
        alpha: {from: 0, to: 1},
        duration: 300,
        yoyo: true,
        repeat: 5
    });

    shipExplTween.on('repeat', () => {
        multiExplosion(context, ship)
    })
    
    shipExplTween.on('complete', () => {
        ship_explosion = context.physics.add.sprite(ship.x, ship.y, 'expl2');
        ship_explosion.setScale(1);
        ship_explosion.setDepth(1);
        ship.destroy();
        
        for (const engine of engineArr) {
            engine.stop();
            engine.destroy();
        }
        
        
        
            
        let explTween = context.tweens.add({
                targets: ship_explosion,
                alpha: {from: 0, to: 1},
                duration: 600,
                yoyo: true
            });

            explTween.on('complete', () => {
                ship_explosion.destroy();
                if (player == 1) {
                    context.mainDead = true;
                }
                else {
                    context.secondDead = true;
                }

                
            })

    })

    
}

function multiExplosion(context, ship){
    
    explosion = context.physics.add.sprite(ship.x, ship.y, 'expl1crop');
    explosion.setScale(.7);
    explosion.setDepth(1);
    let explodeTween = context.tweens.add({
        targets: explosion,
        alpha: {from: 0, to: 1},
        duration: 200,
        yoyo: true
    });

    explodeTween.on('complete', () => {
        explosion.destroy();
    })
    
}

class Entity extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, type) {
        super(scene, x, y, key);

        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this, 0);
        this.setData("type", type);
        this.setData("isDead", false);
      
    }
  }


class GunShip extends Entity {
    constructor(scene, x, y) {
      super(scene, x, y, "enemy", "GunShip");
      this.body.velocity.x = Phaser.Math.Between(0, 75);

    }
    onDestroy() {
        if (this.shootTimer !== undefined) {
            if (this.shootTimer) {
              this.shootTimer.remove(false);
            }
          }
    }
  }
  

class EnemyLaser extends Entity {
  
    constructor(scene, enemy) {
        var x = enemy.x;
        var y = enemy.y;
    
        super(scene, x, y, "enemy-laser");
        scene.add.existing(this);
    
        // this.play("laser_anim");
        scene.physics.world.enableBody(this);
        this.body.velocity.y = 250;
    }
    
    
    update(){
        if (this.y > 600) {
            this.destroy();
        }
    }
  }

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
