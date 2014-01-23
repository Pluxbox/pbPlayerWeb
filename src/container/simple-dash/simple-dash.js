var SimpleDash = PB.Class({

	construct: function( player, src ) {},

	destroy: function() {},

	play: function() {},

	pause: function() {},

	stop: function() {},

	playAt: function() {},

	setVolume: function() {},

	mute: function() {},

	unmute: function() {}

});

window.SimpleDash = SimpleDash;

SimpleDash.canPlayType = function( codec ) {

	return !!(window.AudioContext || window.webkitAudioContext);
};

pbPlayer.registerMediaContainer('simpledash', SimpleDash);