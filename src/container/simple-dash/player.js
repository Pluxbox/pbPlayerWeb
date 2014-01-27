var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ManifestReader = SimpleDash.ManifestReader,
		ChunkBuffer = SimpleDash.ChunkBuffer,
		AudioContext = window.AudioContext || window.webkitAudioContext;

	var Player = function( src ) {

		this._src = src;                                           // Location of manifest file
		this._manifestReader = new ManifestReader(this._src);      // Reader for the manifest file
		this._chunkBuffer = new ChunkBuffer(this._manifestReader); // Buffer for loading chunks of data from the manifest
		this._audioContext = new AudioContext();                   // Contols audio processing and decoding
		this._queuedBuffers = [];                                  // Contains decoded audio buffers that are placed in the audiocontext
		this._startAt = 0;                                         // The offset to use to start the next chunk of audio
		this._playChunkTimer = null;                               // The timer to schedule the next chunk of audio for playback
	};

	/**
	 * Starts the playback.
	 */
	Player.prototype.play = function() {

		this._chunkBuffer.start(); // Start buffering chunks

		// Let's play pretend! (buffer is loaded, probably, maybe)
		window.setTimeout(this._playChunk.bind(this), 3000);
	};

	/**
	 *	Decodes a chunk and adds it to the audiocontext.
	 */
	Player.prototype._playChunk = function() {

		var context = this._audioContext;

		if( !this._chunkBuffer.hasChunk() ) {
			throw 'The buffer is out of chunks but the player requested one anyways.';
		}

		var chunk = this._chunkBuffer.getChunk();

		this._audioContext.decodeAudioData(chunk.audioData, function( buffer ) {

			var source = this._audioContext.createBufferSource();

			source.buffer = buffer;
			source.connect(this._audioContext.destination);

			if( source.start ) {
				source.start(this._startAt);
			} else {
				source.noteOn(this._startAt); // Older webkit implementation
			}

			this._startAt += buffer.duration;

			// Schedule decoding of next chunk
			this._playChunkTimer = window.setTimeout(this._playChunk.bind(this), (this._startAt - this._audioContext.currentTime) * 1000 - 500 );

		}.bind(this));
	};

	SimpleDash.Player = Player;

})(SimpleDash);

// For debugging purposes
window.SimpleDash = SimpleDash;

var player = new SimpleDash.Player('http://localhost:1337/example/manifest.json');
player.play();