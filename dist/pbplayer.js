/*!
 * pbPlayer v4.0.0
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (>= 0.6.0)
 * https://github.com/Saartje87/pbjs-0.6
 *
 * Copyright 2014 Pluxbox
 * Licensed MIT
 *
 * Build date 2014-01-29 14:07
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
}

/**
 *
 */
function unregisterPlayerInstance( pbPlayer ) {

	var i = pbPlayerInstances.length;

	while( i-- ) {

		if( pbPlayerInstances[i] === pbPlayer ) {

			pbPlayerInstances.splice(i, 1);
			return;
		}
	}
}
pbPlayer = PB.Class(PB.Observer, {

	/**
	 * Constructs the pbPlayer.
	 * 
	 * @param {String|DOMElement|PB.$} The DOM node reference for the player to attach to, can be a selector, DOM Node or PB.$.
	 * @param {Object} Options for the pbPlayer, various stuff can be set here.
	 */
	construct: function ( element, options ) {

		if( !(this instanceof pbPlayer) ) {

			return new pbPlayer(element, options);
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
			duration: 0,
			playState: pbPlayer.PLAYSTATE_STOPPED
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

		// Autoplay, does not work on some mobile/handheld devices
		if( this.options.autoplay && this.playlist.size() === 1 && !/(iPod|iPad|iPhone).*AppleWebKit/.test(window.navigator.userAgent) ) {

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
	 * Destoy current media container
	 */
	destroyCurrentMediaContainer: function () {

		if( this.mediaContainer ) {

			this.mediaContainer.destroy();
			this.mediaContainer = null;
		}

		// Todo, reset duration/time/playstate/..
		this._playerData.playstate = pbPlayer.PLAYSTATE_STOPPED;

		this.emit('duration', {

			length: 0
		});

		this.emit('timeupdate', {

			position: 0,
			progress: 0
		});
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

			case 'volumechange':
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
	 * Goto next entry in playlist
	 */
	next: function () {

		this.destroyCurrentMediaContainer();

		if( this.playlist.next() ) {

			this.play();
		}
	},

	/**
	 * Goto previous entry in playlist
	 */
	previous: function () {

		this.destroyCurrentMediaContainer();

		if( this.playlist.previous() ) {

			this.play();
		}
	},

	/**
	 * Return player state
	 */
	getPlayState: function () {

		switch ( this._playerData.playState ) {

			case pbPlayer.PLAYSTATE_PLAYING:
				return 'playing';

			case pbPlayer.PLAYSTATE_PAUSED:
				return 'paused';

			case pbPlayer.PLAYSTATE_STOPPED:
				return 'stopped';
		}
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
	autoplay: false,
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

		if( this.size() === 1 ) {
			this._player.emit('mediachanged', { media: media });
		}
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
			return false;
		}

		this._currentEntryIndex++;
		this._player.emit('mediachanged', { media: entry });

		return true;
	},

	/**
	 * Switches to the previous media object in the playlist, if any.
	 */
	previous: function () {

		var entry = this._entries[this._currentEntryIndex - 1];

		if( entry === undefined ) {
			return false;
		}

		this._currentEntryIndex--;
		this._player.emit('mediachanged', { media: entry });

		return true;
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
			.on('error pause play volumechange ended timeupdate', this.eventDelegation, this);

		// Manually emit volumechange
		this.pbPlayer.emit('volumechange', {

			volume: this.pbPlayer._playerData.volume
		});
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

		if( this.element && this.element.src.indexOf(this._src) < 0 ) {

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
			if( this.element ) {
				setTimeout(this._play, 17);
			}
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
		canPlay,
		version,
		ua = navigator.userAgent;

	if( !window.Audio || !Html5.codecs[codec] ) {

		return false;
	}

	// Not just a fake tag... Android...
	audio = new window.Audio;
	canPlay = audio.canPlayType(Html5.codecs[codec]);

	try {

		// Desktop safari4 should use flash. (It says it can play, but doesn't..)
		if( ua.indexOf('Safari') > -1 && ua.indexOf('Mobile') === -1 && ua.indexOf('SmartTV') ) {

			var version = navigator.userAgent.match(/Version\/([0-9\.]+)/);
			version = version[1] && parseFloat(version[1]);

			if( version <= 5.0 ) {

				return false;
			}
		}

	} catch (e){}

	return canPlay === 'probably' || canPlay === 'maybe';
};

pbPlayer.registerMediaContainer('html5', Html5);


var flashVersion;

// Global variable for flash communication
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

		var flashContainer = pbPlayer.options.path,
			currentMedia = pbPlayer.playlist.getCurrent();

		this.pbPlayer = pbPlayer;

		this.id = 'pbplayer-'+PB.id();
		this.maxTries = 25;		// 25 * 50 = 1250ms max time to load flash..
		this.queue = [];
		this.flashReady = false;

		// Set correct container for streaming media
		if( currentMedia.stream ) {

			// Icecast player
			if( currentMedia.icecast ) {

				flashContainer += 'pbicecastplayer.swf';
			}
			// Use swap mechanism
			else {

				flashContainer += 'pbstreamplayer.swf';
			}
		}
		// Ondemand flash container
		else {

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


(function() {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requirejs = require = requireModule = function(name) {
  requirejs._eak_seen = registry;

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };
})();

define("promise/all", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */

    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;

    /**
      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The return promise
      is fulfilled with an array that gives all the values in the order they were
      passed in the `promises` array argument.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @for RSVP
      @param {Array} promises
      @param {String} label
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
    */
    function all(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to all.');
      }

      return new Promise(function(resolve, reject) {
        var results = [], remaining = promises.length,
        promise;

        if (remaining === 0) {
          resolve([]);
        }

        function resolver(index) {
          return function(value) {
            resolveAll(index, value);
          };
        }

        function resolveAll(index, value) {
          results[index] = value;
          if (--remaining === 0) {
            resolve(results);
          }
        }

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && isFunction(promise.then)) {
            promise.then(resolver(i), reject);
          } else {
            resolveAll(i, promise);
          }
        }
      });
    }

    __exports__.all = all;
  });
define("promise/asap", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var browserGlobal = (typeof window !== 'undefined') ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var local = (typeof global !== 'undefined') ? global : this;

    // node
    function useNextTick() {
      return function() {
        process.nextTick(flush);
      };
    }

    function useMutationObserver() {
      var iterations = 0;
      var observer = new BrowserMutationObserver(flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    function useSetTimeout() {
      return function() {
        local.setTimeout(flush, 1);
      };
    }

    var queue = [];
    function flush() {
      for (var i = 0; i < queue.length; i++) {
        var tuple = queue[i];
        var callback = tuple[0], arg = tuple[1];
        callback(arg);
      }
      queue = [];
    }

    var scheduleFlush;

    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
      scheduleFlush = useMutationObserver();
    } else {
      scheduleFlush = useSetTimeout();
    }

    function asap(callback, arg) {
      var length = queue.push([callback, arg]);
      if (length === 1) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
      }
    }

    __exports__.asap = asap;
  });
define("promise/cast", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.Promise.cast` returns the same promise if that promise shares a constructor
      with the promise being casted.

      Example:

      ```javascript
      var promise = RSVP.resolve(1);
      var casted = RSVP.Promise.cast(promise);

      console.log(promise === casted); // true
      ```

      In the case of a promise whose constructor does not match, it is assimilated.
      The resulting promise will fulfill or reject based on the outcome of the
      promise being casted.

      In the case of a non-promise, a promise which will fulfill with that value is
      returned.

      Example:

      ```javascript
      var value = 1; // could be a number, boolean, string, undefined...
      var casted = RSVP.Promise.cast(value);

      console.log(value === casted); // false
      console.log(casted instanceof RSVP.Promise) // true

      casted.then(function(val) {
        val === value // => true
      });
      ```

      `RSVP.Promise.cast` is similar to `RSVP.resolve`, but `RSVP.Promise.cast` differs in the
      following ways:
      * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
      have something that could either be a promise or a value. RSVP.resolve
      will have the same effect but will create a new promise wrapper if the
      argument is a promise.
      * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
      promises of the exact class specified, so that the resulting object's `then` is
      ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

      @method cast
      @for RSVP
      @param {Object} object to be casted
      @return {Promise} promise that is fulfilled when all properties of `promises`
      have been fulfilled, or rejected if any of them become rejected.
    */


    function cast(object) {
      /*jshint validthis:true */
      if (object && typeof object === 'object' && object.constructor === this) {
        return object;
      }

      var Promise = this;

      return new Promise(function(resolve) {
        resolve(object);
      });
    }

    __exports__.cast = cast;
  });
define("promise/config", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var config = {
      instrument: false
    };

    function configure(name, value) {
      if (arguments.length === 2) {
        config[name] = value;
      } else {
        return config[name];
      }
    }

    __exports__.config = config;
    __exports__.configure = configure;
  });
define("promise/polyfill", 
  ["./promise","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var RSVPPromise = __dependency1__.Promise;
    var isFunction = __dependency2__.isFunction;

    function polyfill() {
      var es6PromiseSupport = 
        "Promise" in window &&
        // Some of these methods are missing from
        // Firefox/Chrome experimental implementations
        "cast" in window.Promise &&
        "resolve" in window.Promise &&
        "reject" in window.Promise &&
        "all" in window.Promise &&
        "race" in window.Promise &&
        // Older version of the spec had a resolver object
        // as the arg rather than a function
        (function() {
          var resolve;
          new window.Promise(function(r) { resolve = r; });
          return isFunction(resolve);
        }());

      if (!es6PromiseSupport) {
        window.Promise = RSVPPromise;
      }
    }

    __exports__.polyfill = polyfill;
  });
define("promise/promise", 
  ["./config","./utils","./cast","./all","./race","./resolve","./reject","./asap","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var configure = __dependency1__.configure;
    var objectOrFunction = __dependency2__.objectOrFunction;
    var isFunction = __dependency2__.isFunction;
    var now = __dependency2__.now;
    var cast = __dependency3__.cast;
    var all = __dependency4__.all;
    var race = __dependency5__.race;
    var staticResolve = __dependency6__.resolve;
    var staticReject = __dependency7__.reject;
    var asap = __dependency8__.asap;

    var counter = 0;

    config.async = asap; // default async is asap;

    function Promise(resolver) {
      if (!isFunction(resolver)) {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
      }

      if (!(this instanceof Promise)) {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
      }

      this._subscribers = [];

      invokeResolver(resolver, this);
    }

    function invokeResolver(resolver, promise) {
      function resolvePromise(value) {
        resolve(promise, value);
      }

      function rejectPromise(reason) {
        reject(promise, reason);
      }

      try {
        resolver(resolvePromise, rejectPromise);
      } catch(e) {
        rejectPromise(e);
      }
    }

    function invokeCallback(settled, promise, callback, detail) {
      var hasCallback = isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        try {
          value = callback(detail);
          succeeded = true;
        } catch(e) {
          failed = true;
          error = e;
        }
      } else {
        value = detail;
        succeeded = true;
      }

      if (handleThenable(promise, value)) {
        return;
      } else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (failed) {
        reject(promise, error);
      } else if (settled === FULFILLED) {
        resolve(promise, value);
      } else if (settled === REJECTED) {
        reject(promise, value);
      }
    }

    var PENDING   = void 0;
    var SEALED    = 0;
    var FULFILLED = 1;
    var REJECTED  = 2;

    function subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      subscribers[length] = child;
      subscribers[length + FULFILLED] = onFulfillment;
      subscribers[length + REJECTED]  = onRejection;
    }

    function publish(promise, settled) {
      var child, callback, subscribers = promise._subscribers, detail = promise._detail;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        invokeCallback(settled, child, callback, detail);
      }

      promise._subscribers = null;
    }

    Promise.prototype = {
      constructor: Promise,

      _state: undefined,
      _detail: undefined,
      _subscribers: undefined,

      then: function(onFulfillment, onRejection) {
        var promise = this;

        var thenPromise = new this.constructor(function() {});

        if (this._state) {
          var callbacks = arguments;
          config.async(function invokePromiseCallback() {
            invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
          });
        } else {
          subscribe(this, thenPromise, onFulfillment, onRejection);
        }

        return thenPromise;
      },

      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };

    Promise.all = all;
    Promise.cast = cast;
    Promise.race = race;
    Promise.resolve = staticResolve;
    Promise.reject = staticReject;

    function handleThenable(promise, value) {
      var then = null,
      resolved;

      try {
        if (promise === value) {
          throw new TypeError("A promises callback cannot return that same promise.");
        }

        if (objectOrFunction(value)) {
          then = value.then;

          if (isFunction(then)) {
            then.call(value, function(val) {
              if (resolved) { return true; }
              resolved = true;

              if (value !== val) {
                resolve(promise, val);
              } else {
                fulfill(promise, val);
              }
            }, function(val) {
              if (resolved) { return true; }
              resolved = true;

              reject(promise, val);
            });

            return true;
          }
        }
      } catch (error) {
        if (resolved) { return true; }
        reject(promise, error);
        return true;
      }

      return false;
    }

    function resolve(promise, value) {
      if (promise === value) {
        fulfill(promise, value);
      } else if (!handleThenable(promise, value)) {
        fulfill(promise, value);
      }
    }

    function fulfill(promise, value) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = value;

      config.async(publishFulfillment, promise);
    }

    function reject(promise, reason) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = reason;

      config.async(publishRejection, promise);
    }

    function publishFulfillment(promise) {
      publish(promise, promise._state = FULFILLED);
    }

    function publishRejection(promise) {
      publish(promise, promise._state = REJECTED);
    }

    __exports__.Promise = Promise;
  });
define("promise/race", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */
    var isArray = __dependency1__.isArray;

    /**
      `RSVP.race` allows you to watch a series of promises and act as soon as the
      first promise given to the `promises` argument fulfills or rejects.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.race` is deterministic in that only the state of the first completed
      promise matters. For example, even if other promises given to the `promises`
      array argument are resolved, but the first completed promise has become
      rejected before the other promises became fulfilled, the returned promise
      will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // Code here never runs because there are rejected promises!
      }, function(reason){
        // reason.message === "promise2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      @method race
      @for RSVP
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise that becomes fulfilled with the value the first
      completed promises is resolved with if the first completed promise was
      fulfilled, or rejected with the reason that the first completed promise
      was rejected with.
    */
    function race(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to race.');
      }
      return new Promise(function(resolve, reject) {
        var results = [], promise;

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && typeof promise.then === 'function') {
            promise.then(resolve, reject);
          } else {
            resolve(promise);
          }
        }
      });
    }

    __exports__.race = race;
  });
