
// A character owns the position, identity, and physics
// of a resident of the game world.
window.Character = (function() {
    "use strict";

    /**************************************************/
    // a Costume manages drawing and animating a character
    // to a graphics context.
    //
    // Costume images should have the following layout
    //
    // REST North, North frame 2, North frame 3, North frame 4
    // REST East, East frame 2, East frame 3, East frame 4
    // REST South, South frame 2, South frame 3, South frame 4
    // REST West, West frame 2, West frame 3, West frame 4
    //
    // Where Rest == the first frame of a walk cycle,
    // and distance traveled in 1 cycle == width of costume
    //
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
            // dx, dy - speed of motion of character in the X and Y directions,
            //    in pixels.
            // time - in millisecond ticks, from some zero.
            draw : function(gfx, posX, posY, dx, dy, time) {
                if(!time) time = 0;

                var orientation = SOUTH;
                var cellOffset = 0;

                // Broken? Animation should correspond to MOTION, not TIME
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
        this.xSpeed = 0;
        this.ySpeed = 0;

        if(costume) this.setCostume(costume);
    }

    Character.Costume = Costume;

    Character.create = function(costume) {
        return new Character(costume);
    };

    Character.prototype = {

        // - costume, a Character.Costume
        setCostume : function(costume) {
            this.costume = costume;
        },

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

        // LOGICAL center of the character
        getCenter : function() {
            return { x : this.xPosition + this.footX + (this.footWidth/2),
                     y : this.yPosition + this.footY + (this.footHeight/2) };
        },

        // Speed should be expressed in pixels-per second
        setSpeed : function(xSpeed, ySpeed) {
            this.xSpeed = xSpeed;
            this.ySpeed = ySpeed;
        },

        // Called when we would otherwise bump into a wall
        whenBlocked : function() {
            var oldXSpeed = this.xSpeed;
            this.xSpeed = -this.ySpeed;
            this.ySpeed = oldXSpeed;
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

	    var isClear = true;
            if(this.bounds) {
                var targetFootX = Math.floor(this.footX + targetX);
                var targetFootY = Math.floor(this.footY + targetY);
                var targetWidth = this.footWidth;
                var targetHeight = this.footHeight;

                isClear =
                    this.bounds.checkClear(targetFootX,
                                           targetFootY,
                                           targetWidth,
                                           targetHeight);
            }

            if(isClear) {
                this.xPosition = targetX;
                this.yPosition = targetY;
            }
            else {
                this.whenBlocked();
            }

            this.now = time;

            // CHECK this.bounds
        },

        // Draw the RIGHT THING on the canvas, for the time
        // and state last seen (and calculated) with move().
        // Does not handle Z-ordering.
        draw : function(gfx) {
            gfx.save();
            gfx.translate(this.xPosition, this.yPosition);
            this.costume.draw(gfx, 0, 0, this.xSpeed, this.ySpeed, this.now);
            gfx.restore();
        },
    };

    return Character;
})();
