pbPlayer = PB.Class(PB.Observer, {

	/**
	 *
	 */
	construct: function ( element, options ) {

		if( !(this instanceof pbPlayer) ) {

			return new pbPlayer(element, options)
		}

		// Initialize Observer
		this.parent();

		if( !options ) {

			options = element;
			element = null;
		}

		this.options = PB.overwrite({}, pbPlayer.defaults);
		PB.overwrite(this.options, options);

		//
		this.playlist = this.registerPlaylist();
		this.plugin = null;
		this.skin = null;	// Set when element is true

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

	/**
	 * Add media to playlist
	 */
	addMedia: function ( media ) {

		this.playlist.add(media);
	},

	/**
	 * Remove media from playlist.
	 */
	removeMedia: function ( media ) {

		this.playlist.remove(media);
	},

	/**
	 * Removes all media from the playlist.
	 */
	emptyMedia: function() {

		this.playlist.empty();
	},

	play: function () {

		var currentMedia = this.playlist.getCurrent(),
			plugin;

		if( !currentMedia ) {
			return;
		}

		plugin = this.getPluginForMedia(currentMedia);

		if( !plugin ) {
			console.info('Couldn\'t find plugin for media');
			return;
		}

		if( this.plugin ) {
			this.plugin.destroy();
		}

		this.plugin = plugin;
		this.plugin.play();
	},

	getPluginForMedia: function ( media ) {

		return null;
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

		PB.log('Event triggered: ', type, eventObject);

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

	solution: 'html5',	// Flash
	autostart: false,
	volume: 100,
	path: '/pbPlayer/dist/',
	preload: 'auto'
};

pbPlayer.skins = [];
pbPlayer.plugins = [];
pbPlayer.registerPlugin = function () {};
pbPlayer.registerSkin = function () {};

pbPlayer.config = function ( config ) {

	PB.overwrite(pbPlayer.defaults, config);
}; // Set defaults for all pbplayer instances
