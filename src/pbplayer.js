pbPlayer = PB.Class(PB.Observer, {

	construct: function ( element, options ) {

		if( !(this instanceof pbPlayer) ) {

			return new pbPlayer(element, options)
		}

		this.parent();
	},

	setMedia: function () {


	},

	play: function () {

		
	}
});

pbPlayer.config = function () {}; // Set defaults for all pbplayer instances
