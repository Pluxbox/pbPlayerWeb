var flash = PB.Class({
	
	/**
	 * 
	 */
	supports: function ( metadata ) {
			
		return true;
	},
	
	/**
	 *
	 */
	construct: function ( context ) {
		
		this.context = context;
	},
	
	/**
	 *
	 */
	destroy: function () {
		
		this.element.remove();

		this.element = null;
		this.context = null;
	},
	
	create: function ( url ) {
		
		url = url || this._src;
		
		this.remove();

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
		
		if( this.element ) {
			
			PB(this.element).remove();
		}
	},
	
	// Trigger events
	
	/**
	 * Set src
	 */
	set: function ( src ) {	
		
		this.create( src );
	},
	
	/**
	 *
	 */
	play: function () {
		
		this.context.emit('play');

		try {

			this.element.Play();
		} catch (e){

			this.create();
		};
	},
	
	/**
	 *
	 */
	pause: function () {
		
		this.context.emit('pause');

		try {

			this.element.Pause();
		} catch (e){

			this.remove();
		};
	},
	
	/**
	 *
	 */
	stop: function () {
		
		this.context.emit('stop');

		try {

			this.element.Stop();
		} catch (e){
			
			this.remove();
		};
	},
	
	/**
	 *
	 */
	volume: function ( volume ) {
		
		try {

			this.element.volume = volume;
		} catch (e){};
		
		try {

			this.element.SetVolume( volume );
		} catch (e){};
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
		
		try {

			this.element.SetTime( position * 1000 ); // Miliseconds
		} catch (e){};
	},
});

PB.Player.register('flash', flash);

