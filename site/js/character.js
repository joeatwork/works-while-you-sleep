window.Character = (function() {
    // LAYOUT
    // NORTH, NORTH, NORTH
    // EAST, EAST, EAST
    // SOUTH, SOUTH, SOUTH
    // WEST, WEST, WEST

    var Character = function(image, spriteWidth, spriteHeight) {
	this.image = image;
	this.spriteWidth = spriteWidth;
	this.spriteHeight = spriteHeight;
    };

    Character.prototype.draw = function(gfx, top, left) {
	var cellNorth = this.spriteWidth;
	var cellWest = this.spriteHeight * 2;
	
	gfx.drawImage(this.image,
		      cellNorth, cellWest, this.spriteWidth, this.spriteHeight,
		      top, left, this.spriteWidth, this.spriteHeight);
    };

    return Character;
})();
