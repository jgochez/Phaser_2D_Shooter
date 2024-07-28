




class EnemyShips extends Phaser.Scene {
    constructor() {
        super("EnemyShips");

    }

    preload () {

        // loading images
        this.load.image('space', '/static/images/background1.jpeg');
        this.load.image('ship', '/static/images/ship1.png');
        this.load.image('big-asteroid', '/static/images/asteroids-sprite.png');
        this.load.image('exhaust', '/static/images/ship-exhaust1.png');
        this.load.image('laser-beam', '/static/images/beams.png');
        
    
        // new images
        this.load.image('enemy', '/static/images/enemy-ship.webp');
        this.load.image('ship-two', '/static/images/space-ship2-1.png');
        this.load.image('exhaust-two', '/static/images/exhaust-effects-blue.jpg')
        this.load.image('expl', '/static/images/exp.jpeg');
        this.load.image('enemy-laser', '/static/images/extra-lasers.png')


        // load audio
        this.load.audio('mediumLaser', '/static/audio/mediumFireRateLaser.mp3');
        this.load.audio('asteroidDestroyed', '/static/audio/asteroidDestroy.mp3');
        this.load.audio('secondShipEngine', '/static/audio/engine2.mp3');
        this.load.audio('theme', '/static/audio/theme1.mp3');
    
    }




