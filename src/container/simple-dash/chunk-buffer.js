var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ChunkBuffer = function( manifestReader ) {

		this._manifestReader = manifestReader;
		this._bufferedChunks = [];
		this._preventBuffering = false;
		this._minChunks = 4;
		this._maxChunks = 6;
	};

	/**
	 * Buffers a new chunk from the manifest reader.
	 */
	ChunkBuffer.prototype._bufferChunk = function() {

		// Prevent buffering when buffer is full or manifest ran out of chunks
		if( this._preventBuffering ||
			this._bufferedChunks.length >= this._maxChunks ||
			!this._manifestReader.hasChunk() ) {

			return;
		}

		// Get chunk from manifest & fill it with data
		this._manifestReader.getChunk().then(function( chunk ) {

			return chunk.fillAudioData();

		}).then(function( chunk ) {

			// Add chunk to buffer & buffer a new chunk
			this._bufferedChunks.push(chunk);
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

		this._bufferedChunks = [];
	};

	/**
	 * Takes a filled chunk from the buffer.
	 *
	 * @returns {Chunk} The filled chunk.
	 */
	ChunkBuffer.prototype.getChunk = function() {

		var chunk = this._bufferedChunks.shift();

		if( chunk === undefined ) {
			throw 'The buffer ran out of chunks but one was requested anyway.';
		}

		this._bufferChunk();

		return chunk;
	};

	SimpleDash.ChunkBuffer = ChunkBuffer;

})(SimpleDash);