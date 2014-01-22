var Manifest = function( src ) {
	this._src = src;
	this._manifest = null;
	this._segments = [];
};

Manifest.prototype._requestManifest = function() {

	return new Promise(function( resolve, reject ) {

		var request = new PB.Request({
			url: this._src,
			method: 'GET',
			json: true
		});

		request.on('success', function( request ) {
			this._manifest = request.responseJSON;
			this._addSegments(this._manifest.containers[0].segments); // TODO: Select container based on codec & bitrate

			resolve();
		}, this);

		request.on('error', function( request, code ) {

			reject(code + ': Could not get manifest.');
		}, this);

		request.send();

	}.bind(this));
};

Manifest.prototype._addSegments = function( segments ) {

	var currentSegments = this._getSegmentIds(this._segments);

	// Filter out all duplicate ckunks
	segments = segments.filter(function( segment ) {

		return segment.type === 'chunk' ? currentSegments.indexOf(segment.id) === -1 : true;
	});

	// Replace 'manifest' segments with a Manifest instance
	segments = segments.map(function( segment ) {

		return segment.type === 'manifest' ? new Manifest(segment.url) : segment;
	});

	return this._segments = this._segments.concat(segments);
};

Manifest.prototype._getSegmentIds = function( segments ) {

	return segments.map(function( segment ) {
		return segment.id;
	}).filter(function( id ) {
		return id !== undefined;
	});
};

Manifest.prototype.hasChunk = function() {
	return this._manifest === null || this._segments[0] !== undefined;
};

Manifest.prototype.getChunk = function() {

	// WARNING: Might cause infinite loop if manifest is never retrieved
	if( this._manifest === null ) {
		return this._requestManifest().then(this.getChunk.bind(this));
	}

	var segment = this._segments[0];

	if( segment.type === 'chunk' ) {
		this._segments.shift();
		return Promise.resolve(segment);
	}

	if( segment instanceof Manifest ) {

		if( segment.hasChunk() ) {
			return segment.getChunk();
		} else {
			this._segments.shift();
			return this.getChunk();
		}
	}

	// TODO: Handle possible empty segment?

	return Promise.resolve(segment);
};

window.Manifest = Manifest;