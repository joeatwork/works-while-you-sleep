
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
	this.movedDx = 0;
	this.movedDy = 0;
	this.width = width;
	this.height = height;
	this.bounds = bounds;
	this.lastTime = -1;
    };

    PlayerCharacter.WALK_NORTH = 'WALK_NORTH';
    PlayerCharacter.WALK_SOUTH = 'WALK_SOUTH';
    PlayerCharacter.WALK_EAST = 'WALK_EAST';
    PlayerCharacter.WALK_WEST = 'WALK_WEST';
    PlayerCharacter.REST = 'REST';

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


	    var halfWidth = Math.floor(this.width / 2);
	    var halfHeight = Math.floor(this.height / 2);

	    // we fudge the bounds rectangle by 1 px to allow for tight squeezes.
	    var destIsClear = this.bounds.checkClear( destX - halfWidth  + 1,
						      destY - halfHeight + 1,
						      this.width - 2,
						      this.height - 2)
	    if (destIsClear) {
		this.x = destX;
		this.y = destY;
		this.movedDx = moveX;
		this.movedDy = moveY;
	    }
	    else {
		this.whenBlocked();
	    }
	},

	whenBlocked: function() {
	    if (Math.random() < 0.5) { // counterclockwise
		var oldDy = this.dy;
		this.dy = - this.dx;
		this.dx = oldDy;
	    }
	    else { // clockwise
		var oldDx = this.dx;
		this.dx = - this.dy;
		this.dy = oldDx;
	    }
	},

	orientation: function() {
	    if (this.movedDy > 0) {
		return PlayerCharacter.WALK_SOUTH;
	    }
	    else if (this.movedDy < 0) {
		return PlayerCharacter.WALK_NORTH;
	    }
	    else if (this.movedDx > 0) {
		return PlayerCharacter.WALK_EAST;
	    }
	    else if (this.movedDx < 0) {
		return PlayerCharacter.WALK_WEST;
	    }
	    else {
		return PlayerCharacter.REST; // Default at rest
	    }		
	}
    };

    return {
	PlayerCharacter: PlayerCharacter
    }
})();
