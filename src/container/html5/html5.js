var Html5 = PB.Class({

	NETWORK_ERROR: 'NETWORK_EMPTY NETWORK_IDLE NETWORK_LOADED NETWORK_LOADING NETWORK_NO_SOURCE'.split(' '),

	/**
	 *
	 */
	construct: function ( pbPlayer ) {

        // Wrapper for Safari
        this._play = this.play.bind(this);

		this.pbPlayer = pbPlayer;

		this.loading = false;
		this.element = PB.$('<audio controls preload="'+pbPlayer.options.preload+'" />');

		this.addEvents();

		// Set node instead of PB wrapper
		this.element = this.element.appendTo(document.body)[0];
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

	metadataLoaded: function ( e ) {

		this.pbPlayer.emit('duration', {

			length: this.element.duration
		});
	},

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

		/*if ( navigator.userAgent.match(/(iPhone)|(iPad)/) ){

			this.element.play();
		}*/

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

		var src = this.element.src;

		this.element.pause();
		this.element.src = '';

		try { this.element.currentTime = 0; } catch (e){};

		this.element.src = src;

		this.pbPlayer.emit('stop');
	},

	/**
	 *
	 */
	volume: function ( volume ) {

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

pbPlayer.registerPlugin('html5', Html5);

window.Html5 = Html5;

