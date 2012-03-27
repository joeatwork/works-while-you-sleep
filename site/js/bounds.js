window.Bounds = (function() {
    "use strict";

    var Bounds = function(image) {
	var bounds = this;

	bounds.width = image.width;
	bounds.height = image.height;
	bounds.alphas = null;

	var boundsCanvas = document.createElement("canvas");
	boundsCanvas.width = bounds.width;
	boundsCanvas.height = bounds.height;

	var gfx = boundsCanvas.getContext("2d");
	gfx.drawImage(image, 0, 0);

	setTimeout(function() {
	    var gfx = boundsCanvas.getContext("2d");
	    var imageData = gfx.getImageData(0,0, 
					     boundsCanvas.width,
					     boundsCanvas.height);

	    var pixels = imageData.data;
	    var alphas = new Array(pixels.length / 4);
	    for(var pixel_ix = 0; pixel_ix < alphas.length; pixel_ix++) {
		alphas[pixel_ix] = pixels[ (pixel_ix * 4) + 3 ];
	    }

	    bounds.alphas = alphas;
	}, 0);
    };
    
    Bounds.prototype = {
	ready : function() {
	    return this.alphas;
	},
	check : function(x,y) {
	    return this.alphas[x + (y * this.width) ];
	}
    };

    Bounds.create = function(image) {
	return new Bounds(image);
    }

    return Bounds;
})();
