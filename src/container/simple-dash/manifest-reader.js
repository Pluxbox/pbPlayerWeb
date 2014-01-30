var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = SimpleDash.Chunk,
		Manifest = SimpleDash.Manifest;

	var ManifestReader = function( src ) {

		this._src = src;
		this._manifestLoaded = false;
		this._segments = [];
		this._currentSegment = 0;

		// Add main manifest
		this._segments.push(new Manifest(this._src));
	};

	/**
	 * Checks if there is a segment available.
	 * @returns {Boolean} True if a segment is available, false otherwise.
	 */
	ManifestReader.prototype.hasChunk = function() {

		return !(this._currentSegment > this._segments.length);
	};

	/**
	 * Get the next chunk in the manifest in sequence.
	 * @returns {Promise} A promise that resolves with the Chunk.
	 */
	ManifestReader.prototype.getChunk = function() {

		var segment = this._segments[this._currentSegment],
			self = this;

		// Resolve with chunk
		if( segment instanceof Chunk ) {
			this._currentSegment++;
			return Promise.resolve(segment);
		}

		// Load segment from manifest and resolve
		if( segment instanceof Manifest ) {

			return segment.getSegments().then(function( segments ) {
				self._appendSegments(segments);
				self._currentSegment++;
			}).then(self.getChunk.bind(self));

		}

		// The segment is of an unknown type, reject.
		return Promise.reject('Got an unknown segment on index ' + this._currentSegment);
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