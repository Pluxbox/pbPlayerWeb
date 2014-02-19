var SimpleDash = SimpleDash || {};

(function( SimpleDash, pbPlayer, window ) {

	var Player = SimpleDash.Player;

	var Container = function( pbPlayer, src ) {

		this._pbPlayer = pbPlayer;
		this._player = new Player(src);

		this._player.on('duration', this._onDuration, this);
		this._player.on('progress', this._onProgress, this);
		this._player.on('module', this._onModule, this);
		this._player.on('ended', this._onEnded, this);
	};

	Container.prototype.destroy = function() {};

	Container.prototype.play = function() {

		this._player.start();

		// TODO: Trigger play event when player actually starts playing
		this._pbPlayer.emit('play');
	};

	Container.prototype.pause = function() {

		this._player.pause();

		this._pbPlayer.emit('pause');
	};

	Container.prototype.stop = function() {

		this._player.stop();

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

	Container.prototype._onDuration = function( evt ) {

		this._pbPlayer.emit('duration', { length: evt.length });
	};

	Container.prototype._onProgress = function( evt ) {

		var args = {};

		args.position = evt.position;

		if( this._duration !== Infinity ) {
			args.progress = (evt.position / this._duration) * 100;
		}

		this._pbPlayer.emit('timeupdate', args);
	};

	Container.prototype._onEnded = function() {

		this._pbPlayer.emit('ended');
	};

	Container.prototype._onModule = function( evt ) {

		var module = evt.module;

		this._pbPlayer.emit('module:' + module.type, module.data);
	};

	Container.canPlayType = function ( codec ) {

		// TODO: Improve codec detection

		// Only support simpledash
		if( codec !== 'simpledash' ) {

			return false;
		}

		return !!(window.AudioContext || window.webkitAudioContext);
	};

	pbPlayer.registerMediaContainer('simpledash', Container);

	SimpleDash.Container = Container;

})(SimpleDash, pbPlayer, window);

// For debugging purposes
window.SimpleDash = SimpleDash;