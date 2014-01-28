var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = function( data ) {

		this.id = data.id;
		this.url = data.url;
		this.audioData = null;
	};


	/**
	 * Fills the chunk with data from the server.
	 *
	 * @returns {Promise} A promise that resolves when teh chunk is filled.
	 */
	Chunk.prototype.fillAudioData = function() {

		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();
			request.open('GET', this.url, true);
			request.responseType = 'arraybuffer';

			request.onload = function() {

				this.audioData = request.response;
				resolve(this);

			}.bind(this);

			request.onerror = function( error ) {
				// TODO: Handle errors
			};

			request.send();

		}.bind(this));
	};

	SimpleDash.Chunk = Chunk;

})( SimpleDash );