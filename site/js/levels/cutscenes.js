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
		new Timeline.Image(this.images.asgard,
				   [
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
		new Timeline.Image(this.images.asgard,
				   [
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
					 } }
				   ]); // asgard_timeline

	    this.timeline = new Timeline([ asgard_still, asgard_pan ]);
	},

	animate: function() {
	    var self = this;
	    var time = Date.now() - this.t0;

	    this.renderGfx.drawImage(self.images.background, 0, 0);

	    this.renderGfx.save();
	    this.renderGfx.translate(this.SCREEN_X, this.SCREEN_Y);
	    this.timeline.draw(time, this.renderGfx);
	    this.renderGfx.restore();

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

	    loadManager.setOnComplete(function() {
		self.initTimeline();
		self.t0 = Date.now();
		self.animate();
	    });
	    loadManager.arm();
	}
    };// cutscenes

})();
