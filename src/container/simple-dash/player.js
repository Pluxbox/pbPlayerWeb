var SimpleDash = SimpleDash || {};

(function( SimpleDash, window ) {

	var ManifestReader = SimpleDash.ManifestReader,
		ChunkBuffer = SimpleDash.ChunkBuffer,
		AudioContext = window.AudioContext || window.webkitAudioContext;

	// Shared audio context
	var audioContext = new AudioContext();

	var Player = function( src, pbPlayer ) {

		// We need instance of pbPlayer
		this._pbPlayer = pbPlayer;
		this._src = src;

		this._init();
	};

	Player.prototype._init = function() {

		this._manifestReader = new ManifestReader(this._src, this);
		this._chunkBuffer = new ChunkBuffer(this._manifestReader);
		this._gainNode = audioContext.createGain();
		this._startAt = 0;
		this._startOffset = 0;
		this._duration = 0;
		this._scheduleChunkTimer = null;
		this._playbackReportTimer = null;
		this._scheduledSources = []; // DEPRECATED
		this._cachedSources = []; // DEPRECATED
		this._isPaused = false;
		this._isPlaying = false;

		// Connect node for regulating volume
		this._gainNode.connect(audioContext.destination);

		// Add events
		this._chunkBuffer.on('canplay', function() {

			this._scheduleChunk();
			this.emit('canplay');

			this._playbackReportTimer = window.setInterval(this._reportPlayback.bind(this), 1000);

		}, this);

		/*this._chunkBuffer.on('empty', function() {

			console.log('empty', this);

			this.pause();
			this.emit('waiting');

		}.bind(this));*/

		this._manifestReader.on('duration', function( duration ) {

			this._duration = duration;
			this.emit('duration', { length: duration });

		}.bind(this));
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

		this._chunkBuffer.start();
	};

	Player.prototype.seekTo = function( seconds ) {
	
		this._manifestReader.seekTo(seconds);
		this._chunkBuffer.empty();
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
		//this.emit('pause');
	};

	Player.prototype.destroy = function() {

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

		this._startAt = audioContext.currentTime;

		// Schedule cached sources
		while( this._cachedSources.length > 0 ) {

			this._scheduleSource(this._cachedSources.shift());
		}

		this._isPaused = false;
		this.emit('play');

		this._playbackReportTimer = window.setInterval(this._reportPlayback.bind(this), 1000);
		this._scheduleChunkTimer = window.setTimeout(this._scheduleChunk.bind(this), (this._startAt - audioContext.currentTime) * 1000 - 1000 );
	};

	Player.prototype._reportPlayback = function() {

		var position = audioContext.currentTime - this._startOffset;
		var progress = this._duration === Infinity ? this._duration : position / this._duration;

		console.log({
			position: position,
			progress: progress
		});

		this.emit('timeupdate', {
			position: position,
			progress: progress
		});
	};

	Player.prototype._scheduleChunk = function() {

		var chunk = this._chunkBuffer.getChunk();

		audioContext.decodeAudioData(chunk.audioData, function( buffer ) {

			var source = this._createSource(buffer);

			this._scheduleSource(source, chunk.startOffset, chunk.endOffset);

			if( !this._isPlaying ) {
				this._isPlaying = true;
				this.emit('play');
			}

			// Schedule decoding of next chunk
			this._scheduleChunkTimer = window.setTimeout(this._scheduleChunk.bind(this), (this._startAt - audioContext.currentTime) * 1000 - 1000 );

		}.bind(this));
	};

	Player.prototype._scheduleSource = function( source, startOffset, endOffset ) {

		if( this._startAt === 0 ) {
			this._startAt = audioContext.currentTime;
		}

		// Schedule playback of source
		if( source.start ) {
			source.start(this._startAt, startOffset, source.buffer.duration + endOffset);
		} else {
			source.noteOn(this._startAt, startOffset, source.buffer.duration + endOffset); // Older webkit implementation
		}

		// Set start point for next source
		this._startAt += source.buffer.duration - startOffset - endOffset;

		// Remove old sources
		if( this._scheduledSources.length > 1 ) {
			this._scheduledSources.shift();
		}

		// Add new source
		this._scheduledSources.push(source);
	};

	Player.prototype._createSource = function( buffer ) {

		var source = audioContext.createBufferSource();

		source.buffer = buffer;
		source.connect(this._gainNode);

		return source;
	};

	SimpleDash.Player = Player;

})(SimpleDash, window);

// For debugging purposes
window.SimpleDash = SimpleDash;