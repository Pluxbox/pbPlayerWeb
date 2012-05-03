(function ( $, context ) {
	
	/**
	 * Html layout
	 */
	var html = '<!-- pbplayer start -->\
	<div class="pbplayer">\
	\
		<!-- background glow -->\
		<div class="bg-glow"></div>\
			\
		<!-- player control start -->\
		<div class="control-main">\
			<!-- emboss background -->\
			<div class="emboss pb-opacity-020"></div>\
		\
			<!-- fysical button -->\
			<div class="control-holder">\
				<!-- control-play / control-pause / control-stop -->\
				<a href="/" class="control-play">\
					<span class="skin"></span><span class="button"></span>\
				</a>\
			</div>\
		\
			<!-- divider -->\
			<div class="divide pb-opacity-020"></div>\
		</div>\
	\
		<!-- player control stop -->\
		<div class="player">\
			<!-- relative inner start -->\
			<div class="player-inner">\
			\
				<!-- top start -->\
				<div class="top">\
					<!-- emboss background -->\
					<div class="info-emboss pb-opacity-020"></div>\
				\
					<!-- track info -->\
					<div class="info-holder">\
						<div class="info">Imogen Heap - Minds without fear</div>\
					</div>\
				\
					<!-- volume start -->\
					<div class="volume-holder">\
						<div class="inner">\
							<a href="/" class="volume">\
								<!-- volume-low / volume-high / volume-off -->\
								<span class="button volume-off"><span>\
							</a>\
							<div class="volume-bar-holder">\
								<div class="loudness-bar">\
									<div class="loudness"><a href="#" class="dragger"></a></div>\
								</div>\
							</div>\
						</div>\
					</div>\
					<!-- volume stop  -->\
				</div>\
				<!-- top stop  -->\
			\
				<!-- bottom start -->\
				<div class="bottom">\
					<div class="inner">\
						<!-- progress bar start -->\
						<div class="progress">\
							<!-- \
							Add `processing` class for loading state.\
							`bar-holder` can be duplicated and wrapped around current `bar-holder`-div.\
							 -->\
							<div class="bar-holder processing">\
								<div class="bar"><a href="#" class="dragger"></a></div>\
							</div>\
						</div>\
						<!-- progress bar stop  -->\
					\
						<!-- progress time start -->\
						<div class="time-holder"><span>00:00</span> / <span>00:00</span></div>\
						<!-- progress time stop  -->\
					</div>\
				</div>\
				<!-- bottom stop  -->\
			\
			</div>\
			<!-- relative inner stop  -->\
		</div>\
	</div>\
	<!-- pbplayer stop  -->';
	
	/**
	 * Format seconds to i:s
	 */
	function formatTime ( seconds ) {
		
		var date = new Date( seconds*1000 ),
			minutes = date.getMinutes(),
			seconds = date.getSeconds();
		
		return (minutes < 10 ? '0': '')+minutes
			+':'
			+(seconds < 10 ? '0': '')+seconds;
	}
	
	var pluxbox = PB.Class(/* PB.Player.Skin, */ {
		
		construct: function ( context ) {
			
			this.context = context;
			this.volTimer = null;
			
			this.element = $(html).appendTo( this.context.config.renderTo );
			
			this.findElements();
			
			this.addEvents();
		},
		
		destroy: function () {
			
			// Remove DOM
		},
		
		findElements: function () {
			
			var element = this.element;
			
			this.elAction = element.find('a.control-play')[0];	// control-play
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
			this.elVolumeIcon = this.elVolume.first();
			
			element = null;
		},
		
		addEvents: function () {
			
			// Wrappers
			this._hideVolume = this.hideVolume.bind(this);
			
			// Player events
			this.context.on('duration error progress loaded pause play volumechange ended timeupdate stop'
				, this.delegatePlayerEvents.bind(this));
			
			// Dom events
			this.elAction.on('click', this.toggle.bind(this));
			this.elVolumeContainer.parent().on('mouseenter', this.showVolume.bind(this));
			this.elVolumeContainer.parent().on('mouseleave', this._hideVolume);
			this.elVolume.on('click', this.toggleVolume.bind(this))
		
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
					break;

				case 'ended':
					this.context.stop();
					break;
				
				case 'pause':
				case 'stop':
					this.elAction.removeClass('control-pause control-stop').addClass('control-play');
					break;
				
				// Volume
				case 'volumechange':
					
					if( e.volume - this.volumeLevel > 30 || e.volume - this.volumeLevel < -30 ) {
						
						this.elLoudness.morph({
							
							height: (100 - e.volume)+'%'
						}, .1);
					} else {
						
						this.elLoudness.height( (100 - e.volume)+'%' );
					}
				
					this.volumeLevel = e.volume;
					
					if( e.volume == 0 ) {
						
						this.elVolumeIcon.addClass('volume-off').removeClass('volume-low volume-high');
					} else if ( e.volume < 70 ) {
						
						this.elVolumeIcon.addClass('volume-low').removeClass('volume-off volume-high');
					} else {

						this.elVolumeIcon.addClass('volume-high').removeClass('volume-off volume-low');
					}
					
					break;
			
				// Duration
				case 'duration':
					this.duration = e.length;
					this.elDuration.text( formatTime(e.length) );
					break;
				
				// Duration
				case 'timeupdate':
					this.elTime.text( formatTime(e.position) );
					this.elProgress.width( e.progress+'%' );
					break;
				
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
			
			clearTimeout(this.volTimer);
			
			this.elVolumeContainer.show();
		},
		
		hideVolume: function () {
			
			clearTimeout(this.volTimer);
			
			if( this.volumeDrag ) {
				
				this.volTimer = setTimeout(this._hideVolume, 100);
				return;
			}
			
			this.elVolumeContainer.hide();
		},
		
		toggleVolume: function ( e ) {
			
			e.stop();
			
			if( this.volumeLevel == 0 ) {
				
				this.context.volume( this.prevVolumeLevel );
			} else {
				
				this.prevVolumeLevel = this.volumeLevel;
				this.context.volume( 0 );
			}
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
				height = this.elLoudness.parent().height(),
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

