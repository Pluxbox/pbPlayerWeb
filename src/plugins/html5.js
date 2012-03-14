PB.Player.Plugin.register(PB.Class(PB.Player.Plugin.Core, {
	
	name: 'html5',
	
	codec: {
		
		mp3: 'audio/mpeg; codecs="mp3"',
		ogg: 'audio/ogg; codecs="vorbis"',
		wav: 'audio/wav; codecs="1"',
		aac: 'audio/aac; codecs="aac"'
	},
	
	NETWORK_ERROR: [
		
		'NETWORK_EMPTY',
		'NETWORK_IDLE',
		'NETWORK_LOADED',
		'NETWORK_LOADING',
		'NETWORK_NO_SOURCE'
	],
	
	supports: function ( metadata ) {
		
		if( !window.Audio || !this.codec[metadata.codec] ) {
			
			return false;
		}
		
		// Not just a fake tag... Android...
		var audio = new window.Audio,
			ogg = ('no' != audio.canPlayType(this.codec.ogg)) && ('' != audio.canPlayType(this.codec.ogg)),
			mp3 = ('no' != audio.canPlayType(this.codec.mp3)) && ('' != audio.canPlayType(this.codec.mp3));
		
		if( !ogg || !mp3 ) {
			
			return false;
		}
		
		// Freakin webkit, Android old safari...
		try {
			
			if( PB.browser.isSafari && !PB.browser.isNokiaBrowser ) {

				if( PB.browser.version <= 5.0 ) {

					return false;
				}
			}
		} catch (e){}
		
		var canPlay = audio.canPlayType( this.codec[metadata.codec] );
		
		return canPlay === 'probably' || canPlay === 'maybe';
	},
	
	construct: function () {
		
		this.parent.apply(this, arguments);
		
		this.element = $(document.createElement('audio'));
		this.element
			.attr('id', this.scope.id)
			.attr('data-id', Date.now())
			.attr('preload', 'metadata');
		
		$(document.body).append(this.element);
		
		this.element = this.element.node;
		
		this.addEvents();
		
		this.element.volume = this.scope.options.volume / 100;
		
		this.eventHandler({type: 'volumechange'});
	},
	
	destroy: function () {
		
		// Purge attached events
		$(this.element).off();
		
		this.element.pause();
		this.element.src = '';
		this.element.load();
		
		this.parent();
	},
	
	/**
	 *
	 */
	addEvents: function () {
		
		var element = $(this.element);
		
		this.eventHandlerWrapper = this.eventHandler.bind(this);
		
		element
			.on('loadedmetadata', this.metadataLoaded.bind(this))
			.on('progress', this.progress.bind(this))
			.on('error pause play volumechange ended timeupdate', this.eventHandlerWrapper);
		
		// Trigger progress when progress event fails
		window.setTimeout(this.progress.bind(this), 250);
	},
	
	eventHandler: function ( e ) {
		
		var type = e.type,
			args = [];
		
		switch( e.type ) {
			
			case 'timeupdate':
				
				args.push( this.element.currentTime );
				break;
			
			case 'volumechange':
				
				if( !!this.element.muted ) {
					
					args.push( 0 );
				} else {
					
					args.push( parseInt(this.element.volume * 100, 10) );
				}
				break;
		}
		
		this.scope.fire(type, args);
	},
	
	metadataLoaded: function ( e ) {
		
		this.scope.fire('duration', [this.element.duration]);
	},
	
	/**
	 * Sometimes progress event never reaches readystate of 4
	 * so added timer..
	 */
	progress: function ( e ) {
		
		clearTimeout( this.timer );
		
		if( this.element.error !== null ) {
			
			this.scope.fire('error', [this.NETWORK_ERROR[this.element.error], this.element.error]);
			$(this.element).off('progress');
		}
		
		if( this.element.buffered.length ) {
			
			this.scope.fire('loadProgress', [Math.floor((this.element.buffered.end(0) / this.element.duration) * 100)]);
		}
		
		if( this.element.readyState === 4 ) {
			
			$(this.element).off('progress');
			
			this.scope.fire('loadProgress', [100]);
			this.scope.fire('load');
		} else {
			
			this.timer = window.setTimeout(this.progress.bind(this), 250);
		}
	},
	
	setAudio: function ( src ) {
		
		try {
			
			this.element.pause();
			this.element.src = src;
			this.element.load();
		} catch (e){};
		
		this.scope.fire('src', [src]);
	},
	
	play: function () {
		
		this.element.play();
	},
	
	pause: function () {
		
		this.element.pause();
	},
	
	/**
	 * Stop playing, will kill loading
	 */
	stop: function () {
		
		var src = this.element.src;
		
		this.element.pause();
		this.element.src = '';
		try { this.element.currentTime = 0; } catch (e){};
		this.element.src = src;
	},
	
	volume: function ( volume ) {
		
		this.element.volume = volume / 100;
	},
	
	playAt: function ( position ) {
		
		this.element.currentTime = position;
	}
}));

