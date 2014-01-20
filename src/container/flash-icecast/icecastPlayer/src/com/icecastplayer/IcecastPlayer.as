/**
 * 
 * ADOBE SYSTEMS INCORPORATED
 * Copyright 2012 Adobe Systems Incorporated
 * All Rights Reserved.
 * 
 * NOTICE: Adobe permits you to use, modify, and distribute this file
 * in accordance with the terms of the license agreement accompanying it.
 *
 * Author: Jozsef Vass
 *
 * ====================================================================
 *
 * Typical response:
 * HTTP/1.0 200 OK
 * Content-Type: audio/mpeg
 * icy-br:128
 * ice-audio-info: bitrate=128;samplerate=44100;channels=2
 * icy-br:128
 * icy-description:Description
 * icy-genre:Genre
 * icy-name:Name
 * icy-pub:1
 * icy-url:http://stream.expample.com
 * Server: Icecast 2.3.2-kh30-advert-14
 * Cache-Control: no-cache
 * Expires: Mon, 26 Jul 1997 05:00:00 GMT
 * Pragma: no-cache
 *
 * Using URLStream, we cannot get response headers. Another solution is to use Socket class.
 * 
 * http://jicyshout.sourceforge.net/oreilly-article/java-streaming-mp3-pt2/java-streaming-mp3-pt2.html 
 */

