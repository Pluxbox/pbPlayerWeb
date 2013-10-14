/**
 * PB.Player
 */
package {
	
	// Includes
	import flash.system.System;
	import flash.system.Security;
	import flash.external.ExternalInterface;
	import flash.display.Sprite;
	import flash.net.URLRequest;
	import flash.events.*;
	import flash.media.Sound;
	import flash.media.SoundLoaderContext;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
	import flash.utils.Timer;
	
	
	public class pbplayer extends Sprite {
		
//	private var log:Boolean = true;

		private var audioURL:String;
		private var pbPlayerId:String;
		
		private var sound:Sound;
		private var audio:SoundChannel;
		private var request:URLRequest;
		
		private var audioLoaded:Boolean = false;
		private var isPlaying:Boolean = false;
		
		private var position:Number = 0;
		private var volumeLvl:Number = 0;
		// For calculated duration in load progress event
		private var duration:Number = 0;
		
		private var timeupdateTimer:Timer = new Timer( 333, 0 );
		private var memoryTimer:Timer = new Timer(1000, 0);
		
		private var progressTrottle:Number = 0;
		
		// Pseudo-streaming
		
		// Keep track of milliseconds that are in buffer
		private var streamBuffer:Object = {start: 0, end: 0};
		private var filesize:Number = 0;
		// Bytes from request is started
		private var pseudestreamStart:Number = 0;
		private var pseudestreamStartPercent:Number = 0;
		private var skipTime:Number = 0;

		//
		private var downloadStopped:Boolean = false;
		private var maxBytes:Number = (150 * 1024 * 1024);
		
		/**
		 * Constructor
		 */
		public function pbplayer ():void {
			
			flash.system.Security.allowDomain('*');
			
			debug("PB.Player Flex, V3.5.0");
			
			addGlobalEvents();
		}
		
		/**
		 * Register methods to browser
		 */
		public function addGlobalEvents ():void {
			
			ExternalInterface.addCallback('_playerId', playerId);
			
			ExternalInterface.addCallback('_src', setFile);
			ExternalInterface.addCallback('_play', play);
			ExternalInterface.addCallback('_pause', pause);
			ExternalInterface.addCallback('_stop', stop);
			ExternalInterface.addCallback('_playAt', playAt);
			ExternalInterface.addCallback('_volume', setVolume);
			ExternalInterface.addCallback('_close', close);
			
			// Add timer callback
			timeupdateTimer.addEventListener(TimerEvent.TIMER, timeupdate);
			memoryTimer.addEventListener(TimerEvent.TIMER, debugMemory);
			//memoryTimer.start();
		}
		
		/**
		 * Set pbplayer id
		 */
		public function playerId ( id:String ):void {
			
			pbPlayerId = id;
		}
		
		/**
		 * Set an file
		 * 
		 * External
		 */
		public function setFile ( src:String ):void {
			
			try {
				
				stop();
				sound.close();
			} catch(e:Error) {}
			
			audioURL = src;
			
			audioLoaded = false;
			
			resetPseudostream();
			
			connect();
		}
		
		private function connect ():void {
			
			audioLoaded = false;
			downloadStopped = false;
			
			// Change offset to start
			request = new URLRequest( audioURL+(pseudestreamStart ? (audioURL.indexOf('?') ? '?' : ':')+'start='+pseudestreamStart : '') );
			
			sound = new Sound;
			
			sound.addEventListener(Event.COMPLETE, completeHandler);
			sound.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
			sound.addEventListener(ProgressEvent.PROGRESS, progressHandler);
		}
		
		/**
		 * 
		 */
		public function close ():void {
			
			isPlaying = false;
			position = 0;
			
			audio.stop();
			
			timeupdateTimer.stop();
			
			try {

				sound.close();
			} catch(e:Error) {}
		}
		
		public function timeupdate (event:Event):void {

			if( downloadStopped && position && audio.position === position ) {

				streamBuffer.start = 0;
				streamBuffer.end = 0;

				playAt((skipTime + audio.position) / 1000);
			}

			position = audio.position;
			callPBArg('timeupdate', {
				
				position: (skipTime + audio.position) / 1000,
				progress: ((skipTime + audio.position)*(100 / duration)) || 0
			});
		}
		
		/**
		 *
		 */
		public function play ():void {
			
			if( audioLoaded === false ) {
				
				debug('loading');
				
				audioLoaded = true;
				
				sound.load( request );
			}
			
			if( isPlaying === true ) {
				
				return;
			}
			
			isPlaying = true;
			
			var hasPlayed:Boolean = !!audio;
			
			audio = sound.play( position, 0, audio ? audio.soundTransform : null );
			audio.addEventListener(Event.SOUND_COMPLETE, soundCompleteHandler);
			
			// Set volume
			if( hasPlayed === false ) {
				
				setVolume(volumeLvl);
			}
			
			timeupdateTimer.start();
			
			callPB('play');
		}
		
		/**
		 *
		 */
		public function pause ():void {
			
			if( isPlaying === false ) {
				
				return;
			}
			
			isPlaying = false;
			
			position = audio.position;
			audio.stop();
			
			timeupdateTimer.stop();
			
			callPB('pause');
		}
		
		/**
		 *
		 */
		public function stop ():void {
			
			if( isPlaying === false ) {
				
				return;
			}
			
			close();
			
			callPBArg('timeupdate', {
				
				position: 0,
				progress: 0
			});
			callPB('stop');
		}
		
		/**
		 *
		 */
		public function playAt ( seconds:Number ):void {
			
			pause();
			
			// New position
			position = seconds * 1000;
			
			// Handle unbuffered content
			if( !(position > streamBuffer.start && position < streamBuffer.end) ) {
				
				debug("Not in buffer!");
				
				pseudestreamStart = Math.floor(((position*(100 / duration)) / 100) * filesize);
				pseudestreamStartPercent = ((pseudestreamStart / filesize) || 0);
				skipTime = duration * pseudestreamStartPercent;

				debug('pseudestreamStart: '+pseudestreamStart+' pseudestreamStartPercent: '+pseudestreamStartPercent+' skipTime: '+skipTime);

				streamBuffer.start = position;
				streamBuffer.end = position;
				
				// Start playing form zero seconds
				position = 0;

				close();
				connect();
			} else {
				
				position = (seconds * 1000) - skipTime;
			}
			
			play();
			
			callPBArg('timeupdate', {
				
				position: (skipTime + position) / 1000,
				progress: ((skipTime + audio.position)*(100 / duration)) || 0
			});
		}
		
		/**
		 *
		 */
		public function setVolume ( volume:Number ):void {
			
			volumeLvl = volume;
			
			if( !audio ) {
				
				return;
			}

			volume = volume / 100;
			
			var transform:SoundTransform = audio.soundTransform;
			transform.volume = volume;
			audio.soundTransform = transform;
			
			callPBArg('volumechange', {
				
				volume: volume*100
			});
		}
		
		/**
		 * Call pbplayer with
		 */
		public function callPB ( type:String ):void {
			
			ExternalInterface.call('PB.Player.instances["'+pbPlayerId+'"].emit', type);
		}
		
		public function callPBArg ( type:String, arg:Object ):void {
			
			ExternalInterface.call('PB.Player.instances["'+pbPlayerId+'"].emit', type, arg);
		}
		
		/**
		 *
		 */
		public function debug ( msg:String ):void {
			
			ExternalInterface.call("console.log", msg);
		}
		
		public function debugMemory ( e:TimerEvent ):void {
			
			// totalMemory is shared accross all player instances
			ExternalInterface.call("console.log", 'Memory: '+(System.totalMemory / 1024 / 1024).toFixed()+' mb');
		}
		
		private function completeHandler(event:Event):void {
			
			callPB('loaded');
			
			callPBArg('progress', {
				
				loaded: 100
			});
			
			// Setting end of streamBuffer
			streamBuffer.end = streamBuffer.start + sound.length;
			
			if( !pseudestreamStart ) {
				
				duration = sound.length;

				callPBArg('duration', {

					length: duration / 1000
				});
			}
        }

        private function ioErrorHandler(event:Event):void {
			
			stop();

			debug("File not found: "+audioURL);
			callPBArg('error', {
				
				message: 'File not found'
			});
        }

        private function progressHandler(event:ProgressEvent):void {
		
			// Flash fires like a trilion progress events each second so throttle
			// progress event to ~3 event per second
			if( (progressTrottle + 300) > (new Date()).getTime() ) {
				
				return;
			}
			
			progressTrottle = (new Date()).getTime();

			//debug( (event.bytesTotal / 1024 / 1024)+' mb' );
			
			callPBArg('progress', {
				
				loaded: Math.max( Math.min(100, (((event.bytesLoaded / event.bytesTotal)*100) * pseudestreamStartPercent)+(pseudestreamStartPercent*100)), (event.bytesLoaded / event.bytesTotal)*100 )
			});
			
			if( isNaN((sound.bytesTotal / (sound.bytesLoaded/sound.length)) / 1000) ) {
				
				return;
			}
			
			if( !pseudestreamStart ) {
			
				filesize = sound.bytesTotal;
				duration = filesize / (sound.bytesLoaded/sound.length);
			}
			
			// Setting end of streamBuffer
			streamBuffer.end = streamBuffer.start + sound.length;
			
//			debug( streamBuffer.start+' '+streamBuffer.end );
			
			callPBArg('duration', {
				
				length: duration / 1000
			});

			//
			if( event.bytesTotal > maxBytes ) {

				if( event.bytesLoaded > maxBytes ) {

					debug('Closing download');

					downloadStopped = true;
					sound.close();

					return;
				}
			}
        }

		private function soundCompleteHandler(event:Event):void {
			
			position = 0;
			// Reset pseudo stream vars
			pseudestreamStart = 0;
			pseudestreamStartPercent = 0;
			skipTime = 0;
			
			audio.stop();
			timeupdateTimer.stop();
			
			callPB('ended');
		}
		
		private function resetPseudostream ():void {
			
			// Reset pseudo stream vars
			pseudestreamStart = 0;
			pseudestreamStartPercent = 0;
			skipTime = 0;
			streamBuffer.start = 0;
			streamBuffer.end = 0;
		}
	}
}

