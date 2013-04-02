var html5 = PB.Class({

	codecs: {

		mp3: 'audio/mpeg; codecs="mp3"',
		ogg: 'audio/ogg; codecs="vorbis"',
		opus: 'audio/ogg; codecs="opus"',
	//	wav: 'audio/wav; codecs="1"',		// deprecated
		aac: 'audio/aac; codecs="aac"'
	},

	NETWORK_ERROR: 'NETWORK_EMPTY NETWORK_IDLE NETWORK_LOADED NETWORK_LOADING NETWORK_NO_SOURCE'.split(' '),

	/**
	 * Html5 availeble and supports audio file?
	 */
	supports: function ( metadata ) {

		var codecs = html5.prototype.codecs;

		if( !window.Audio || !codecs[metadata.codec] ) {

			return false;
		}

		// Not just a fake tag... Android...
		var audio = new window.Audio;

		//	ogg = ('no' != audio.canPlayType(codecs.ogg)) && ('' != audio.canPlayType(codecs.ogg)),
		//	mp3 = ('no' != audio.canPlayType(codecs.mp3)) && ('' != audio.canPlayType(codecs.mp3)),
		//	aac = ('no' != audio.canPlayType(codecs.aac)) && ('' != audio.canPlayType(codecs.aac));

		// Safari 4 issues
		try {

			// Desktop safari fails playing audio before version 5
			if( PB.browser.isSafari && navigator.userAgent.indexOf('Mobile') === -1 ) {

				if( PB.browser.version <= 5.0 ) {

					return false;
				}
			}

		} catch (e){}

		var canPlay = audio.canPlayType( codecs[metadata.codec] );

		return canPlay === 'probably' || canPlay === 'maybe';
	},

	/**
	 *
	 */
	construct: function ( context ) {

        // Wrapper for Safari
        this._play = this.play.bind(this);

		this.context = context;

		this.element = PB('<audio preload="metadata" />');

		this.addEvents();

		// Set node instead of PB wrapper
		this.element = this.element.appendTo(document.body).node;
	},

	/**
	 *
	 */
	destroy: function () {

		if( this.element && PB(this.element) ) {
			
			this.element.pause();
			this.element.src = '';
			
			PB(this.element).remove();
		}

		this.element = null;
		this.context = null;
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

		this.context.emit('duration', {

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

			this.context.emit('error', {

				code: this.element.error,
				message: this.NETWORK_ERROR[error]
			});

			return;
		}

		if( buffered.length ) {

			this.context.emit('progress', {

				loaded: Math.floor((buffered.end(0) / element.duration) * 100)
			});
		}


		if( element.readyState >= 3 ) {

			this.context.emit('progress', {

				loaded: 100
			});

			this.context.emit('loaded');

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

		this.context.emit(e.type, args);
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
	},

	/**
	 *
	 */
	play: function () {

		if ( navigator.userAgent.match(/(iPhone)|(iPad)/) ){

			this.element.play();
		}

        try {

            this.element.currentTime = this.element.currentTime;

            this.element.play();

        } catch ( e ) {

        	// Safari doesn't load duration
            setTimeout(this._play, 16.7);
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

		this.context.emit('stop');
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

PB.Player.register('html5', html5);

