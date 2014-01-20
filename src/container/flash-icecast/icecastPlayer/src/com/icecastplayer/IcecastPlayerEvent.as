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
 */

package com.icecastplayer
{
	import flash.events.Event;
	
	public class IcecastPlayerEvent extends Event
	{
		public static const BUFFER_EMPTY:String = "bufferEmpty";
		public static const SECURITY_ERROR:String = "securityError";
		public static const IO_ERROR:String = "ioError";
		public static const PLAY_START:String = "playStart";
		
		public function IcecastPlayerEvent(type:String):void
		{
			super(type);
		}
		
		override public function clone():Event
		{
			return new IcecastPlayerEvent(type);
		}
	}
}