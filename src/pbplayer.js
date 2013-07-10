pbPlayer = PB.Class(PB.Observer, {

	/**
	 *
	 */
	construct: function ( element, options ) {

		if( !(this instanceof pbPlayer) ) {

			return new pbPlayer(element, options)
		}

		//
		this.playlist = this.registerPlaylist();
		this.plugin = null;
		this.skin = null;	// Set when element is true

		this.parent();
	},

	/**
	 * Create new playlist and register events
	 */
	registerPlaylist: function () {

		var playlist = new Playlist();

		playlist.on('mediaadded', this.emit.bind(this, 'mediaadded'));
		playlist.on('mediaremoved', this.emit.bind(this, 'mediaremoved'));
		playlist.on('mediachanged', this.emit.bind(this, 'mediachanged'));

		return playlist;
	},

	addMedia: function ( media ) {

		this.playlist.add(media);
	},

	removeMedia: function ( media ) {

		this.playlist.remove(media);
	},

	emptyMedia: function() {

		this.playlist.empty();
	},

	play: function () {

	}
});

// Statics

// pbPlayer default settings
pbPlayer.defaults = {

	solution: 'html5, flash'
};

pbPlayer.skins = [];
pbPlayer.plugins = [];
pbPlayer.registerPlugin = function () {};
pbPlayer.registerSkin = function () {};

pbPlayer.config = function ( config ) {

	PB.overwrite(pbPlayer.defaults, config);
}; // Set defaults for all pbplayer instances
