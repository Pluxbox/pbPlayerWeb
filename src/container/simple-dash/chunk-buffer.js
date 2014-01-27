var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ChunkBuffer = function( manifest ) {

		this._manifest = manifest;
		this._chunks = [];
		this._bufferedChunks = 0;
		this._currentChunk = 0;
		this._minChunks = 4;
		this._maxChunks = 6;
	};

	ChunkBuffer.prototype.start = function() {

		this._bufferChunk();
	};

	ChunkBuffer.prototype.hasChunk = function() {

		return this._chunks[this._currentChunk] !== undefined;
	};

	ChunkBuffer.prototype.getChunk = function() {

		var chunk = this._chunks[this._currentChunk];

		// TODO: Check for possible non-buffered chunk

		this._bufferedChunks--;
		this._currentChunk++;

		this._bufferChunk();

		return chunk;
	};

	ChunkBuffer.prototype._bufferChunk = function() {

		if( this._bufferedChunks >= this._maxChunks ||
			!this._manifest.hasChunk() ) {

			return;
		}

		this._manifest.getChunk().then(function( chunk ) {

			return chunk.fillAudioData();

		}).then(function( chunk ) {

			this._chunks.push(chunk);
			this._bufferedChunks++;

			this._bufferChunk();

		}.bind(this));
	};

	SimpleDash.ChunkBuffer = ChunkBuffer;

})(SimpleDash);