PB.Player.Plugin.register(PB.Class(PB.Player.Plugin.Core, {
	
	name: 'embed',
	
	codec: ['wma', 'asx', 'aif', 'raw', 'wav', 'au', 'flac', 'ra', 'ogg', 'ram'],
	
	supports: function ( metadata ) {
		
		return this.codec.indexOf(metadata.codec) >= 0;
	},
	
	construct: function () {
		
		this.parent.apply(this, arguments);
	},
	
	/**
	 * 
	 */
	create: function ( url ) {
		
		url = url || this._src;
		
		if( PB.browser.isIE ) {
			
			this.element = $('<object id="'+this.scope.id+'" type="audio/x-mpeg" data="'+url+'" autoplay="true" height="0" style="width: 0; height: 0;" volume="80">\
				<param name="src" value="'+url+'" />\
				<param name="controller" value="true" />\
				<param name="autoplay" value="true" />\
				<param name="autostart" value="1" />\
				<param naem="volume" value="80" />\
			</object>');
		} else {
			
			this.element = $('<embed id="'+this.scope.id+'" type="application/x-mplayer2" src="'+url+'" autostart="1" enablejavascript="true" uiMode="invisible" volume="80" style="width: 0; height: 0;"></embed>');
		}
		
		this.element = this.element.appendTo(document.body).node;
		
		this._src = url;
	},
	
	remove: function () {
		
		if( PB(this.scope.id) ) {
			
			PB(this.scope.id).remove();
		}
	},
	
	setAudio: function ( src ) {
		
		try {
			
		//	this.create( src );
		} catch (e){};
		
		this._src = src;
		
		this.scope.fire('src', [src]);
	},
	
	play: function () {
		
		this.scope.fire('play');
		
		try {

			this.element.Play();
		} catch (e){
			
			this.remove();
			this.create();
		};
	},
	
	pause: function () {
		
		this.scope.fire('pause');
		
		try {
			
			this.element.Pause();
		} catch (e){
			
			this.remove();
		};
	},
	
	/**
	 * Stop playing, will kill loading
	 */
	stop: function () {
		
		this.scope.fire('stop');
		
		try {
			
			this.element.Stop();
		} catch (e){};

		this.remove();
	},
	
	volume: function ( volume ) {
		
		try {
			
			this.element.volume = volume;
			this.element.SetVolume( volume );
			
		} catch (e){};
	},
	
	playAt: function ( position ) {
		
		try {
			
			this.element.SetTime( position * 1000 ); // Miliseconds
		} catch (e){};
	}
}));

