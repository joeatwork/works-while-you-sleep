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
    'use strict';

    var Terrain = function(columns, rows) {
	this.cells = []
	this.columns = columns;
	this.rows = rows;

	// In this world, things occupy 16 x 16 spaces in a grid.
	for (var row = 0; row < rows; row++) {
	    this.cells[ row ] = [];
	    for (var column = 0; column < columns; column++) {
		this.cells[ row ][ column ] = false;
	    }
	}
    };

    Terrain.prototype = {
	block: function(column, row) {
	    this.cells[row][column] = true;
	},

	clear: function(column, row) {
	    this.cells[row][column] = false;
	},

	isBlocked: function(column, row) {
	    return this.cells[row][column];
	},

	width: function() { return this.columns; },
	height: function() { return this.rows; }
    };

    return Terrain;
})();

window.Structures = (function() {
    'use strict';
    var Structures = function(terrain) {
	this.terrain = terrain;
	this.structureDb = window.SpaceManager.treeSpace(0, terrain.width,
							 0, terrain.height);
    };

    Structures.prototype = {
	findInRect: function(searchLeft, searchRight,
			     searchTop, searchBottom) {
	    return this.structureDb.find(searchLeft, searchRight,
					 searchTop, searchBottom);
	},


	disposeStructure: function(structure) {
	    var self = this;
	    self.structureDb.remove(structure.dbHandle);

	    var xrange = _.range(structure.xTile, structure.xTile + structure.width);
	    var yrange = _.range(structure.yTile, structure.yTile + structure.height);

	    _.each(xrange, function(xCoord) {
		_.each(yrange, function(yCoord) {
		    self.terrain.clear(xCoord, yCoord);
		});
	    });
	},

	plantStructure: function(structure) {
	    var self = this;
	    structure.dbHandle =
		self.structureDb.add(structure,
				     structure.xTile, structure.xTile + structure.width,
				     structure.yTile, structure.yTile + structure.height);

	    var xrange = _.range(structure.xTile, structure.xTile + structure.width);
	    var yrange = _.range(structure.yTile, structure.yTile + structure.height);

	    _.each(xrange, function(xCoord) {
		_.each(yrange, function(yCoord) {
		    self.terrain.block(xCoord, yCoord);
		});
	    });
	}
    };

    return Structures;
})();

window.Culture = (function() {
    'use strict';

    var Culture = function(structures, maxSearchRadius) {
	this.structures = structures;
	this.startRadius = 1;
	this.maxSearchRadius = maxSearchRadius;
    };

    Culture.prototype = {
	getGoal : function(member) {
	    var found = [];
	    var searchRadius = this.startRadius;
	    var operations = 0;

	    while ((found.length == 0) && searchRadius < this.maxSearchRadius) {
		var searchLeft = member.xTile - searchRadius;
		var searchRight = member.xTile + member.width + searchRadius;

		var searchTop = member.yTile - searchRadius;
		var searchBottom = member.yTile + member.height + searchRadius;

		var found = this.structures.findInRect(searchLeft, searchRight,
						       searchTop, searchBottom);

		operations = operations + found.findOperations;
		searchRadius = searchRadius * 2;
	    }

	    // Consider randomly splicing stuff out?
	    for (var i = 0; i < found.length; i++ ) {
		var candidate = found[i];
		if (candidate.resources > 0) { // TODO Color check here
		    return {
			found: candidate,
			operations: operations
		    }
		}
	    }// for

	    return {
		found: undefined,
		operations: operations
	    };
	}	
    };

    return Culture;
})();

