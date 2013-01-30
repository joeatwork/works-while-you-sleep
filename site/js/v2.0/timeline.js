
// Options
//   - Don't clamp?  Simpler code, starts and ends.
//   - End signals?
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

    Timeline.Still = function(image, properties, startTime, endTime) {
	this.image = image;
	this.properties = properties;
	this.startTime = startTime;
	this.endTime = endTime;
    };

    Timeline.Still.prototype.draw = function(time, context) {
	if (this.startTime && (time < this.startTime)) return; // Too early
	if (this.endTime && (time > this.endTime)) return; // Too late
	// ELSE
	this.render(this.properties, context);
    };

    Timeline.Still.prototype.render = function(state, context) {
	context.drawImage(
	    this.image,
	    state.sx, state.sy, state.sw, state.sh,
	    state.dx, state.dy, state.dw, state.dh
	);
    };

    Timeline.Interpolator = function(image, keyFrames) {
	// image is an Image(),
	// frames is a pre-sorted list of 
	//     [ { time:time, properties:{...} } ]
	// where properties are all number values
	var self = this;
	self.image = image;

	var earlyProps = {};
	var lateProps = {};
	_.each(keyFrames, function(keyFrame) {
	    _.defaults(earlyProps, keyFrame.properties);
	    _.extend(lateProps, keyFrame.properties);
	});

	// Artifical frames for use in computing intermediate values
	keyFrames.unshift({ time: -1, properties: earlyProps });
	keyFrames.push({ time: Number.POSITIVE_INFINITY, properties: lateProps });

	// Precompute missing values.
	_.each(_.keys(earlyProps), function(k) {
	    var definedFrames = [];
	    var undefinedFrames = [];

	    _.each(keyFrames, function(frame) {
		if (_.has(frame.properties, k)) {
		    definedFrames.push(frame);
		} else {
		    undefinedFrames.push(frame);
		}
	    }); // each frame

	    _.each(undefinedFrames, function(fixFrame) {
		var approx = self._getState(definedFrames, fixFrame.time);
		_.defaults(fixFrame.properties, approx);
	    }); // Each undefined frame
	}); // each key in the universe

	// Get rid of artificial frames
	keyFrames.shift();
	keyFrames.pop();

	self.frames = keyFrames;
	self.beginTime = self.frames[0].time;
	self.endTime = self.frames[ self.frames.length - 1 ].time;
    }; // Image()

    Timeline.Interpolator.prototype.draw = function(time, context) {
	var self = this;
	var state = self._getState(this.frames, time);

	if (state) {
	    self.render(state, context);
	}
    };

    Timeline.Interpolator.prototype.render = function(state, context) {
	context.drawImage(
	    this.image,
	    state.sx, state.sy, state.sw, state.sh,
	    state.dx, state.dy, state.dw, state.dh
	);
    };

    Timeline.Interpolator.prototype._getState = function(frames, time) {
	var self = this;

	if (self.beginTime > time) return;
	if (self.endTime < time) return;
	// ELSE

	var insertPoint = _.sortedIndex(frames, { time: time }, 'time');

	var neighborBefore = frames[ insertPoint ];
	var neighborAfter = neighborBefore;

	if ((neighborAfter.time < time) && (insertPoint + 1 < frames.length)) {
	    neighborAfter = frames[ insertPoint + 1 ];
	}
	else if ((neighborBefore.time > time) && (insertPoint - 1 >= 0)) {
	    neighborBefore = frames[ insertPoint - 1 ];
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
