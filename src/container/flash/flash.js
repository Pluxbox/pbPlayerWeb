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

