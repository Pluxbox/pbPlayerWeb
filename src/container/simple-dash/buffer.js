(function() {

	var Buffer = function( manifest ) {

		this._manifest = manifest;
		this._chunks = [];
		this._minChunks = 4;
		this._maxChunks = 20;
	};

	Buffer.prototype.start = function() {

		this._manifest.getChunk().then(this._bufferChunk.bind(this));
	};

	Buffer.prototype._bufferChunk = function() {

		if( !this._manifest.hasChunks() ) {
			return;
		}

		this._manifest.getChunk().then(function( chunk ) {

			return chunk.fillAudioData();

		}).then(function( chunk ) {

			console.log(chunk);

		});
	};

	SimpleDash.Buffer = Buffer;

})();