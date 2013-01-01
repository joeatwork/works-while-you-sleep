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

window.Terrain = (function() {
    var Terrain = function(columns, rows) {
	this.cells = []

	// In this world, things occupy 16 x 16 spaces in a grid.
	for (var row = 0; row < rows; row++) {
	    this.cells[ row ] = [];
	    for (var column = 0; column < columns; column++) {
		this.cells[ row ][ column ] = false;
	    }
	}
    };

    Terrain.prototype.block = function(column, row) {
	this.cells[row][column] = true;
    };

    Terrain.prototype.clear = function(column, row) {
	this.cells[row][column] = false;
    };

    Terrain.prototype.isBlocked = function(column, row) {
	return this.cells[row][column];
    };

    return Terrain;
})();

window.miracleMile = {};
window.miracleMile.bootstrap = function() {
    'use strict';

    var screenCanvas = $('#screen_canvas')[0];

    var structureSpriteMap = {
	TREE: {
	    top: 0, left: 0, width: 32, height: 32,
	    footprint: { width: 1, height: 1 },
	    draw_offset: { top: -16, left: -8 }
	},
	SMALL_TOWER: { top: 32, left: 0, width: 32, height: 48 },
	MID_TOWER: { top: 80, left: 0, width: 32, height: 64 },
	TALL_TOWER: { top: 144, left: 0, width: 32, height: 96 },
	TALLEST_TOWER: { top: 240, left: 0, width: 32, height: 160 },
	IDOL_STAGE_1: { top: 400, left: 128 * 4, width: 128, height: 240 },
	IDOL_STAGE_2: { top: 400, left: 128 * 3, width: 128, height: 240 },
	IDOL_STAGE_3: { top: 400, left: 128 * 2, width: 128, height: 240 },
	IDOL_STAGE_4: { top: 400, left: 128 * 1, width: 128, height: 240 },
	IDOL_STAGE_5: { top: 400, left: 128 * 0, width: 128, height: 240 }
    };

    var swarmSpriteMap = { // 'sprites/spaceman_overworld_16x16_tiny.png';
	white: { 
	    SOUTH: [ { top: 0, left: 0, width: 16, height: 16 } ],
	    WALK_NORTH: [ { top: 0, left: 16 * 5, width: 16, height: 16 },
			  { top: 0, left: 16 * 6, width: 16, height: 16 } ],
	    WALK_SOUTH: [ { top: 0, left: 16 * 3, width: 16, height: 16 },
			  { top: 0, left: 16 * 4, width: 16, height: 16 } ],
	    WALK_WEST: [ { top: 0, left: 16 * 8, width: 16, height: 16 },
			 { top: 0, left: 16 * 7, width: 16, height: 16 } ],
	    WALK_EAST: [ { top: 0, left: 16 * 9, width: 16, height: 16 },
			 { top: 0, left: 16 * 10, width: 16, height: 16 } ]
	},

	red: {
	    SOUTH: [ { top: 16, left: 0, width: 16, height: 16 } ],
	    WALK_NORTH: [ { top: 16, left: 16 * 5, width: 16, height: 16 },
			  { top: 16, left: 16 * 6, width: 16, height: 16 } ],
	    WALK_SOUTH: [ { top: 16, left: 16 * 3, width: 16, height: 16 },
			  { top: 16, left: 16 * 4, width: 16, height: 16 } ],
	    WALK_WEST: [ { top: 16, left: 16 * 8, width: 16, height: 16 },
			 { top: 16, left: 16 * 7, width: 16, height: 16 } ],
	    WALK_EAST: [ { top: 16, left: 16 * 9, width: 16, height: 16 },
			 { top: 16, left: 16 * 10, width: 16, height: 16 } ]
	},

	green: {
	    SOUTH: [ { top: 16 * 2, left: 0, width: 16, height: 16 } ],
	    WALK_NORTH: [ { top: 16 * 2, left: 16 * 5, width: 16, height: 16 },
			  { top: 16 * 2, left: 16 * 6, width: 16, height: 16 } ],
	    WALK_SOUTH: [ { top: 16 * 2, left: 16 * 3, width: 16, height: 16 },
			  { top: 16 * 2, left: 16 * 4, width: 16, height: 16 } ],
	    WALK_WEST: [ { top: 16 * 2, left: 16 * 8, width: 16, height: 16 },
			 { top: 16 * 2, left: 16 * 7, width: 16, height: 16 } ],
	    WALK_EAST: [ { top: 16 * 2, left: 16 * 9, width: 16, height: 16 },
			 { top: 16 * 2, left: 16 * 10, width: 16, height: 16 } ]
	}
    };

    var WALK_ANIMATION_SPEED = 4; // PIXELS PER FRAME

    var TILE_IN_PX = 16;
    var TERRAIN_ROWS = 40;
    var TERRAIN_COLS = 64;
    var terrain = new Terrain(TERRAIN_COLS, TERRAIN_ROWS);
    _.each([0, 1, 2, 3, 38, 39 ], function(row) {
	_.times(TERRAIN_COLS, function(column) {
	    terrain.block(column, row);
	});
    }); // North and south walls

    _.each([0, 1, 62, 63 ], function(column) {
	_.times(TERRAIN_ROWS, function(row) {
	    terrain.block(column, row);
	})
    }); // East and west walls
    
    /////////////////////////////////////////

    var RESOURCES_PER_TREE = 1;
    var initForest = function(tileBounds, count) {
	var trees = [];
	while (trees.length < count) {
	    var newTree = {
		xTile: _.random(tileBounds.left, tileBounds.left + tileBounds.width),
		yTile: _.random(tileBounds.top, tileBounds.top + tileBounds.height),
		resources: RESOURCES_PER_TREE
	    }

	    if (!terrain.isBlocked(newTree.xTile, newTree.yTile)) {
		terrain.block(newTree.xTile, newTree.yTile);
		trees.push(newTree);
	    }
	}

	return _.sortBy(trees, 'ytile');
    };


    var TEAM_SIZE = 50;
    var initSwarm = function() {
	var ret = {};

	_.each( ['white', 'red', 'green' ], function(team) {
	    ret[team] = [];
	    while(ret[team].length < TEAM_SIZE) {
		var member = {
		    xTile : _.random(2, 61),
		    yTile : _.random(4, 37)
		};

		if (! terrain.isBlocked(member.xTile, member.yTile)) {
		    ret[team].push(member);
		}
	    }
	});

	// Will result in possibly overlapping members in the first go-round,
	// which will sort itself out naturally as they move.
	_.each( ['white', 'red', 'green' ], function(team) {
	    _.each(ret[team], function(member) {
		terrain.block(member.xTile, member.yTile);
	    });
	});

	return ret;
    };

    ///////////////////////////////////////

    var loadManager = new Chorus();

    var background = new Image();
    background.onload = loadManager.addCallback();
    background.src = '012_industry/industry_background.png';

    var swarmSprites = new Image();
    swarmSprites.onload = loadManager.addCallback();
    swarmSprites.src = 'sprites/spaceman_overworld_16x16_tiny.png';

    var structureSprites = new Image();
    structureSprites.onload = loadManager.addCallback();
    structureSprites.src = 'sprites/structures_industry.png';

    var swarm = initSwarm();

    var northForest = initForest({ top: 6, left: 4, width: 24, height: 16 }, 100);
    var southForest = initForest({ top: 20, left: 36, width: 24, height: 16 }, 100);
    var forest = northForest.concat(southForest);

    loadManager.setOnComplete(function() {
	var renderGfx = screenCanvas.getContext('2d');
	renderGfx.drawImage(background, 0, 0);

	_.each( [ 'green', 'white', 'red' ], function(color) {
	    var swarmFrame = swarmSpriteMap[color].SOUTH[0];

	    var spriteOffsetX = swarmFrame.left;
	    var spriteOffsetY = swarmFrame.top;
	    var swarmWidth = swarmFrame.width;
	    var swarmHeight = swarmFrame.height;

	    _.each(swarm[color], function(member) {
		var memberX = member.xTile * TILE_IN_PX;
		var memberY = member.yTile * TILE_IN_PX;

		renderGfx.drawImage(swarmSprites,
				    // Source rect
				    swarmFrame.left, swarmFrame.top, swarmWidth, swarmHeight,
				    // Dest rect
				    memberX, memberY, swarmWidth, swarmHeight);
	    }); // each member
	}); // each team color


	_.each(forest, function(tree) {
	    var treeTileX = tree.xTile * TILE_IN_PX;
	    var treeTileY = tree.yTile * TILE_IN_PX;

	    var treeDrawX = treeTileX + structureSpriteMap.TREE.draw_offset.left;
	    var treeDrawY = treeTileY + structureSpriteMap.TREE.draw_offset.top;

	    renderGfx.drawImage(structureSprites,
				structureSpriteMap.TREE.left, structureSpriteMap.TREE.top,
				structureSpriteMap.TREE.width, structureSpriteMap.TREE.height,
				treeDrawX, treeDrawY,
				structureSpriteMap.TREE.width, structureSpriteMap.TREE.height);
	}); // each tree
    });

    loadManager.arm()
};
