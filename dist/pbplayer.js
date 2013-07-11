/*!
 * pbPlayer v4.0.0
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (>= 0.6.0)
 * https://github.com/Saartje87/pbjs-0.6
 *
 * Copyright 2013 Pluxbox
 * Licensed MIT
 *
 * Build date 2013-07-11 13:28
 */
(function ( name, context, definition ) {
	
	this[name] = definition( context );

})('pbPlayer', this, function ( context ) {

'use strict';

	// Export
var pbPlayer,
	
	// Keep track of all created pbPlayers
	pbPlayerInstances = [],

	// Reference to PB
	PB = context.PB,

	// 
	OLD_PBPlayer = context.pbPlayer;

// pbjs required..
if( !PB ) {

	throw new Error('Missing dependency pbjs');
}

/**
 *
 */
function registerPlayerInstance( pbPlayer ) {

	pbPlayerInstances.push(pbPlayer);
};

/**
 *
 */
function unregisterPlayerInstance( pbPlayer ) {

	pbPlayerInstances.unpush(pbPlayer);
};

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

		// Already matched a container
		if( this.mediaContainer ) {

			return;
		}

		this.options.solution.split(' ').forEach(function( key ) {

			if( this.mediaContainer ) {

				return;
			}

			var mediaContainer = pbPlayer.mediaContainers[key];

			PB.each(media, function( key, value ) {

				if( this.mediaContainer ) {

					return;
				}

				if( mediaContainer.canPlayType( key ) ) {

					return this.mediaContainer = new mediaContainer(this, value);
				}

			}, this)

		}, this);

		// No error found
		if( !this.mediaContainer ) {

			this.emit('error', {

				//code: this.element.error,
				message: 'No suitable media container found'
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

// pbPlayer default options
pbPlayer.defaults = {

	solution: 'html5 flash',	// Flash
	autostart: false,
	volume: 100,
	path: '/pbPlayer/dist/',
	preload: 'auto'
};

//pbPlayer.skins = {};

// 
pbPlayer.mediaContainers = {};

/**
 * Register plugin to pbPlayer
 *
 * @param {String} Container name
 * @param {Object} MediaContainer
 */
pbPlayer.registerMediaContainer = function ( name, container ) {

	pbPlayer.mediaContainers[name] = container;
};

/**
 * Set default options for all pbplayer instances
 *
 * @param {Object}
 */
pbPlayer.config = function ( config ) {

	PB.overwrite(pbPlayer.defaults, config);
};

// pbPlayer.registerSkin = function () {};
var Playlist = PB.Class({

	/**
	 * Constructs the Playlist class
	 * @param {pbPlayer} reference of the pbPlayer to trigger events
	 */
	construct: function ( player ) {

		this._player = player;
		this._entries = [];
		this._currentEntryIndex = 0;
	},

	/**
	 * Adds a media object to the playlist.
	 * @param {Object / Array} The media object to add to the playlist.
	 */
	add: function ( media ) {

		var i = 0;

		if( media instanceof Array ) {

			for( ; i < media.length; i++ ) {
				this.add(media[i]);
			}

			return;
		}

		if( !media instanceof Object || this.has(media) ) {
			return;
		}

		this._entries.push(media);
		this._player.emit('mediaadded', { media: media });
	},

	/**
	 * Checks if a media object already exists in the playlist.
	 * @param {Object} The media object check.
	 */
	has: function ( media ) {

		return this._entries.indexOf(media) !== -1;
	},

	/**
	 * Removes a media object to the playlist.
	 * @param {Object / Array} The media object to remove from the playlist.
	 */
	remove: function ( media ) {

		var i = 0;

		if( media instanceof Array ) {

			for( ; i < media.length; i++ ) {
				this.remove(media[i]);
			}

			return;
		}

		var index = this._entries.indexOf(media);

		if( index !== -1 ) {
			this._player.emit('mediaremoved', { media: this._entries.splice(index, 1)[0] });
		}
	},

	/**
	 * Removes all media objects from the playlist.
	 */
	empty: function () {
		
		while( this._entries.length ) {

			this.remove(this._entries[0]);
		}
	},

	/**
	 * Gets the current media object.
	 * @returns {Object} the current media or null if not found.
	 */
	getCurrent: function() {

		var entry = this._entries[this._currentEntryIndex];

		return entry ? entry : null;
	},

	/**
	 * Switches to the next media object in the playlist, if any.
	 */
	next: function () {

		var entry = this._entries[this._currentEntryIndex + 1];

		if( entry === undefined ) {
			return;
		}

		this._currentEntryIndex++;
		this._player.emit('mediachanged', { media: entry });
	},

	/**
	 * Switches to the previous media object in the playlist, if any.
	 */
	previous: function () {

		var entry = this._entries[this._currentEntryIndex - 1];

		if( entry === undefined ) {
			return;
		}

		this._currentEntryIndex--;
		this._player.emit('mediachanged', { media: entry });
	}

});
var Html5 = PB.Class({

	NETWORK_ERROR: 'NETWORK_EMPTY NETWORK_IDLE NETWORK_LOADED NETWORK_LOADING NETWORK_NO_SOURCE'.split(' '),

	/**
	 *
	 */
	construct: function ( pbPlayer, src ) {

		var preload = pbPlayer.options.preload === 'metadata' ? 'metadata' : 'auto';

		// Needed when stopping playback / download
		this._src = src;

        // Wrapper for Safari
        this._play = this.play.bind(this);

		this.pbPlayer = pbPlayer;

		this.loading = false;
		this.element = PB.$('<audio preload="'+pbPlayer.options.preload+'" />');

		this.addEvents();

		// Set node instead of PB wrapper
		this.element = this.element.appendTo(document.body)[0];

		// Set src
		this.element.src = src;

		// Trigger progress when progress event fails
		this.progress();
	},

	/**
	 *
	 */
	destroy: function () {

		this.element.pause();
		this.element.src = '';

		// Remove element from dom and detach event
		PB.$(this.element).remove();

		this.element = null;
		this.pbPlayer = null;
	},

	/**
	 *
	 */
	addEvents: function () {

		this._progress = this.progress.bind(this);

		this.element
			.on('loadedmetadata', this.metadataLoaded.bind(this))
		//	.on('progress', this.progress.bind(this))
			.on('error pause play volumechange ended timeupdate', this.eventDelegation.bind(this));
	},

	/**
	 *
	 */
	metadataLoaded: function ( e ) {

		this.pbPlayer.emit('duration', {

			length: this.element.duration
		});
	},

	/**
	 *
	 */
	progress: function ( e ) {

		var element = this.element,
			error = element ? element.error : null,
			buffered = element ? element.buffered : null;

		if( !element ) {

			return;
		}

		if( error !== null ) {

			this.pbPlayer.emit('error', {

				code: this.element.error,
				message: this.NETWORK_ERROR[this.element.error]
			});

			return;
		}

		if( buffered.length ) {

			this.pbPlayer.emit('progress', {

				loaded: Math.floor((buffered.end(0) / element.duration) * 100)
			});
		}


		if( element.readyState >= 3 ) {

			this.pbPlayer.emit('progress', {

				loaded: 100
			});

			this.pbPlayer.emit('loaded');

			return;
		}

		window.setTimeout(this._progress, 100);

		element = null;
	},

	eventDelegation: function ( e ) {

		var args = {};

		switch( e.type ) {

			case 'timeupdate':
				args.position = this.element.currentTime;
				args.progress = (this.element.currentTime*(100 / this.element.duration)) || 0;
				break;

			case 'volumechange':
				args.volume = this.element.muted
					? 0
					: parseInt(this.element.volume * 100, 10);
				break;
		}

		this.pbPlayer.emit(e.type, args);
	},

	// Trigger events

	/**
	 * Set src
	 */
	set: function ( src ) {

		this.stop();

		this.element.src = src;

		// Trigger progress when progress event fails
		this.progress();

		return this;
	},

	/**
	 *
	 */
	play: function () {

		if( this.element.src !== this._src ) {

			this.element.src = this._src;
		}

        try {

        	this.element.currentTime = this.element.currentTime;

            this.element.play();

        } catch ( e ) {

        	if( !this.loading ) {

        		this.element.load();
        		this.loading = true;
        	}

        	// Safari doesn't load duration
            setTimeout(this._play, 17);
        }
	},

	/**
	 *
	 */
	pause: function () {

		this.element.pause();
	},

	/**
	 *
	 */
	stop: function () {

		this.element.pause();

		try {

			this.element.currentTime = 0;
		} catch (e){};

		this.element.src = '';
		this.loading = false;

		// Need this.element.load() ?

		this.pbPlayer.emit('stop');
	},

	/**
	 *
	 */
	setVolume: function ( volume ) {

		this.element.volume = volume / 100;
	},

	/**
	 *
	 */
	mute: function () {

		 this.element.muted = true;
	},

	/**
	 *
	 */
	unmute: function () {

		this.element.muted = false;
	},

	/**
	 *
	 */
	playAt: function ( position ) {

		this.element.currentTime = position;
	}
});

Html5.codecs = {

	mp3: 'audio/mpeg; codecs="mp3"',
	ogg: 'audio/ogg; codecs="vorbis, opus"',
	opus: 'audio/ogg; codecs="opus"',
	wav: 'audio/wav; codecs="1"',
	aac: 'audio/aac; codecs="aac"'
};

/**
 * Html5 availeble and supports audio file?
 */
Html5.canPlayType = function ( codec ) {

	var audio,
		canPlay;

	if( !window.Audio || !Html5.codecs[codec] ) {

		return false;
	}

	// Not just a fake tag... Android...
	audio = new window.Audio;
	canPlay = audio.canPlayType(Html5.codecs[codec]);

	// Safari 4 issues
	try {

		if(navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Mobile') === -1 ) {

			if( PB.browser.version <= 5.0 ) {

				return false;
			}
		}

	} catch (e){}

	return canPlay === 'probably' || canPlay === 'maybe';
};

pbPlayer.registerMediaContainer('html5', Html5);


return pbPlayer;
});