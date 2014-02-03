var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ManifestReader = SimpleDash.ManifestReader,
		ChunkBuffer = SimpleDash.ChunkBuffer,
		AudioContext = window.AudioContext || window.webkitAudioContext;

	var Player = function( src, pbPlayer ) {

		// We need instance of pbPlayer
		this._pbPlayer = pbPlayer;
		this._src = src;

		this._init();
	};

	Player.prototype._init = function() {

		this._manifestReader = new ManifestReader(this._src, this);
		this._chunkBuffer = new ChunkBuffer(this._manifestReader);
		this._audioContext = new AudioContext();
		this._gainNode = this._audioContext.createGain();
		this._startAt = 0;
		this._startOffset = 0;
		this._scheduleChunkTimer = null;
		this._scheduledSources = [];
		this._cachedSources = [];
		this._isPaused = false;
		this._isPlaying = false;
		this._playbackReportTimer = null;

		// Connect node for regulating volume
		this._gainNode.connect(this._audioContext.destination);
	};

	Player.prototype.emit = function ( type, data ) {

		this._pbPlayer.emit(type, data);
	}

	Player.prototype.getVolume = function() {

		return this._gainNode.gain.value;
	};

	Player.prototype.setVolume = function( volume ) {

		if( volume > 1 ) {
			volume = 1;
		}

		if( volume < 0 ) {
			volume = 0;
		}

		this._gainNode.gain.value = volume;

		// Trigger volume changed event
		this.emit('volumechange', {
			volume: volume * 100
		});
	};

	Player.prototype.play = function() {

		// Resume playback is paused
		if( this._isPaused ) {
			this._resume();
			return;
		}

		// Start buffering chunks
		this._chunkBuffer.on('canplay', function() {

			this._scheduleChunk();
			this.emit('canplay');
			this.emit('duration', { length: Infinity });

			this._playbackReportTimer = window.setInterval(this._reportPlayback.bind(this), 1000);

		}, this);

		this._chunkBuffer.on('waiting', function() {

			this.emit('waiting');

		}, this)

		this._chunkBuffer.start();
	};

	Player.prototype.pause = function() {

		if( this._isPaused ) {
			return;
		}

		window.clearTimeout(this._scheduleChunkTimer);
		window.clearTimeout(this._playbackReportTimer);

		// Stop playback & copy sources
		while( this._scheduledSources.length > 0 ) {

			var oldSource = this._scheduledSources.shift();
			var newSource = this._createSource(oldSource.buffer);

			this._cachedSources.push(newSource);

			if( oldSource.noteOff ) {
				oldSource.noteOff(0); // Older webkit
			} else {
				oldSource.stop();
			}
		}

		this._isPaused = true;

		// Emit pause event
		this.emit('pause');
	};

	Player.prototype.stop = function() {

		// Stop scheduling chunks
		window.clearTimeout(this._scheduleChunkTimer);
		window.clearTimeout(this._playbackReportTimer);

		// Stop buffer
		this._chunkBuffer.stop();

		// Stop scheduled sources
		while( this._scheduledSources.length > 0 ) {

			var source = this._scheduledSources.shift();

			if( source.noteOff ) {
				source.noteOff(0); // Older webkit
			} else {
				source.stop();
			}
		}


		this._isPlaying = false;
		this.emit('stop');

		this._init();
	};

	Player.prototype._resume = function() {

		if( !this._isPaused ) {
			return;
		}

		this._startAt = this._audioContext.currentTime;

		// Schedule cached sources
		while( this._cachedSources.length > 0 ) {

			this._scheduleSource(this._cachedSources.shift());
		}

		this._isPaused = false;
		this.emit('play');

		this._playbackReportTimer = window.setInterval(this._reportPlayback.bind(this), 1000);
		this._scheduleChunkTimer = window.setTimeout(this._scheduleChunk.bind(this), (this._startAt - this._audioContext.currentTime) * 1000 - 1000 );
	};

	Player.prototype._reportPlayback = function() {

		this.emit('timeupdate', {
			time: this._audioContext.currentTime - this._startOffset
		});
	};

	Player.prototype._scheduleChunk = function() {

		var chunk = this._chunkBuffer.getChunk();

		this._audioContext.decodeAudioData(chunk.audioData, function( buffer ) {

			var source = this._createSource(buffer);

			this._scheduleSource(source);

			if( !this._isPlaying ) {
				this._isPlaying = true;
				this.emit('play');
			}

			// Schedule decoding of next chunk
			this._scheduleChunkTimer = window.setTimeout(this._scheduleChunk.bind(this), (this._startAt - this._audioContext.currentTime) * 1000 - 1000 );

		}.bind(this));
	};

	Player.prototype._scheduleSource = function( source ) {

		if( this._startAt === 0 ) {
			this._startAt = this._audioContext.currentTime;
		}

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

	Player.prototype._createSource = function( buffer ) {

		var source = this._audioContext.createBufferSource();

		source.buffer = buffer;
		source.connect(this._gainNode);

		return source;
	};

	SimpleDash.Player = Player;

})(SimpleDash);

// For debugging purposes
window.SimpleDash = SimpleDash;