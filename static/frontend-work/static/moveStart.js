var PhaserGame = function () {

    this.bmd = null;
    this.startButton = null;
    this.points = {
        'x': [32, 128, 256, 384, 512, 608],
        'y': [240, 240, 240, 240, 240, 240]
    }
}

PhaserGame.prototype = {

    create: function () {

        this.bmd = this.add.bitMapData(this.game.width, this.game.height);
        this.bmd.addToWorld();

        var py = this.points.y;

        for (var i = 0; i < py.length; i++) {
            py[i] = this.rnd.between(32, 432);
        }
        this.plot();
    },

    plot: function () {
        this.bmd.clear();
        this.path = [];
        var x = 1 / game.width;


        for (var i = 0; i <= 1; i++) {
            var px = this.math.linearInterpolation(this.points.x, i);
            var py = this.math.linearInterpolation(this.points.y, i);
        
            
            this.path.push(  { x: px, y: py }  )
            this.bmd.rect(px, py, 1, 1, 'rgba(255, 255, 255, 1)');
        }

        for (var p = 0; p < this.points.x.length; p++) {

            this.bmd.rect(this.points.x[p]-3, this.points.y[p]-3, 6, 6, 'rgba(255, 0, 0, 1)')
        }

        
    },

    update: function() {

        this.startButton.x = this.path[this.pi].x;
        this.startButton.y = this.path[this.pi].y;

        this.pi++

        if (this.pi >= this.path.length) {
            this.pi = 0;
        }

    }
};

game.state.add('Game', PhaserGame, true)