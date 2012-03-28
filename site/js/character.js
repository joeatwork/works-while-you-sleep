
// A character owns the position, identity, and physics
// of a resident of the game world.
window.Character = (function() {
    "use strict";


    /**************************************************/
    // a Costume manages drawing and animating a character
    // to a graphics context.
    var Costume = (function() {

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

        var ANIMATION_SPEED_MS = 250;

        var Costume = function(image, spriteWidth, spriteHeight) {
            this.image = image;
            this.spriteWidth = spriteWidth;
            this.spriteHeight = spriteHeight;
        };


        Costume.create = function(image, spriteWidth, spriteHeight) {
            return new Costume(image, spriteWidth, spriteHeight);
        };

        Costume.prototype = {

            // gfx - a graphics context
            // posX, posY - point in gfx coordinates to draw the upper left corner
            //    of the character
            // dx, dy - direction of motion of character in the X and Y directions,
            //    as -1, 0, or 1
            // time - in millisecond ticks, from some zero.
            draw : function(gfx, posX, posY, dx, dy, time) {
                if(!time) time = 0;

                var orientation = SOUTH;
                var cellOffset = 0;

                if(dx || dy) {
                    orientation = dirToOrientation(dx, dy);
                    var animTime = Math.floor(time/ANIMATION_SPEED_MS);
                    cellOffset = animTime % 4;
                }

                var cellY = this.spriteHeight * orientation;
                var cellX = this.spriteWidth * cellOffset;

                gfx.drawImage(this.image,
                              cellX, cellY, this.spriteWidth, this.spriteHeight,
                              posX, posY, this.spriteWidth, this.spriteHeight);
            },

            width : function() {
                return this.spriteWidth;
            },

            height : function() {
                return this.spriteHeight;
            }
        }; // Costume.prototype


        return Costume;
    })(); /* Costume */


    /**************************************************************/

    // Characters are constructed with
    //  - a Costume, to represent themselves on gfx contexts
    var Character = function(costume) {
        this.costume = costume;
        this.xSpeed = 0;
        this.ySpeed = 0;
    }

    Character.Costume = Costume;

    Character.create = function(costume) {
        return new Character(costume);
    };

    Character.prototype = {

        //  - bounds - has a check(x,y) method
        //  - a Footprint rectangle {x, y, width, height } for collision detection
        //       where x,y are offset from costume's top left corner
        setBounds : function(bounds, footX, footY, footWidth, footHeight) {
            this.bounds = bounds;
            this.footX = footX || 0;
            this.footY = footY || 0;
            this.footWidth = footWidth || this.costume.width();
            this.footHeight = footHeight || this.costume.height();
        },

        setPosition : function(xPosition, yPosition) {
            this.xPosition = xPosition;
            this.yPosition = yPosition;
        },

        // Speed should be expressed in pixels-per second
        setSpeed : function(xSpeed, ySpeed) {
            this.xSpeed = xSpeed;
            this.ySpeed = ySpeed;
        },

        // Advance this character's state through time. Likely VERY SPECIAL.
        // Callers should promise that if called with time === x, ALL future
        // calls will have time > x
        move : function(time) {
            if(! this.now) {
                this.now = time;
                return;
            }
            // ELSE, if time is valid

            var deltaT = time - this.now;

            var dX = this.xSpeed * (deltaT/1000);
            var dY = this.ySpeed * (deltaT/1000);

            var targetX = this.xPosition + dX;
            var targetY = this.yPosition + dY;

            if(this.bounds) {
                var targetFootX = Math.floor(this.footX + targetX);
                var targetFootY = Math.floor(this.footY + targetY);
		var targetWidth = this.footWidth;
		var targetHeight = this.footHeight;

                var isClear =
                    this.bounds.checkClear(targetFootX,
                                           targetFootY,
                                           targetWidth,
                                           targetHeight);

                if(isClear) {
                    this.xPosition = targetX;
                    this.yPosition = targetY;
                }
		else {
		    var oldXSpeed = this.xSpeed;
		    this.xSpeed = -this.ySpeed;
		    this.ySpeed = oldXSpeed;
		}
            }

            this.now = time;

            // CHECK this.bounds
        },

        // Draw the RIGHT THING on the canvas, for the time
        // and state last seen (and calculated) with move().
        // Does not handle Z-ordering.
        draw : function(gfx) {
            this.costume.draw(gfx,
                              Math.floor(this.xPosition),
                              Math.floor(this.yPosition),
                              this.xSpeed, this.ySpeed,
                              this.now);
        },
    };

    return Character;
})();
