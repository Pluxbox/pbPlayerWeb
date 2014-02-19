var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable;

	var Buffer = function( manifestReader, options ) {

		Eventable.call(this);

		options = options || {};

		this._manifestReader = manifestReader;
		this._chunks = [];
		this._currentBuffer = 0;
		this._minBuffer = options.minBuffer || 15000; // TODO: Tweak value
		this._maxBuffer = options.maxBuffer || 120000; // TODO: Tweak value
		this._minBufferFilled = false;
		this._busyBuffering = false;
		this._stopBuffering = true;
		this._canPlay = false;
	};

	// Extend Eventable
	Buffer.prototype = Object.create(Eventable.prototype);
	Buffer.prototype.constructor = Buffer;

	Buffer.prototype.canPlay = function() {
	
		return this._canPlay;
	};

	/**
	 * Buffers a new chunk from the manifest reader.
	 */
	Buffer.prototype._bufferChunk = function() {

		// Prevent buffering if we're already buffering or buffering has stopped
		if( this._busyBuffering || this._stopBuffering ) {

			return;
		}

		// Prevent buffering if buffer is full
		if( this._currentBuffer >= this._maxBuffer ) {

			return;
		}

		this._busyBuffering = true;

		var requestStart = Date.now();

		// Get chunk from manifest
		this._manifestReader.getChunk().then(function( chunk ) {

			// Fill the chunk with data
			return chunk.fill();

		}).then(function( chunk ) {

			// Add chunk to buffer
			this._currentBuffer += chunk.duration;
			this._chunks.push(chunk);

			// Check if buffer is full enough to start playing
			if( !this._minBufferFilled && this._currentBuffer >= this._minBuffer ) {

				this._minBufferFilled = true;
				this._canPlay = true;

				this.emit('canplay');
			}

			// TODO: Improve scaling detection
			if( Date.now() - requestStart > chunk.duration ) {

				this._manifestReader.scaleDown();
			} else {

				this._manifestReader.scaleUp();
			}

			this._busyBuffering = false;

			this.emit('progress');

			this._bufferChunk();

		}.bind(this)).catch(function( reason ) {

			this._busyBuffering = false;

			// TODO: Make sure this timer gets destroyed
			window.setTimeout(function() {

				this._bufferChunk();

			}.bind(this), 1000);

		}.bind(this));
	};

	/**
	 * Starts the buffering proccess.
	 */
	Buffer.prototype.start = function() {

		this._stopBuffering = false;
		this._bufferChunk();
	};

	Buffer.prototype.pause = function() {};

	/**
	 * Stops the buffering proccess.
	 */
	Buffer.prototype.reset = function() {

		// TODO: Might cause error if request for data completes after the buffer was stopped
		// Should cancel request somehow

		this._chunks = [];
		this._currentBuffer = 0;
		this._minBufferFilled = false;
		this._busyBuffering = false;
		this._stopBuffering = true;
	};

	/**
	 * Clears the buffer.
	 */
	Buffer.prototype.clear = function() {

		this._chunks = [];
		this._currentBuffer = 0;
		this._minBufferFilled = false;

		this.emit('empty');

		this._bufferChunk();
	};

	Buffer.prototype.hasChunk = function() {

		return this._chunks.length !== 0;
	};

	/**
	 * Takes a filled chunk from the buffer.
	 * @returns {Chunk} The filled chunk.
	 */
	Buffer.prototype.getChunk = function() {

		var chunk = this._chunks.shift();

		if( chunk === undefined ) {

			throw 'The buffer ran out of chunks but one was requested anyway.';
		}

		this._currentBuffer -= chunk.duration;

		// Check if buffer is empty
		if( this._currentBuffer === 0 ) {

			this.emit('empty');
		}

		this._bufferChunk();

		return chunk;
	};

	SimpleDash.Buffer = Buffer;

})(SimpleDash);