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

		registerPlayerInstance(this);
	},

	/**
	 *
	 */
	destroy: function () {

		// Destroy plugin
		if( this.plugin ) {

			this.plugin.destroy();
			this.plugin = null;
		}

		// Destroy skin
		if( this.skin ) {

			this.skin.destroy();
			this.skin = null;
		}

		// Remove from group
		unregisterPlayerInstance(this);
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

	/**
	 * Event normalisation
	 *
	 * Add type and target to event object
	 */
	emit: function ( type, data ) {

		// Event object
		var eventObject = {

			type: type,
			target: this
		};
		
		PB.overwrite(eventObject, data);

		this.parent(type, eventObject);
	},

	/**
	 * Get correct plugin
	 */
	getPlugin: function () {


	},

	getVolume: function () {


	},

	getDuration: function () {


	},

	getPosition: function () {


	},

	isBuffering: function () {


	},

	isPlaying: function () {


	},

	isPaused: function () {


	},

	isStopped: function () {

	}
});

var proxyPlayerControlls = 'play pause stop playAt setVolume mute unmute'.split(' '),
	i = proxyPlayerControlls.length;

PB.each(proxyPlayerControlls, function ( key, value ) {

	pbPlayer.prototype[value] = function () {

		this.getPlugin();

        this.plugin[value].apply(this, PB.toArray(arguments));
	};
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
