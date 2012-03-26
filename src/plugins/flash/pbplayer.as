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

	//	private var audioURL:String = "http://shoutcast.omroep.nl:8248/;stream.nsv";
	//	private var audioURL:String = "http://ics2css.omroep.nl/3fm-bb.mp3?q=/npo/mp3/3fm-bb.pls";
		private var audioURL:String;
		private var pbPlayerId:String;
		
		private var sound:Sound;
		private var audio:SoundChannel;
		private var request:URLRequest;
		
		private var audioLoaded:Boolean = false;
		private var isPlaying:Boolean = false;
		
		private var position:Number = 0;
		private var volumeLvl:Number = 0;
		
		private var timeupdateTimer:Timer = new Timer( 333, 0 );
		
		private var bufferTime:Number = 5;	// In seconds
		
		private var progressTrottle:Number = 0;
		
		/**
		 * Constructor
		 */
		public function pbplayer ():void {
			
			flash.system.Security.allowDomain('*');
			
			debug("PB.Player Flex, V3.3.0");
			
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
			
			// Add timer callback
			timeupdateTimer.addEventListener(TimerEvent.TIMER, timeupdate);
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
			
			request = new URLRequest( audioURL );
			
			audioLoaded = false;
			
			sound = new Sound;
			
			sound.addEventListener(Event.COMPLETE, completeHandler);
		//	sound.addEventListener(Event.ID3, id3Handler);
			sound.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
			sound.addEventListener(ProgressEvent.PROGRESS, progressHandler);
		}
		
		public function timeupdate (event:Event):void {
			
			position = audio.position;
			callPBArg('timeupdate', {
				
				position: audio.position / 1000,
				progress: (audio.position*(100 / sound.length)) || 0
			});
		}
		
		/**
		 *
		 */
		public function play ():void {
			
			if( audioLoaded === false ) {
				
				debug('loading');
				
				audioLoaded = true;
				
				debug('bufferTime: '+bufferTime.toString()+'s');
				var slc:SoundLoaderContext = new SoundLoaderContext( bufferTime*1000, false );
				
				sound.load( request, slc );
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
			
			isPlaying = false;
			
			position = 0;
			audio.stop();
			
			timeupdateTimer.stop();
			
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
			position = seconds * 1000;
			play();
			
			callPBArg('timeupdate', {
				
				position: position / 1000,
				progress: audio.position*(100 / sound.length)
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
			
			ExternalInterface.call("console.log", ['Memory: '+System.totalMemory.toString()]);
		}
		
		private function completeHandler(event:Event):void {
			
			callPBArg('progress', {
				
				loaded: 100
			});
			callPBArg('duration', {
				
				position: (sound.bytesTotal / (sound.bytesLoaded/sound.length)) / 1000
			});
        }

        private function ioErrorHandler(event:Event):void {
			
			stop();

			debug("File not found: "+audioURL);
			callPBArg('error', {
				
				message: 'File not found'
			});
        }

        private function progressHandler(event:ProgressEvent):void {
		
			// Flash fires like a trilion progress events each second
			if( (progressTrottle + 300) > (new Date()).getTime() ) {
				
				return;
			}
			
			progressTrottle = (new Date()).getTime();
			
			callPBArg('progress', {
				
				loaded: (event.bytesLoaded / event.bytesTotal) * 100
			});
			
			if( isNaN((sound.bytesTotal / (sound.bytesLoaded/sound.length)) / 1000) ) {
				
				return;
			}
			
			callPBArg('duration', {
				
				position: (sound.bytesTotal / (sound.bytesLoaded/sound.length)) / 1000
			});
        }

		private function soundCompleteHandler(event:Event):void {
			
			position = 0;
			audio.stop();
			timeupdateTimer.stop();
			
			callPB('ended');
		}
	}
}

