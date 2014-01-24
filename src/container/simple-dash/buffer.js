(function() {

	var Buffer = function( manifest ) {

		this._manifest = manifest;
		this._chunks = [];
		this._bufferedChunks = 0;
		this._currentChunk = 0;
		this._minChunks = 4;
		this._maxChunks = 6;
	};

	Buffer.prototype.start = function() {

		this._bufferChunk();
	};

	Buffer.prototype.hasChunk = function() {

		return this._chunks[this._currentChunk] !== undefined;
	};

	Buffer.prototype.getChunk = function() {

		var chunk = this._chunks[this._currentChunk];

		// TODO: Check for possible non-buffered chunk

		this._bufferedChunks--;
		this._currentChunk++;

		this._bufferChunk();

		return chunk;
	};

	Buffer.prototype._bufferChunk = function() {

		if( !this._manifest.hasChunk() ) {
			throw 'The manifest has no chunks left.';
		}

		if( this._bufferedChunks >= this._maxChunks ) {
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

	SimpleDash.Buffer = Buffer;

})();