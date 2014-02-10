var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var AudioContext = window.AudioContext || window.webkitAudioContext;

	// Shared audio context
	var audioContext = new AudioContext();

	var Chunk = function( data ) {

		this.id = data.id;
		this.url = data.url;
		this.duration = data.duration;
		this.startOffset = (data.start_offset / 1000) || 0;
		//this.endOffset = (data.stop_offset / 1000) || 0;
		this.endOffset = 0; // TEMP
		this.buffer = null;
	};

	/**
	 * Fills the chunk with data from the server.
	 *
	 * @returns {Promise} A promise that resolves when the chunk is filled.
	 */
	Chunk.prototype.fill = function() {

		// Resolve if data is already retrieved
		if( this.buffer ) {
			return Promise.resolve(this);
		}

		// Return a promise for when the data is retrieved
		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();
			request.open('GET', this.url, true);
			request.responseType = 'arraybuffer';

			request.onload = function() {

				var data = request.response;

				audioContext.decodeAudioData(data, function( buffer ) {

					this.buffer = buffer;

					resolve(this);

				}.bind(this));

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

		this.buffer = null;
	};

	SimpleDash.Chunk = Chunk;

})( SimpleDash );