define("promise/reject", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.reject` returns a promise that will become rejected with the passed
      `reason`. `RSVP.reject` is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @for RSVP
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become rejected with the given
      `reason`.
    */
    function reject(reason) {
      /*jshint validthis:true */
      var Promise = this;

      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    }

    __exports__.reject = reject;
  });
define("promise/resolve", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.resolve` returns a promise that will become fulfilled with the passed
      `value`. `RSVP.resolve` is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        resolve(1);
      });

      promise.then(function(value){
        // value === 1
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.resolve(1);

      promise.then(function(value){
        // value === 1
      });
      ```

      @method resolve
      @for RSVP
      @param {Any} value value that the returned promise will be resolved with
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    function resolve(value) {
      /*jshint validthis:true */
      var Promise = this;
      return new Promise(function(resolve, reject) {
        resolve(value);
      });
    }

    __exports__.resolve = resolve;
  });
define("promise/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function objectOrFunction(x) {
      return isFunction(x) || (typeof x === "object" && x !== null);
    }

    function isFunction(x) {
      return typeof x === "function";
    }

    function isArray(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    }

    // Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function() { return new Date().getTime(); };


    __exports__.objectOrFunction = objectOrFunction;
    __exports__.isFunction = isFunction;
    __exports__.isArray = isArray;
    __exports__.now = now;
  });
requireModule('promise/polyfill').polyfill();
}());
var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = function( data ) {

		this.id = data.id;
		this.url = data.url;
		this.duration = data.duration;
		this.audioData = null;
	};


	/**
	 * Fills the chunk with data from the server.
	 *
	 * @returns {Promise} A promise that resolves when the chunk is filled.
	 */
	Chunk.prototype.fillAudioData = function() {

		// Resolve if audio data is already retrieved
		if( this.audioData ) {
			return Promise.resolve(this);
		}

		// Return a promise for when the audio data is retrieved
		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();
			request.open('GET', this.url, true);
			request.responseType = 'arraybuffer';

			request.onload = function() {

				this.audioData = request.response;
				resolve(this);

			}.bind(this);

			request.onerror = function( error ) {
				reject('Could not get audio data for chunk.');
			};

			request.send();

		}.bind(this));
	};

	SimpleDash.Chunk = Chunk;

})( SimpleDash );
var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = SimpleDash.Chunk;

	var ManifestReader = function( src ) {

		this._src = src;
		this._manifestLoaded = false;
		this._segments = [];
		this._currentSegment = 0;
	};

	/**
	 * Loads the manifest from the server and parses it.
	 *
	 * @param {String} src The url where the manifest can be found.
	 * @returns {Promise} A promise for when loading succeeds or fails.
	 */
	ManifestReader.prototype._loadManifest = function( src ) {

		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();
			request.open('GET', src, true);

			request.onload = function() {

				try {

					var manifest = JSON.parse(request.response);

					// TODO: Add support for selecting a container
					this._appendSegments(manifest.containers[0].segments);
					this._manifestLoaded = true;

					resolve();

				} catch( err ) {

					reject('Could not parse manifest.')
				}


			}.bind(this);

			request.onerror = function() {

				reject('Could not load manifest from server.');
			};

			request.send();

		}.bind(this));
	};

	/**
	 * Appends a bunch of segments removing duplicates in the proccess.
	 *
	 * @param {Array} segments The segments to append.
	 */
	ManifestReader.prototype._appendSegments = function( segments ) {

		// Get current segment ids
		var currentSegments = this._getSegmentIds(this._segments);

		// Filter out all unwanted segments
		segments = segments.filter(function( segment ) {

			if( segment.type === 'chunk' ) {
				return currentSegments.indexOf(segment.id) === -1;
			}

			if( segment.type === 'manifest' ) {
				return true;
			}

			return false;
		});

		// Create instances for segments
		segments = segments.map(function( segment ) {

			switch( segment.type ) {
				case 'chunk':
					return new Chunk(segment);
					break;
				case 'manifest':
					return new ManifestReader(segment.url);
					break;
			}

			return segment;
		});

		this._segments = this._segments.concat(segments);
	};

	/**
	 * Creates an array of ids from the specified segments.
	 * 
	 * @param {Array} segments The segments to extract the ids from.
	 * @returns {Array} A collection of ids.
	 */
	ManifestReader.prototype._getSegmentIds = function( segments ) {

		var results;

		// Fill results with ids of segments
		results = segments.map(function( segment ) {
			return segment.id;
		});

		// Filter out any undefined segments
		results = results.filter(function( id ) {
			return id !== undefined;
		});

		return results;
	};

	/**
	 * Checks if there is a segment available.
	 *
	 * @returns {Boolean} True if a segment is available, false otherwise.
	 */
	ManifestReader.prototype.hasChunk = function() {

		var segment = this._segments[this._currentSegment];

		if( !this._manifestLoaded ||
			segment instanceof Chunk ||
			( segment instanceof ManifestReader && segment.hasChunk() ) ) {

			return true;
		}

		return false;
	};

	/**
	 * Get the next chunk in the manifest in sequence.
	 *
	 * @returns {Promise} A promise that resolves with the Chunk.
	 */
	ManifestReader.prototype.getChunk = function() {

		// Load manifest if not yet loaded
		if( !this._manifestLoaded ) {

			return this._loadManifest(this._src)
				.then(this.getChunk.bind(this));
		}

		// Get current segment
		var segment = this._segments[this._currentSegment];

		// Resolve if segment is of type chunk
		if( segment instanceof Chunk ) {

			this._currentSegment++;
			return Promise.resolve(segment);
		}

		// Get chunk from nested manifestreader or load next chunk if it's out of chunks
		if( segment instanceof ManifestReader ) {

			if( segment.hasChunk() ) {
				return segment.getChunk();
			} else {
				this._currentSegment++;
				return this.getChunk()
			}
		}

		// There are no more comparisons, segment is unknown
		return Promise.reject('Got an unknown segment on index ' + (this._currentSegment + 1));
	};

	SimpleDash.ManifestReader = ManifestReader;

})(SimpleDash);
var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ChunkBuffer = function( manifestReader ) {

		this._manifestReader = manifestReader;
		this._bufferedChunks = [];
		this._preventBuffering = false;
		this._minChunks = 4;
		this._maxChunks = 6;
	};

	/**
	 * Buffers a new chunk from the manifest reader.
	 */
	ChunkBuffer.prototype._bufferChunk = function() {

		// Prevent buffering when buffer is full or manifest ran out of chunks
		if( this._preventBuffering ||
			this._bufferedChunks.length >= this._maxChunks ||
			!this._manifestReader.hasChunk() ) {

			return;
		}

		// Get chunk from manifest & fill it with data
		this._manifestReader.getChunk().then(function( chunk ) {

			return chunk.fillAudioData();

		}).then(function( chunk ) {

			// Add chunk to buffer & buffer a new chunk
			this._bufferedChunks.push(chunk);
			this._bufferChunk();

		}.bind(this));
	};

	/**
	 * Starts the buffering proccess.
	 */
	ChunkBuffer.prototype.start = function() {

		this._preventBuffering = false;
		this._bufferChunk();
	};

	/**
	 * Stops the buffering proccess.
	 */
	ChunkBuffer.prototype.stop = function() {

		this._preventBuffering = true;
	};

	/**
	 * Empties the buffer.
	 */
	ChunkBuffer.prototype.empty = function() {

		this._bufferedChunks = [];
	};

	/**
	 * Takes a filled chunk from the buffer.
	 *
	 * @returns {Chunk} The filled chunk.
	 */
	ChunkBuffer.prototype.getChunk = function() {

		var chunk = this._bufferedChunks.shift();

		if( chunk === undefined ) {
			throw 'The buffer ran out of chunks but one was requested anyway.';
		}

		this._bufferChunk();

		return chunk;
	};

	SimpleDash.ChunkBuffer = ChunkBuffer;

})(SimpleDash);
var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var ManifestReader = SimpleDash.ManifestReader,
		ChunkBuffer = SimpleDash.ChunkBuffer,
		AudioContext = window.AudioContext || window.webkitAudioContext;

	var Player = function( src ) {

		this._src = src;                                           // Location of manifest file
		this._manifestReader = new ManifestReader(this._src);      // Reader for the manifest file
		this._chunkBuffer = new ChunkBuffer(this._manifestReader); // Buffer for loading chunks of data from the manifest
		this._audioContext = new AudioContext();                   // Contols audio processing and decoding
		this._startAt = 0;                                         // The offset to use to start the next chunk of audio
		this._scheduleChunkTimer = null;                           // The timer to schedule the next chunk of audio for playback
		this._scheduledSources = [];                               // Sources that have been scheduled for playback
		this._cachedSources = [];                                  // Sources that have been cached because of changes in the playback state
	};

	Player.prototype.play = function() {

		this._chunkBuffer.start(); // Start buffering chunks

		// Let's play pretend! (buffer is loaded, probably, maybe)
		window.setTimeout(this._scheduleChunk.bind(this), 2000);
	};

	Player.prototype.pause = function() {

		// Stop adding new chunks
		window.clearTimeout(this._scheduleChunkTimer);

		// Stop playback & copy sources
		while( this._scheduledSources.length > 0 ) {

			var oldSource = this._scheduledSources.shift();
			var newSource = this._audioContext.createBufferSource();

			newSource.buffer = oldSource.buffer;
			newSource.connect(this._audioContext.destination);

			this._cachedSources.push(newSource);
			oldSource.stop();
		}

	};

	Player.prototype.stop = function() {

		// Stop scheduling chunks
		window.clearTimeout(this._scheduleChunkTimer);

		// Stop buffer
		this._chunkBuffer.stop();

		// Stop scheduled sources
		while( this._scheduledSources.length > 0 ) {

			var source = this._scheduledSources.shift();
			source.stop();
		}

		// Reset variables
		this._manifestReader = new ManifestReader(this._src);
		this._chunkBuffer = new ChunkBuffer(this._manifestReader);
		this._audioContext = new AudioContext();
		this._startAt = 0;
		this._scheduleChunkTimer = null;
		this._scheduledSources = [];
		this._cachedSources = [];
	};

	Player.prototype.resume = function() {

		this._startAt = this._audioContext.currentTime;

		while( this._cachedSources.length > 0 ) {

			var source = this._cachedSources.shift();

			this._scheduleSource(source);
		}
	};

	Player.prototype._scheduleChunk = function() {

		var chunk;

		// TODO: Replace this error handling with events from buffer.
		try {
			chunk = this._chunkBuffer.getChunk();
		} catch( err ) {
			return;
		}

		this._audioContext.decodeAudioData(chunk.audioData, function( buffer ) {

			var source = this._audioContext.createBufferSource();

			source.buffer = buffer;
			source.connect(this._audioContext.destination);

			this._scheduleSource(source);

			// Schedule decoding of next chunk
			this._scheduleChunkTimer = window.setTimeout(this._scheduleChunk.bind(this), (this._startAt - this._audioContext.currentTime) * 1000 - 500 );

		}.bind(this));
	};

	Player.prototype._scheduleSource = function( source ) {

		if( source.start ) {
			source.start(this._startAt);
		} else {
			source.noteOn(this._startAt); // Older webkit implementation
		}

		// Set start point for next source
		this._startAt += source.buffer.duration;

		// Remove old sources
		if( this._scheduledSources.length > 1 ) {
			this._scheduledSources.shift();
		}

		// Add new source
		this._scheduledSources.push(source);
	};

	SimpleDash.Player = Player;

})(SimpleDash);

// For debugging purposes
window.SimpleDash = SimpleDash;
return pbPlayer;
});