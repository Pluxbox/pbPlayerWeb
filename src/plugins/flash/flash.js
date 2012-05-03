var flash = PB.Class({
	
	/**
	 * Flash installed? Version 9 is the required version
	 */
	supports: function ( metadata ) {
		
		var codecs = { mp3: true, mp4: true };
		
		return PB.browser.flash && PB.browser.flash >= 9 && codecs[metadata.codec];
	},
	
	/**
	 *
	 */
	construct: function ( context ) {
		
		var flashContainer = context.config.swfPath;
		
		this.context = context;
		
		this.maxTries = 25;		// 25 * 50 = 1250ms max time to load flash..
		this.queue = [];
		this.flashReady = false;
		
		if( context.config.stream ) {
			
			flashContainer += 'pbstreamplayer.swf';
		} else {
			
			flashContainer += 'pbplayer.swf';
		}
		
		// IE only
		if( PB.browser.isIE ) {
			
			// Change to innerHTML
			this.element = PB('<object id="'+this.context.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,40,0" width="0" height="0">'
					+'<param name="movie" value="'+flashContainer+'?ac='+Date.now()+'">'
					+'<param name="quality" value="high">'
					+'<param name="bgcolor" value="#FFFFFF">'
					+'<param name="allowScriptAccess" value="always">'
				+'</object>');
		}
		// Modern browsers
		else {
			
			this.element = PB('<embed width="0" height="0" id="'+this.context.id+'" '
				+'src="'+flashContainer+'?ac='+Date.now()+'"'
				+'allowscriptaccess="always" type="application/x-shockwave-flash"'
				+'pluginspage="http://www.macromedia.com/go/getflashplayer"></embed>');
		}
		
		this.element = this.element.appendTo(document.body).node;
		
		this._isLoaded = this.isLoaded.bind(this);
		this.isLoadedTimer = setInterval( this._isLoaded, 50 );
	},
	
	/**
	 * Check if flash is loaded, then execute queue
	 */
	isLoaded: function () {
		
		try {
			
			this.element._playerId( this.context.id );
			
			this.flashReady = true;
			this.queue.forEach(function ( item ){
				
				if( item.args === null ) {
					
					this[item.method].call(this);
				} else {
					
					this[item.method].call(this, Array.prototype.slice.call(item.args));
				}
			}, this);

			clearTimeout( this.isLoadedTimer );
			
		} catch (e){};
		
		if( !(--this.maxTries) ) {
			
			clearTimeout( this.isLoadedTimer );
			
			this.context.emit('error', {
				
				message: 'Flash file not found in `'+this.context.config.swfPath+'`',
				code: 404
			});
		}
	},
	
	/**
	 *
	 */
	destroy: function () {
		
		this.element.remove();

		this.element = null;
		this.context = null;
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
		
		this.element._src( src );
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
	volume: function ( volume ) {
		
		if( !this.flashReady ) {
			
			this.addToQueue( 'volume', arguments );
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

PB.Player.register('flash', flash);

