var SimpleDash = SimpleDash || {};

(function( SimpleDash, PB, pbPlayer, window ) {

	var	Eventable = SimpleDash.Eventable,
		ManifestReader = SimpleDash.ManifestReader,
		ChunkBuffer = SimpleDash.ChunkBuffer,
		ChunkScheduler = SimpleDash.ChunkScheduler;

	var Player = function( pbPlayer, src ) {

		this._pbPlayer = pbPlayer;
		this._reader = new ManifestReader(src);
		this._buffer = new ChunkBuffer(this._reader);
		this._scheduler = new ChunkScheduler(this._buffer);

		this._reader.on('duration', this._onReportDuration, this);
		this._scheduler.on('progress', this._onReportTimeUpdate, this);
	};

	Player.prototype.destroy = function() {

		this.stop();
	};

	Player.prototype.play = function() {

		this._scheduler.start();
		this._pbPlayer.emit('play');
	};

	Player.prototype.pause = function() {

		this._pbPlayer.emit('pause');
	};

	Player.prototype.stop = function() {

		this._reader.reset();
		this._buffer.reset();
		this._scheduler.reset();

		this._pbPlayer.emit('stop');
	};

	Player.prototype.setVolume = function( volume ) {

		this._scheduler.setVolume(volume / 100);

		// Trigger volume changed event
		this.emit('volumechange', {
			volume: volume * 100
		});
	};

	Player.prototype.playAt = function() {};

	Player.prototype.mute = function() {};

	Player.prototype.unmute = function() {};

	Player.prototype._onReportDuration = function( evt ) {

		this._duration = evt.length;

		this._pbPlayer.emit('duration', { length: evt.length });
	};

	Player.prototype._onReportTimeUpdate = function( evt ) {

		var args = {};

		args.position = evt.position;

		if( this._duration !== Infinity ) {
			args.progress = (evt.position / this._duration) * 100;
		}

		this._pbPlayer.emit('timeupdate', args);
	};

	Player.canPlayType = function ( codec ) {

		// Only support simpledash
		if( codec !== 'simpledash' ) {

			return false;
		}

		return !!(window.AudioContext || window.webkitAudioContext);
	};

	pbPlayer.registerMediaContainer('simpledash', Player);

	SimpleDash.Player = Player;

})(SimpleDash, PB, pbPlayer, window);

// For debugging purposes
window.SimpleDash = SimpleDash;