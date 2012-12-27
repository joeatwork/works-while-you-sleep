window.Bounds = (function() {
    "use strict";

    /**
     * A fast integer set, intended for dense collections
     * of ints close to zero.
     */
    var BitMap = function() {
        this.int32s = [];
    };

    BitMap.create = function() {
        return new BitMap();
    };

    BitMap.prototype = {

        setBit : function(index, val) {
            var intIndex = Math.floor(index / 32);
            var bitIndex = index % 32;

            var oldMask = this.int32s[intIndex] || 0;
            var newBit = 1 << bitIndex;

            var newMask = val ?
                oldMask | newBit :
                oldMask & ~newBit;

            this.int32s[intIndex] = newMask;
        },

        getBit : function(index) {
            var intIndex = Math.floor(index / 32);
            var bitIndex = index % 32;

            var int32 = this.int32s[intIndex];
            var bit = 1 << bitIndex;

            // Sign extension means we can't
            // just return bit >> index
            return (int32 & bit) ? 1 : 0
        },

        // TODO DELETE OR JUSTIFY
        // TODO: There has *got* to be a faster
        //       (memcpy-ish) way to do this.
        setBlock : function(low, high, val) {
            for(var i=low; i<=high; i++) {
                this.setBit(i, val);
            }
        },

        cost : function() {
            return this.int32s.length;
        }

    };// BitMap

    /*******************************************************************/

    var canvasToBitMap = function(canvas) {
        var gfx = canvas.getContext("2d");
        var imageData = gfx.getImageData(0,0,
                                         canvas.width,
                                         canvas.height);
        var pixels = imageData.data;
        var bitMapLength = Math.ceil(pixels.length / 4);
        var bitMap = new BitMap();
        for(var bit_ix = 0; bit_ix < bitMapLength ; bit_ix++) {
            var alpha = pixels[ (bit_ix * 4) + 3 ];
            bitMap.setBit(bit_ix, alpha);
        }

        return bitMap;
    };

    // CONVENTION - we represent bounds as an image, with
    // alpha == 0 at out of bounds and alpha > 0 in bounds.
    var Bounds = function(image) {
        var bounds = this;

        bounds.width = image.width;
        bounds.height = image.height;

        var boundsCanvas = document.createElement("canvas");
        boundsCanvas.width = bounds.width;
        boundsCanvas.height = bounds.height;

        var gfx = boundsCanvas.getContext("2d");
        gfx.drawImage(image, 0, 0);

        // Delay because drawImage is QUEUED, but (probably)
        // not actually RUN.
        setTimeout(function() {
            bounds.bitMap = canvasToBitMap(boundsCanvas);
            bounds.onReady();
        }, 0);
    };
    
    Bounds.BitMap = BitMap;

    // TODO: Make bitmap OPTIONAL, or use bounding rect.
    // TODO: Take a bitmap FUTURE, and load yourself.
    Bounds.prototype = {

        onReady : function() {
            ; // To be overridden if needed.
        },

        ready : function() {
            return this.bitMap;
        },

        check : function(x,y) {
	    if((x >= this.width) || (y >= this.height) ||
	       (x < 0) || (y < 0)) {
		return false;
	    }
	    else {
		var checkBit = x + (y * this.width);
		return this.bitMap.getBit(checkBit);
	    }
        },

        checkClear : function(x, y, width, height) {
            return (this.check(x,y) && 
                    this.check(x + width, y) &&
                    this.check(x, y + height) &&
                    this.check(x + width, y + height));
        },

        // TODO DELETE OR JUSTIFY
        blockRect : function(x, y, width, height) {
            this._markRect(x, y, width, height, 0);
        },

        // TODO DELETE OR JUSTIFY
        clearRect : function(x, y, width, height) {
            this._markRect(x, y, width, height, 1);
        },

        // TODO DELETE OR JUSTIFY
        _markRect : function(x, y, width, height, mark) {
            for(var iY = y; iY <= y + height; iY++) {
		if((iY >= 0) && (iY < this.height))  {
                    var lowCol = x + (iY * this.width);
		    lowCol = Math.max(lowCol, 0);

                    var highCol = lowCol + width;
		    highCol = Math.min(highCol, this.width);

                    this.bitMap.setBlock(lowCol, highCol, mark);
		}// iY in bounding rect
            }
        }
    };// Bounds.prototype

    Bounds.create = function(image) {
        return new Bounds(image);
    }

    return Bounds;
})();
