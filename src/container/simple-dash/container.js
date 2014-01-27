var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Container = function( player, src ) {};

	Container.prototype._concatAudioBuffer = function( buffer ) {};

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