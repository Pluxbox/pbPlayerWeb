(function( SimpleDash, window ) {

	var AudioContext = window.AudioContext || window.webkitAudioContext,
		Eventable = SimpleDash.Eventable;

	var audioContext = new AudioContext();

	var ChunkScheduler = function( chunkBuffer ) {

		Eventable.call(this);

		this._chunkBuffer = chunkBuffer;
		this._gainNode = audioContext.createGain();
		this._scheduleTimer = null;
		this._reportProgressTimer = null;
		this._chunks = [];
		this._scheduledSources = [];
		this._minChunks = 2;
		this._startPosition = 0;
		this._chunkPosition = 0;
		this._totalDuration = 0;

		this._gainNode.connect(audioContext.destination);
	};

	ChunkScheduler.prototype = Object.create(Eventable.prototype);
	ChunkScheduler.prototype.constructor = ChunkScheduler;

	ChunkScheduler.prototype.start = function() {

		this._chunkBuffer.on('progress', this._onBufferProgress, this);
		this._chunkBuffer.start();
	};

	ChunkScheduler.prototype.reset = function() {

		this._chunkBuffer.off('progress', this._onBufferProgress);

		window.clearTimeout(this._scheduleTimer);
		window.clearTimeout(this._reportProgressTimer);

		while( this._scheduledSources.length ) {

			var source = this._scheduledSources.shift();

			if( source.noteOff ) {
				source.noteOff(0); // Older webkit
			} else {
				source.stop();
			}

			source.onended = null;
		}

		this._scheduleTimer = null;
		this._reportProgressTimer = null;
		this._chunks = [];
		this._minChunks = 4;
		this._startPosition = 0;
		this._chunkPosition = 0;
		this._totalDuration = 0;

	};

	ChunkScheduler.prototype.clear = function() {};

	ChunkScheduler.prototype.getVolume = function() {

		return this._gainNode.gain.value;
	};

	ChunkScheduler.prototype.setVolume = function( volume ) {

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

	ChunkScheduler.prototype._onBufferProgress = function( evt ) {

		if( this._chunks.length < this._minChunks ) {

			this._chunks.push(this._chunkBuffer.getChunk());
			return;
		}

		this._chunkBuffer.off('progress', this._onBufferProgress);
		this._scheduleChunk();
	};

	ChunkScheduler.prototype._scheduleChunk = function() {

		var chunk,
			source,
			duration;

		while( this._chunks.length ) {

			chunk = this._chunks.shift();

			if( !chunk ) {

				return;
			}

			console.log('Playing chunk at: ' + audioContext.currentTime, chunk);

			source = this._createSource(chunk.buffer);
			duration = source.buffer.duration - chunk.startOffset - chunk.endOffset;

			if( this._startPosition === 0 ) {

				this._chunkPosition = this._startPosition = audioContext.currentTime;
			}

			if( source.start ) {

				source.start(this._chunkPosition, chunk.startOffset, duration);
			} else {

				source.noteOn(this._chunkPosition, chunk.startOffset, duration);
			}

			this._scheduledSources.push(source);
			this._chunkPosition += duration;

		}

		if( this._chunkBuffer.hasChunk() ) {

			this._chunks.push(this._chunkBuffer.getChunk());
			this._scheduleTimer = window.setTimeout(this._scheduleChunk.bind(this), (duration * 1000) - 10 );
		} else {

			source.onended = this._onEnded.bind(this);
		}

		if( !this._reportProgressTimer ) {

			this._reportProgressTimer = window.setTimeout(this._onReportProgress.bind(this), 250);
		}
	};

	ChunkScheduler.prototype._createSource = function( buffer ) {

		var source = audioContext.createBufferSource();

		source.buffer = buffer;
		source.connect(this._gainNode);

		return source;
	};

	ChunkScheduler.prototype._onReportProgress = function() {

		this.emit('progress', {

			position: audioContext.currentTime - this._startPosition
		});

		this._reportProgressTimer = window.setTimeout(this._onReportProgress.bind(this), 250);
	};

	ChunkScheduler.prototype._onEnded = function() {

		this.emit('ended');
	};

	SimpleDash.ChunkScheduler = ChunkScheduler;

})(SimpleDash, window);