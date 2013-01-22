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
    
    // Offsets and position of the viewscreen
    
    // Outer viewscreen dimensions 864 × 576
    // Inner viewscreen dimensions 576 x 384
    // Offset (144, 68)

    var Timeline = window.timeline.Timeline;

    return {
	SCREEN_X: 144,
	SCREEN_Y: 68,
	SCREEN_WIDTH: 576,
	SCREEN_HEIGHT: 384,

	initTimeline: function() {
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


	    var black_bg1 = new Timeline.Interpolator(null, [
		{ time: 31000, properties: {} },
		{ time: 31100, properties: {} }
		]);
	    black_bg1.render = function(state, context) {
		context.fillstyle = "black";
		context.fillRect(0, 0, 576, 384);
	    };

	    var landfall = new Timeline.Interpolator(this.images.landfall, [
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
		{ time: 33101,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 576, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 33300,
		  properties: {
		      // Canvas coordinates
		      dx: 0, dy: 0, dw: 576, dh: 384,
		      // Source coordinates
		      sx: 576, sy: 0, sw: 576, sh: 384
		  } },
		{ time: 33301,
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

	    this.timeline = new Timeline([ asgard_still,
					   asgard_pan,
					   balcony_background,
					   hero_back,
					   black_bg1,
					   landfall ]);
	},

	animate: function() {
	    var self = this;
	    var time = Date.now() - this.t0;

	    this.renderGfx.save();
	    this.renderGfx.translate(this.SCREEN_X, this.SCREEN_Y);
	    this.timeline.draw(time, this.renderGfx);
	    this.renderGfx.restore();

	    this.renderGfx.drawImage(self.images.background, 0, 0);
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
	    self.withImg(loadManager, 'asgard', '013_cutscenes/001_asgard.png');
	    self.withImg(loadManager, 'balcony', '013_cutscenes/balcony_in_space.png');
	    self.withImg(loadManager, 'back_and_bolt', '013_cutscenes/back_and_bolt.png');
	    self.withImg(loadManager, 'landfall', '013_cutscenes/002_landfall.png');

	    loadManager.setOnComplete(function() {
		self.initTimeline();
		self.t0 = Date.now();
		self.animate();
	    });
	    loadManager.arm();
	}
    };// cutscenes

})();
