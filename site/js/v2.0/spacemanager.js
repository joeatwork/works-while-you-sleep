// From https://github.com/joeatwork/SpaceManager

window.SpaceManager = (function() {

    var toRect = function(left, right, top, bottom) {
	return {
	    left : Math.min(left, right),
	    right : Math.max(left, right),
	    top : Math.min(top, bottom),
	    bottom : Math.max(top, bottom)
	};
    };

    var cloneRect = function(r) {
	return {
	    left : r.left,
	    right : r.right,
	    top : r.top,
	    bottom : r.bottom
	};
    };

    var unionRects = function(r1, r2) {
	return {
	    left : Math.min(r1.left, r2.left),
	    top : Math.min(r1.top, r2.top),
	    right : Math.max(r1.right, r2.right),
	    bottom : Math.max(r1.bottom, r2.bottom)	    
	};
    };

    var collideRects = function(r1, r2) {
	if((r2.right < r1.left) || 
	   (r1.right < r2.left) || // disjoint X
	   (r2.bottom < r1.top) || 
	   (r1.bottom < r2.top)) // disjoint y
	    return false;

	// OTHERWISE, overlap in X and in Y
	return true;
    };

    var containsRect = function(rOutside, rInside) {
	if(null === rInside)
	    return "For convenience, EVERY rect contains null.";

	return ((rOutside.left   <= rInside.left  ) &&
		(rOutside.right  >= rInside.right ) &&		
		(rOutside.top    <= rInside.top   ) &&
		(rOutside.bottom >= rInside.bottom));
    }

    var centerRect = function(r) {
	var halfWidth = (r.right - r.left)/2.0;
	var halfHeight = (r.bottom - r.top)/2.0;
	return [ r.left + halfWidth,
		 r.top  + halfHeight ];
    };

    ///////////////////////////////////////////////////////////////
    // Brute force space. No clever data structures. Hashes for all!
    // After http://code.google.com/p/mason/

    var HashSpace = function(scale) {
	this.scale = scale;
	this.locationsToItems = {};
	this.itemsToLocation = {};
    };

    // EVERY rect MUST have at least one location.
    HashSpace.prototype._rectLocations = function(rect, f) {
	var ret = [];

	var qLeft = Math.floor(rect.left / this.scale);
	var qRight = Math.ceil(rect.right / this.scale);
	var qTop = Math.floor(rect.top / this.scale);
	var qBottom = Math.ceil(rect.bottom / this.scale);

	for(var nextX = qLeft; nextX <= qRight; nextX++) {
	    for(var nextY = qTop; nextY <= qBottom; nextY++) {
		var location = nextX + ":" + nextY;
		ret.push(location);
	    }
	}

	return ret;
    };

    HashSpace.prototype._uniqueItemsInLocations = function(locationList) {
	var uniqueItems = {};
	var ret = [];

	for(var locationIx=0; locationIx < locationList.length; locationIx++) {
	    var location = locationList[locationIx];
	    var itemsHere = this.locationsToItems[location];
	    if(itemsHere) {
		for(var itemIx=0 ; itemIx < itemsHere.length; itemIx++) {
		    var item = itemsHere[itemIx];
		    uniqueItems[ item.hashCode ] = item;
		}
	    }
	}

	for(var hashCode in uniqueItems) {
	    ret.push(uniqueItems[ hashCode ]);
	}

	return ret;
    }

    // The same object must only be added once before removal
    HashSpace.prototype.add = function(newRect) {
	var locations = this._rectLocations(newRect);
	this.itemsToLocation[ newRect.hashCode ] = locations;

	for(var i=0; i < locations.length; i++) {
	    var location = locations[i];
	    var itemBucket = this.locationsToItems[ location ];
	    if(!itemBucket) itemBucket = [];
	    itemBucket.push(newRect);
	    this.locationsToItems[ location ] = itemBucket;
	}
    };

    // An object must be added before it can be removed
    HashSpace.prototype.remove = function(reference) {
	var locations = this.itemsToLocation[ reference.hashCode ];
	delete this.itemsToLocation[ reference.hashCode ];

	for(var locationIx=0; locationIx < locations.length; locationIx++) {
	    var nextLocation = locations[ locationIx ];
	    var itemsAtLocation = this.locationsToItems[ nextLocation ]
	    var itemsRemaining = [];

	    for(var itemIx=0; itemIx < itemsAtLocation.length; itemIx++) {
		var nextOne = itemsAtLocation[ itemIx ];
		if(reference !== nextOne)
		    itemsRemaining.push(nextOne);
	    }

	    if(itemsRemaining.length)
		this.locationsToItems[nextLocation] = itemsRemaining;
	    else
		delete this.locationsToItems[nextLocation];
	}
    };

    HashSpace.prototype.findInRect = function(query) {
	var ret = [];
	var locations = this._rectLocations(query);
	var candidates = this._uniqueItemsInLocations(locations);
	var operations = 0;

	for(var i = 0; i < candidates.length; i++) {	    
	    operations++;
	    var found = candidates[ i ];
	    if(collideRects(found, query))
		ret.push(found);
	}

	ret.findOperations = operations;
	return ret;
    };

    HashSpace.prototype.dump = function() {
	var allLocations = [];

	for(var location in this.locationsToItems) {
	    allLocations.push(location);
	}

	return this._uniqueItemsInLocations(allLocations);
    };

    HashSpace.prototype.checkSpace = function() {
	var dump = this.dump();
	items = dump.length;

	var depth = 0;
	var nodes = 0;

	for(var location in this.locationsToItems) {
	    var itemsAtLocation = this.locationsToItems[ location ];
	    depth = Math.max(depth, location.length);
	    nodes += location.length;
	}

	for(var hashCode in this.itemsToLocation) {
	    nodes += this.itemsToLocation[ hashCode ].length;
	}

	return {
	    nodes : nodes,
	    depth : depth,
	    items : items
	}
    };

    ////////////////////////////////////////////////////////////////

    // HINTED BSP tree. The HINT is the rectangle 'field',
    // which will be used to decide how to partition the space.
    // We MUST be able to handle points outside of field, but
    // we don't claim to be able to handle them efficiently :)

    var TreeSpace = function(field, orientation /* 'left' or 'top', or null */) {
	// INVARIANTS
	//   either this.less == this.more, OR NIETHER IS NULL
	//   either this.less == null OR this.contents NOT NULL
	// That is
	//   No non-leaves are empty
	//   All non-leaves have two (possibly empty) children

	if(undefined === orientation)
	    orientation = 'left';

	this.field = field;
	this.orientation = orientation;

	this.less = null; // LEFT/UPWARD
	this.more = null; // RIGHT/DOWNWARD
	this.contents = null;
	this.bounds = null;

	this.center = centerRect(field);
	if('left' == orientation)
	    this.cleavage = this.center[0];
	else
	    this.cleavage = this.center[1];
    };

    // NOT RECURSIVE. Thanks, teeny tiny stack!
    TreeSpace.prototype._assertSane = function() {
	if( (null === this.contents) &&
	    (null === this.less) &&
	    (null === this.more) ) {
	    return "SANE: empty leaf";
	}
	else if( (null !== this.contents) &&
		 (null === this.less) &&
		 (null === this.more) ) {
	    return "SANE: Full Leaf";
	}
	else if( (null !== this.contents) &&
		 (null !== this.less) &&
		 (null !== this.more) ) {
	    return "SANE: Full Branch";
	}
	else {
	    throw { error : "INSANE TREE",
		    tree : this };
	}
    }

    // NOT RECURSIVE
    TreeSpace.prototype._assertGoodBounds = function() {
	if(this.isEmpty()) {
	    if(null === this.bounds) return "SANE, EMPTY NODE";
	}
	else if(this.isLeaf()) {
	    if(containsRect(this.bounds, this._getContents()) &&
	       containsRect(this._getContents(), this.bounds)) {
		return "SANE LEAF, IDENTICAL CONTENTS AND BOUNDS";
	    }
	}
	else if(containsRect(this.bounds, this.less.bounds) &&
		containsRect(this.bounds, this.more.bounds)){
	    return "SANE, bounds contains leaves";
	}

	// if we get here, we're bad.
	throw { error : "BAD BOUNDING BOX",
		tree : this };
    }

    TreeSpace.prototype._recurTowardBranch = function(someRect) {
	var rectPos = someRect[ this.orientation ];

	if(this.cleavage >= rectPos) {
	    return this.less;
	}
	else {
	    return this.more;
	}

    };

    TreeSpace.prototype._split = function() {
	var orientation = this.orientation;
	var cleavage = this.cleavage;

	var lessField = cloneRect(this.field);
	var moreField = cloneRect(this.field);

	var newOrientation = 'left';

	if('left' == orientation) {	    
	    lessField.right = cleavage;
	    moreField.left = cleavage;
	    newOrientation = 'top';
	}
	else {
	    lessField.bottom = cleavage;
	    moreField.top = cleavage;
	}

	this.less = new TreeSpace(lessField, newOrientation);
	this.more = new TreeSpace(moreField, newOrientation);
    };

    TreeSpace.prototype._setContents = function(c) {
	// DOES NOT ADJUST BOUNDS
	this.contents = c;
    };

    TreeSpace.prototype._getContents = function() {
	return this.contents;
    };

    // DOES NOT RECUR.
    TreeSpace.prototype._recalculateBounds = function() {
	if(this.isEmpty()) {
	    this.bounds = null;
	}
	else {
	    this.bounds = cloneRect(this.contents);
	    if(this.less && this.less.bounds) {
		this.bounds = unionRects(this.bounds, this.less.bounds);
	    }

	    if(this.more && this.more.bounds) {
		this.bounds = unionRects(this.bounds, this.more.bounds);
	    }
	}

	this._assertGoodBounds();
    };

    TreeSpace.prototype._deleteContents = function() {
	var acceptor = this;
	var affected = [ acceptor ]; // we all have invalid bounds!
	acceptor._setContents(null);

	while(! acceptor.isLeaf()) {
	    var donor = null;

	    if(! acceptor.less.isEmpty()) {
		donor = acceptor.less;
	    }
	    else if(! acceptor.more.isEmpty()) {
		donor = acceptor.more;
	    }

	    if(donor) {
		var content = donor._getContents();
		donor._setContents(null);
		affected.push(donor);
		acceptor._setContents(content);
		acceptor = donor;
	    }
	    else { 
		acceptor.less = null;
		acceptor.more = null;
	    }
	}

	while(affected.length) {
	    var toAdjust = affected.pop();
	    toAdjust._recalculateBounds();
	}
    };

    TreeSpace.prototype.dump = function() {
	var branches = [ this ];
	var ret = [];

	while(branches.length) {
	    var branch = branches.shift();
	    if(branch && (! branch.isEmpty())) {
		ret.push(branch._getContents());
		branches.push(branch.less);
		branches.push(branch.more);
	    }
	}

	return ret;
    };

    TreeSpace.prototype.isEmpty = function() {
	return (null === this.contents);
    };

    TreeSpace.prototype.isLeaf = function() {
	return (null === this.less);
    };

    TreeSpace.prototype.add = function(newRect) {
	var branch = this;
	if(null === newRect)
	    throw "Space Invariant Violated, Cannot add a null rectangle";

	while(branch) {
	    if(null === branch.bounds)
		branch.bounds = cloneRect(newRect);
	    else
		branch.bounds = unionRects(branch.bounds, newRect);

	    if(branch.isEmpty()) {
		branch._setContents(newRect);
	    }
	    else if(branch.isLeaf()) {
		branch._split();
	    }

	    branch = branch._recurTowardBranch(newRect);
	}
    };

    TreeSpace.prototype.findInRect = function(rect) {
	var ret = [];
	var searches = [ this ];
	var operations = 0;

	while(searches.length) {
	    operations++;
	    var branch = searches.shift();

	    if(branch.bounds && collideRects(branch.bounds, rect)) {
		var contents = branch._getContents();

		if(collideRects(contents, rect)) ret.push(contents);

		if(branch.less) searches.push(branch.less);
		if(branch.more) searches.push(branch.more);
	    }
	}

	ret.findOperations = operations;
	return ret;
    };

    TreeSpace.prototype.remove = function(reference) {
	var branch = this;
	var affected = [];

	// No real GC, but we do push gaps into
	// the leaves of the tree.
	while(branch) {
	    affected.push(branch);
	    var contents = branch._getContents();
	    if(contents === reference) {
		branch._deleteContents();
		break;
	    }

	    branch = branch._recurTowardBranch(reference);
	}

	while(affected.length) {
	    var toAdjust = affected.pop();
	    toAdjust._recalculateBounds();
	}
    };

    TreeSpace.prototype.checkSpace = function() {
	var toSearch = [ { depth : 1, branch : this } ];

	var nodes = 0;
	var maxDepth = 0;
	var items = 0;

	while(0 < toSearch.length) {
	    var search = toSearch.shift();
	    var branch = search.branch;
	    var depth = search.depth;
	    var nextDepth = depth + 1;

	    branch._assertSane();

	    nodes += 1;
	    items += (null === branch._getContents() ? 0 : 1);	
	    maxDepth = Math.max(depth, maxDepth);

	    if(null !== branch.less) toSearch.push({ depth: nextDepth, branch: branch.less });
	    if(null !== branch.more) toSearch.push({ depth: nextDepth, branch: branch.more });
	}

	return {
	    nodes : nodes,
	    depth : maxDepth,
	    items : items
	};
    };


    /////////////////////////////////////////////////

    // Good at UNIFORMLY SIZED, GENERALLY NON-OVERLAPPING OBJECTS.
    // Which, hurrah, is what we need.
    var SpaceManager = function(space) {
	this.space = space;
	this.handles = {}; // NOT AN ARRAY.
	this.nextCode = 1;
    };

    SpaceManager.prototype.makeHandle = function(item, left, right, top, bottom) {
	// Callers are expected to keep a reference to
	// our return value around.
	var handle = toRect(left, right, top, bottom);
	handle.contents = item;
	handle.hashCode = this.nextCode;
	this.nextCode++;

	return handle;
    };

    // TODO: This is easy to confuse with SpaceManager.add -
    // merge them into one method that is smart about arguments
    SpaceManager.prototype.addHandle = function(handle) {
	if(this.handles[ handle.hashCode ])
	    throw "Cannot add the same handle to the same manager more than once";

	this.handles[ handle.hashCode ] = handle;
	this.space.add(handle);
	return handle;
    };

    SpaceManager.prototype.contentFromHandle = function(handle) {
	return handle.contents;
    };

    SpaceManager.prototype.setHandleContents = function(handle, contents) {
	handle.contents = contents;
    };

    SpaceManager.prototype.containsHandle = function(handle) {
	return this.handles[ handle.hashCode ];
    }

    SpaceManager.prototype.add = function(item, left, right, top, bottom) {
	var newHandle = this.makeHandle(item, left, right, top, bottom);
	return this.addHandle(newHandle);
    };

    SpaceManager.prototype.remove = function(handle) {
	this.space.remove(handle);
	delete this.handles[ handle.hashCode ];
    };

    SpaceManager.prototype.move = function(oldHandle, left, right, top, bottom) {
	var item = oldHandle.contents;
	this.remove(oldHandle);
	return this.add(item, left, right, top, bottom);
    };

    SpaceManager.prototype.find = function(left, right, top, bottom) {
	var handles = this.space.findInRect(toRect(left, right, top, bottom));
	var ret = [];
	for( var i = 0; i < handles.length; i++) {
	    ret[i] = handles[i].contents;
	}
	ret.findOperations = handles.findOperations;

	return ret;
    };

    SpaceManager.prototype.dump = function() {
	return this.space.dump();	
    };

    SpaceManager.prototype.checkSpace = function() {
	return this.space.checkSpace();
    };

    return {
	hashSpace : function(scale) {
	    var space = new HashSpace(scale);
	    return new SpaceManager(space);
	},

	treeSpace : function(left, right, top, bottom) {
	    var field = toRect(left, right, top, bottom);
	    var space = new TreeSpace(field, 'left');
	    return new SpaceManager(space);
	}
    };

})();
