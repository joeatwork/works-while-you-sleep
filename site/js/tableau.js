window.Tableau = (function() {
    "use strict";

    // "Top Level" simple map and protagonist.
    // DONT try to generalize this class.
    // DO try to factor out bits of this into other,
    //   more generic classes
    var Tableau = function() {};

    Tableau.create = function() {
        return new Tableau();
    };

    Tableau.prototype.load = function(costumeImageURL,
                                      roomImageURL,
                                      boundsImageURL) {
        var tableau = this;
        tableau.loaded = false;
        
        var loadManager = Chorus.create();

	var costumeImage = null;
	if(costumeImageURL) {
            costumeImage = new Image();
            costumeImage.onload = loadManager.addCallback();
            costumeImage.src = costumeImageURL;
	}

	var roomImage = null;
	if(roomImageURL) {
            roomImage = new Image();
            roomImage.onload = loadManager.addCallback();
            roomImage.src = roomImageURL;
	}

        var boundsImage = null;
	if(boundsImageURL) {
            boundsImage = new Image();
            boundsImage.onload = loadManager.addCallback();
            boundsImage.src = boundsImageURL;
	}
        
        loadManager.setOnComplete(function() {
            tableau._whenLoaded(costumeImage, roomImage, boundsImage);
            tableau.loaded = true;
        });

        loadManager.arm();
    };

    // TODO: WEIRD MAGIC NUMBERS IN THE WRONG SPOT
    //   Choose more general defaults (maybe single frame?)
    Tableau.COSTUME_SPRITE_WIDTH = 32;
    Tableau.COSTUME_SPRITE_HEIGHT = 48;
    
    // To be set as a callback by clients.
    // Expect to parameterize character (and capture it if you need to)
    Tableau.prototype.onCharacterAssetsLoaded = function(character, costume, bounds) {
        ;
    };

    Tableau.prototype.isLoaded = function() {
        return this.loaded;
    };

    Tableau.prototype.setFixedBackground = function(backgroundUrl) {
	this.background = new Image();
	this.background.src = backgroundUrl;
    };

    Tableau.prototype.scroll = function(character, canvas) {
        var characterOffset = character.getCenter();
        var viewOffsetX = canvas.width/2;
        var scrollDistance = Math.floor(characterOffset.x - viewOffsetX);

	var gfx = canvas.getContext("2d");
        gfx.translate(-scrollDistance, 0);
    };

    Tableau.prototype.draw = function(canvas) {
        if(this.isLoaded()) {
            var gfx = canvas.getContext("2d");
            gfx.clearRect(0, 0, canvas.width, canvas.height);

	    if(this.background && this.background.complete) {
		gfx.drawImage(this.background, 0, 0);
	    }

            gfx.save();

	    this.scroll(this.character, canvas);

	    if(this.roomImage)
		gfx.drawImage(this.roomImage, 0, 0);

	    // gfx.drawImage(this.boundsImage, 0, 0); // DEBUG ONLY
	    if(this.character)
		this.character.draw(gfx);

            gfx.restore();
        }
    };

    Tableau.prototype._whenLoaded = function(costumeImage,
                                             roomImage,
                                             boundsImage) {
        var tableau = this;
        tableau.roomImage = roomImage;
        tableau.boundsImage = boundsImage; // TODO REMOVE

	var bounds = null;
	if(boundsImage) {
            bounds = Bounds.create(boundsImage);
	}

	var costume = null;
	if(costumeImage) {
            var costume =
		Character.Costume.create(costumeImage,
					 Tableau.COSTUME_SPRITE_WIDTH,
					 Tableau.COSTUME_SPRITE_HEIGHT);

            tableau.character = Character.create();
            tableau.character.setCostume(costume);
            tableau.character.setBounds(bounds)
	}

	if(bounds) {
            bounds.onReady = function() {
		tableau.onCharacterAssetsLoaded(tableau.character, 
						costume, bounds);
            };
	}
	else {
	    tableau.onCharacterAssetsLoaded(tableau.character, 
					    costume, bounds);
	}
    };

    return Tableau;
})();
