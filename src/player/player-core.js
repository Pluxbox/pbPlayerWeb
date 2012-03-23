/**
 * PBPlayer global options
 */
local.options = {
	
	path: 'static/pbplayer/',	// Used to get skin, swf, etc...
	volume: 80,
	autostart: false,
	skin: false,
	renderTo: null,				// Render skin to
	timeFormat: 'i:s',
	loop: false,
	simple: true
};

local.id = 0;

/**
 *
 */
$.Player = $.Class({
	
	VERSION: '<%= PB_VERSION %>',
	
	construct: function ( files, options ) {
		
		this.id = 'pbplayer'+(++local.id);
		
		// Initialize class vars
		this.listeners = {};
		this.options = {};
		this.audio = null;
		this.plugin = null;
		this.playlist = {

			current: 0,
			length: 0,
			files: null
		};
		
		// Add options to instance
		PB.overwrite(this.options, local.options);
		
		// Instance options
		if( typeof options !== 'undefined' ) {

			this._setOptions( options );
		}
		
		if( typeof files !== 'undefined' ) {

			if( this.options.simple === true ) {

				this._setFilesSimple( files );
			} else {

				this._setFilesAdvanced( files );
			}
		}
		
		if( this.options.skin ) {
			
			this._initSkin();
		}
		
		// Add instance to global, for communication with plugins eg flash
		$.Player.addInstance( this.id, this );

		if( this.options.autostart === true ) {

			this.play();
		}
	},
	
	_setFilesSimple: function ( files ) {

		var playlist = [];

		if( Array.isArray(files) === true ) {
			
			playlist = files.map( this.extendFileObject );
			playlist = playlist.map( function ( fileObject ){ return [fileObject]; } );
		} else {
			
			playlist.push( [this.extendFileObject( files )] );
		}
		
		this.playlist = {

			current: 0,
			length: playlist.length,
			files: playlist
		};
	},
	
	_setFilesAdvanced: function ( files ) {
		
		var playlist = [];
		
		if( true ) {
			
			
		}
	},

	/**
	 * Return modified object
	 */
	extendFileObject: function ( fileObject ) {
		
		// Proberly only an url given
		if( PB.is('Object', fileObject) === false ) {
			
			fileObject = { url: fileObject };
		}
		
		// Try to set codec, mp3 default
		if( !fileObject.codec ) {
			
			var codec = fileObject.url.substr(-4);
			
			fileObject.codec = codec.charAt(0) === '.'
				? codec.substr(-3)
				: 'mp3';
		}
		
		// Stream defaults to false
		if( !fileObject.stream ) {
			
			fileObject.stream = false;
		}
		
		// Protocol, not used at the moment
		if( !fileObject.protocol ) {
			
			fileObject.protocol = 'http';
		}
		
		return fileObject;
	},
	
	/**
	 * Add files to instance
	 *
	 * Always create an playlist of given file(s)
	 *
	 * Possibilities
	 *
	 * Single files:
	 * - 'file.mp3'	// Could never be a stream, when using an skin
	 * - {url: 'file.mp3', codec: 'mp3', protocol: 'http', stream: true}
	 *
	 * Playlist:
	 * - ['file.mp3', 'file2.mp3', ...]	// Playlist
	 * - [{url: 'file.mp3', codec: 'mp3', protocol: 'http', stream: true}, ...]
	 */
	// _setFiles: function ( files ) {
	// 		
	// 		var playlist = [];
	// 		
	// 		// Todo, check extension for codec
	// 		// files.codes || local.getCodecByExtension(files) || 'mp3'
	// 		// Todo, optimize code
	// 		
	// 		// Is single file
	// 		if( typeof files === 'string' ) {
	// 			
	// 			playlist.push([{
	// 				
	// 				url: files,
	// 				codec: 'mp3',
	// 				protocol: 'http',
	// 				stream: false
	// 			}]);
	// 		}
	// 		// Is object
	// 		else if ( Object.isObject(files) === true ) {
	// 			
	// 			playlist.push([Object.extend({
	// 				
	// 				codec: 'mp3',
	// 				protocol: 'http',
	// 				stream: false
	// 			}, files)]);
	// 		}
	// 		// Is playlist, or multiple audio?
	// 		else if ( Array.isArray(files) === true ) {
	// 			
	// 			// Multiple audio
	// 			if( typeof files[0][0] === 'undefined' ) {
	// 				
	// 				files = files.map(function ( file ){
	// 					
	// 					return Object.extend({
	// 						
	// 						codec: 'mp3',
	// 						protocol: 'http',
	// 						stream: false
	// 					}, file);
	// 				});
	// 				
	// 				playlist.push(files);
	// 			}
	// 			// Playlist
	// 			else {
	// 				
	// 				playlist = files.map(function ( entry ){
	// 					
	// 					if( typeof entry === 'string' ) {
	// 						
	// 						return [{
	// 
	// 							url: entry,
	// 							codec: 'mp3',
	// 							protocol: 'http',
	// 							stream: false
	// 						}];
	// 					} else if ( Object.isObject(entry) === true ) {
	// 						
	// 						return [Object.extend({
	// 
	// 							codec: 'mp3',
	// 							protocol: 'http',
	// 							stream: false
	// 						}, entry)];
	// 					} else { 
	// 					
	// 						return entry.map(function ( file ){
	// 						
	// 							return Object.extend({
	// 
	// 								codec: 'mp3',
	// 								protocol: 'http',
	// 								stream: false
	// 							}, file);
	// 						});
	// 					}
	// 				});
	// 			}
	// 		}
	// 		
	// 		// Set playlist data
	// 		this.playlist = {
	// 
	// 			current: 0,
	// 			length: playlist.length,
	// 			files: playlist
	// 		};
	// 	},
	
	destroy: function () {
		
		try {
			
			this.stop();
		} catch (e){};
		try {

			this.plugin.destroy();
		} catch (e){}
		
		this.plugin = null;
	},
	
	/**
	 * Set options
	 */
	_setOptions: function ( options ) {
		
		PB.overwrite(this.options, options);
	},
	
	/**
	 * Get plugin for audio type
	 */
	_getPlugin: function () {
		
		if( !this.playlist.files[this.playlist.current] ) {
			
			throw new Error('No audio given');
		}
		
		// ----
		var plugins = $.Player.Plugin.getPlugins(),
			plugin,
			items = this.playlist.files[this.playlist.current],
			i = j = 0,
			iLen,
			jLen = items.length;
		
		for( iLen = plugins.length; i < iLen; i++ ) {	

			plugin = plugins[i];
			
			for( j = 0; j < jLen; j++ ) {

				if( plugin.prototype.supports( items[j] ) === true ) {
					
					// Create class with plugin and extend with our Plugin core object
					this.plugin = new plugin(this);
					this._setAudio(items[j]);
					return;
				}
			}
		}
		
		if( !this.plugin ) {
			
			throw new Error('No plugin found');
		}
	},
	
	/**
	 * Init skin
	 */
	_initSkin: function () {
		
		var skin = $.Player.Skin.getSkin( this.options.skin );
		
		if( !skin ) {
			
			throw Error('PB.Player: Skin `'+this.options.skin+'` not found.');
		}
		
		this.skin = new (PB.Class(PB.Player.Skin.Core, skin))(this);
	},
	
	_setAudio: function ( audio ) {
		
		this.audio = audio;
		this.plugin.setAudio( audio.url );
	},
	
	/**
	 * Observe
	 */
	on: function ( type, fn ) {
		
		if( !this.listeners[type] ) {
			
			this.listeners[type] = [];
		}
		
		this.listeners[type].push(fn);
		
		return this;
	},
	
	/**
	 * Stop observing
	 */
	unbind: function ( type, fn ) {
		
		this.listeners[type].remove(fn);
	},
	
	/**
	 * Fire listeners
	 */
	fire: function ( type, args ) {
		
		if( !this.listeners[type] ) {
			
			return;
		}
		
		this.listeners[type].forEach(function ( fn ){
			
			fn.call(null, type, args || []);
		});
	},
	
	/**
	 * 
	 */
	setFile: function ( file ) {
		
		// Kill last
		
		if( this.plugin !== null ) {
			
			this.plugin.destroy();
			this.plugin = null;
		}
		
		this._setFilesSimple( file );
		
		if( this.options.autostart === true ) {
			
			this.play();
		}
		
		return this;
	},
	
	/**
	 *
	 */
	play: function () {
		
		// Get correct plugin for media type
		if( !this.plugin ) {
			
			this._getPlugin();
		}
		
		this.plugin.play();
	},
	
	/**
	 *
	 */
	pause: function () {
		
		// Get correct plugin for media type
		if( !this.plugin ) {
			
			this._getPlugin();
		}
		
		this.plugin.pause();
	},
	
	/**
	 *
	 */
	stop: function () {
		
		// Get correct plugin for media type
		if( !this.plugin ) {
			
			this._getPlugin();
		}
		
		this.plugin.stop();
	},
	
	/**
	 *
	 */
	volume: function ( volume ) {
		
		// Get correct plugin for media type
		if( !this.plugin ) {
			
			this._getPlugin();
		}
		
		volume = parseInt(volume, 10);
		volume = ( volume < 0 ) ? 0 : ( volume > 100 ) ? 100 : volume;
		
		this.options.volume = volume;
		
		this.plugin.volume( volume );
	},
	
	/**
	 *
	 */
	mute: function () {
		
		// Get correct plugin for media type
		if( !this.plugin ) {
			
			this._getPlugin();
		}
		
		this.plugin.mute();
	},
	
	/**
	 *
	 */
	unmute: function () {
		
		// Get correct plugin for media type
		if( !this.plugin ) {
			
			this._getPlugin();
		}
		
		this.plugin.unmute();
	},
	
	/**
	 *
	 */
	playAt: function ( position ) {
		
		// Get correct plugin for media type
		if( !this.plugin ) {
			
			this._getPlugin();
		}
		
		this.plugin.playAt( position );
	},
	
	/**
	 *
	 */
	next: function () {
		
		this.destroy();
		
		this.playlist.current++;
		
		this.play();
	},
	
	/**
	 *
	 */
	previous: function () {
		
		this.destroy();
		
		this.playlist.current--;
		
		this.play();
	},
	
	select: function ( index ) {
		
		this.destroy();
		
		// Reset
		this.fire('timeupdate', [0]);
		this.fire('progress', [0]);
		this.fire('loadProgress', [0]);
		
		this.playlist.current = index;

		this.play();
	}
});

/**
 * Extend default options with given ones
 */
$.Player.options = function ( options ) {
	
	PB.overwrite( local.options, options );
};

/**
 * Extend default options with given ones
 */
$.Player.instances = {};
$.Player.addInstance = function ( id, instance ) {
	
	$.Player.instances[id] = instance;
};

