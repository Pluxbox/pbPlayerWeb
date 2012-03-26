(function ( $, context ) {
	
	var pluxbox = PB.Class(/* PB.Player.Skin, */ {
		
		construct: function ( context ) {
			
			this.context = context;
			
			this.findElements();
			
			this.addEvents();
		},
		
		destroy: function () {
			
			// Remove DOM
		},
		
		findElements: function () {
			
			var element = this.context.config.renderTo;
			
			this.elAction = element.find('a.control-stop')[0];	// control-play
			this.elTime = element.find('div.time-holder')[0].first();
			this.elDuration = element.find('div.time-holder')[0].last();
			this.elProgress = element.find('div.progress > .bar-holder > .bar')[0];
			this.elLoudness = element.find('div.loudness')[0];
			
			element = null;
		},
		
		addEvents: function () {
			
			// Player events
			this.context.on('duration error progress loaded pause play volumechange ended timeupdate stop'
				, this.delegatePlayerEvents.bind(this));
			
			
			// Dom events
		},
		
		delegatePlayerEvents: function ( e ) {
			
			switch( e.type ) {
				
				case 'play':
					this.elAction.removeClass('control-play control-stop').addClass('control-pause');
					return;

				case 'pause':
					this.elAction.removeClass('control-pause control-stop').addClass('control-play');
					return;

				case 'stop':
					this.elAction.removeClass('control-play control-pause').addClass('control-play');
					return;
				
				// Volume
				case 'volumechange':
					this.elLoudness.height( (100 - e.volume)+'%' );
					return;
			
				// Duration
				case 'duration':
					this.elDuration.text( e.length );
					return;
				
				// Duration
				case 'timeupdate':
					this.elTime.text( e.position );
					this.elProgress.width( e.progress+'%' );
					return;
				
				default:
						console.log(e.type);
					break;
			}
		}
	});
	
	PB.Player.registerSkin('Pluxbox', pluxbox);
	
})( PB, this );

