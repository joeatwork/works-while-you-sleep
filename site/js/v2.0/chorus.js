window.Chorus = (function() {

    // Chorus is a simple way to wait on a group of callbacks that
    // don't depend on each other.
    //
    //     var loadManager = Chorus.create();
    //
    // var roomImage = new Image();
    // roomImage.onload = loadManager.addCallback();
    // roomImage.src = roomImageURL;
    //
    // var guyImage = new Image();
    // costumeImage.onload = loadManager.addCallback();
    // costumeImage.src = costumeImageURL;
    //
    // loadManager.setOnComplete(function() {
    //     var gfx = canvas.getContext("2d");
    //     gfx.drawImage(roomImage);
    //     gfx.drawImage(guyImage);
    // });
    //
    // loadManager.arm();
    //    
    var Chorus = function() {
        this.heard = [];
        this.results = [];

        this.armed = false;
        this.fired = false;
        this.onComplete = false;
    };

    Chorus.create = function() {
        return new Chorus();
    };

    Chorus.prototype.setOnComplete = function(onComplete) {
        this.onComplete = onComplete;
    };

    Chorus.prototype.addCallback = function(valueName) {
        var chorus = this;
        var noteIndex = chorus.heard.length;
        chorus.heard[ noteIndex ] = false;

        return function(results) {
            chorus.heard[ noteIndex ] = true;
            chorus.results[ valueName ] = results;
            chorus._checkComplete();
        };
    };//addCallback

    Chorus.prototype.arm = function() {
        this.armed = true;
        this._checkComplete();
    };

    Chorus.prototype._checkComplete = function() {
        if(this.fired || (! this.armed )) return;
        // ELSE if armed but not fired

        var finished = true;
        for(var i=0; finished && (i < this.heard.length); i++ ) {
            finished = this.heard[i];
        }
        
        if(finished) {
            this._fire();
        }
    };

    Chorus.prototype._fire = function() {
        this.onComplete(this.results);

        this.heard = null;
        this.results = null;
        this.fired = true;
    };

    return Chorus;
})();
