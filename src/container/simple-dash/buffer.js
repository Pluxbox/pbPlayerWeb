(function() {

	var Buffer = function( manifest ) {

		this._manifest = manifest;
		this._chunks = [];
		this._minChunks = 4;
		this._maxChunks = 20;
	};

	Buffer.prototype.startBuffering = function() {

		this._bufferChunk();
	};

	Buffer.prototype._bufferChunk = function() {

		if( !this._manifest.hasChunk() ) {
			throw 'The manifest has no chunks.';
		}

		this._manifest.getChunk().then(function( chunk ) {

			return chunk.fillAudioData();

		}).then(function( chunk ) {

			console.log(chunk);

			this._chunks.push(chunk);

			if( this._chunks.length < this._minChunks &&
				this._chunks.length < this._maxChunks ) {

				this._bufferChunk();
			}

		}.bind(this));
	};

	SimpleDash.Buffer = Buffer;

})();