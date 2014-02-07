var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable,
		Manifest = SimpleDash.Manifest,
		Chunk = SimpleDash.Chunk;

	var ManifestReader = function( src ) {

		Eventable.call(this);

		this._src = src;
		this._segments = [];
		this._currentSegment = 0;
		this._metaDataGiven = false;

		// Add main manifest
		this._segments.push(new Manifest(src));
	};

	// Extend Eventable
	ManifestReader.prototype = Object.create(Eventable.prototype);
	ManifestReader.prototype.constructor = ManifestReader;

	/**
	 * Checks if there is a segment available.
	 * @returns {Boolean} True if a segment is available, false otherwise.
	 */
	ManifestReader.prototype.hasChunk = function() {

		return !(this._currentSegment >= this._segments.length);
	};

	/**
	 * Get the next chunk in the manifest in sequence.
	 * @returns {Promise} A promise that resolves with the Chunk.
	 */
	ManifestReader.prototype.getChunk = function() {

		var segment = this._segments[this._currentSegment];

		// Resolve with chunk
		if( segment instanceof Chunk ) {

			this._currentSegment++;
			return Promise.resolve(segment);
		}

		// Load segment from manifest and resolve
		if( segment instanceof Manifest ) {

			return segment.getSegments().then(function( segments ) {

				// Detect if metadata events should be triggered
				if( !this._metaDataGiven && this._currentSegment === 0 ) {

					var meta = segment.metaData;

					this._metaDataGiven = true;

					this.emit('duration', { length: meta.duration });
				}

				this._appendSegments(segments);
				this._currentSegment++;

			}.bind(this)).then(this.getChunk.bind(this));

		}

		// The segment is of an unknown type, reject.
		return Promise.reject('Got an unknown segment on index ' + this._currentSegment);
	};

	/**
	 * Seeks the manifest to a specific point in time.
	 * @param {Number} target The target to seek to in seconds.
	 */
	ManifestReader.prototype.seekTo = function( target ) {

		var i = 0,
			segment,
			now = 0;

		for( ; i < this._segments.length; i++ ) {

			segment = this._segments[i];

			if( segment instanceof Manifest || !segment.duration ) {

				continue;
			}

			// TODO: Handle unloaded manifests

			now += (segment.duration - segment.startOffset - segment.endOffset) / 1000;

			if( now > target ) {

				this._currentSegment = i;
				break;
			}

		}

	};

	ManifestReader.prototype.reset = function() {

		this._segments = [];
		this._currentSegment = 0;
		this._metaDataGiven = false;

		// Add main manifest
		this._segments.push(new Manifest(this._src));
	};

	/**
	 * Appends a bunch of segments removing duplicates in the proccess.
	 * @param {Array} segments The segments to append.
	 */
	ManifestReader.prototype._appendSegments = function( segments ) {

		// Get current segment ids
		var currentSegments = this._getSegmentIds(this._segments),
			results;

		// Filter out any unwanted segments
		results = segments.filter(function( segment ) {

			// Chunks with the same ID
			if( segment instanceof Chunk ) {
				return currentSegments.indexOf(segment.id) === -1;
			}

			// Always keep manifests
			if( segment instanceof Manifest ) {
				return true;
			}

			// Remove unknowns
			return false;
		});

		this._segments = this._segments.concat(results);
	};

	/**
	 * Creates an array of ids from the specified segments.
	 * @param {Array} segments The segments to extract the ids from.
	 * @returns {Array} A collection of ids.
	 */
	ManifestReader.prototype._getSegmentIds = function( segments ) {

		// Return mapped ids of segments
		return segments.map(function( segment ) {
			return segment.id;
		});
	};

	SimpleDash.ManifestReader = ManifestReader;

})(SimpleDash);