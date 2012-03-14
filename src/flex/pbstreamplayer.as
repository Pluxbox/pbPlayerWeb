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
	
	
	public class pbstreamplayer extends Sprite {

		private var audioURL:String;
		private var pbPlayerId:String;
		
		private var sound:Sound;
		private var presound:Sound;
		private var audio:SoundChannel;
		private var request:URLRequest;
		
		private var audioLoaded:Boolean = false;
		private var isPlaying:Boolean = false;
		
		private var position:Number = 0;
		private var volumeLvl:Number = 0;
		
		private var streamTimer:Timer = new Timer( 1200 * 1000, 0 );	// 20 minutes stream switch
		
		private var bufferTime:Number = 10;	// In seconds
		
		private var progressTrottle:Number = 0;
		
		private var preloadTime:Number = 0;
		private var hasBuffered:Boolean = false;
		
		/**
		 * Constructor
		 */
		public function pbstreamplayer ():void {
			
			flash.system.Security.allowDomain('*');
			
			debug("PB.Player Flex Stream, V3.3.0");
			
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
			streamTimer.addEventListener(TimerEvent.TIMER, switchstream);
		}
		
		public function switchstream ( event:Event ):void {
			
			debug('PB.Player Flex Stream, switch');
			
			streamTimer.stop();
			
			// Stop loading data
			try {
				
				sound.close();
			} catch ( e:Error ){
				
				debug( 'sound: '+e.message );
			}
			
			try {
				
				presound.close();
			} catch ( e:Error ){
				
				debug( 'presound: '+e.message );
			}
			
			request = null;
			request = new URLRequest( audioURL + (audioURL.indexOf('?') === -1 ? '?' : '&') + 'non_cache=' + (new Date).getTime() );
			
			presound = null;
			presound = new Sound;
			
			presound.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
			presound.addEventListener(ProgressEvent.PROGRESS, preloadProgressHandler);
			
			var slc:SoundLoaderContext = new SoundLoaderContext( bufferTime*1000, false );
			
			hasBuffered = false;
			preloadTime = 0;//(new Date).getTime();
			
			presound.load( request, slc );
			
		//	setFile( audioURL );
		//	play();
		}
		
		public function preloadProgressHandler ( event:ProgressEvent ):void {
			
			if( presound.isBuffering === false && hasBuffered === false ) {
				
				debug('Buffering done');
				
				hasBuffered = true;
				
				audio.stop();
				isPlaying = false;
				
				presound.removeEventListener( ProgressEvent.PROGRESS, preloadProgressHandler );
				
				position = (new Date).getTime() - preloadTime;
				debug('Resume time in stream: '+position.toString());
				
				sound = presound;
				presound = null;
				streamTimer.start();
				
				audio = sound.play(0, 0, null);
				var transform:SoundTransform = audio.soundTransform;
				transform.volume = volumeLvl/100;
				audio.soundTransform = transform;
				
				isPlaying = true;
				
			//	play();
			}
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
		public function setFile ( src:String, useStop:Boolean = true ):void {
			
			debug( 'Flash: '+src );
			
			try {
				
				if( useStop ) {
					
					stop();
				}
				
				sound.close();
			} catch(e:Error) {}
			
			audioURL = src;
			
			request = new URLRequest( audioURL + (audioURL.indexOf('?') === -1 ? '?' : '&') + 'non_cache=' + (new Date).getTime() );
			
			audioLoaded = false;
			
			sound = new Sound;
			
			sound.addEventListener(Event.COMPLETE, completeHandler);
			sound.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
			sound.addEventListener(ProgressEvent.PROGRESS, progressHandler);
		}
		
		/**
		 *
		 */
		public function play ():void {
			
			if( audioLoaded === false ) {
				
				debug('load audio');
				
				audioLoaded = true;
				
				debug('bufferTime: '+bufferTime.toString()+'s');
				var slc:SoundLoaderContext = new SoundLoaderContext( bufferTime*1000, false );
				
				sound.load( request, slc );
			}
			
			if( isPlaying === true ) {
				
				debug('is playing');
				
				return;
			}
			
			isPlaying = true;
			
			var hasPlayed:Boolean = !!audio;
			
			audio = sound.play( position, 0, null );//, audio ? audio.soundTransform : null );
			
			// Set volume
			if( hasPlayed === false ) {
				
				setVolume(volumeLvl);
			}
			
			streamTimer.start();
			
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
			
			streamTimer.stop();
			
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
			setFile( audioURL, false );
			
			streamTimer.stop();
			
			callPBArg('timeupdate', '0');
			callPB('stop');
		}
		
		/**
		 *
		 */
		public function playAt ( seconds:Number ):void {
			
			pause();
			position = seconds * 1000;
			play();
			
			callPBArg('timeupdate', (position / 1000).toString());
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
			
			callPBArg('volumechange', (volume*100).toString());
		}
		
		/**
		 * Call pbplayer with
		 */
		public function callPB ( type:String ):void {
			
			ExternalInterface.call('PB.Player.instances.'+pbPlayerId+'.fire', type);
		}
		
		public function callPBArg ( type:String, arg:String ):void {
			
			ExternalInterface.call('PB.Player.instances.'+pbPlayerId+'.fire', type, [arg]);
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
			
			callPBArg('loadProgress', '100');
        }

        private function ioErrorHandler(event:Event):void {

			debug("File not found: "+audioURL);
			callPBArg('error', 'Failed to load fle');
        }

        private function progressHandler(event:ProgressEvent):void {
		
			// Flash fires like a trilion progress events each second
			if( (progressTrottle + 300) > (new Date()).getTime() ) {
				
				return;
			}
			
			progressTrottle = (new Date()).getTime();
			
			callPBArg('loadProgress', Math.ceil( (event.bytesLoaded / event.bytesTotal) * 100 ).toString());
			callPBArg('duration', ((sound.bytesTotal / (sound.bytesLoaded/sound.length)) / 1000).toString());
        }

		private function soundCompleteHandler(event:Event):void {
			
			position = 0;
			audio.stop();
			
			callPB('ended');
		}
	}
}

