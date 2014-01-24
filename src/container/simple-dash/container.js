var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ManifestReader = SimpleDash.ManifestReader;
	var Buffer = SimpleDash.Buffer;
	var AudioContext = window.AudioContext || window.webkitAudioContext;

	var Container = function( player, src ) {

		this._src = src;
		this._manifest = new ManifestReader(this._src);
		this._buffer = new Buffer(this._manifest);
		this._audioContext = null;
		this._nextBufferStart = 0;
		this._bufferTimer = null;
	};

	Container.prototype._decodeChunk = function() {

		if( !this._buffer.hasChunk() ) {
			return;
		}

		var chunk = this._buffer.getChunk();

		this._audioContext.decodeAudioData(chunk.audioData, function( buffer ) {

			var source = this._audioContext.createBufferSource();
			
			source.buffer = buffer;
			source.connect(this._audioContext.destination);

			if( this._nextBufferStart === 0 ) {
				this._nextBufferStart = this._audioContext.currentTime;
			}

			source.start(this._nextBufferStart);
			this._nextBufferStart += buffer.duration;

			// Decode chunk 500ms before it starts
			this._bufferTimer = window.setTimeout(this._decodeChunk.bind(this), (this._nextBufferStart - this._audioContext.currentTime) * 1000 - 500);

		}.bind(this));

	};

	Container.prototype.destroy = function() {};

	Container.prototype.play = function() {

		this._audioContext = new AudioContext();
		this._buffer.start();

		this._bufferTimer = window.setTimeout(this._decodeChunk.bind(this), 2000);
	};

	Container.prototype.pause = function() {};

	Container.prototype.stop = function() {};

	Container.prototype.playAt = function() {};

	Container.prototype.setVolume = function() {};

	Container.prototype.mute = function() {};

	Container.prototype.unmute = function() {};

	Container.canPlayType = function( codec ) {

		// TODO: Improvements to detection

		return !!(window.AudioContext || window.webkitAudioContext);
	};

	pbPlayer.registerMediaContainer('simpledash', Container);

	SimpleDash.Container = Container;

})(SimpleDash);

window.SimpleDash = SimpleDash;