
window.level = (function() {
    "use strict";

    //////////////////////////////

    var Battle = function() {
	var nameIndex = _.random(0, window.data.first_names.length - 1);
	this._opponentName = window.data.first_names[ nameIndex ];
    };

    Battle.prototype.opponentName = function() {
	return this._opponentName;
    };

    Battle.prototype.youSaid = function() {
	return "What time is it?";
    };

    Battle.prototype.theySaid = function() {
	return "It's Business Time!";
    };

    ///////////////////////////////////

    var WALK_SPEED = 64/1000; // PIXELS PER MILLISECOND
    var PIXELS_PER_STEP = 32; // PIXELS PER "STEP" FOR BATTLE FREQUENCY

    var PlayerCharacter = function(startX,
				   startY,
				   width,
				   height,
				   bounds
				  ) {
	this.x = startX;
	this.y = startY;
	this.width = width;
	this.height = height;
	this.bounds = bounds;

	this.reset();
    };

    PlayerCharacter.WALK_NORTH = 'WALK_NORTH';
    PlayerCharacter.WALK_SOUTH = 'WALK_SOUTH';
    PlayerCharacter.WALK_EAST = 'WALK_EAST';
    PlayerCharacter.WALK_WEST = 'WALK_WEST';
    PlayerCharacter.REST = 'REST';
    PlayerCharacter.FIGHTING = 'FIGHTING';

    PlayerCharacter.prototype = {

	reset: function() {
	    this.lastTime = -1;

	    this.movedDx = 0;
	    this.movedDy = 0;

	    this.stepsUntilBattle = _.random(10, 50);
	    this.steps = 0;
	    this.battling = false;

	    this.dx = 0;
	    this.dy = 1;
	},

	update: function(nowTime) {
	    if (this.battling) {
		return;
	    }
	    else if (this.steps > this.stepsUntilBattle) {
		this.battling = true;
		return;
	    }
	    else if (this.lastTime < 0) {
		this.lastTime = nowTime;
		return;
	    }

	    // ELSE we have a valid delta time

	    var deltaTime = nowTime - this.lastTime;
	    var moveX = (this.dx * WALK_SPEED * deltaTime) | 0; // round toward 0
	    var moveY = (this.dy * WALK_SPEED * deltaTime) | 0; // rount toward 0

	    if ((Math.abs(moveX) < 1) && (Math.abs(moveY) < 1)) {
		return;
	    }
	    // ELSE we're committed to move

	    this.lastTime = nowTime;
	    var destX = this.x + moveX;
	    var destY = this.y + moveY;

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

		var newSteps = Math.abs(moveX) + Math.abs(moveY);
		this.steps = this.steps + (newSteps/PIXELS_PER_STEP);
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

	state: function() {
	    if (this.battling) {
		return PlayerCharacter.FIGHTING;
	    }
	    else if (this.movedDy > 0) {
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
