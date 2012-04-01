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

        var roomImage = new Image();
        roomImage.onload = loadManager.addCallback();
        roomImage.src = roomImageURL;

        var boundsImage = new Image();
        boundsImage.onload = loadManager.addCallback();
        boundsImage.src = boundsImageURL;
        
        var costumeImage = new Image();
        costumeImage.onload = loadManager.addCallback();
        costumeImage.src = costumeImageURL;

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

    Tableau.prototype.draw = function(canvas) {
        if(this.isLoaded()) {
            var gfx = canvas.getContext("2d");
            gfx.clearRect(0, 0, canvas.width, canvas.height);
            gfx.drawImage(this.roomImage, 0, 0);
            // gfx.drawImage(this.boundsImage, 0, 0);
            this.character.draw(gfx);
        }
    };

    Tableau.prototype._whenLoaded = function(costumeImage,
                                             roomImage,
                                             boundsImage) {
        this.roomImage = roomImage;
        this.boundsImage = boundsImage; // TODO REMOVE

        var bounds = Bounds.create(boundsImage);

        var costume = 
            Character.Costume.create(costumeImage,
                                     Tableau.COSTUME_SPRITE_WIDTH,
                                     Tableau.COSTUME_SPRITE_HEIGHT);

        this.character = Character.create();
        this.character.setCostume(costume);
        this.character.setBounds(bounds)
        this.onCharacterAssetsLoaded(this.character, costume, bounds);
    };

    return Tableau;
})();
