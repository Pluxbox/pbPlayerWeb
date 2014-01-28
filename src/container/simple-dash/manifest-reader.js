var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = SimpleDash.Chunk;

	var ManifestReader = function( src ) {

		this._src = src;
		this._manifestLoaded = false;
		this._segments = [];
		this._currentSegment = 0;
	};

	/**
	 * Loads the manifest from the server and parses it.
	 *
	 * @param {String} src The url where the manifest can be found.
	 * @returns {Promise} A promise for when loading succeeds or fails.
	 */
	ManifestReader.prototype._loadManifest = function( src ) {

		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();
			request.open('GET', src, true);

			request.onload = function() {

				try {

					var manifest = JSON.parse(request.response);

					// TODO: Add support for selecting a container
					this._appendSegments(manifest.containers[0].segments);
					this._manifestLoaded = true;

					resolve();

				} catch( err ) {

					reject('Could not parse manifest.')
				}


			}.bind(this);

			request.onerror = function() {

				reject('Could not load manifest from server.');
			};

			request.send();

		}.bind(this));
	};

	/**
	 * Appends a bunch of segments removing duplicates in the proccess.
	 *
	 * @param {Array} segments The segments to append.
	 */
	ManifestReader.prototype._appendSegments = function( segments ) {

		// Get current segment ids
		var currentSegments = this._getSegmentIds(this._segments);

		// Filter out all unwanted segments
		segments = segments.filter(function( segment ) {

			if( segment.type === 'chunk' ) {
				return currentSegments.indexOf(segment.id) === -1;
			}

			if( segment.type === 'manifest' ) {
				return true;
			}

			return false;
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

		this._segments = this._segments.concat(segments);
	};

	/**
	 * Creates an array of ids from the specified segments.
	 * 
	 * @param {Array} segments The segments to extract the ids from.
	 * @returns {Array} A collection of ids.
	 */
	ManifestReader.prototype._getSegmentIds = function( segments ) {

		var results;

		// Fill results with ids of segments
		results = segments.map(function( segment ) {
			return segment.id;
		});

		// Filter out any undefined segments
		results = results.filter(function( id ) {
			return id !== undefined;
		});

		return results;
	};

	/**
	 * Checks if there is a segment available.
	 *
	 * @returns {Boolean} True if a segment is available, false otherwise.
	 */
	ManifestReader.prototype.hasChunk = function() {

		var segment = this._segments[this._currentSegment];

		if( !this._manifestLoaded ||
			segment instanceof Chunk ||
			( segment instanceof ManifestReader && segment.hasChunk() ) ) {

			return true;
		}

		return false;
	};

	/**
	 * Get the next chunk in the manifest in sequence.
	 *
	 * @returns {Promise} A promise that resolves with the Chunk.
	 */
	ManifestReader.prototype.getChunk = function() {

		// Load manifest if not yet loaded
		if( !this._manifestLoaded ) {

			return this._loadManifest(this._src)
				.then(this.getChunk.bind(this));
		}

		// Get current segment
		var segment = this._segments[this._currentSegment];

		// Resolve if segment is of type chunk
		if( segment instanceof Chunk ) {

			this._currentSegment++;
			return Promise.resolve(segment);
		}

		// Get chunk from nested manifestreader or load next chunk if it's out of chunks
		if( segment instanceof ManifestReader ) {

			if( segment.hasChunk() ) {
				return segment.getChunk();
			} else {
				this._currentSegment++;
				return this.getChunk()
			}
		}

		// There are no more comparisons, segment is unknown
		return Promise.reject('Got an unknown segment on index ' + (this._currentSegment + 1));
	};

	SimpleDash.ManifestReader = ManifestReader;

})(SimpleDash);