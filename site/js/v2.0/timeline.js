window.timeline = (function() {
    'use strict';

    // A Layer should have
    //
    // .draw(time, context2d) where time is in milliseconds
    // time should be non-decreasing throughout the run of the
    // program, or the timeline will do goofy stuff.

    var Timeline = function(layers) {
	// layers from bottom to top
	this.layers = layers;
    };

    Timeline.prototype.draw = function(time, context) {
	for (var i=0; i < this.layers.length; i++) {
	    this.layers[i].draw(time, context);
	}
    };

    Timeline.Image = function(image, keyFrames) {
	// image is an Image(),
	// frames is a pre-sorted list of 
	//     [ { time:time, properties:{...} } ]
	// where properties are all number values
	var self = this;

	self.image = image;
	self.lastFrameIx = -1;
	self.lastTime = -1;

	var earlyProps = {};
	var lateProps = {};
	_.each(keyFrames, function(keyFrame) {
	    _.defaults(earlyProps, keyFrame.properties);
	    _.extend(lateProps, keyFrame.properties);
	});

	keyFrames.unshift({ time: -1, properties: earlyProps });
	keyFrames.push({ time: Number.POSITIVE_INFINITY, properties: lateProps });

	// Precompute missing values.
	_.each(_.keys(earlyProps), function(k) {
	    var definedFrames = [];
	    var undefinedFrames = [];

	    _.each(self.frames, function(frame) {
		if (_.has(frame, k)) {
		    definedFrames.push(frame);
		} else {
		    undefinedFrames.push(frame);
		}
	    }); // each frame

	    _.each(undefinedFrames, function(undefinedFrame) {
		var approx = self._getState(definedFrames, undefinedFrames.time);
		_.defaults(undefinedFrame, approx);
	    }); // Each undefined frame
	}); // each key in the universe

	self.frames = keyFrames;
    }; // Image()

    Timeline.Image.prototype.draw = function(time, context) {
	var self = this;
	var state = self._getState(this.frames, time);

	context.drawImage(
	    self.image,
	    state.sx, state.sy, state.sw, state.sh,
	    state.dx, state.dy, state.dw, state.dh
	);
    };

    Timeline.Image.prototype._getState = function(frames, time) {
	var self = this;
	var insertPoint = _.sortedIndex(frames, { time: time }, 'time');

	if (insertPoint > frames.length) {
	    return self.frames[ frames.length - 1 ];
	}
	// ELSE

	var neighborBefore = self.frames[ insertPoint ];
	var neighborAfter = neighborBefore;

	if ((neighborAfter.time < time) && (insertPoint + 1 < self.frames.length)) {
	    neighborAfter = self.frames[ insertPoint + 1 ];
	}
	else if ((neighborBefore.time > time) && (insertPoint - 1 >= 0)) {
	    neighborBefore = self.frames[ insertPoint - 1 ];
	}

	var afterWeight = Math.max(time - neighborBefore.time, 1);
	var beforeWeight = Math.max(neighborAfter.time - time, 1);

	if (beforeWeight == Number.POSITIVE_INFINITY) {
	    beforeWeight = 0;
	    afterWeight = 1;
	}

	var scale = beforeWeight + afterWeight;

	var ret = {};
	var retKeys = _.keys(neighborBefore.properties);
	for (var i = 0; i < retKeys.length; i++) {
	    var k = retKeys[i];
	    if (_.has(neighborAfter.properties, k)) {
		var beforeFactor = (neighborBefore.properties[ k ] * beforeWeight)/scale;
		var afterFactor = (neighborAfter.properties[ k ] * afterWeight)/scale;
		ret[ k ] = beforeFactor + afterFactor;
	    }
	}

	return ret;
    };// _getState

    return { Timeline: Timeline };
})();
