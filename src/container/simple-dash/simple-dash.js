var SimpleDash = SimpleDash || {};

(function( SimpleDash, PB, pbPlayer, window ) {

	var	Eventable = SimpleDash.Eventable,
		ManifestReader = SimpleDash.ManifestReader,
		Buffer = SimpleDash.Buffer,
		Player = SimpleDash.Player;

	var Container = function( pbPlayer, src ) {

		this._pbPlayer = pbPlayer;
		this._reader = new ManifestReader(src);
		this._buffer = new Buffer(this._reader);
		this._player = new Player(this._buffer);

		this._reader.on('duration', this._onReportDuration, this);
		this._reader.on('module', this._onModule, this);
		this._player.on('progress', this._onReportTimeUpdate, this);
		this._player.on('ended', this._onEnded, this);
	};

	Container.prototype.destroy = function() {

		this.stop();
	};

	Container.prototype.play = function() {

		this._buffer.start();
		this._player.start();

		this._pbPlayer.emit('play');
	};

	Container.prototype.pause = function() {

		this._player.pause();

		this._pbPlayer.emit('pause');
	};

	Container.prototype.stop = function() {

		this._buffer.pause();
		this._player.pause();

		this._buffer.empty();
		this._player.empty();

		this._pbPlayer.emit('stop');
	};

	Container.prototype.setVolume = function( volume ) {

		this._player.setVolume(volume / 100);

		// Trigger volume changed event
		this._pbPlayer.emit('volumechange', {
			volume: volume
		});
	};

	Container.prototype.playAt = function() {};

	Container.prototype.mute = function() {};

	Container.prototype.unmute = function() {};

	Container.prototype._onReportDuration = function( evt ) {

		this._duration = evt.length;

		this._pbPlayer.emit('duration', { length: evt.length });
	};

	Container.prototype._onReportTimeUpdate = function( evt ) {

		var args = {};

		args.position = evt.position;

		if( this._duration !== Infinity ) {
			args.progress = (evt.position / this._duration) * 100;
		}

		this._pbPlayer.emit('timeupdate', args);
	};

	Container.prototype._onEnded = function() {

		this._reader.reset();
		this._buffer.reset();
		this._player.reset();

		this._pbPlayer.emit('ended');
	};

	Container.prototype._onModule = function( evt ) {

		var module = evt.module;

		this._pbPlayer.emit('module:' + module.type, module.data);
	};

	Container.canPlayType = function ( codec ) {

		// Only support simpledash
		if( codec !== 'simpledash' ) {

			return false;
		}

		return !!(window.AudioContext || window.webkitAudioContext);
	};

	pbPlayer.registerMediaContainer('simpledash', Container);

	SimpleDash.Container = Container;

})(SimpleDash, PB, pbPlayer, window);

// For debugging purposes
window.SimpleDash = SimpleDash;