    create () {

        // enemy lasers
        // this.enemyLasers = this.add.group();
        this.enemies = this.add.group();
        this.enemyLasers = this.add.group();

        this.time.addEvent({
            delay: 1000, // this can be changed to a higher value like 1000
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
        


        // enemy logic and spawning
        // this.enemiesGroup = this.physics.add.group();
        
        // var enemies = this.enemiesGroup.create(Phaser.Math.Between(20, 600) , -10, 'enemy');
        
        // var i = 0;
        // while (i < 10) {
        //     var x = this.enemiesGroup.create( (i * 20) * 10 , 60, 'enemy').setScale(.14);
        //     x;
        //     x.body.setAllowGravity(false);
        //     x.setDepth(1);
        //     x.setCollideWorldBounds(true);
        //     x.body.velocity.x = -60;
        //     // x.body.velocity.y = 30
        //     x.setBounceX(1.1);
        //     x.setBounceY(1.1);
        //     i++

        //     this.enemyTimer = this.time.addEvent({
        //         delay: 1500,
        //         callback: this.changeEnemyDirection,
        //         callbackScope: this,
        //         loop: true
        //     });
            
        
        // }


        // // overlap enemy and laser
        // this.overlapEnemy = this.physics.add.overlap(this.laserGroup, this.EnemyShips, function(laser, enemy){
    
        //     enemy.destroy();
            
        //     // laser.disableBody(false, true)
        // }, null, this);


        
        // this.enemiesArray = [];
        // this.enemyTimedEvent = this.time.addEvent({
        //     delay: 1000,
        //     callback: this.addEnemy,
        //     callbackScope: this,
        //     loop: true
        // })




        // moving space background
        this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
        this.tileSprite.setOrigin(0);
        this.tileSprite.setScrollFactor(0, 1);



        let theme = this.sound.add('theme');
        theme.setLoop(true);
        theme.play();

        // main-ship logic
        this.main_ship = this.physics.add.sprite(400, 630, 'ship');
        this.main_ship.setScale(.2);
        this.main_ship.setDepth(1);
        this.main_ship.setCollideWorldBounds();
    
        // laser audio
        let mediumFireRateLaser = this.sound.add('mediumLaser');
    
        // ship laser-logic
        this.laserGroup = new LaserGroup(this);
        this.laserGroup.setDepth(1);
        // event-listening for laser for main ship
        this.input.on( 'pointerdown', pointer => {
            // begin shooting
            this.laserGroup.fireLaser(this.main_ship.x, this.main_ship.y - 50);
            mediumFireRateLaser.play();
        });
        
        
    
        // event-listening for laser for second ship
        var spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
        spacebar.on( 'down', pointer => {
            this.laserGroup.fireLaser(this.second_ship.x, this.second_ship.y - 50)
            mediumFireRateLaser.play();
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
    
        // second ship logic
    
        this.second_ship = this.physics.add.sprite(700, 630, 'ship-two');
        this.second_ship.setScale(.15);
        this.second_ship.setDepth(1);
        this.second_ship.setCollideWorldBounds(true);
    
        // second ship boosters
        
        var booster_count = .08
        var boosterOffset = -.03
        var boosterOffsetY = -.06
        for (var i = 1; i < 5; i++) {
        this.emitter_two = this.add.particles(0, 0, 'exhaust-two',{
            quantity: 5,
            speedY: { min: 10, max: 30 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.065, end: .0065 },
            follow: this.second_ship,
            scale: 0.2,
            accelerationY: 1000,
            lifespan: { min: 100, max: 300 },
            followOffset: { y: this.second_ship.height * 0.075 + boosterOffsetY , x: this.second_ship.width * (booster_count += boosterOffset)},
            alpha: { random: [0.1, 0.8] },
            
        })
        this.emitter_two.setDepth(1);
    }

        // Initialize cursors
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Initialize movement keys
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);


        // overlap enemy laser
        this.overlapEnemyLaser = this.physics.add.overlap(this.enemyLasers, this.main_ship, function(laser, ship){
    
            ship.destroy();
            this.emitter.stop();
            laser.destroy();
            // if (!asteroidDestroyed.isPlaying){
            // asteroidDestroyed.play();
            // }
            // laser.disableBody(false, true)
        }, null, this);

        this.overlapEnemyLaserOne = this.physics.add.overlap(this.enemyLasers, this.second_ship, function(laser, ship) {

            ship.destroy();
            this.emitter_two.destroy();
            laser.destroy();
            

        }, null, this );

        // main ship laser versus enemy ship

        this.overlapLaserEnemy = this.physics.add.overlap(this.laserGroup, this.enemies, function(laser, ship) {
            

            ship.destroy()
            laser.destroy()

        }, null, this);

            

        // this.physics.add.collider(this.laserGroup, this.enemies, function(playerLaser, enemy) {
  
           
        //         enemy.destroy();
        //         playerLaser.destroy();
              

        // });


    }



    update (time, delta) {

       

        // moving background logic
        this.tileSprite.tilePositionY -= 5;
    
        // Ship Movement
        playerMovement.call(this);
        // linearInterpolation.call(this);



        // this.enemiesArray = this.enemiesArray.filter((enemy)=> enemy.active );
        // for (const enemy of this.enemiesArray) {
        //     if (!enemy.isOrbiting()){
        //         enemy.launch(this.main_ship.x, this.main_ship.y);
        //         enemy.launch(this.second_ship.x, this.second_ship.y);
        //     }
        //     enemy.update(time, delta);
        // }
    
        // const enemy = new EnemyShips(this, 0, 0, 'enemy', 0);
        // this.enemiesGroup.add(enemy, true);
        // this.enemiesArray.push(enemy);

        

    }

    // addEnemy() {
    //     let enemy = new EnemyShips (this, 0, 0, 'enemy', 0).setScale(0.14);
    //     this.enemiesGroup.add(enemy, true);
    //     this.enemiesArray.push(enemy);
    // }    

 

}


function playerMovement(){
    // moving ship with keys
    const speed = 8;

    if (this.cursors.left.isDown) {
        this.main_ship.x -= speed;
        // socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
    } else if (this.cursors.right.isDown) {
        this.main_ship.x += speed;
        // socket.emit('player_move', { player: 'main_x', x: this.main_ship.x });
    } else if (this.cursors.up.isDown) {
        this.main_ship.y -= speed;
        // socket.emit('player_move', { player: 'main_y', y: this.main_ship.y });
    } else if (this.cursors.down.isDown) {
        this.main_ship.y += speed;
        // socket.emit('player_move', { player: 'main_y', y: this.main_ship.y });
    }

    // moving second ship with keys
    if (this.keyA.isDown) {
        this.second_ship.x -= speed;
        // socket.emit('player_move', { player: 'sec_x', x: this.second_ship.x });
    } else if (this.keyD.isDown) {
        this.second_ship.x += speed;
        // socket.emit('player_move', { player: 'sec_x', x: this.second_ship.x });
    } else if (this.keyW.isDown) {
        this.second_ship.y -= speed;
        // socket.emit('player_move', { player: 'sec_y', y: this.second_ship.y });
    } else if (this.keyS.isDown) {
        this.second_ship.y += speed;
        // socket.emit('player_move', { player: 'sec_y', y: this.second_ship.y });
    }



}

function asteroidToShip(ship, asteroid) {    

    ship.destroy();
    asteroid.destroy();

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





// class ChaserShip extends Entity {
//     constructor(scene, x, y) {
//       super(scene, x, y, "sprEnemy1", "ChaserShip");
//       this.body.velocity.y = Phaser.Math.Between(50, 100);

//     }
//   }
  
class GunShip extends Entity {
    constructor(scene, x, y) {
      super(scene, x, y, "enemy", "GunShip");
      this.body.velocity.x = Phaser.Math.Between(0, 75);
    //   this.shootTimer = this.scene.time.addEvent({
    //     delay: 1000,
    //     callback: function() {
    //       var newLaser = new EnemyLaser(
    //         this.scene,
    //         this.x,
    //         this.y
    //       );
    //       newLaser.setScale(1);
    //       this.scene.enemyLasers.add(newLaser);
    //     },
    //     callbackScope: this,
    //     loop: true
    //   });

    }
    onDestroy() {
        if (this.shootTimer !== undefined) {
            if (this.shootTimer) {
              this.shootTimer.remove(false);
            }
          }
    }
  }
  
//   class CarrierShip extends Entity {
//     constructor(scene, x, y) {
//       super(scene, x, y, "sprEnemy2", "CarrierShip");
//       this.body.velocity.y = Phaser.Math.Between(50, 100);

//       this.play("sprEnemy2");
//     }
//   }
class EnemyLaser extends Entity {
  constructor(scene, x, y) {
    super(scene, x, y, "enemy-laser");
    this.body.velocity.y = 200;
  }
}