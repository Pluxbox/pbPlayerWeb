(function ( $, context ) {
	
	var formatTime = function ( seconds ) {
		
		var date = new Date( seconds*1000 ),
			minutes = date.getMinutes(),
			seconds = date.getSeconds();
		
		return (minutes < 10 ? '0': '')+minutes
			+':'
			+(seconds < 10 ? '0': '')+seconds;
	};
	
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
			this.elProgressContainer = element.find('div.bar-holder')[0];
			this.elProgress = element.find('div.progress > .bar-holder > .bar')[0];
			this.elProgressHandler = this.elProgress.first();
			this.elLoudness = element.find('div.loudness')[0];
			this.elLoudnessHandler = this.elLoudness.first();
			this.elVolumeHover = element.find('a.volume')[0];
			this.elVolumeContainer = element.find('div.volume-bar-holder')[0];
			this.elVolume = element.find('a.volume')[0];
			
			element = null;
		},
		
		addEvents: function () {
			
			// Player events
			this.context.on('duration error progress loaded pause play volumechange ended timeupdate stop'
				, this.delegatePlayerEvents.bind(this));
			
			// Dom events
			this.elAction.on('click', this.toggle.bind(this));
			this.elVolumeHover.on('mouseenter', this.showVolume.bind(this));
			this.elVolumeContainer.on('mouseleave', this.hideVolume.bind(this));
		
			// Draggables
			this._progressDragUpdate = this.progressDragUpdate.bind(this);
			this._progressDragDestroy = this.progressDragDestroy.bind(this);
			
			this.elProgressHandler.on('mousedown', this.startProgressDrag.bind(this));
			this.elProgressHandler.on('click', this.stop.bind(this));
			this.elProgressContainer.on('click', this.progressPoint.bind(this));
			
			this._volumeDragUpdate = this.volumeDragUpdate.bind(this);
			this._volumeDragDestroy = this.volumeDragDestroy.bind(this);
			
			this.elLoudnessHandler.on('mousedown', this.startVolumeDrag.bind(this));
			this.elLoudnessHandler.on('click', this.stop.bind(this));
			this.elLoudness.on('click', this.volumePoint.bind(this));
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
					this.duration = e.length;
					this.elDuration.text( formatTime(e.length) );
					return;
				
				// Duration
				case 'timeupdate':
					this.elTime.text( formatTime(e.position) );
					this.elProgress.width( e.progress+'%' );
					return;
				
				default:
				//	console.log(e.type);
					break;
			}
		},
		
		toggle: function ( e ) {
			
			e.stop();
			
			if( this.elAction.hasClass('control-play') ) {
				
				this.context.play()
			} else {
				
				this.context.pause();
			}
		},
		
		showVolume: function () {
			
			this.elVolumeContainer.show();
		},
		
		hideVolume: function () {
			
			if( this.volumeDrag ) {
				
				return;
			}
			
			this.elVolumeContainer.hide();
		},
		
		toggleVolume: function ( e ) {
			
			e.stop();
		},
		
		stop: function ( e ) {
			
			e.stop();
		},
		
		progressPoint: function ( e ) {
			
			var position = this.elProgressContainer.getXY(true),
				width = this.elProgressContainer.width(),
				x = e.pageX - position.left,
				percent = x / (width / 100);
		
			// Min / max
			percent = ( percent < 0 ) ? 0 : ( percent > 100 ) ? 100 : percent;
			
			this.context.playAt( this.duration * (percent/100) );
		},
		
		startProgressDrag: function ( e ) {
			
			e.stop();
			
			// prevent text selection in IE 
			document.onselectstart = function () { return false; };
			
			$(document).on('mousemove', this._progressDragUpdate);
			$(document).on('mouseup', this._progressDragDestroy);
		},
		
		progressDragUpdate: function ( e ) {

			if( e.button !== 1 && e.button !== 0 ) {

				this.progressDragDestroy();
				return;
			}

			this.progressPoint( e );
		},
		
		progressDragDestroy: function () {
			
			$(document).off('mousemove', this._progressDragUpdate);
			$(document).off('mouseup', this._progressDragDestroy);
		},
		
		
		volumePoint: function ( e ) {
			
			var position = this.elLoudness.getXY(true),
				height = this.elLoudness.height(),
				y = e.pageY - position.top,
				percent = y / (height / 100);
			
			// Min / max
			percent = ( percent < 0 ) ? 0 : ( percent > 100 ) ? 100 : percent;
			
			this.context.volume( 100 - percent );
		},
		
		startVolumeDrag: function ( e ) {
			
			e.stop();
			
			this.volumeDrag = true;
			
			// prevent text selection in IE 
			document.onselectstart = function () { return false; };
			
			$(document).on('mousemove', this._volumeDragUpdate);
			$(document).on('mouseup', this._volumeDragDestroy);
		},
		
		volumeDragUpdate: function ( e ) {

			if( e.button !== 1 && e.button !== 0 ) {

				this.volumeDragDestroy();
				return;
			}

			this.volumePoint( e );
		},
		
		volumeDragDestroy: function () {
			
			this.volumeDrag = false;
			
			$(document).off('mousemove', this._volumeDragUpdate);
			$(document).off('mouseup', this._volumeDragDestroy);
		}
	});
	
	PB.Player.registerSkin('Pluxbox', pluxbox);
	
})( PB, this );

