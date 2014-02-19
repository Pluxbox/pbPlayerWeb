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
		this._currentManifest = null;
		this._metaDataGiven = false;
		this._duration = 0;

		this._segments.push(new Manifest({ url: this._src }));
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

			this._currentManifest = segment;

			return segment.getSegments().then(function( segments ) {

				// Detect if metadata events should be triggered
				if( !this._metaDataGiven ) {

					this._metaDataGiven = true;
					this._duration = segment.duration;

					this.emit('duration', { duration: this._duration });
				}

				this._addSegments(segments);
				this._currentSegment++;

				this._dispatchModuleEvents(segment.getModules());

			}.bind(this)).then(this.getChunk.bind(this));

		}

		// The segment is of an unknown type, reject.
		return Promise.reject('Got an unknown segment on index ' + this._currentSegment);
	};

	ManifestReader.prototype.getDuration = function() {

		return this._duration;
	};

	/**
	 * Dispatches the events for module data.
	 */
	ManifestReader.prototype._dispatchModuleEvents = function( modules ) {

		modules.forEach(function( module ) {

			this.emit('module', { module: module });

		}, this);

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

			if( segment instanceof Manifest ) {

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
		this._currentManifest = null;
		this._metaDataGiven = false;
		this._duration = 0;

		// Add main manifest
		this._segments.push(new Manifest({ url: this._src }));
	};

	ManifestReader.prototype.scaleUp = function() {

		this._currentManifest.scaleUp();
	};

	ManifestReader.prototype.scaleDown = function() {

		this._currentManifest.scaleDown();
	};

	/**
	 * Adds a bunch of segments replacing unloaded duplicates in the proccess.
	 * @param {Array} segments The segments to append.
	 */
	ManifestReader.prototype._addSegments = function( newSegments ) {

		var existingSegments = this._segments,
			existingSegmentIds = this._getSegmentIds(existingSegments),
			newSegmentIds = this._getSegmentIds(newSegments);

		// TODO: Find existing by new ids, not the other way around.
		// Replace existing unloaded segments
		existingSegments = existingSegments.map(function( existingSegment ) {

			// Map existing if already loaded
			if( existingSegment.isLoaded() ) {

				return existingSegment;
			}

			return newSegments[newSegmentIds.indexOf(existingSegment.id)];

		}.bind(this));

		// Filter out any segments with the same id
		newSegments = newSegments.filter(function( newSegment ) {

			// Always keep manifests
			if( newSegment instanceof Manifest ) {

				return true;
			}

			return existingSegmentIds.indexOf(newSegment.id) === -1;

		}.bind(this));

		this._segments = existingSegments.concat(newSegments);
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