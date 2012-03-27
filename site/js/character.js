
// A character owns the position, identity, and physics
// of a resident of the game world.
window.Character = (function() {
    "use strict";

    var Character = function() {}

    /**************************************************/
    Character.Costume = (function() {

        var NORTH = 0;
        var EAST = 1;
        var SOUTH = 2;
        var WEST = 3;

        var dirToOrientation = function(dx, dy) {
            var orientation = SOUTH;
            if(dy < 0) orientation = NORTH;
            else if(dx > 0) orientation = EAST;
            else if(dx < 0) orientation = WEST;

            return orientation;
        };

        var ANIMATION_SPEED_MS = 500;

        // a Costume manages drawing and animating a character
        // to a graphics context.
        var Costume = function(image, spriteWidth, spriteHeight) {
            this.image = image;
            this.spriteWidth = spriteWidth;
            this.spriteHeight = spriteHeight;
        };


        Costume.create = function(image, spriteWidth, spriteHeight) {
            return new Costume(image, spriteWidth, spriteHeight);
        };

        // gfx - a graphics context
        // posX, posY - point in gfx coordinates to draw the upper left corner
        //    of the character
        // dx, dy - direction of motion of character in the X and Y directions,
        //    as -1, 0, or 1
        // time - in millisecond ticks, from some zero.
        Costume.prototype.draw = function(gfx,
                                          posX, posY,
                                          dx, dy,
                                          time) {
            if(!time) time = 0;

            var orientation = SOUTH;
            var cellOffset = 0;

            if(dx || dy) {
                orientation = dirToOrientation(dx, dy);
                var animTime = Math.floor(time/ANIMATION_SPEED_MS);
                cellOffset = 1 + (animTime % 2);
            }

            var cellY = this.spriteHeight * orientation;
            var cellX = this.spriteWidth * cellOffset;

            gfx.drawImage(this.image,
                          cellX, cellY, this.spriteWidth, this.spriteHeight,
                          posX, posY, this.spriteWidth, this.spriteHeight);
        };


        return Costume;
    })(); /* Costume */


    /**************************************************************/

    Character.create = function(costume) {
        var ret = new Character();
        ret.costume = costume;
        return ret;
    };

    Character.prototype = {

        // Advance this character's state through time. Likely VERY SPECIAL.
        // Callers should promise that if called with time === x, ALL future
        // calls will have time > x
        move : function(time) {
            this.now = time;
        },

        // Draw the RIGHT THING on the canvas, for the time
        // and state last seen (and calculated) with move().
        // Does not handle Z-ordering.
        draw : function(gfx) {
            this.costume.draw(gfx,
                              this.xPosition, this.yPosition,
                              this.xSpeed, this,ySpeed,
                              this.now);
        },
    };

    return Character;
})();
