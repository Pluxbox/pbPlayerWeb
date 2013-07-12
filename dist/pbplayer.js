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
 * Build date 2013-07-12 11:07
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

			volume: this.options.volume,
			time: 0,
			duration: 0
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
	getMediaContainer: function () {

		var media,
			solutions = this.options.solution.replace(',', '').split(' '),
			solution,
			mediaContainer,
			i = 0;

		// Already matched a container
		if( this.mediaContainer ) {

			return true;
		}

		media = this.playlist.getCurrent();

		if( !media ) {

			this.emit('error', {

				//code: this.element.error,
				message: 'No media given'
			});

			return false;
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

			if( this.mediaContainer ) {

				break;
			}
		}

		// No media container found
		if( !this.mediaContainer ) {

			this.emit('error', {

				message: 'No suitable media container found',
				media: media
			});
		}

		return !!this.mediaContainer;
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

		// Debug
		if( this.options.debug ) {

			PB.log('Event triggered: ', type, eventObject);
		}

		switch ( type ) {

			case 'volume':
				this._playerData.volume = data.volume;
				break;

			case 'timeupdate':
				this._playerData.time = data.position;
				break;

			case 'duration':
				this._playerData.duration = data.length;
				break;

			case 'play':
				this._playerData.playState = pbPlayer.PLAYSTATE_PLAYING;
				break;

			case 'pause':
				this._playerData.playState = pbPlayer.PLAYSTATE_PAUSED;
				break;

			case 'stop':
				this._playerData.playState = pbPlayer.PLAYSTATE_STOPPED;
				break;
		}

		this.parent(type, eventObject);
	},

	/**
	 * Sets the volume of the player, values between 0 and 100 are valid.
	 *
	 * @param {Number} between 0 and 100
	 */
	setVolume: function( volume ) {

		if( !this.getMediaContainer() ) {

			return this;
		}

		volume = parseInt(volume, 10);
		volume = ( volume < 0 ) ? 0 : ( volume > 100 ) ? 100 : volume;

		this.mediaContainer.setVolume(value);
	},

	getVolume: function () {

		return this._playerData.volume;
	},

	getDuration: function () {

		return this._playerData.duration;
	},

	getTime: function () {

		return this._playerData.time;
	},

	/*isBuffering: function () {

	},*/

	isPlaying: function () {

		return this._playerData.playState === pbPlayer.PLAYSTATE_PLAYING;
	},

	isPaused: function () {

		return this._playerData.playState === pbPlayer.PLAYSTATE_PAUSED;
	},

	isStopped: function () {

		return this._playerData.playState === pbPlayer.PLAYSTATE_STOPPED;
	}
});

var proxyPlayerControlls = 'play pause stop playAt setVolume mute unmute'.split(' '),
	i = proxyPlayerControlls.length;

PB.each(proxyPlayerControlls, function ( key, value ) {

	pbPlayer.prototype[value] = function () {

		if( !this.getMediaContainer() ) {

			return this;
		}

        this.mediaContainer[value].apply(this.mediaContainer, PB.toArray(arguments));
	};
});

// pbPlayer default options
pbPlayer.defaults = {

	debug: true,
	solution: 'html5 flash',	// Flash
	autostart: false,
	volume: 100,
	path: '/pbPlayer/dist/',
	preload: 'auto'
};

//pbPlayer.skins = {};

