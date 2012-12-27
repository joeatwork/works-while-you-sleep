
window.level = (function() {
    "use strict";

    var WALK_SPEED = 32/1000; // PIXELS PER MILLISECOND

    var PlayerCharacter = function(startX,
				   startY,
				   startDx,
				   startDy,
				   width,
				   height,
				   bounds
				  ) {
	this.x = startX;
	this.y = startY;
	this.dx = startDx;
	this.dy = startDy;
	this.width = width;
	this.height = height;
	this.bounds = bounds;
	this.lastTime = -1;
    };

    PlayerCharacter.prototype = {

	// We tend to get stuck in the walls- We need a better pathfinding algorithm
	// or lower-fi (and thus smoother) bounds
	update: function(nowTime) {
	    if (this.lastTime < 0) {
		this.lastTime = nowTime;
		return;
	    }
	    // ELSE we have a valid delta time

	    var deltaTime = nowTime - this.lastTime;
	    var moveX = this.dx * WALK_SPEED * deltaTime;
	    var moveY = this.dy * WALK_SPEED * deltaTime;

	    if ((Math.abs(moveX) < 1.0) && (Math.abs(moveY) < 1.0)) {
		return;
	    }
	    // ELSE we're committed to move

	    this.lastTime = nowTime;
	    var destX = Math.floor(this.x + moveX);
	    var destY = Math.floor(this.y + moveY);

	    var destIsClear = this.bounds.checkClear( destX - Math.floor(this.width / 2),
						      destY - Math.floor(this.height / 2),
						      this.width,
						      this.height)
	    if (destIsClear) {
		this.x = destX;
		this.y = destY;
	    }
	    else {
		this.whenBlocked();
	    }
	},

	whenBlocked: function() {
	    var whim = -1;
	    if (Math.random() < 0.5) {
		whim = 1;
	    }

	    var oldDx = this.dx;
	    this.dx = this.dy * whim;
	    this.dy = oldDx;
	}
    };

    return {
	PlayerCharacter: PlayerCharacter
    }
})();
