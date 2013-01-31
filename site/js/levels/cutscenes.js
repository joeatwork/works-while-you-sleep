window.requestAnimFrame = (function(){
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback){
            window.setTimeout(callback, 10);
        };
})();//polyfill

window.cutscenes = (function() {
    'use strict';

    var SCREEN_X = 144;
    var SCREEN_Y = 68;
    var SCALE_FACTOR = 576 / 864.0;
    
    // Offsets and position of the viewscreen
    
    // Outer viewscreen dimensions 864 × 576
    // Inner viewscreen dimensions 576 x 384
    // Offset (144, 68)

    var Timeline = window.timeline.Timeline;

    var Blackout = function(keyframes) {
	Timeline.Interpolator.call(this, null, keyframes);
    };

    Blackout.prototype = _.extend({}, Timeline.Interpolator.prototype);
    Blackout.prototype.render = function(state, context) {
	context.fillstyle = "black";
	context.fillRect(state.dx, state.dy, state.dw, state.dh);
    };    
    
    var Recursor = function(timeline, time_offset) {
	this.timeline = timeline;
	this.time_offset = time_offset;
    };

    Recursor.prototype.draw = function(time, context) {
	var realTime = time - this.time_offset;
	if (realTime > 0) {
	    context.save()
	    context.scale(SCALE_FACTOR, SCALE_FACTOR);
	    context.translate(SCREEN_X, SCREEN_Y);

	    this.timeline.draw(realTime, context);
	    context.restore();
	}
    };

    var spriteLoop = function(begin_time,
			      end_time,
			      frame_count,  // Total frames to show
			      sprite_count, // number of frames in one cycle
			      sprite_width) { // Width in px of one frame
	var duration = end_time - begin_time;
	var frame_time = duration / frame_count;

	var ret = [];
	for (var frame = 0; frame < frame_count; frame++) {
	    var lastFrame = _.last(ret);
	    var time = begin_time + (frame * frame_time);

	    if (lastFrame) {
		ret[ ret.length ] = {
		    time: time - 1,
		    properties: _.clone(lastFrame.properties)
		}
	    }

	    var next_offset = sprite_width * ( frame % sprite_count);
	    ret[ ret.length ] = {
		time: time,
		properties: { sx: next_offset }
	    };
	}

	if (ret.length > 1) {
	    ret.pop(); // Drop a useless final frame
	}

	return ret;
    };

    return {
	SCREEN_WIDTH: 576,
	SCREEN_HEIGHT: 384,

	initTimeline: function() {

	    var white_walk_frames = [];
	    var green_walk_frames = [];
	    var red_walk_frames = [];

	    var astronaut_walk = spriteLoop(61000, 70000, 40, 3, 24);
	    _.each(astronaut_walk, function(frame) {
	    	frame.properties.sx = frame.properties.sx + 216;
		white_walk_frames.push({ time: frame.time, properties: _.clone(frame.properties) });
		green_walk_frames.push({ time: frame.time, properties: _.clone(frame.properties) });
		red_walk_frames.push({ time: frame.time, properties: _.clone(frame.properties) });
	    });

	    var walk_first = astronaut_walk[0];
	    var walk_last = _.last(astronaut_walk);

	    white_walk_frames[0] = {
		time: walk_first.time,
		properties: _.extend({
		    dx: 0, dy: 350, dw: 24, dh: 32,
		    sy: 0, sw: 24, sh: 32
		}, walk_first.properties)
	    };

	    white_walk_frames[ white_walk_frames.length - 1 ] = {
		time: walk_last.time,
		properties: _.extend({
		    dx: 360, dy: 350, dw: 24, dh: 32,
		    sy: 0, sw: 24, sh: 32
		}, walk_last.properties)
	    };

	    var white_stand_time = _.last(white_walk_frames).time;
	    var white_stance = _.clone(_.last(white_walk_frames).properties);
	    white_stance.sx = 24 * 4;

	    var white_walk = new Timeline.Interpolator(this.images.smallSprites,
	    					       white_walk_frames);

	    var white_stand = new Timeline.Still(this.images.smallSprites,
						 white_stance,
						 white_stand_time,
						 null);
						 
	    green_walk_frames[0] = {
		time: walk_first.time,
		properties: _.extend({
		    dx: -80, dy: 350, dw: 24, dh: 32,
		    sy: 32, sw: 24, sh: 32
		}, walk_first.properties)
	    };

	    green_walk_frames[ green_walk_frames.length - 1 ] = {
		time: walk_last.time,
		properties: _.extend({
		    dx: 280, dy: 350, dw: 24, dh: 32,
		    sy: 32, sw: 24, sh: 32
		}, walk_last.properties)
	    };

	    var green_stand_time = _.last(green_walk_frames).time;
	    var green_stance = _.clone(_.last(green_walk_frames).properties);
	    green_stance.sx = 24 * 4;

	    var green_walk = new Timeline.Interpolator(this.images.smallSprites,
	    					       green_walk_frames);

	    var green_stand = new Timeline.Still(this.images.smallSprites,
						 green_stance,
						 green_stand_time,
						 null);

						 
	    red_walk_frames[0] = {
		time: walk_first.time,
		properties: _.extend({
		    dx: -160, dy: 350, dw: 24, dh: 32,
		    sy: 64, sw: 24, sh: 32
		}, walk_first.properties)
	    };

	    red_walk_frames[ red_walk_frames.length - 1 ] = {
		time: walk_last.time,
		properties: _.extend({
		    dx: 200, dy: 350, dw: 24, dh: 32,
		    sy: 64, sw: 24, sh: 32
		}, walk_last.properties)
	    };

	    var red_stand_time = _.last(red_walk_frames).time;
	    var red_stance = _.clone(_.last(red_walk_frames).properties);
	    red_stance.sx = 24 * 4;

	    var red_walk = new Timeline.Interpolator(this.images.smallSprites,
	    					       red_walk_frames);

	    var red_stand = new Timeline.Still(this.images.smallSprites,
						 red_stance,
						 red_stand_time,
						 null);

	    var asgard_still =
		new Timeline.Interpolator(this.images.asgard, [
		    { time: 0,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 0, sy: 0, sw: 576, sh: 384
		      } },
		    { time: 4000,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 0, sy: 0, sw: 576, sh: 384
		      } }
		]);

	    var asgard_pan =
		new Timeline.Interpolator(this.images.asgard, [
		    { time: 4000,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 576, sy: 0, sw: 576, sh: 384
		      } },
		    { time: 6000,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 576, sy: 0, sw: 576, sh: 384
		      } },
		    { time: 26000,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 2302, sy: 0, sw: 576, sh: 384
		      } },
		    { time: 28000,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 2302, sy: 0, sw: 576, sh: 384
		      } }
		]); // asgard_timeline

	    var balcony_background =
		new Timeline.Interpolator(this.images.balcony, [
		    { time: 28000,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 0, sy: 0, sw: 576, sh: 384
		      } },
		    { time: 31000,
		      properties: {
			  // Canvas coordinates
			  dx: 0, dy: 0, dw: 576, dh: 384,
			  // Source coordinates
			  sx: 0, sy: 0, sw: 576, sh: 384
		      } }
		]);

	    var hero_back =
		new Timeline.Interpolator(this.images.back_and_bolt, [
		    { time: 28000,
		      properties: {
			  // Canvas coordinates
			  dx: 192, dy: 188, dw: 48, dh: 128,
			  // Source coordinates
			  sx: 0, sy: 0, sw: 48, sh: 128
		      } },
		    { time: 30000,
		      properties: {
			  // Canvas coordinates
			  dx: 192, dy: 188, dw: 48, dh: 128,
			  // Source coordinates
			  sx: 0, sy: 0, sw: 48, sh: 128
		      } },
		    { time: 30001, properties: { sx: 48 } },
		    { time: 30030, properties: { sx: 48 } },
		    { time: 30031, properties: { sx: 96 } },
		    { time: 30060, properties: { sx: 96 } },
		    { time: 30061, properties: { sx: 144 } },
		    { time: 30090, properties: { sx: 144 } },
		    { time: 30091, properties: { sx: 192 } },
		    { time: 30180,
		      properties: {
			  // Canvas coordinates
			  dx: 192, dy: -128, dw: 48, dh: 128,
			  // Source coordinates
			  sx: 192, sy: 0, sw: 48, sh: 128
		      } }
		]);

	    var black_bg1 = new Blackout([
		{ time: 31000, properties: { dx: 0, dy: 0, dw: 576, dh: 384 } },
		{ time: 31100, properties: { dx: 0, dy: 0, dw: 576, dh: 384 } }
	    ]);

	    var landfall = new Timeline.Interpolator(this.images.landfall, [
		// Dark
		{ time: 31100,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 33100,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		// Flash
		{ time: 33101,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 576, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 33200,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 576, sy: 0, sw: 576, sh: 384
		  } },
		// Dark
		{ time: 33201,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 33300,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		// Flash
		{ time: 33301,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 576, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 33600,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 576, sy: 0, sw: 576, sh: 384
		  } },
		// Dark
		{ time: 33601,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 35000,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } }
	    ]);

	    var twinkleFrames = spriteLoop(31600, 33100, 15, 3, 10);
	    _.extend(twinkleFrames[0].properties, {
		// Canvas coordinates
		dx: 283, dy: 120, dw: 10, dh: 10,
		// Source coordinates
		/* no sx */ sy: 0, sw: 10, sh: 10
	    });

	    _.extend(_.last(twinkleFrames).properties, {
		// Canvas coordinates
		dx: 283, dy: 255, dw: 10, dh: 10,
		// Source coordinates
		/* no sx */ sy: 0, sw: 10, sh: 10
	    });

	    var twinkle = new Timeline.Interpolator(this.images.twinkle, twinkleFrames);

	    var black_bg2 = new Blackout([
		{ time: 35000, properties: { dx: 0, dy: 0, dw: 576, dh: 384 } },
		{ time: 46000, properties: { dx: 0, dy: 0, dw: 576, dh: 384 } }
	    ]);

	    var white_landing = new Timeline.Interpolator(this.images.front_and_bolts, [
		{ time: 36000,
		  properties: {
		      dx: 256, dy: 0, dw: 64, dh: 128,
		      sx: 256, sy: 0, sw: 64, sh: 128
		  } },
		{ time: 36030, properties: { sx: 256 } },
 		{ time: 36031, properties: { sx: 192 } },
 		{ time: 36060, properties: { sx: 192 } },
		{ time: 36061, properties: { sx: 128 } },
		{ time: 36090, properties: { sx: 128 } },
		{ time: 36091, properties: { sx:  64 } },
		{ time: 36120, properties: { sx:  64 } },
		{ time: 36121,
		  properties: {
		      dx: 256, dy: 192, dw: 64, dh: 128,
		      sx: 0, sy: 0, sw: 64, sh: 128
		  } },
		{ time: 40000,
		  properties: {
		      dx: 256, dy: 192, dw: 64, dh: 128,
		      sx: 0, sy: 0, sw: 64, sh: 128
		  } }
	    ]);

	    var green_landing = new Timeline.Interpolator(this.images.front_and_bolts, [
		{ time: 37000,
		  properties: {
		      dx: 208, dy: 0, dw: 64, dh: 128,
		      sx: 256, sy: 128, sw: 64, sh: 128
		  } },
		{ time: 37030, properties: { sx: 256 } },
 		{ time: 37031, properties: { sx: 192 } },
 		{ time: 37060, properties: { sx: 192 } },
		{ time: 37061, properties: { sx: 128 } },
		{ time: 37090, properties: { sx: 128 } },
		{ time: 37091, properties: { sx:  64 } },
		{ time: 37120, properties: { sx:  64 } },
		{ time: 37121,
		  properties: {
		      dx: 208, dy: 176, dw: 64, dh: 128,
		      sx: 0, sy: 128, sw: 64, sh: 128
		  } },
		{ time: 40000,
		  properties: {
		      dx: 208, dy: 176, dw: 64, dh: 128,
		      sx: 0, sy: 128, sw: 64, sh: 128
		  } }
	    ]);

	    var red_landing = new Timeline.Interpolator(this.images.front_and_bolts, [
		{ time: 37200,
		  properties: {
		      dx: 304, dy: 0, dw: 64, dh: 128,
		      sx: 256, sy: 256, sw: 64, sh: 128
		  } },
		{ time: 37230, properties: { sx: 256 } },
 		{ time: 37231, properties: { sx: 192 } },
 		{ time: 37260, properties: { sx: 192 } },
		{ time: 37261, properties: { sx: 128 } },
		{ time: 37290, properties: { sx: 128 } },
		{ time: 37291, properties: { sx:  64 } },
		{ time: 37320, properties: { sx:  64 } },
		{ time: 37321,
		  properties: {
		      dx: 304, dy: 176, dw: 64, dh: 128,
		      sx: 0, sy: 256, sw: 64, sh: 128
		  } },
		{ time: 40000,
		  properties: {
		      dx: 304, dy: 176, dw: 64, dh: 128,
		      sx: 0, sy: 256, sw: 64, sh: 128
		  } }
	    ]);

	    var white_portrait = new Timeline.Interpolator(this.images.portraits, [
		{ time: 40000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 42000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 42001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 200,
		      sx: 0, sy: 0, sw: 576, sh: 200
		  } },
		{ time: 46000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 200,
		      sx: 0, sy: 0, sw: 576, sh: 200
		  } },
	    ]);

	    var green_portrait = new Timeline.Interpolator(this.images.portraits, [
		{ time: 42001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 384, sw: 576, sh: 384
		  } },
		{ time: 44000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 384, sw: 576, sh: 384
		  } },
		{ time: 44001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 230,
		      sx: 0, sy: 384, sw: 576, sh: 230
		  } },
		{ time: 46000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 230,
		      sx: 0, sy: 384, sw: 576, sh: 230
		  } },
	    ]);

	    var red_portrait = new Timeline.Interpolator(this.images.portraits, [
		{ time: 44000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 768, sw: 576, sh: 384
		  } },
		{ time: 46000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 768, sw: 576, sh: 384
		  } }
	    ]);

	    var wonders = new Timeline.Interpolator(this.images.wonders, [
		{ time: 46000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 50000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 0, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 55000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 2064, sy: 0, sw: 576, sh: 384
		  } },

		// Wonders frames
		{ time: 55001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 2640, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 55500,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 2640, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 55501,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3216, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 56000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3216, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 56001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3792, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 56500,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3792, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 56501,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 4368, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 57000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 4368, sy: 0, sw: 576, sh: 384
		  } },
		
		// Wonders frames second loop

		{ time: 57001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 2640, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 57500,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 2640, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 57501,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3216, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 58000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3216, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 58001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3792, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 58500,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 3792, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 58501,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 4368, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 59000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 4368, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 59001,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 4944, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 63000,
		  properties: {
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      sx: 4944, sy: 0, sw: 576, sh: 384
		  } },
	    ]);

	    var recursor_screen =
		new Timeline.Still(this.images.background,
				   { dx: 0, dy: 0, dw: 576, dh: 384,
				     sx: 0, sy: 0, sw: 864, sh: 576 },
				   60000, null);

	    var recursor = new Recursor(null, 61000);

	    this.timeline = new Timeline([ 
		asgard_still,
		asgard_pan,
		balcony_background,
		hero_back,
		black_bg1,
		landfall,
		twinkle,
		black_bg2,
		green_landing,
		red_landing,
		white_landing,
		white_portrait,
		green_portrait,
		red_portrait,
		wonders,
		recursor_screen,
		recursor,
		white_walk,
		green_walk,
		red_walk,
		white_stand,
		green_stand,
		red_stand
	    ]);

	    recursor.timeline = this.timeline;
	},

	animate: function() {
	    var self = this;
	    var time = Date.now() - this.t0;
	    time = time + 61001; // Start at the screen

	    this.renderGfx.save();
	    this.renderGfx.scale(1.5, 1.5);
	    this.timeline.draw(time, this.renderGfx);
	    this.renderGfx.restore();

	    // this.renderGfx.drawImage(self.images.background, 0, 0);
	    requestAnimFrame(function() { self.animate() });
	},

	withImg: function(loadManager, name, src) {
	    var self = this;

	    self.images[name] = new Image();
	    self.images[name].onload = loadManager.addCallback();
	    self.images[name].src = src;
	},

	bootstrap: function() {
	    var self = this;
	    var loadManager = new Chorus();
	    self.images = {};

	    self.screenCanvas = $('#screen_canvas')[0];
	    self.renderGfx = self.screenCanvas.getContext('2d');

	    self.withImg(loadManager, 'background', '013_cutscenes/viewscreen.png');
	    self.withImg(loadManager, 'smallSprites', 'sprites/spaceman_24x32_tiny.png');
	    self.withImg(loadManager, 'asgard', '013_cutscenes/001_asgard.png');
	    self.withImg(loadManager, 'balcony', '013_cutscenes/balcony_in_space.png');
	    self.withImg(loadManager, 'back_and_bolt', '013_cutscenes/back_and_bolt.png');
	    self.withImg(loadManager, 'landfall', '013_cutscenes/002_landfall.png');
	    self.withImg(loadManager, 'twinkle', '013_cutscenes/twinkle_10px.png');
	    // 64 x 128
	    self.withImg(loadManager, 'front_and_bolts', '013_cutscenes/front_and_bolts.png');
	    self.withImg(loadManager, 'portraits', '013_cutscenes/portraits.png');
	    self.withImg(loadManager, 'wonders', '013_cutscenes/wonders.png');

	    loadManager.setOnComplete(function() {
		self.initTimeline();
		self.t0 = Date.now();
		self.animate();
	    });
	    loadManager.arm();
	}
    };// cutscenes

})();
