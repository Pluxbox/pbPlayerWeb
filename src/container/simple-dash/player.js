(function( SimpleDash, window ) {

	var AudioContext = window.AudioContext || window.webkitAudioContext,
		Eventable = SimpleDash.Eventable;

	var audioContext = new AudioContext();

	var Player = function( buffer ) {

		Eventable.call(this);

		this._buffer = buffer;
		this._start = 0;
		this._position = 0;
		this._scheduledChunks = [];
		this._scheduledSources = [];
		this._cachedChunks = [];
		this._minChunks = 2;
		this._gainNode = audioContext.createGain();

		this._gainNode.connect(audioContext.destination);
	};

	Player.prototype = Object.create(Eventable.prototype);
	Player.prototype.constructor = Player;

	Player.prototype.start = function() {

		if( this._buffer.canPlay() ) {

			this._scheduleChunk();
			return;
		}

		this._buffer.on('canplay', this._onBufferCanPlay, this);
	};

	Player.prototype.pause = function() {

		// Stop listening to buffer events
		this._buffer.off('canplay', this._onBufferCanPlay);

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

	Player.prototype.setVolume = function( volume ) {

		this._gainNode.gain.value = volume;
	};

	Player.prototype._onBufferCanPlay = function() {

		this._buffer.off('canplay', this._onBufferCanPlay);

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

	Player.prototype._onSourceEnded = function( evt ) {

		this._scheduledChunks.shift();
		this._scheduledSources.shift();
		this._scheduleChunk();
	};

	Player.prototype._createSource = function( buffer ) {

		var source = audioContext.createBufferSource();

		source.buffer = buffer;
		source.connect(this._gainNode);

		return source;
	};

	SimpleDash.Player = Player;

})(SimpleDash, window);