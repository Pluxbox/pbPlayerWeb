pbPlayer = PB.Class(PB.Observer, {

	/**
	 * Constructs the pbPlayer.
	 * @param {String|DOMElement|PB.$} The DOM node reference for the player to attach to, can be a selector, DOM Node or PB.$.
	 * @param {Object} Options for the pbPlayer, various stuff can be set here.
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
	 * Destroys the pbPlayer instance.
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
	 * Adds media to playlist.
	 */
	addMedia: function ( media ) {

		this.playlist.add(media);
	},

	/**
	 * Removes media from playlist.
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

	/**
	 * Gets the right plugin for a media object.
	 */
	getPluginForMedia: function ( media ) {

		var plugin;

		//this.plugin = null;

		this.options.solution.split(' ').forEach(function( key ) {

			if( this.plugin ) {

				return;
			}

			plugin = pbPlayer.plugins[key];

			PB.each(media, function( key, value ) {

				if( this.plugin ) {

					return;
				}

				if( plugin.canPlayType( key ) ) {

					return this.plugin = new plugin(this, value);
				}

			}, this)

		}, this);

		return this.plugin;
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

		var currentMedia = this.playlist.getCurrent(),
			plugin;

		if( !currentMedia ) {

			this.emit('error', {

				//code: this.element.error,
				message: 'No media given'
			});
			return;
		}

		plugin = this.getPluginForMedia(currentMedia);

		if( !plugin ) {
			console.info('Couldn\'t find plugin for media');
			return;
		}

		//this.plugin = plugin;
		//this.plugin.play();

        plugin[value].apply(plugin, PB.toArray(arguments));
	};
});

// Statics

// pbPlayer default settings
pbPlayer.defaults = {

	solution: 'html5',	// Flash
	autostart: false,
	volume: 100,
	path: '/pbPlayer/dist/',
	preload: 'metadata'
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
