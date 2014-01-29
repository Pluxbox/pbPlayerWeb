var SimpleDash = PB.Class({

	/**
	 *
	 */
	construct: function ( pbPlayer, src ) {

		this.pbPlayer = pbPlayer;

		this.player = new SimpleDash.Player(src);
	},

	/**
	 *
	 */
	destroy: function () {

		this.pbPlayer = this.player = null;
	},

	/**
	 *
	 */
	play: function () {

		this.player.play();
	},

	/**
	 *
	 */
	pause: function () {


	},

	/**
	 *
	 */
	stop: function () {


	},

	/**
	 *
	 */
	playAt: function () {


	},

	/**
	 *
	 */
	setVolume: function () {


	},

	/**
	 *
	 */
	mute: function () {


	},

	/**
	 *
	 */
	unmute: function () {


	}   
});

/**
 * SimpleDash available and supports audio file?
 */
SimpleDash.canPlayType = function ( codec ) {

	// Only support simpledash
	if( codec !== 'simpledash' ) {

		return false;
	}

	return !!(window.AudioContext || window.webkitAudioContext);
};

pbPlayer.registerMediaContainer('simpledash', SimpleDash);

