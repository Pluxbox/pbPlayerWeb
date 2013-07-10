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
		this.playlist = new Playlist(this);
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

		var plugin;

		this.defaults.solution.split(' ').forEach(function( key ) {

			plugin = pbPlayer.plugins[key];

			PB.each(media, function( key, value ) {

				if( plugin.canPlayType( key ) ) {

					return this.plugin = new plugin(this, value);
				}

			}, this)

		}, this);
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

var proxyPlayerControlls = 'play2 pause stop playAt setVolume mute unmute'.split(' '),
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

pbPlayer.skins = {};
pbPlayer.plugins = {};

pbPlayer.registerPlugin = function ( key, plugin ) {

	pbPlayer.plugins[key] = plugin;
};

pbPlayer.registerSkin = function () {};

pbPlayer.config = function ( config ) {

	PB.overwrite(pbPlayer.defaults, config);
}; // Set defaults for all pbplayer instances
