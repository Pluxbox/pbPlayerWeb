(function( SimpleDash, window ) {

	var AudioContext = window.AudioContext || window.webkitAudioContext,
		Eventable = SimpleDash.Eventable,
		ManifestReader = SimpleDash.ManifestReader,
		Buffer = SimpleDash.Buffer;

	var audioContext = new AudioContext();

	var Player = function( src ) {

		Eventable.call(this);

		this._start = 0;
		this._position = 0;
		this._scheduledChunks = [];
		this._scheduledSources = [];
		this._cachedChunks = [];
		this._minChunks = 2;
		this._gainNode = audioContext.createGain();
		this._reportProgressTimer = null;

		this._reader = new ManifestReader(src);
		this._buffer = new Buffer(this._reader);

		this._reader.on('duration', this.emit.bind(this, 'duration'));

		this._gainNode.connect(audioContext.destination);
	};

	Player.prototype = Object.create(Eventable.prototype);
	Player.prototype.constructor = Player;

	Player.prototype.start = function() {

		this._buffer.start();

		if( this._buffer.canPlay() ) {

			this._reportProgressTimer = window.setInterval(this._reportProgress.bind(this), 250);
			this._scheduleChunk();

			return;
		}

		this._buffer.on('canplay', this._onBufferCanPlay, this);
	};

	Player.prototype.pause = function() {

		// Stop listening to buffer events
		this._buffer.off('canplay', this._onBufferCanPlay);

		window.clearInterval(this._reportProgressTimer);

		// Move scheduled chunks to cache
		this._cachedChunks = this._scheduledChunks.slice(0);
		this._scheduledChunks.length = 0;

		// Stop scheduled sources
		while( this._scheduledSources.length ) {

			var source = this._scheduledSources.shift();

			source.onended = null;
			source.stop();
		}

		// Reset current position
		this._position = 0;
	};

	Player.prototype.stop = function() {

		this.pause();

		this._cachedChunks.length = 0;
		this._reader.reset();
		this._buffer.empty();
	};

	Player.prototype.setVolume = function( volume ) {

		if( volume < 0 ) {
			volume = 0;
		}

		if( volume > 1 ) {
			volume = 0;
		}

		this._gainNode.gain.value = volume;

		this.emit('volumechange', { volume: volume });
	};

	Player.prototype._reportProgress = function() {

		var args = {};

		args.position = audioContext.currentTime - this._start;

		if( this._reader.getDuration() !== Infinity ) {

			args.progress = args.position / this._reader.getDuration();
		}

		this.emit('progress', args);
	};

	Player.prototype._onBufferCanPlay = function() {

		this._buffer.off('canplay', this._onBufferCanPlay);
		this._reportProgressTimer = window.setInterval(this._reportProgress.bind(this), 250);

		this._scheduleChunk();
	};

	Player.prototype._enoughScheduled = function() {

		return this._scheduledChunks.length >= this._minChunks;
	};

	Player.prototype._scheduleChunk = function() {

		// Buffer has no chunks, prevent scheduling.
		if( !this._buffer.hasChunk() ) {

			return;
		}

		// Enough chunks are scheduled, prevent scheduling.
		if( this._enoughScheduled() ) {

			return;
		}

		var chunk = this._cachedChunks.shift() || this._buffer.getChunk(),
			source = this._createSource(chunk.buffer),
			duration = source.buffer.duration - chunk.startOffset - chunk.endOffset;

		// Reset start postion
		if( this._start === 0 || this._position === 0 ) {

			this._start = this._position = audioContext.currentTime;
		}

		source.onended = this._onSourceEnded.bind(this);
		source.start(this._position, chunk.startOffset, duration);

		this._position += duration;

		this._scheduledSources.push(source);
		this._scheduledChunks.push(chunk);

		// Keep scheduling chunks until a minimum is reached
		this._scheduleChunk();
	};

	Player.prototype._createSource = function( buffer ) {

		var source = audioContext.createBufferSource();

		source.buffer = buffer;
		source.connect(this._gainNode);

		return source;
	};

	Player.prototype._onSourceEnded = function( evt ) {

		this._scheduledChunks.shift();
		this._scheduledSources.shift();

		if( this._scheduledChunks.length === 0 &&
			!this._reader.hasChunk() ) {

			this.emit('ended');
			this.stop();
			
			return;
		}

		this._scheduleChunk();
	};

	SimpleDash.Player = Player;

})(SimpleDash, window);