pbPlayer.PLAYSTATE_PLAYING = 1;
pbPlayer.PLAYSTATE_PAUSED = 2;
pbPlayer.PLAYSTATE_STOPPED = 3;

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
	 * Get number of playlist items
	 *
	 * @return {Number}
	 */
	size: function () {

		return this._entries.length;
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

		// 
		this.setVolume(pbPlayer._playerData.volume);

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
			.on('loadedmetadata', this.metadataLoaded, this)
		//	.on('progress', this.progress, this)
			.on('error pause play volumechange ended timeupdate', this.eventDelegation, this);
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

		// Element could be removed by calling destoy()
		if( !element ) {

			return;
		}

		// Error occured
		if( error && error.code ) {

			return;
		}

		// Emit progress
		if( buffered.length ) {

			this.pbPlayer.emit('progress', {

				loaded: Math.floor((buffered.end(0) / element.duration) * 100)
			});
		}

		// Loading done
		if( element.readyState >= 3 ) {

			this.pbPlayer.emit('progress', {

				loaded: 100
			});

			this.pbPlayer.emit('loaded');

			return;
		}

		window.setTimeout(this._progress, 100);
	},

	/**
	 *
	 */
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

			case 'error':
				args.code = this.element.error.code;
				args.message = this.NETWORK_ERROR[this.element.error.code]
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

		if( this.element.src.indexOf(this._src) < 0 ) {

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

		this.pbPlayer.emit('stop');

		// Reset time/position to beginning
		this.pbPlayer.emit('timeupdate', {

			position: 0,
			progress: 0
		});
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

		try {

			this.element.currentTime = position;
		} catch (e) { setTimeout(this.playAt.bind(this, position), 50) };
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


var flashVersion;

window.__pbPlayer_flash__ = {};

// Flash detection
if( navigator.plugins && navigator.plugins['Shockwave Flash'] ) {
	
	flashVersion = navigator.plugins['Shockwave Flash'].description;
} else if ( window.ActiveXObject ) {
	
	try {
		
		flashVersion = new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
	} catch (e) {}
}

if( flashVersion ) {
	
	flashVersion = flashVersion.match(/\d+/g);
	flashVersion = Number(flashVersion[0]+'.'+flashVersion[1]);
}

/**
 * Flash ondemand media communication layer
 */
var Flash = PB.Class({

	/**
	 *
	 */
	construct: function ( pbPlayer, src ) {

		var flashContainer = pbPlayer.options.path;

		this.pbPlayer = pbPlayer;

		this.id = 'pbplayer-'+PB.id();
		this.maxTries = 25;		// 25 * 50 = 1250ms max time to load flash..
		this.queue = [];
		this.flashReady = false;

		if( pbPlayer.playlist.getCurrent().stream ) {

			flashContainer += 'pbstreamplayer.swf';
		} else {

			flashContainer += 'pbplayer.swf';
		}

		// IE < 8 only
		if( !document.addEventListener ) {

			// Change to innerHTML
			this.element = PB.$('<object id="'+this.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,40,0" width="0" height="0">'
					+'<param name="movie" value="'+flashContainer+'?ac='+Date.now()+'">'
					+'<param name="quality" value="high">'
					+'<param name="bgcolor" value="#FFFFFF">'
					+'<param name="allowScriptAccess" value="always">'
				+'</object>');
		}
		// Modern browsers
		else {

			this.element = PB.$('<embed width="0" height="0" id="'+this.id+'" '
				+'src="'+flashContainer+'?ac='+Date.now()+'"'
				+'allowscriptaccess="always" type="application/x-shockwave-flash"'
				+'pluginspage="http://www.macromedia.com/go/getflashplayer"></embed>');
		}

		// Create global callback for flash
		window.__pbPlayer_flash__[this.id] = this.eventDelegation.bind(this);

		this.element = this.element.appendTo(document.body)[0];

		this._isLoaded = this.isLoaded.bind(this);
		this.isLoaded();

		this.set(src);
		this.setVolume(pbPlayer._playerData.volume);
	},

	/**
	 * Delegate flash events
	 */
	eventDelegation: function ( type, args ) {

		this.pbPlayer.emit(type, args);
	},

	/**
	 * Check if flash is loaded, then execute queue
	 */
	isLoaded: function () {

		if ( this.element._playerId ) {

			this.element._playerId( this.id );

			this.flashReady = true;
			this.queue.forEach(function ( item ){

				if( item.args === null ) {

					this[item.method].call(this);

				} else {

					this[item.method].call(this, PB.toArray(item.args));
				}

			}, this);

			return;
		}

		if( !(--this.maxTries) ) {

			this.pbPlayer.emit('error', {

				message: 'Flash file not found in `'+this.pbPlayer.options.path+'`',
				code: 404
			});

			return;
		}

		setTimeout(this._isLoaded, 50);
	},

	/**
	 *
	 */
	destroy: function () {

		clearTimeout( this.isLoadedTimer );

		// abort open request
        try { 

            if ( this.element._close) {

                this.element._close();
            }

        } catch(e) {}

		PB.$(this.element).remove();

		this.element = null;
		this.pbPlayer = null;

		try {

			delete window.__pbPlayer_flash__[this.id];
		} catch(e) {

			window.__pbPlayer_flash__[this.id] = null;
		}
	},

	addToQueue: function ( method, args ) {

		this.queue.push({

			method: method,
			args: args || null
		});
	},

	// Trigger events

	/**
	 * Set src
	 */
	set: function ( src ) {

		if( !this.flashReady ) {

			this.addToQueue( 'set', arguments );
			return;
		}

		//PB.log(src);

		this.element._src(src);
	},

	/**
	 *
	 */
	play: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'play' );
			return;
		}

		this.element._play();
	},

	/**
	 *
	 */
	pause: function () {

		if( !this.element._pause ) {

			return;
		}

		this.element._pause();
	},

	/**
	 *
	 */
	stop: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'stop' );
			return;
		}

		this.element._stop();
	},

	/**
	 *
	 */
	setVolume: function ( volume ) {

		if( !this.flashReady ) {

			this.addToQueue( 'setVolume', arguments );
			return;
		}

		this.currentVolume = volume;

		this.element._volume( volume );
	},

	/**
	 *
	 */
	mute: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'mute' );
			return;
		}

		this.element._volume( 0 );
	},

	/**
	 *
	 */
	unmute: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'unmute' );
			return;
		}

		this.element._volume( this.currentVolume );
	},

	/**
	 *
	 */
	playAt: function ( position ) {

		if( !this.flashReady ) {

			this.addToQueue( 'playAt', arguments );
			return;
		}

		this.element._playAt( position );
	}
});

/**
 * Flash installed? Version 9 is the required version
 */
Flash.canPlayType = function ( codec, media ) {

	var supportedCodecs = { mp3: true, mp4: true };

	return (flashVersion >= 9 && supportedCodecs[codec]);
};

pbPlayer.registerMediaContainer('flash', Flash);


return pbPlayer;
});