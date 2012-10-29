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
 * Documentation: http://mpgedit.org/mpgedit/mpeg_format/mpeghdr.htm
 * 
 */
package com.icecastplayer
{
	import flash.utils.ByteArray;

	public class MpegHeader
	{
		public static const VERSION_25:int = 0;
		public static const VERSION_2:int = 2;
		public static const VERSION_1:int = 3;
		
		public static const LAYER_1:int = 3;
		public static const LAYER_2:int = 2;
		public static const LAYER_3:int = 1;
		
		public static const CHANNEL_STEREO:int = 0;
		public static const CHANNEL_JOINT_STEREO:int = 1;
		public static const CHANNEL_DUAL:int = 2;
		public static const CHANNEL_MONO:int = 3;
		
		private static const FrameSyncMask:uint = 0xffe00000;
		private static const AudioVersionIdMask:uint = 0x180000;
		private static const LayerMask:uint = 0x60000;
		private static const ProtectionMask:uint = 0x10000;
		private static const BitrateMask:uint = 0xf000;
		private static const SamplingRateMask:uint = 0xc00;
		private static const PaddingMask:uint = 0x200;
		private static const ChannelModeMask:uint = 0xc0;
		private static const CopyrightMask:uint = 0x8;
		private static const OriginalMask:uint = 0x4;
		
		private static const BitRateV1L1:Array = [0, 32000, 64000, 96000, 128000, 160000, 192000, 224000, 256000, 288000, 320000, 352000, 384000, 416000, 448000, -1];
		private static const BitRateV1L2:Array = [0, 32000, 48000, 56000, 64000, 80000, 96000, 112000, 128000, 160000, 192000, 224000, 256000, 320000, 384000, -1];
		private static const BitRateV1L3:Array = [0, 32000, 40000, 48000, 56000, 64000, 80000, 96000, 112000, 128000, 160000, 192000, 224000, 256000, 320000, -1];
		private static const BitRateV2L1:Array = [0, 32000, 48000, 56000, 64000, 80000, 96000, 112000, 128000, 144000, 160000, 176000, 192000, 224000, 256000, -1];
		private static const BitRateV2L2L3:Array = [0, 8000, 16000, 24000, 32000, 40000, 48000, 56000, 64000, 80000, 96000, 112000, 128000, 144000, 160000, -1];
		
		/**
		 * Constructor.
		 */
		public function MpegHeader()
		{
			reset();
		}
		
		/**
		 * Reset.
		 */
		public function reset():void
		{
			header = 0;
		}
		
		/**
		 * MPEG header parser. Performs minimal validation of header.
		 */
		public function parse(stream:ByteArray):Boolean
		{
			if (stream.bytesAvailable < 4)
			{
				return false;
			}
			header = stream.readUnsignedInt();
			if ((header & FrameSyncMask) ^ FrameSyncMask)
			{
				return false;
			}
			version = (header & AudioVersionIdMask) >> 19;	
			if (1 == version)
			{
				return false;
			}
			
			layer = (header & LayerMask) >> 17;
			if (0 == layer)
			{
				return false;
			}
			
			if (LAYER_1 == layer)
			{
				samplesPerFrame = 384;
			}
			else if (LAYER_2 == layer || LAYER_3 == layer)
			{
				samplesPerFrame = 1152;	
			}

			protection = (header & ProtectionMask) >> 16;
			
			var bitrateIndex:uint = (header & BitrateMask) >> 12;
			
			if (15 == bitrateIndex)
			{
				return false;
			}
			
			if (VERSION_1 == version)
			{
				switch (layer)
				{
					case LAYER_1:
						bitrate = BitRateV1L1[bitrateIndex];
						break;
					case LAYER_2:
						bitrate = BitRateV1L2[bitrateIndex];
						break;
					case LAYER_3:
						bitrate = BitRateV1L3[bitrateIndex];
						break;
				}
			}
			else if (VERSION_2 == version)
			{
				switch (layer)
				{
					case LAYER_1:
						bitrate = BitRateV2L1[bitrateIndex];
						break;
					case LAYER_2:
					case LAYER_3:
						bitrate = BitRateV2L2L3[bitrateIndex];
						break;
				}
			}
			
			var samplingRateIndex:uint = (header & SamplingRateMask) >> 10;
			if (3 == samplingRateIndex)
			{
				return false;
			}
			switch (version)
			{
				case VERSION_1:
					switch (samplingRateIndex)
					{
						case 0:
							samplingRate = 44100;
							break;
						case 1:
							samplingRate = 48000;
							break;
						case 2:
							samplingRate = 32000;
							break;
					}
					break;
				case VERSION_2:
					switch (samplingRateIndex)
					{
						case 0:
							samplingRate = 22050;
							break;
						case 1:
							samplingRate = 24000;
							break;
						case 2:
							samplingRate = 16000;
							break;
					}
					break;
				case VERSION_25:
					switch (samplingRateIndex)
					{
						case 0:
							samplingRate = 11025;
							break;
						case 1:
							samplingRate = 12000;
							break;
						case 2:
							samplingRate = 8000;
							break;
					}
					break;
			}
			
			padding = (header & PaddingMask) >> 9;
			
			if (LAYER_1 == layer)
			{
				frameLengthBytes = (12 * bitrate / samplingRate + padding) * 4;	
			}
			else if (LAYER_2 == layer || LAYER_3 == layer)
			{
				frameLengthBytes = 144 * bitrate / samplingRate + padding;
			}
			
			duration = 1000 * samplesPerFrame / samplingRate;
			
			channelMode = (header & ChannelModeMask) >> 6;
			copyright = (header & CopyrightMask) >> 3;
			original = (header & OriginalMask) >> 2;
			
			return true;
		}
		
		public var version:int = -1;
		public var layer:int = -1;
		public var protection:int = -1;
		public var bitrate:int = -1;
		public var samplingRate:int = -1;
		public var padding:int = -1;
		public var channelMode:int = -1;
		public var frameLengthBytes:int = -1;
		public var samplesPerFrame:int = -1;
		public var copyright:int = -1;
		public var original:int = -1;
		public var duration:int = -1;
		
		public var header:uint = 0;
	}
}