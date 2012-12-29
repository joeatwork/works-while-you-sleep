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

window.overworld = {};
window.overworld.bootstrap = function() {
    "use strict";

    var stateToFrames = {};
    stateToFrames[window.level.PlayerCharacter.WALK_NORTH] = 'WALK_NORTH';
    stateToFrames[window.level.PlayerCharacter.WALK_SOUTH] = 'WALK_SOUTH';
    stateToFrames[window.level.PlayerCharacter.WALK_EAST] = 'WALK_EAST';
    stateToFrames[window.level.PlayerCharacter.WALK_WEST] = 'WALK_WEST';
    stateToFrames[window.level.PlayerCharacter.REST] = 'SOUTH';
    stateToFrames[window.level.PlayerCharacter.FIGHTING] = 'SOUTH'; // TODO BETTER ANIMATION

    var heroFrames01 = {
	NORTH: [ { top: 0, left: 32 * 1, width: 32, height: 32 } ],
	WALK_NORTH: [ { top: 0, left: 32 * 5, width: 32, height: 32 },
		      { top: 0, left: 32 * 6, width: 32, height: 32 } ],
	SOUTH: [ { top: 0, left: 0, width: 32, height: 32 } ],
	WALK_SOUTH: [ { top: 0, left: 32 * 3, width: 32, height: 32 },
		      { top: 0, left: 32 * 4, width: 32, height: 32 } ],
	WEST: [ { top: 0, left: 32 * 2, width: 32, height: 32 } ],
	WALK_WEST: [ { top: 0, left: 32 * 8, width: 32, height: 32 },
		     { top: 0, left: 32 * 7, width: 32, height: 32 } ],
	EAST: [ { top: 0, left: 32 * 10, width: 32, height: 32 } ],
	WALK_EAST: [ { top: 0, left: 32 * 9, width: 32, height: 32 },
		     { top: 0, left: 32 * 10, width: 32, height: 32 } ]
    };

    var heroFrames02 = {
	NORTH: [ { top: 32, left: 32 * 1, width: 32, height: 32 } ],
	WALK_NORTH: [ { top: 32, left: 32 * 5, width: 32, height: 32 },
		      { top: 32, left: 32 * 6, width: 32, height: 32 } ],
	SOUTH: [ { top: 32, left: 0, width: 32, height: 32 } ],
	WALK_SOUTH: [ { top: 32, left: 32 * 3, width: 32, height: 32 },
		      { top: 32, left: 32 * 4, width: 32, height: 32 } ],
	WEST: [ { top: 32, left: 32 * 2, width: 32, height: 32 } ],
	WALK_WEST: [ { top: 32, left: 32 * 8, width: 32, height: 32 },
		     { top: 32, left: 32 * 7, width: 32, height: 32 } ],
	EAST: [ { top: 32, left: 32 * 10, width: 32, height: 32 } ],
	WALK_EAST: [ { top: 32, left: 32 * 9, width: 32, height: 32 },
		     { top: 32, left: 32 * 10, width: 32, height: 32 } ]
    };

    var heroFrames03 = {
	NORTH: [ { top: 64, left: 32 * 1, width: 32, height: 32 } ],
	WALK_NORTH: [ { top: 64, left: 32 * 5, width: 32, height: 32 },
		      { top: 64, left: 32 * 6, width: 32, height: 32 } ],
	SOUTH: [ { top: 64, left: 0, width: 32, height: 32 } ],
	WALK_SOUTH: [ { top: 64, left: 32 * 3, width: 32, height: 32 },
		      { top: 64, left: 32 * 4, width: 32, height: 32 } ],
	WEST: [ { top: 64, left: 32 * 2, width: 32, height: 32 } ],
	WALK_WEST: [ { top: 64, left: 32 * 8, width: 32, height: 32 },
		     { top: 64, left: 32 * 7, width: 32, height: 32 } ],
	EAST: [ { top: 64, left: 32 * 10, width: 32, height: 32 } ],
	WALK_EAST: [ { top: 64, left: 32 * 9, width: 32, height: 32 },
		     { top: 64, left: 32 * 10, width: 32, height: 32 } ]
    };

    var WALK_ANIMATION_SPEED = 8; // PIXELS PER FRAME ANIMATION

    // (logical) center of hero
    var heroStart01 = { x: 320 + 16, y: 800 + 16 };
    var heroStart02 = { x: 928 + 16, y: 800 + 16 };
    var heroStart03 = { x: 800 + 16, y: 384 + 16 };

    var screen01 = $('#screen_01')[0];
    var screen02 = $('#screen_02')[0];
    var screen03 = $('#screen_03')[0];
    var $battle01 = $('.screen_01_area .battle');
    var $battle02 = $('.screen_02_area .battle');
    var $battle03 = $('.screen_03_area .battle');

    var $show_fps = $('#show_fps');

    // Draws hero frame to BACKING, FULL-SIZED RENDER GFX
    var drawHero = function(gfx, heroPosition, heroFrame) {
	var heroWidth = heroFrame.width;
	var heroHeight = heroFrame.height;
	var heroOffsetX = heroPosition.x - (heroWidth / 2);
	var heroOffsetY = heroPosition.y - (heroHeight / 2);

	heroOffsetY = heroOffsetY - 8; // aesthetic tweak.
	gfx.drawImage(heroes,
		      heroFrame.left, heroFrame.top,
		      heroWidth, heroHeight,
		      heroOffsetX, heroOffsetY,
		      heroWidth, heroHeight);
    };

    var drawScreen = function(backCanvas, screenCanvas, heroPosition) {
	var bgOffsetX = heroPosition.x - (screenCanvas.width / 2);
	var bgOffsetY = heroPosition.y - (screenCanvas.height / 2);

	var screenGfx = screenCanvas.getContext("2d");
	screenGfx.drawImage(backCanvas, -bgOffsetX, -bgOffsetY);
    };

    var ANIMATION_WIDTH_PX = 32; // in PIXELS, not TIME
    var pickFrame = function(hero, heroFrames) {
	var frameListName = stateToFrames[ hero.state() ];
	var offsetPx = 0;
	if ((frameListName == 'WALK_EAST') ||
	    (frameListName == 'WALK_WEST')) {
	    offsetPx = hero.x % ANIMATION_WIDTH_PX;
	}
	else {
	    offsetPx = hero.y % ANIMATION_WIDTH_PX;
	}

	var frameList = heroFrames[ frameListName ];
	var offsetFrame = Math.floor((offsetPx / ANIMATION_WIDTH_PX) * frameList.length);
	return frameList[offsetFrame];
    };

    /////////////////////////////////////////
    // Battles are event driven

    var MONSTER_CLASSES = [ 'spacesuit_character',
			    'astroman_character',
			    'radarman_character',
			    'aquanaut_character' ];

    var observeBattle = function($battleElement, hero, battle, oldState) {
	var newState = battle.state();

	// Cleanup old
	if (oldState == window.level.Battle.STATE_BEGIN) {
	    $battleElement.removeClass('begin_go');
	    var newClass = MONSTER_CLASSES[ _.random(0, MONSTER_CLASSES.length - 1)  ];
	    $battleElement.addClass(newClass);
	}

	// Setup new
	if (newState == window.level.Battle.STATE_BEGIN) {
	    $battleElement.addClass('begin_go');
	    $battleElement.find('.opponent_name').text(battle.opponentName());
	    $battleElement.find('.dialog').text("GO!");
	    $battleElement.show();
	}
	else if (newState == window.level.Battle.STATE_HERO_TURN) {
	    var blurb = battle.heroSays();
	    $battleElement.find('.dialog').text('YOU: ' + blurb);
	}
	else if (newState == window.level.Battle.STATE_OPPONENT_TURN) {
	    var name = battle.opponentName();
	    var blurb = battle.opponentSays();
	    $battleElement.find('.dialog').text(name.toUpperCase() + ': ' + blurb);
	}
	else if (newState == window.level.Battle.STATE_COMPLETE) {
	    battle.end();
	}
	else if (newState == window.level.Battle.STATE_NO_BATTLE) {
	    _.each(MONSTER_CLASSES, function(cls) {
		$battleElement.removeClass(cls);
	    });
	    $battleElement.hide();
	    hero.reset();
	}
    };

    ////////////////////////////////////
    // Load and run.

    var loadManager = new Chorus();
    var background = new Image();
    background.onload = loadManager.addCallback();
    background.src = "011_overworld/world_map_background.png";
    
    var heroes = new Image();
    heroes.onload = loadManager.addCallback();
    heroes.src = "sprites/spaceman_overworld_16x16.png";

    var bounds = null;
    var boundsReady = loadManager.addCallback();
    var boundsImage = new Image();
    boundsImage.onload = function() {
	bounds = Bounds.create(boundsImage);
	bounds.onReady = boundsReady;
    };
    boundsImage.src = "011_overworld/world_map_bounds.png";

    loadManager.setOnComplete(function() {
	var hero01 = new window.level.PlayerCharacter(heroStart01.x,
						      heroStart01.y,
						      32, 32, bounds);

	var hero02 = new window.level.PlayerCharacter(heroStart02.x,
						      heroStart02.y,
						      32, 32, bounds);

	var hero03 = new window.level.PlayerCharacter(heroStart03.x,
						      heroStart03.y,
						      32, 32, bounds);

	var observer01 = function(battle, oldState) {
	    observeBattle($battle01, hero01, battle, oldState);
	};
	var observer02 = function(battle, oldState) {
	    observeBattle($battle02, hero02, battle, oldState);
	};
	var observer03 = function(battle, oldState) {
	    observeBattle($battle03, hero03, battle, oldState);
	};

	var battle01 = new window.level.Battle(observer01, window.data.dialogue.euclid);
	var battle02 = new window.level.Battle(observer02, window.data.dialogue.soaps);
	var battle03 = new window.level.Battle(observer03, window.data.dialogue.letterman);

	////////////////////////////////////////////////////
	
	var renderCanvas = document.createElement('canvas');
	renderCanvas.width = background.width;
	renderCanvas.height = background.height;

	var fps_update = Date.now();
	var frames = 0;
	var animate = function() {
	    var now = Date.now();
	    frames++;

	    if (now - fps_update > 1000) {
		$show_fps.text(frames * 1000 / (now - fps_update));
		frames = 0;
		fps_update = now;
	    }

	    hero01.update(now);
	    hero02.update(now);
	    hero03.update(now);

	    battle01.update(now);
	    battle02.update(now);
	    battle03.update(now);

	    var renderGfx = renderCanvas.getContext("2d");
	    renderGfx.drawImage(background, 0, 0);

	    var hero01Frame = pickFrame(hero01, heroFrames01);
	    drawHero(renderGfx, hero01, hero01Frame);

	    var hero02Frame = pickFrame(hero02, heroFrames02);
	    drawHero(renderGfx, hero02, hero02Frame);

	    var hero03Frame = pickFrame(hero03, heroFrames03);
	    drawHero(renderGfx, hero03, hero03Frame);

	    if (hero01.state() == window.level.PlayerCharacter.FIGHTING) {
		if (battle01.state() == window.level.Battle.STATE_NO_BATTLE) {
		    battle01.begin();
		}
	    }
	    else {
		drawScreen(renderCanvas, screen01, hero01);
	    }

	    if (hero02.state() == window.level.PlayerCharacter.FIGHTING) {
		if (battle02.state() == window.level.Battle.STATE_NO_BATTLE) {
		    battle02.begin();
		}
	    }
	    else {
		drawScreen(renderCanvas, screen02, hero02);
	    }

	    if (hero03.state() == window.level.PlayerCharacter.FIGHTING) {
		if (battle03.state() == window.level.Battle.STATE_NO_BATTLE) {
		    battle03.begin();
		}
	    }
	    else {
		drawScreen(renderCanvas, screen03, hero03);
	    }

	    requestAnimFrame(animate);
	};
	requestAnimFrame(animate);
    });

    loadManager.arm();
};
