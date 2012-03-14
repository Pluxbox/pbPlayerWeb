PB.Player.Plugin.register(PB.Class(PB.Player.Plugin.Core, {
	
	name: 'flash_stream',
	
	codec: {
		
		mp3: true,
		mp4: true
	},
	
	navigator: navigator.userAgent.toLowerCase(),
	
	hasFlash: function () {
		
		var flash,
			hasFlash = false,
			requiredFlashVersion = 9;
		
		if( !!window.ActiveXObject ) {
			
			try {
				
				flash = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.'+requiredFlashVersion);
				hasFlash = true;
			} catch(e){};
		} else {
			
			flash = navigator.plugins['Shockwave Flash'];
			
			if( flash && parseFloat(flash.description.match(/\d+\.\d+/)[0], 10) >= requiredFlashVersion ) {
				
				hasFlash = true;
			}
		}
		
		return hasFlash;
	}(),
	
	supports: function ( metadata ) {
		
		return this.hasFlash && this.codec[metadata.codec] && metadata.stream;
	},
	
	construct: function () {
		
		this.parent.apply(this, arguments);
		
		// Class specific values
		this.queue = [];
		this.ready = false;
		
		// IE only
		if( PB.browser.isIE ) {
			
			// Change to innerHTML
			this.element = $('<object id="'+this.scope.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,40,0" width="0" height="0">'
					+'<param name="movie" value="'+this.scope.options.path+'pbstreamplayer.swf?ac='+Date.now()+'">'
					+'<param name="quality" value="high">'
					+'<param name="bgcolor" value="#FFFFFF">'
					+'<param name="allowScriptAccess" value="always">'
				+'</object>');
		}
		// Modern browsers
		else {
			
			this.element = $('<embed width="0" height="0" id="'+this.scope.id+'" '
				+'src="'+this.scope.options.path+'pbstreamplayer.swf?ac='+Date.now()+'"'
				+'allowscriptaccess="always" type="application/x-shockwave-flash"'
				+'pluginspage="http://www.macromedia.com/go/getflashplayer"></embed>');
		}
		
		this.element = this.element.node;
		
		$(document.body).append(this.element);
		
		this.volume( this.scope.options.volume );
		
		this.isLoadedWrapper = this.isLoaded.bind(this);
		this.isLoadedTimer = setInterval( this.isLoadedWrapper, 1000 );
	},
	
	isLoaded: function () {
		
		try {
			
			this.element._playerId( this.scope.id );
			
			this.ready = true;
			this.queue.forEach(function ( item ){
				
				if( item.args === null ) {
					
					this[item.method].call(this);
				} else {
					
					this[item.method].call(this, Array.prototype.slice.call(item.args));
				}
			}, this);

			clearTimeout( this.isLoadedTimer );
			
		} catch (e){};
	},
	
	addToQueue: function ( method, args ) {
		
		this.queue.push({
			
			method: method,
			args: args || null
		});
	},
	
	// ----- Controlls -----
	
	setAudio: function ( src ) {
		
		if( this.ready === false ) {
			
			this.addToQueue( 'setAudio', arguments );
			return;
		}
		
		this.element._src( src );
		
	//	this.scope.fire('src', [src]);
	},
	
	play: function () {
		
		if( this.ready === false ) {
			
			this.addToQueue( 'play' );
			return;
		}
		
		this.element._play();
	},
	
	pause: function () {
		
		this.element._pause();
	},
	
	stop: function () {
		
		if( this.ready === false ) {
			
			this.addToQueue( 'stop' );
			return;
		}
		
		this.element._stop();
	},
	
	volume: function ( volume ) {
		
		if( this.ready === false ) {
			
			this.addToQueue( 'volume', arguments );
			return;
		}
		
		this.element._volume( volume );
	},
	
	playAt: function ( position ) {
		
		if( this.ready === false ) {
			
			this.addToQueue( 'playAt', arguments );
			return;
		}
		
		this.element._playAt( position );
	}
}));

