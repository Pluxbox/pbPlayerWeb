var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable;

	var ChunkBuffer = function( manifestReader, options ) {

		options = options || {};

		Eventable.call(this);

		this._manifestReader = manifestReader;
		this._chunks = [];
		this._currentBuffer = 0;
		this._minBuffer = options.minBuffer || 5000; // TODO: Tweak value
		this._maxBuffer = options.maxBuffer || 15000; // TODO: Tweak value
		this._minBufferFilled = false;
		this._maxBufferFilled = false; // TODO: Implement max buffer events
		this._busyBuffering = false;
		this._stopBuffering = true;
	};

	// Extend Eventable
	ChunkBuffer.prototype = Object.create(Eventable.prototype);
	ChunkBuffer.prototype.constructor = ChunkBuffer;

	/**
	 * Buffers a new chunk from the manifest reader.
	 */
	ChunkBuffer.prototype._bufferChunk = function() {

		// Prevent buffering if we're already buffering
		if( this._busyBuffering ) {

			return;
		}

		// Prevent buffering if buffer is full
		if( this._currentBuffer >= this._maxBuffer ) {

			return;
		}

		this._busyBuffering = true;

		// TODO: Prevent buffer from DDOSing the server

		// Get chunk from manifest & fill it with data
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
				this.emit('canplay');
			}

			this._busyBuffering = false;
			this._bufferChunk();

		}.bind(this));
	};

	/**
	 * Starts the buffering proccess.
	 */
	ChunkBuffer.prototype.start = function() {

		this._stopBuffering = false;
		this._bufferChunk();
	};

	/**
	 * Stops the buffering proccess.
	 */
	ChunkBuffer.prototype.stop = function() {

		// TODO: Might cause error if request for data completes after the buffer was stopped

		this._stopBuffering = true;
	};

	/**
	 * Empties the buffer.
	 */
	ChunkBuffer.prototype.empty = function() {

		this.stop();

		this._chunks = [];
		this._currentBuffer = 0;
		this._minBufferFilled = false;

		this.emit('empty');
	};

	/**
	 * Takes a filled chunk from the buffer.
	 * @returns {Chunk} The filled chunk.
	 */
	ChunkBuffer.prototype.getChunk = function() {

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

	SimpleDash.ChunkBuffer = ChunkBuffer;

})(SimpleDash);