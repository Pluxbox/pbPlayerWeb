var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable;

	var ChunkBuffer = function( manifestReader ) {

		Eventable.call(this);

		this._manifestReader = manifestReader;
		this._chunks = [];
		this._currentBuffer = 0; // In milliseconds
		this._minBuffer = 5000; // In milliseconds
		this._maxBuffer = 15000; // In milliseconds
		this._minBufferFilled = false;
		this._bufferingChunk = false;
		this._preventBuffering = true;
	};

	// Extend Eventable
	ChunkBuffer.prototype = Object.create(Eventable.prototype);
	ChunkBuffer.prototype.constructor = ChunkBuffer;

	/**
	 * Buffers a new chunk from the manifest reader.
	 */
	ChunkBuffer.prototype._bufferChunk = function() {

		// Prevent buffering if we're already buffering
		if( this._bufferingChunk ) {

			return;
		}

		// Prevent buffering if buffer is full
		if( this._currentBuffer >= this._maxBuffer ) {

			return;
		}

		this._bufferingChunk = true;

		// Get chunk from manifest & fill it with data
		// TODO: Prevent buffer from DDOSing the server
		this._manifestReader.getChunk().then(function( chunk ) {

			// Fill the chunk with audio data
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

			this._bufferingChunk = false;
			this._bufferChunk();

		}.bind(this));
	};

	/**
	 * Starts the buffering proccess.
	 */
	ChunkBuffer.prototype.start = function() {

		this._preventBuffering = false;
		this._bufferChunk();
	};

	/**
	 * Stops the buffering proccess.
	 */
	ChunkBuffer.prototype.stop = function() {

		this._preventBuffering = true;
	};

	/**
	 * Empties the buffer.
	 */
	ChunkBuffer.prototype.empty = function() {

		this._chunks = [];
		this._currentBuffer = 0;
		this._preventBuffering = true;

		// TODO: Trigger empty event
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
			this.emit('waiting');
		}

		this._bufferChunk();

		return chunk;
	};

	SimpleDash.ChunkBuffer = ChunkBuffer;

})(SimpleDash);