package com.icecastplayer
{
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.NetStatusEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.net.NetConnection;
	import flash.net.NetStream;
	import flash.net.URLRequest;
	import flash.net.URLStream;
	import flash.utils.ByteArray;
	import flash.media.SoundTransform;
	
	/**
	 * Dispatched when buffer undeflow.
	 */
	[Event(name="BUFFER_EMPTY", type="IcecastPlayerEvent")];
	
	/**
	 * Dispatched when failed to load URL.
	 */
	[Event(name="IO_ERROR", type="IcecastPlayerEvent")];
	
	/**
	 * Dispatched when security error occured when loading URL.
	 */
	[Event(name="SECURITY_ERROR", type="IcecastPlayerEvent")];
	
	/**
	 * Dispatched when playback has started.
	 */
	[Event(name="PLAY_START", type="IcecastPlayerEvent")];
	
	
	public class IcecastPlayer extends EventDispatcher
	{	
		/**
		 * Constructor.
		 */
		public function IcecastPlayer(r:URLRequest):void
		{
			request = r;
			sync = SYNC_NONE;
			mpeg = new MpegHeader();
			flv = new Flv();
		}
		
		/**
		 * Start playing the resource.
		 */
		public function play():void
		{
			mpeg.reset();
			flv.reset();
			
			bytesLoaded = 0;
			
			httpConnect();
			
			status("Conencting to " + request.url + "\n");
			
			soundStream = new URLStream();
			soundStream.addEventListener(ProgressEvent.PROGRESS, onData);
			soundStream.addEventListener(Event.COMPLETE, onComplete);
			soundStream.addEventListener(IOErrorEvent.IO_ERROR, onIoError);
			soundStream.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onSecurityError);
			soundStream.addEventListener(HTTPStatusEvent.HTTP_STATUS, onHttpStatus);
			try
			{
				soundStream.load(request);
			}
			catch (e:Error)
			{
				status("URL loader error: " + e + "\n");
				dispatchEvent(new IcecastPlayerEvent(IcecastPlayerEvent.IO_ERROR));
			}
			
			netStream = new NetStream(netConnection);
			netStream.addEventListener(NetStatusEvent.NET_STATUS, netStatusHandler);
			netStream.bufferTime = 1;
			netStream.play(null);
		}
		
		/**
		 * Retrieve the parsed MPEG header.
		 */
		public function get mpegHeader():MpegHeader
		{
			return mpeg;
		}
		
		/**
		 * Get play time.
		 */
		public function get time():Number
		{
			if (netStream)
			{
				return netStream.time;
			}
			
			return 0;
		}
		
		/**
		 * Get the amount of data buffered in seconds.
		 */
		public function get bufferLength():Number
		{
			if (netStream)
			{
				return netStream.bufferLength;
			}
			
			return 0;
		}
		
		/**
		 * Stop playback.
		 */
		public function stop():void
		{
			if (netStream)
			{
				netStream.close();
			}
			
			if (netConnection)
			{
				netConnection.close();
				netConnection = null;
			}
			
			if (soundStream)
			{
				soundStream.close();
				soundStream = null;
			}
		}
		
		public function setVolume ( volume:Number ):Boolean {
			
			volume = volume / 100;
			
			if( !netStream ) {
				
				return false;
			}
			
			var transform:SoundTransform = netStream.soundTransform;
			transform.volume = volume;
			netStream.soundTransform = transform;
			
			return true;
		}
		
		private function httpConnect():void
		{	
			netConnection = new NetConnection();
			netConnection.addEventListener(NetStatusEvent.NET_STATUS, netStatusHandler);
			netConnection.connect(null);
		}
		
		private function netStatusHandler(e:NetStatusEvent):void
		{
			status("NetStatus event: " + e.info.code + "\n");
			if (e.info.code == "NetStream.Buffer.Empty")
			{
				dispatchEvent(new IcecastPlayerEvent(IcecastPlayerEvent.BUFFER_EMPTY));
			} 
			else if (e.info.code == "NetStream.Buffer.Full")
			{
				dispatchEvent(new IcecastPlayerEvent(IcecastPlayerEvent.PLAY_START));
			}
		}
		
		private function onData(e:ProgressEvent):void
		{
			if (netStream && soundStream && soundStream.bytesAvailable > 0)
			{
//				status("Data: " + soundStream.bytesAvailable + "\n");
				
				var b:ByteArray = new ByteArray();
	
				while (soundStream.bytesAvailable >= 512)
				{
					if (!flv.headerSent)
					{
						status("Sending FLV header\n");
						netStream.appendBytes(flv.getHeader());
						netStream.appendBytes(flv.getTagSize());
					}
					
					if (SYNC_NONE == sync)
					{
						status("Looking for sync\n");
						var idx:int = 0;
						while (soundStream.bytesAvailable > 0)
						{
							bytesLoaded++;
							idx++;
							if (0xff == soundStream.readUnsignedByte())
							{
								status("Potential sync location: " + idx + ", available: " + soundStream.bytesAvailable + "\n");
								b.position = 0;	
								b.length = 4;
								b[0] = 0xff;
								soundStream.readBytes(b, 1, 3);
								bytesLoaded += 3;
								idx += 3;
								if (mpeg.parse(b))
								{
									status("Initial MPEG header read, size: " + mpeg.frameLengthBytes + "\n");
									sync = SYNC_POTENTIAL;
									break;
								}
								status("Sync not yet found\n");
							}
						}
						
						if (SYNC_NONE == sync)
						{
							status("Out of data, sync not found: " + idx + "\n");
							return;
						}
					}
					else if (SYNC_POTENTIAL == sync)
					{
						status("Skipping initial frame\n");
						var skipSize:int = mpeg.frameLengthBytes - 4;
						if (soundStream.bytesAvailable < skipSize)
						{
							break;
						}
						soundStream.readBytes(b, 0, skipSize);
						bytesLoaded += skipSize;
						sync = SYNC_OK;
						expectingHeader = true;
					}
					else
					{
						if (expectingHeader)
						{				
							b.position = 0;	
							b.length = 4;
							soundStream.readBytes(b, 0, 4);
							bytesLoaded += 4;
								
							if (!mpeg.parse(b))
							{
								// it is important to note that we do not drain the buffer, 
								status("Failed to parse header, bytes available: " + soundStream.bytesAvailable + "\n");
								sync = SYNC_NONE;
								break;
							}
							
	//						status("MPEG header read, size: " + mpeg.frameLengthBytes + "\n");
							
							expectingHeader = false;
						}
						
						var dataSize:int = mpeg.frameLengthBytes - 4;
							
						if (soundStream.bytesAvailable < dataSize)
						{
							break;
						}
							
						// append audio header
						netStream.appendBytes(flv.getAudio(mpeg.frameLengthBytes, mpeg.duration, Flv.SOUND_FORMAT_MP3, mpeg.channelMode == MpegHeader.CHANNEL_MONO ? 1 : 2)); 

						// append data
						b.position = 0;
						b.writeUnsignedInt(mpeg.header);
						b.length = dataSize + 4;
						soundStream.readBytes(b, 4, dataSize);
						bytesLoaded += dataSize;
						netStream.appendBytes(b);
							
						// append FLV Tag size
						netStream.appendBytes(flv.getTagSize());
							
						expectingHeader = true;
					}
				}
			}
		}
		
		private function onComplete(e:Event):void
		{
			status("HTTP download complete.\n");
		}
		
		private function onIoError(e:IOErrorEvent):void
		{
			status("HTTP download error: " + e + "\n");
			dispatchEvent(new IcecastPlayerEvent(IcecastPlayerEvent.IO_ERROR));
		}
		
		private function onSecurityError(e:SecurityErrorEvent):void
		{
			status("HTTP download security error: " + e + "\n");
			dispatchEvent(new IcecastPlayerEvent(IcecastPlayerEvent.SECURITY_ERROR));
		}
		
		private function onHttpStatus(e:HTTPStatusEvent):void
		{
			status("HTTP status: " + e.status + "\n");
		}
		
		private function status(msg:String):void
		{
			//trace (msg);
		}
		
		private static const SYNC_NONE:int = 0;
		private static const SYNC_POTENTIAL:int = 1;
		private static const SYNC_OK:int = 2;
		
		private var sync:int = SYNC_NONE;
		
		private var mpeg:MpegHeader = null;
		private var flv:Flv = null;
		
		private var netConnection:NetConnection = null;
		private var netStream:NetStream = null;
		
		private var soundStream:URLStream = null;
		
		public var bytesLoaded:uint = 0;
		
		private var request:URLRequest = null;
		
		private var expectingHeader:Boolean = true;
	}
}