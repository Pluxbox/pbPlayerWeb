var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = function( data ) {

		this.id = data.id;
		this.url = data.url;
		this.duration = data.duration;
		this.startOffset = (data.start_offset / 1000) || 0;
		this.endOffset = (data.end_offset / 1000) || 0;
		this.audioData = null;
	};

	/**
	 * Fills the chunk with data from the server.
	 *
	 * @returns {Promise} A promise that resolves when the chunk is filled.
	 */
	Chunk.prototype.fill = function() {

		// Resolve if audio data is already retrieved
		if( this.audioData ) {
			return Promise.resolve(this);
		}

		// Return a promise for when the audio data is retrieved
		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();
			request.open('GET', this.url, true);
			request.responseType = 'arraybuffer';

			request.onload = function() {

				this.audioData = request.response;

				// Resolve with own instance
				resolve(this);

			}.bind(this);

			request.onerror = function( error ) {
				reject('Could not get audio data for chunk.');
			};

			request.send();

		}.bind(this));
	};

	/**
	 * Empties the data in the chunk.
	 */
	Chunk.prototype.empty = function() {

		this.audioData = null;
	};

	SimpleDash.Chunk = Chunk;

})( SimpleDash );