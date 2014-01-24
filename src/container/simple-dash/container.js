var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ManifestReader = SimpleDash.ManifestReader;
	var Buffer = SimpleDash.Buffer;
	var AudioContext = window.AudioContext || window.webkitAudioContext;

	var Container = function( player, src ) {

		this._src = src;
		this._manifest = new ManifestReader(this._src);
		this._buffer = new Buffer(this._manifest);
		this._audioContext = new AudioContext();
		this._nextBufferStart = 0;

		this._buffer.start();

		window.setInterval(function() {

			if( !this._buffer.hasChunk() ) {
				return;
			}

			var chunk = this._buffer.getChunk();

			console.log('Player got new chunk from buffer', chunk);

			this._audioContext.decodeAudioData(chunk.audioData, function( buffer ) {

				var source = this._audioContext.createBufferSource();

				source.buffer = buffer;
				source.connect(this._audioContext.destination);

				if( this._nextBufferStart === 0 ) {
					this._nextBufferStart = this._audioContext.currentTime;
				}

				source.start(this._nextBufferStart);

				this._nextBufferStart += buffer.duration;

			}.bind(this));

		}.bind(this), 4000);
	};

	Container.prototype.destroy = function() {};

	Container.prototype.play = function() {};

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