window.Swarm = (function() {
    'use strict';

    var TEAM_SIZE = 50; // members per swarm team
    var WALK_SPEED = 16/500; // PIXELS PER MILLISECOND
    var MINING_SPEED = 1/5000; // RESOURCE UNIT PER MILLISECOND

    // Offset in TILES
    var STAND_STILL = { offsetX:  0, offsetY: 0 };
    var NORTH = { offsetX:  0, offsetY: -1 };
    var EAST  = { offsetX:  1, offsetY:  0 };
    var SOUTH = { offsetX:  0, offsetY:  1 };
    var WEST  = { offsetX: -1, offsetY:  0 };

    var Swarm = function(terrain, culture, walkDistance) {
	this.terrain = terrain;
	this.culture = culture;
	this.walkDistance = walkDistance;
	this._initMembers();
    };

    Swarm.prototype = {
	getMembers: function() {
	    return this.members;
	},

	update: function(timeElapsedMillis) {
	    this._moveMembers(timeElapsedMillis);
	    this._updateGoals(timeElapsedMillis);
	},

	////////////////////////////////////

	_initMembers: function() {
	    this.members = [];

	    _.each( ['white', 'red', 'green' ], function(team) {
		var teamBuilt = 0;
		while(teamBuilt < TEAM_SIZE) {
		    var member = {
			xTile : _.random(2, 61),
			yTile : _.random(4, 37),

			// How far we have stepped off of our tile
			offsetX : 0,
			offsetY : 0,

			// Size in tiles
			width : 1,
			height: 1,

			// Carrying resources?
			resources: 0,
			team: team
		    };

		    if (! this.terrain.isBlocked(member.xTile, member.yTile)) {
			this.members.push(member);
			teamBuilt = teamBuilt + 1;
		    }
		}
	    }, this);// each team

	    // Will result in possibly overlapping members in the first go-round,
	    // which will sort itself out naturally as they move.
	    _.each(this.members, function(member) {
		this.terrain.block(member.xTile, member.yTile);
	    }, this);
	}, // _initMembers

	_moveMembers: function(timeElapsed) {
	    for (var i=0; i < this.members.length; i++) {
		var member = this.members[i];
		// Update offsets
		if (member.offsetX > 0) {
		    member.offsetX += WALK_SPEED * timeElapsed;
		}
		else if (member.offsetX < 0) {
		    member.offsetX -= WALK_SPEED * timeElapsed;
		}
	
		if (member.offsetY > 0) {
		    member.offsetY += WALK_SPEED * timeElapsed;
		}
		else if (member.offsetY < 0) {
		    member.offsetY -= WALK_SPEED * timeElapsed;
		}

		// Update tiles
		var newTileX = member.xTile;
		if (member.offsetX >= this.walkDistance)  {
		    member.offsetX = 0;
		    newTileX = member.xTile + 1;
		}
		else if (member.offsetX <= -this.walkDistance) {
		    member.offsetX = 0;
		    newTileX = member.xTile - 1;
		}

		var newTileY = member.yTile;
		if (member.offsetY >= this.walkDistance) {
		    member.offsetY = 0;
		    newTileY = member.yTile + 1;
		}
		else if (member.offsetY <= -this.walkDistance) {
		    member.offsetY = 0;
		    newTileY = member.yTile - 1;
		}

		// Update terrain
		if ((newTileX != member.xTile) ||
		    (newTileY != member.yTile)) {
		    this.terrain.clear(member.xTile, member.yTile);
		    member.xTile = newTileX;
		    member.yTile = newTileY;
		}
	    }// for member in swarm
	}, // moveMembers

	_updateGoals: function(timeElapsedMillis) {
	    for (var i=0; i < this.members.length; i++) {
		var member = this.members[i];
		if (member.offsetX || member.offsetY) continue;

		var move = false;
		var goal = this.culture.getGoal(member);
		if (goal.found) {
		    var distanceX = goal.found.xTile - member.xTile;
		    var distanceY = goal.found.yTile - member.yTile;

		    if (((Math.abs(distanceX) <= 1) && (Math.abs(distanceY) <= 0)) ||
			((Math.abs(distanceX) <= 0) && (Math.abs(distanceY) <= 1))) {
			var transfer = Math.min(MINING_SPEED * timeElapsedMillis,
						goal.found.resources);
			goal.found.resources -= transfer;
			member.resources += transfer;
			move = STAND_STILL;
		    }
		    else if ((distanceY > 0) &&
			(! this.terrain.isBlocked(member.xTile, member.yTile + 1))) {
			move = SOUTH;
		    }
		    else if ((distanceY < 0) &&
			     (! this.terrain.isBlocked(member.xTile, member.yTile - 1))) {
			move = NORTH;
		    }
		    else if ((distanceX > 0) &&
			     (! this.terrain.isBlocked(member.xTile + 1, member.yTile))) {
			move = EAST;
		    }
		    else if ((distanceX < 0) &&
			     (! this.terrain.isBlocked(member.xTile - 1, member.yTile))) {
			move = WEST;
		    }
		}

		if (! move) {
		    var checkOrder = _.shuffle([ NORTH, SOUTH, EAST, WEST ]);

		    move = _.find(checkOrder, function(move) {
			var moveX = member.xTile + move.offsetX;
			var moveY = member.yTile + move.offsetY;
			return (! this.terrain.isBlocked(moveX, moveY));
		    }, this);
		}// if no goal move

		//////////////////////////////////////

		if (move) {
		    member.offsetX = move.offsetX * WALK_SPEED;
		    member.offsetY = move.offsetY * WALK_SPEED;
		    this.terrain.block(member.xTile + move.offsetX,
				       member.yTile + move.offsetY);
		}

	    } // for member in swarm
	} // updateGoals
    }; // Swarm.prototype

    return Swarm;
})();


