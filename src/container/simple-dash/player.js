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
		this._startAt = 0;                                         // The offset to use to start the next chunk of audio
		this._scheduleChunkTimer = null;                           // The timer to schedule the next chunk of audio for playback
		this._scheduledSources = [];                               // Sources that have been scheduled for playback
		this._cachedSources = [];                                  // Sources that have been cached because of changes in the playback state
	};

	Player.prototype.play = function() {

		this._chunkBuffer.start(); // Start buffering chunks

		// Let's play pretend! (buffer is loaded, probably, maybe)
		window.setTimeout(this._scheduleChunk.bind(this), 2000);
	};

	Player.prototype.pause = function() {

		// Stop adding new chunks
		window.clearTimeout(this._scheduleChunkTimer);

		// Stop playback & copy sources
		while( this._scheduledSources.length > 0 ) {

			var oldSource = this._scheduledSources.shift();
			var newSource = this._audioContext.createBufferSource();

			newSource.buffer = oldSource.buffer;
			newSource.connect(this._audioContext.destination);

			this._cachedSources.push(newSource);
			oldSource.stop();
		}

	};

	Player.prototype.stop = function() {

		// Stop scheduling chunks
		window.clearTimeout(this._scheduleChunkTimer);

		// Stop buffer
		this._chunkBuffer.stop();

		// Stop scheduled sources
		while( this._scheduledSources.length > 0 ) {

			var source = this._scheduledSources.shift();
			source.stop();
		}

		// Reset variables
		this._manifestReader = new ManifestReader(this._src);
		this._chunkBuffer = new ChunkBuffer(this._manifestReader);
		this._audioContext = new AudioContext();
		this._startAt = 0;
		this._scheduleChunkTimer = null;
		this._scheduledSources = [];
		this._cachedSources = [];
	};

	Player.prototype.resume = function() {

		this._startAt = this._audioContext.currentTime;

		while( this._cachedSources.length > 0 ) {

			var source = this._cachedSources.shift();

			this._scheduleSource(source);
		}
	};

	Player.prototype._scheduleChunk = function() {

		var chunk;

		// TODO: Replace this error handling with events from buffer.
		try {
			chunk = this._chunkBuffer.getChunk();
		} catch( err ) {
			return;
		}

		this._audioContext.decodeAudioData(chunk.audioData, function( buffer ) {

			var source = this._audioContext.createBufferSource();

			source.buffer = buffer;
			source.connect(this._audioContext.destination);

			this._scheduleSource(source);

			// Schedule decoding of next chunk
			this._scheduleChunkTimer = window.setTimeout(this._scheduleChunk.bind(this), (this._startAt - this._audioContext.currentTime) * 1000 - 500 );

		}.bind(this));
	};

	Player.prototype._scheduleSource = function( source ) {

		if( source.start ) {
			source.start(this._startAt);
		} else {
			source.noteOn(this._startAt); // Older webkit implementation
		}

		// Set start point for next source
		this._startAt += source.buffer.duration;

		// Remove old sources
		if( this._scheduledSources.length > 1 ) {
			this._scheduledSources.shift();
		}

		// Add new source
		this._scheduledSources.push(source);
	};

	SimpleDash.Player = Player;

})(SimpleDash);

// For debugging purposes
window.SimpleDash = SimpleDash;