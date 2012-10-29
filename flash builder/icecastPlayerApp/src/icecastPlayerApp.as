package
{
	import com.icecastplayer.IcecastPlayer;
	
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.TimerEvent;
	import flash.external.*;
	import flash.net.URLRequest;
	import flash.system.System;
	import flash.utils.Timer;
	
	public class icecastPlayerApp extends Sprite
	{
		private var audioURL:String;
		private var pbPlayerId:String;
		
		private var request:URLRequest;
		
		private var isPlaying:Boolean = false;
		
		private var player:IcecastPlayer;
		
		private var volumeTimer:Timer = new Timer( 50, 0 );
		private var storedVolume:Number;
				
		public function icecastPlayerApp()
		{
			flash.system.Security.allowDomain('*');
			
			debug("PB.Player Icecast Stream, V1.0.0");
			
			addGlobalEvents();
		}
		
		private function addGlobalEvents ():void {
			
			ExternalInterface.addCallback('_playerId', playerId);
			
			ExternalInterface.addCallback('_src', setFile);
			ExternalInterface.addCallback('_play', play);
			ExternalInterface.addCallback('_pause', stop);
			ExternalInterface.addCallback('_stop', stop);
			ExternalInterface.addCallback('_volume', setVolume);
			
			volumeTimer.addEventListener(TimerEvent.TIMER, triggerVolume);
		}
		
		private function triggerVolume ( event:Event ):void {
			
			if( player && player.setVolume( storedVolume ) ) {
				
				volumeTimer.stop();
			}
		}
		
		/**
		 * Set pbplayer id
		 */
		public function playerId ( id:String ):void {
			
			debug( 'playerId: '+id );
			
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
			} catch(e:Error) {}
			
			audioURL = src;
			
			request = new URLRequest( audioURL + (audioURL.indexOf('?') === -1 ? '?' : '&') + 'non_cache=' + (new Date).getTime() );
			
			player = new IcecastPlayer(request); 
		}
		
		/**
		 *
		 */
		public function play ():void {
						
			if( isPlaying === true ) {
				
				debug('is playing');
				
				return;
			}
			
			isPlaying = true;

			player.play();
			
			callPB('play');
		}
		
		/**
		 *
		 */
		public function stop ():void {
			
			if( isPlaying === false ) {
				
				return;
			}
			
			isPlaying = false;
			
			debug("Stopping");
			
			player.stop();
			
			callPB('stop');
		}
		
		/**
		 *
		 */
		public function setVolume ( volume:Number ):void {
			
			if( !player || !player.setVolume( volume ) ) {
				
				storedVolume = volume;
				volumeTimer.start();
				return;
			}
			
			player.setVolume( volume );
			
			callPBArg('volumechange', {
				
				volume: volume
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
			
			System.gc();
			
			ExternalInterface.call("console.log", 'Memory: '+(System.totalMemory / 1024 / 1024).toString()+' MB');
		}
	}
}