window.miracleMile = {};
window.miracleMile.bootstrap = function() {
    'use strict';

    var screenCanvas = $('#screen_canvas')[0];
    var renderGfx = screenCanvas.getContext('2d');

    var structureSpriteMap = {
	TREE: {
	    top: 0, left: 0, width: 32, height: 32,
	    draw_offset: { top: -16, left: -8 }
	},
	SMALL_TOWER: {
	    top: 32, left: 0, width: 32, height: 48,
	    draw_offset: { top: -32, left: 0 }
	},
	MID_TOWER: {
	    top: 80, left: 0, width: 32, height: 64,
	    draw_offset: { top: -48, left: 0 }
	},
	TALL_TOWER: {
	    top: 144, left: 0, width: 32, height: 96,
	    draw_offset: { top: -80, left: 0 }
	},
	TALLEST_TOWER: {
	    top: 240, left: 0, width: 32, height: 160,
	    draw_offset: { top: -144, left: 0 }
	},
	IDOL_STAGE_1: {
	    top: 400, left: 128 * 4, width: 128, height: 240,
	    draw_offset: {top: -192, left: -16}
	},
	IDOL_STAGE_2: {
	    top: 400, left: 128 * 3, width: 128, height: 240,
	    draw_offset: {top: -192, left: -16}
	},
	IDOL_STAGE_3: {
	    top: 400, left: 128 * 2, width: 128, height: 240,
	    draw_offset: {top: -192, left: -16}
	},
	IDOL_STAGE_4: {
	    top: 400, left: 128 * 1, width: 128, height: 240,
	    draw_offset: {top: -192, left: -16}
	},
	IDOL_STAGE_5: {
	    top: 400, left: 128 * 0, width: 128, height: 240,
	    draw_offset: {top: -192, left: -16}
	}
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

    /////////////////////////////////////////

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

    var structures = new window.Structures(terrain);
    var culture = new window.Culture(structures,
				     Math.min(TERRAIN_COLS/2, TERRAIN_ROWS/2));

    //////////////////////////////////////////

    var structureFootprints = {
	TREE: { width: 1, height: 1, resources: 1 },
	SMALL_TOWER: { width: 2, height: 1, resources: 3 },
	MID_TOWER: { width: 2, height: 1, resources: 6 },
	TALL_TOWER: { width: 2, height: 1, resources: 9 },
	TALLEST_TOWER: { width: 2, height: 1, resources: 12 },

	IDOL_STAGE_1: { width: 6, height: 2, resources:  5 },
	IDOL_STAGE_2: { width: 6, height: 2, resources: 10 },
	IDOL_STAGE_3: { width: 6, height: 2, resources: 15 },
	IDOL_STAGE_4: { width: 6, height: 2, resources: 20 },
	IDOL_STAGE_5: { width: 6, height: 2, resources: 25 } // TOO EXPENSIVE!
    };

    ////////////////////////////////////////////

    var initForest = function(tileBounds, count) {
	var trees = [];
	var treeWidth = structureFootprints.TREE.width;
	var treeHeight = structureFootprints.TREE.height;

	while (trees.length < count) {
	    var newTree = {
		xTile: _.random(tileBounds.left,
				tileBounds.left + tileBounds.width),
		yTile: _.random(tileBounds.top,
				tileBounds.top + tileBounds.height),
		resources: structureFootprints.TREE.resources,
		width: structureFootprints.TREE.width,
		height: structureFootprints.TREE.height,
		team: 'no team'
	    };

	    if (!terrain.isBlocked(newTree.xTile, newTree.yTile)) {
		structures.plantStructure(newTree);
		trees.push(newTree);
	    }
	}

	return _.sortBy(trees, 'yTile');
    };

    var drawTerrain = function() {
	_.times(TERRAIN_COLS, function(col_ix) {
	    _.times(TERRAIN_ROWS, function(row_ix) {
		var treeTileX = col_ix * TILE_IN_PX;
		var treeTileY = row_ix * TILE_IN_PX;

		renderGfx.fillStyle = "rgb(200,0,0)";
		if (terrain.isBlocked(col_ix, row_ix)) {
		    renderGfx.fillRect(treeTileX, treeTileY, TILE_IN_PX, TILE_IN_PX);
		}
	    });
	});
    };

    ///////////////////////////////////////

    var swarm = new window.Swarm(terrain, culture, TILE_IN_PX);

    var northForest = initForest({ top: 6, left: 4, width: 24, height: 16 }, 100);
    var southForest = initForest({ top: 20, left: 36, width: 24, height: 16 }, 100);

    // TODO forest should be managed by a structure manager
    var forest = northForest.concat(southForest);

    /////////////////////////////////////

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

    ///////////////////////////////////

    var lastTime = false;
    var animate = function() {
	if (! lastTime) {
	    lastTime = Date.now();
	    window.requestAnimFrame(animate);
	    return;
	}
	// ELSE
	var now = Date.now();
	var timeDelta = now - lastTime;
	lastTime = now;

	swarm.update(timeDelta);

	renderGfx.drawImage(background, 0, 0);

	_.each(swarm.getMembers(), function(member) {
	    var color = member.team;
	    var swarmFrame = swarmSpriteMap[color].SOUTH[0];

	    var swarmWidth = swarmFrame.width;
	    var swarmHeight = swarmFrame.height;

	    var memberX = (member.xTile * TILE_IN_PX) + member.offsetX;
	    var memberY = (member.yTile * TILE_IN_PX) + member.offsetY;

	    renderGfx.drawImage(swarmSprites,
				// Source rect
				swarmFrame.left, swarmFrame.top, swarmWidth, swarmHeight,
				// Dest rect
				memberX, memberY, swarmWidth, swarmHeight);
	}); // each member

	// TODO this should be managed in disposeStructure
	var livingAndDead = _.groupBy(forest, function(tree) {
	    return (tree.resources > 0) ? 'living' : 'dead';
	});

	_.each(livingAndDead.dead, function(corpse) {
	    structures.disposeStructure(corpse);
	});

	forest = livingAndDead.living;
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

	// drawTerrain();

	window.requestAnimFrame(animate);
    };

    loadManager.setOnComplete(function() {
	window.requestAnimFrame(animate);
    });

    loadManager.arm()
};
