pbPlayer = PB.Class(PB.Observer, {

	/**
	 * Constructs the pbPlayer.
	 * 
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

		this.playlist = new Playlist(this);
		this.mediaContainer = null;
		this.skin = null;	// Set when element is true

		registerPlayerInstance(this);

		this._playerData = {

			volume: this.options.volume
		};
	},

	/**
	 * Destroys the pbPlayer instance.
	 */
	destroy: function () {

		// Destroy media container
		if( this.mediaContainer ) {

			this.mediaContainer.destroy();
			this.mediaContainer = null;
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

		// Autostart, does not work on some mobile/handheld devices
		if( this.options.autostart && this.playlist.size() === 1 ) {

			this.play();
		}
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
	 * Gets the right media container for a media object.
	 */
	getMediaContainer: function ( media ) {

		var solutions = this.options.solution.replace(',', '').split(' '),
			solution,
			mediaContainer,
			i = 0;

		// Already matched a container
		if( this.mediaContainer ) {

			return;
		}

		for( ; i < solutions.length; i++ ) {

			solution = solutions[i];
			mediaContainer = pbPlayer.mediaContainers[solution];

			if( !mediaContainer ) {

				this.emit('error', {

					message: 'Media container `'+solution+'` not found'
				});
				continue;
			}

			// Find suitable media container
			PB.each(media, function ( codec, url ) {

				if( mediaContainer.canPlayType(codec) ) {

					this.mediaContainer = new mediaContainer(this, url, media);

					// Stop loop
					return true;
				}
			}, this);
		}

		// No media container found
		if( !this.mediaContainer ) {

			this.emit('error', {

				message: 'No suitable media container found',
				media: media
			});
		}
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
	 * Sets the volume of the player, values between 0 and 100 are valid.
	 */
	/*setVolume: function( value ) {

		// Validate range
		if( value < 0 || value > 100 ) {
			return;
		}

		this.mediaContainer.setVolume(value);
	},*/

	getVolume: function () {
		return this._playerData.volume;
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

		var currentMedia = this.playlist.getCurrent();

		if( !currentMedia ) {

			return this.emit('error', {

				//code: this.element.error,
				message: 'No media given'
			});
		}

		this.getMediaContainer(currentMedia);

		if( !this.mediaContainer ) {

			return this;
		}

        this.mediaContainer[value].apply(this.mediaContainer, PB.toArray(arguments));
	};
});
