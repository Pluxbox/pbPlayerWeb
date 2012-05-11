(function ( $ ){
	
	var local = {};
	
	local.html = '<div class="pbplayer-wrapper"><div class="pbplayer-skin"><div class="pbplayer-inner-skin"><div class="pbplayer-details pbplayer-text-shadow"><p></p></div><div class="pbplayer-seeker-shell"><div class="pbplayer-seeker pbplayer-playing-stream"><div class="pbplayer-button pbplayer-play"></div><div class="pbplayer-button pbplayer-control-button"></div><div class="pbplayer-button pbplayer-volumn-control"><span class="pbplayer-volumn3">&nbsp;</span></div><div class="pbplayer-volumn-slider"><div class="pbplayer-volumn-slider-range"><div class="pbplayer-volumn-slider-bar"></div><div class="pbplayer-volumn-slider-handle"></div></div></div><div class="pbplayer-bar-stream"><div class="pbplayer-bar-skin"><div class="pbplayer-bar-inner"></div></div></div><div class="pbplayer-bar-progress" style="width:0%"><div class="pbplayer-bar-skin"><div class="pbplayer-bar-inner"></div></div></div><div class="pbplayer-bar-buffer" style="width:0%"><div class="pbplayer-bar-skin"><div class="pbplayer-bar-inner"></div></div></div><div class="pbplayer-bar"><div class="pbplayer-bar-skin"><div class="pbplayer-bar-inner"></div></div></div><div class="pbplayer-time pbplayer-text-shadow"><span class="pbplayer-elapsed">00:00</span>/<span class="pbplayer-duration">00:00</span></div></div></div></div></div><div class="pbplayer-playlist"><div class="pbplayer-playlist-skin"><ul><li>&nbsp;</li></ul></div></div></div>';
	
	local.formatTime = function ( seconds ) {
		
		var date = new Date( seconds*1000 ),
			minutes = date.getMinutes(),
			seconds = date.getSeconds();
		
		return (minutes < 10 ? '0': '')+minutes
			+':'
			+(seconds < 10 ? '0': '')+seconds;
	};
	
	var npo = PB.Class({
		
		css: 'omroep.css',
		
		construct: function ( player ) {
			
			this.player = player;
			
			this.init();
		},
		
		/**
		 *
		 */
		init: function () {
			
			var player = this.player;
			
			var renderTo = this.element = $(local.html).appendTo( this.player.config.renderTo );
			
			this._playtime = renderTo.find('.pbplayer-elapsed')[0];
			this._playprogress = renderTo.find('.pbplayer-bar-progress')[0];
			this._progresshandler = renderTo.find('.pbplayer-control-button')[0];
			this._duration = renderTo.find('.pbplayer-duration')[0];
			this._bufferbar = renderTo.find('.pbplayer-bar-buffer')[0];
			this._playerbar = renderTo.find('.pbplayer-bar')[0];
			this._playPause = renderTo.find('.pbplayer-play')[0];
			this._handler = renderTo.find('.pbplayer-control-button')[0];
			this._volumeButton = renderTo.find('.pbplayer-volumn-control')[0];
			this._volumeContainer = renderTo.find('.pbplayer-volumn-slider')[0];
			this._volumeBar = renderTo.find('.pbplayer-volumn-slider-range')[0];
			this._volumeSliderHandler = renderTo.find('.pbplayer-volumn-slider-handle')[0];
			this._volumeIndicator = renderTo.find('.pbplayer-volumn3')[0];
			this._volumeSlider = renderTo.find('.pbplayer-volumn-slider-bar')[0];
			this._songTitle = renderTo.find('.pbplayer-details')[0];
			this._playlist = renderTo.find('.pbplayer-playlist-skin')[0];
			
			// Events
			this.addEvents();
			
			this.setTitle();
			this.volume = 0;
		
			/*
			if( this.player.playlist.length > 1 ) {
				
				this._playlistList = this._playlist.first();
				this.setPlaylist();
			} else {
				
				this._playlist.hide();
				
				this.setTitle( this.player.playlist.files[0][0].title );
			}
			*/
			
			this._playlist.hide();
			this.setTitle( this.player.current().name );
			
			// Remove stream skin
			if( true ) {
				
				this.element.find(".pbplayer-bar-stream")[0].hide();
				this.element.find(".pbplayer-seeker")[0].removeClass("pbplayer-playing-stream");
				this.element.find(".pbplayer-control-button")[0].show();
				this.element.find(".pbplayer-bar-progress")[0].show();
				this.element.find(".pbplayer-time")[0].show();
			}
			
			this._playerEvent = this.playerEvent.bind(this);
			
			this.player
				.on('progress', this._playerEvent)
				.on('timeupdate', this._playerEvent)
				.on('totalTime', this._playerEvent)
				.on('error', this._playerEvent)
				.on('pause', this._playerEvent)
				.on('play', this._playerEvent)
				.on('stop', this._playerEvent)
			//	.on('playing', this._playerEvent)
				.on('volumechange', this._playerEvent)
				.on('loaded', this._playerEvent)
				.on('ended', this._playerEvent)
				.on('duration', this._playerEvent);
		
			// iPad cant adjust volume, guess iPhone either
			if( /Mobile/.test(navigator.userAgent) ) {

				// Hide volume
			}
		},
		
		/**
		 *
		 */
		addEvents: function () {
			
			// Play/pause toggle
			this._playPause.on('click', function ( e ){
				
				e.stop();
				
				if( this._playPause.hasClass('pbplayer-play') === true ) {
					
					this.player.play();
				} else if ( this._playPause.hasClass('pbplayer-pause') === true ) {
					
					this.player.pause();
				}
			}.bind(this));
			
			// Progress events
			this._progresshandler.on('mousedown', this.progressDragInit.bind(this));
			this._playerbar.on('click', this.progressPoint.bind(this));
			this._bufferbar.on('click', this.progressPoint.bind(this));
			this._playprogress.on('click', this.progressPoint.bind(this));
			
			this.progressDragUpdateWrapper = this.progressDragUpdate.bind(this);
			this.progressDragDestroyWrapper = this.progressDragDestroy.bind(this);
			
			// Volume events
			this._volumeButton.on('click', function ( e ){
				if(this.player.options.volume == 0){
					this.player.volume(this.volume);
				}else{
					this.volume = this.player.options.volume;
					this.player.volume(0);
				}
			}.bind(this));
			this._volumeButton.on('mouseenter', function ( e ){
				
				this._volumeContainer.show();
			}.bind(this));
			this._volumeContainer.on('mouseleave', function (){
				
				this.volumeTimer = window.setTimeout(function (){
					
					this._volumeContainer.hide();
				}.bind(this), 500);
			}.bind(this));
			this._volumeContainer.on('mouseenter', function (){
				
				window.clearTimeout(this.volumeTimer);
			}.bind(this));
			
			this._volumeSliderHandler.on('mousedown', this.volumeDragInit.bind(this));
			this._volumeContainer.on('click', this.volumePoint.bind(this));
			
			this.volumeDragUpdateWrapper = this.volumeDragUpdate.bind(this);
			this.volumeDragDestroyWrapper = this.volumeDragDestroy.bind(this);
		},
		
		volumeDragInit: function ( e ) {
			
			e.stop();
			
			// prevent text selection in IE 
			document.onselectstart = function () { return false; };
			
			$(document).on('mousemove', this.volumeDragUpdateWrapper);
			$(document).on('mouseup', this.volumeDragDestroyWrapper);
		},
		
		volumeDragUpdate: function ( e ) {
			
			if( e.button !== 1 && e.button !== 0 ) {
				
				this.volumeDragDestroy();
				return;
			}
			
			this.volumePoint( e );
		},
		
		volumeDragDestroy: function () {
			
			document.onselectstart = null;
			
			$(document).off('mousemove', this.volumeDragUpdateWrapper);
			$(document).off('mouseup', this.volumeDragDestroyWrapper);
		},
		
		volumePoint: function ( e ) {
			
			var position = this._volumeBar.getXY(true),
				height = this._volumeBar.height(),
				y = e.pageY - position.top,
				percent = y / (height / 100);
			
			// Min / max
			percent = ( percent < 0 ) ? 0 : ( percent > 100 ) ? 100 : percent;
			
			this.player.volume( 100 - percent );
		},
		
		/**
		 * Delegate player events
		 */
		playerEvent: function ( e ) {
			
			var type = e.type,
				args = e;
			
			switch( type ) {
				
				case 'play':
					this._playPause.removeClass('pbplayer-play').addClass('pbplayer-pause');
					break;
				
				case 'stop':
				case 'pause':	
					this._playPause.removeClass('pbplayer-pause').addClass('pbplayer-play');
					break;
				
				case 'volumechange':
					this._volumeSliderHandler.setStyle('bottom', args[0]+'%');
					this._volumeSlider.setStyle('height', args[0]+'%');
					
					this._volumeIndicator.removeClass('pbplayer-volumn3').removeClass('pbplayer-volumn2')
						.removeClass('pbplayer-volumn1').removeClass('pbplayer-volumn0');
					
					if( args[0] == 0 ) {
						
						this._volumeIndicator.addClass('pbplayer-volumn0');
					} else if ( args[0] < 40 ) {
						
						this._volumeIndicator.addClass('pbplayer-volumn1');
					} else if ( args[0] < 80 ) {
						
						this._volumeIndicator.addClass('pbplayer-volumn2');
					} else {
						
						this._volumeIndicator.addClass('pbplayer-volumn3');
					}
					
					break;
					
				case 'timeupdate':
					this._playtime.html( local.formatTime( parseFloat(args[0]) ) );
					
					var percent = parseFloat(args[0]) / (this.duration/100);
					
					if( isNaN(percent) == true	) percent = 0;
					
					this._playprogress.width( percent+"%" );
					this._progresshandler.setStyle( "left", percent+"%" );
					break;
				
				case 'duration':
					var time = new Date();
					time.setTime( parseFloat(args[0])*1000 );
					
					if( isNaN(time) === false ) {
						this._duration.html( local.formatTime( parseFloat(args[0]) ) );
					}
					
					this.duration = parseFloat(args[0]);
					break;
			
				case 'loadProgress':
					this._bufferbar.width( args[0]+'%' );
					break;
				
				case 'ended':
					// Stop or next in playlist :)
					this.player.pause();
					break;
			}
		},
		
		progressDragInit: function ( e ) {
			
			e.stop();
			
			// prevent text selection in IE 
			document.onselectstart = function () { return false; };
			
			$(document).on('mousemove', this.progressDragUpdateWrapper);
			$(document).on('mouseup', this.progressDragDestroyWrapper);
		},
		
		progressDragUpdate: function ( e ) {
			
			if( e.button !== 1 && e.button !== 0 ) {
				
				this.progressDragDestroy();
				return;
			}
			
			this.progressPoint( e );
		},
		
		progressDragDestroy: function () {
			
			document.onselectstart = null;
			
			$(document).off('mousemove', this.progressDragUpdateWrapper);
			$(document).off('mouseup', this.progressDragDestroyWrapper);
		},
		
		progressPoint: function ( e ) {
			
			var position = this._playerbar.getXY(true),
				width = this._playerbar.width(),
				x = e.pageX - position.left,
				percent = x / (width / 100);
		
			// Min / max
			percent = ( percent < 0 ) ? 0 : ( percent > 100 ) ? 100 : percent;
			
			this.player.playAt( this.duration * (percent/100) );
		},
		
		/**
		 * Set song title
		 */
		setTitle: function ( title ) {

			if( typeof title === 'string' ) {
				
				this._songTitle.show().html( title );
			} else {

				this._songTitle.hide();
			}
		},
		
		// ---- PLAYLIST ---- //
		setPlaylist: function () {
			
			var html = '';
			
			this.player.playlist.files.forEach(function ( playlistItem, index ){
				
				var _item = { title: 'Geen titel' };
				
				// Find item with title
				playlistItem.every(function ( item ){
					
					if( item.title ) {
						
						_item = item;
						return false;
					}
					
					return true;
				});
				
				if( _item === null ) {
					
					return;
				}
				
				html += '<li><a href="#" data-playlist-id="'+index+'" data-playlist-title="'+_item.title+'">'+_item.title+'<span>&nbsp;</span></a></li>';
				
			//	console.log( _item );
			});
			
			// Purge events
			this._playlistList.off();
			
			// Render playlist
			this._playlistList.html( html );
			this._playlistList.last().addClass('last');
			
			// Mimic behavior of active
			this.setTitle( this._playlistList.first().first().attr('data-playlist-title') );
			this._playlistList.first().first().addClass('pbplayer-playing');
			
			this._playlistList.on('click', this.playlistEvent.bind(this));
		},
		
		playlistEvent: function ( e ) {
			
			e.stop();
			
			var target = $(e.target).closest('a', 3),
				index,
				active;
			
			if( target === null ) {
				
				return;
			}
			
			this._duration.html('00:00');
			
			active = this._playlistList.find('.pbplayer-playing');
			active.invoke('removeClass', 'pbplayer-playing');
			
			index = parseInt(target.attr('data-playlist-id'));
			
			this.setTitle( target.attr('data-playlist-title') );
			target.addClass('pbplayer-playing');
			
			this.player.select( index );
		}
	});
	
	PB.Player.registerSkin('npo', npo);
	
})( PB );

