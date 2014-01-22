var SimpleDash = PB.Class({

	construct: function( player, src ) {

		var AudioContext = window.AudioContext || window.webkitAudioContext;

		this._segmentProvider = new SegmentProvider(src); // Provides new segments to decode
		this._audioContext = new AudioContext();
	},

	destroy: function() {

	},

	play: function() {},

	pause: function() {},

	stop: function() {},

	playAt: function() {},

	setVolume: function() {},

	mute: function() {},

	unmute: function() {}

});

SimpleDash.canPlayType = function( codec ) {

	return !!(window.AudioContext || window.webkitAudioContext);
};

pbPlayer.registerMediaContainer('simpledash', SimpleDash);