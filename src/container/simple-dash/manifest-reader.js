var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = SimpleDash.Chunk;

	var ManifestReader = function( src ) {

		this._src = src;
		this._manifest = null;
		this._segments = [];
	};

	ManifestReader.prototype._requestManifest = function() {

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

	ManifestReader.prototype._addSegments = function( segments ) {

		var currentSegments = this._getSegmentIds(this._segments);

		// Filter out all duplicate ckunks
		segments = segments.filter(function( segment ) {

			return segment.type === 'chunk' ? currentSegments.indexOf(segment.id) === -1 : true;
		});

		// Create instances for segments
		segments = segments.map(function( segment ) {

			switch( segment.type ) {
				case 'chunk':
					return new Chunk(segment);
					break;
				case 'manifest':
					return new ManifestReader(segment.url);
					break;
			}

			return segment;
		});

		return this._segments = this._segments.concat(segments);
	};

	ManifestReader.prototype._getSegmentIds = function( segments ) {

		return segments.map(function( segment ) {
			return segment.id;
		}).filter(function( id ) {
			return id !== undefined;
		});
	};

	ManifestReader.prototype.hasChunk = function() {

		var segment = this._segments[0];

		if( this._manifest === null ||
			segment instanceof Chunk ||
			(segment instanceof ManifestReader && segment.hasChunk()) ) {

			return true;
		}

		return false;
	};

	ManifestReader.prototype.getChunk = function() {

		// WARNING: Might cause infinite loop if manifest is never retrieved
		if( this._manifest === null ) {
			return this._requestManifest().then(this.getChunk.bind(this));
		}

		var segment = this._segments[0];

		if( segment instanceof Chunk ) {
			this._segments.shift();
			return Promise.resolve(segment);
		}

		if( segment instanceof ManifestReader ) {

			if( segment.hasChunk() ) {
				return segment.getChunk();
			} else {
				this._segments.shift();
				return this.getChunk();
			}
		}

		if( segment === undefined ) {
			return Promise.reject('There are no more chunks in the manifest.');
		}

		return Promise.resolve(segment);
	};

	SimpleDash.ManifestReader = ManifestReader;

})(SimpleDash);