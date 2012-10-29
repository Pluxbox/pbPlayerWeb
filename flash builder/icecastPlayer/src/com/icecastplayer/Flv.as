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
	import flash.utils.ByteArray;

	public class Flv
	{	
		public static const SOUND_FORMAT_MP3:int = 2;
		
		private static const TAG_TYPE_AUDIO:int = 8;
		private static const TAG_HEADER_SIZE:int = 11;
		private static const FLV_HEADER_SIZE:int = 9;
		
		/**
		 * Constructor.
		 */
		public function Flv()
		{
			reset();
		}
		
		/**
		 * Reset.
		 */
		public function reset():void
		{
			timestamp = 0;
			headerSent = false;
			previousTagSize = 0;
		}
		
		/**
		 * Create FVL header.
		 */
		public function getHeader():ByteArray
		{
			var header:ByteArray = new ByteArray();
			header.writeByte(0x46); // 'F'
			header.writeByte(0x4c); // 'L'
			header.writeByte(0x56); // 'V'
			header.writeByte(0x01); // version 0x01
			
			header.writeByte(0x04); // hasAudio
			
			header.writeUnsignedInt(FLV_HEADER_SIZE);
			
			previousTagSize = 0;
			
			headerSent = true;
			
			return header;
		}
		
		/**
		 * Create FLV Tag header, includes one byte of audio header as well. 
		 */
		public function getAudio(dataSize:int, duration:uint, format:int, channels:int):ByteArray
		{
			// flv header
			var message:ByteArray = new ByteArray();
			message.length = TAG_HEADER_SIZE + 1;
			
			// type
			message.writeByte(TAG_TYPE_AUDIO);
			
			// size
			message.writeByte(((dataSize + 1)>> 16) & 0xff);
			message.writeByte(((dataSize + 1) >> 8) & 0xff);
			message.writeByte((dataSize + 1) & 0xff);
			
			// timestamp
			message.writeByte((timestamp >> 16) & 0xff);
			message.writeByte((timestamp >> 8) & 0xff);
			message.writeByte(timestamp & 0xff);
			message.writeByte((timestamp >> 24) & 0xff);
			
			// stream id
			message.writeByte(0);
			message.writeByte(0);
			message.writeByte(0);
			
			timestamp += duration;
			
			// audio header
			var audioTagHeader:int = 0;
			audioTagHeader = format << 4;
				
			// rate must be 44 kHz
			audioTagHeader |= 0xc;
			
			// always 16 bit
			audioTagHeader |= 0x2;
			
			if (1 == channels)
			{
				audioTagHeader |= 0x1;
			}
			else
			{
				audioTagHeader &= 0xfe;
			}
			
			message.writeByte(audioTagHeader);
			
			previousTagSize = TAG_HEADER_SIZE + dataSize + 1;
			
			return message;
		}
		
		/**
		 * Returns a ByteArray with the previous tage size.
		 */
		public function getTagSize():ByteArray
		{
			var b:ByteArray = new ByteArray();
			b.length = 4;
			b.writeUnsignedInt(previousTagSize);
			return b;
		}
		
		private var timestamp:uint = 0;
		public var headerSent:Boolean = false;
		private var previousTagSize:uint = 0;
	}
}