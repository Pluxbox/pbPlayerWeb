/*!
 * pbPlayer v3.3.2
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (> 0.5)
 * https://github.com/Saartje87/pbjs
 */
(function ( $, global ){

if( typeof global.PB === 'undefined' ) {

	throw new Error('pbjs required! Please visit https://github.com/Saartje87/pbjs');
}

var local = {};

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
local.instances = [];

$.Player = $.Class({

	VERSION: '3.3.2',

	construct: function ( files, options ) {

		this.id = 'pbplayer'+(++local.id);

		this.listeners = {};
		this.options = {};
		this.audio = null;
		this.plugin = null;
		this.playlist = {

			current: 0,
			length: 0,
			files: null
		};

		PB.overwrite(this.options, local.options);

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

		if( PB.is('Object', fileObject) === false ) {

			fileObject = { url: fileObject };
		}

		if( !fileObject.codec ) {

			var codec = fileObject.url.substr(-4);

			fileObject.codec = codec.charAt(0) === '.'
				? codec.substr(-3)
				: 'mp3';
		}

		if( !fileObject.stream ) {

			fileObject.stream = false;
		}

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

		if( !this.plugin ) {

			this._getPlugin();
		}

		this.plugin.play();
	},

	/**
	 *
	 */
	pause: function () {

		if( !this.plugin ) {

			this._getPlugin();
		}

		this.plugin.pause();
	},

	/**
	 *
	 */
	stop: function () {

		if( !this.plugin ) {

			this._getPlugin();
		}

		this.plugin.stop();
	},

	/**
	 *
	 */
	volume: function ( volume ) {

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

		if( !this.plugin ) {

			this._getPlugin();
		}

		this.plugin.mute();
	},

	/**
	 *
	 */
	unmute: function () {

		if( !this.plugin ) {

			this._getPlugin();
		}

		this.plugin.unmute();
	},

	/**
	 *
	 */
	playAt: function ( position ) {

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

$.Player.Plugin = new ($.Class({

	plugins: [],

	/**
	 * Register plugin to PBPlayer
	 */
	register: function ( plugin ) {

		this.plugins.push( plugin );
	},

	/**
	 *
	 */
	getPlugins: function () {

		return this.plugins;
	}
}));

$.Player.Plugin.Core = PB.Class({

	construct: function ( scope ) {

		this.scope = scope;
	},

	destroy: function () {

		$(this.scope.id).remove();
	}
});

$.Player.Skin = new ($.Class({

	skins: {},

	loadedCss: [],

	/**
	 * Register plugin to PBPlayer
	 */
	register: function ( name, plugin ) {

		this.skins[name] = plugin;
	},

	/**
	 *
	 */
	getSkin: function ( name ) {

		return this.skins[name] || null;
	},

	loadCss: function ( file ) {

		if( this.loadedCss.indexOf(file) >= 0 ) {

			return;
		}

		$(document.createElement('link'))
			.attr('type', 'text/css')
			.attr('rel', 'stylesheet')
			.attr('href', file)
			.appendTo( document.getElementsByTagName('head')[0] );
	}
}));

$.Player.Skin.Core = PB.Class({

	construct: function ( player ) {

		if( this.css ) {

			$.Player.Skin.loadCss( player.options.skinPath + this.css );
		}

		this.player = player;
		this.element = $(player.options.renderTo);

		this.init( this.element );
	},

	init: function () {}
});


PB.Player.Plugin.register(PB.Class(PB.Player.Plugin.Core, {

	name: 'html5',

	codec: {

		mp3: 'audio/mpeg; codecs="mp3"',
		ogg: 'audio/ogg; codecs="vorbis"',
		wav: 'audio/wav; codecs="1"',
		aac: 'audio/aac; codecs="aac"'
	},

	NETWORK_ERROR: [

		'NETWORK_EMPTY',
		'NETWORK_IDLE',
		'NETWORK_LOADED',
		'NETWORK_LOADING',
		'NETWORK_NO_SOURCE'
	],

	supports: function ( metadata ) {

		if( !window.Audio || !this.codec[metadata.codec] ) {

			return false;
		}

		var audio = new window.Audio,
			ogg = ('no' != audio.canPlayType(this.codec.ogg)) && ('' != audio.canPlayType(this.codec.ogg)),
			mp3 = ('no' != audio.canPlayType(this.codec.mp3)) && ('' != audio.canPlayType(this.codec.mp3));

		if( !ogg || !mp3 ) {

			return false;
		}

		try {

			if( PB.browser.isSafari && !PB.browser.isNokiaBrowser ) {

				if( PB.browser.version <= 5.0 ) {

					return false;
				}
			}
		} catch (e){}

		var canPlay = audio.canPlayType( this.codec[metadata.codec] );

		return canPlay === 'probably' || canPlay === 'maybe';
	},

	construct: function () {

		this.parent.apply(this, arguments);

		this.element = $(document.createElement('audio'));
		this.element
			.attr('id', this.scope.id)
			.attr('data-id', Date.now())
			.attr('preload', 'metadata');

		$(document.body).append(this.element);

		this.element = this.element.node;

		this.addEvents();

		this.element.volume = this.scope.options.volume / 100;

		this.eventHandler({type: 'volumechange'});
	},

	destroy: function () {

		$(this.element).off();

		this.element.pause();
		this.element.src = '';
		this.element.load();

		this.parent();
	},

	/**
	 *
	 */
	addEvents: function () {

		var element = $(this.element);

		this.eventHandlerWrapper = this.eventHandler.bind(this);

		element
			.on('loadedmetadata', this.metadataLoaded.bind(this))
			.on('progress', this.progress.bind(this))
			.on('error pause play volumechange ended timeupdate', this.eventHandlerWrapper);

		window.setTimeout(this.progress.bind(this), 250);
	},

	eventHandler: function ( e ) {

		var type = e.type,
			args = [];

		switch( e.type ) {

			case 'timeupdate':

				args.push( this.element.currentTime );
				break;

			case 'volumechange':

				if( !!this.element.muted ) {

					args.push( 0 );
				} else {

					args.push( parseInt(this.element.volume * 100, 10) );
				}
				break;
		}

		this.scope.fire(type, args);
	},

	metadataLoaded: function ( e ) {

		this.scope.fire('duration', [this.element.duration]);
	},

	/**
	 * Sometimes progress event never reaches readystate of 4
	 * so added timer..
	 */
	progress: function ( e ) {

		clearTimeout( this.timer );

		if( this.element.error !== null ) {

			this.scope.fire('error', [this.NETWORK_ERROR[this.element.error], this.element.error]);
			$(this.element).off('progress');
		}

		if( this.element.buffered.length ) {

			this.scope.fire('loadProgress', [Math.floor((this.element.buffered.end(0) / this.element.duration) * 100)]);
		}

		if( this.element.readyState === 4 ) {

			$(this.element).off('progress');

			this.scope.fire('loadProgress', [100]);
			this.scope.fire('load');
		} else {

			this.timer = window.setTimeout(this.progress.bind(this), 250);
		}
	},

	setAudio: function ( src ) {

		try {

			this.element.pause();
			this.element.src = src;
			this.element.load();
		} catch (e){};

		this.scope.fire('src', [src]);
	},

	play: function () {

		this.element.play();
	},

	pause: function () {

		this.element.pause();
	},

	/**
	 * Stop playing, will kill loading
	 */
	stop: function () {

		var src = this.element.src;

		this.element.pause();
		this.element.src = '';
		try { this.element.currentTime = 0; } catch (e){};
		this.element.src = src;
	},

	volume: function ( volume ) {

		this.element.volume = volume / 100;
	},

	playAt: function ( position ) {

		this.element.currentTime = position;
	}
}));

PB.Player.Plugin.register(PB.Class(PB.Player.Plugin.Core, {

	name: 'flash',

	codec: {

		mp3: true,
		mp4: true
	},

	navigator: navigator.userAgent.toLowerCase(),

	hasFlash: function () {

		var flash,
			hasFlash = false,
			requiredFlashVersion = 9;

		if( !!window.ActiveXObject ) {

			try {

				flash = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.'+requiredFlashVersion);
				hasFlash = true;
			} catch(e){};
		} else {

			flash = navigator.plugins['Shockwave Flash'];

			if( flash && parseFloat(flash.description.match(/\d+\.\d+/)[0], 10) >= requiredFlashVersion ) {

				hasFlash = true;
			}
		}

		return hasFlash;
	}(),

	supports: function ( metadata ) {

		return this.hasFlash && this.codec[metadata.codec] && metadata.stream === false;
	},

	construct: function () {

		this.parent.apply(this, arguments);

		this.queue = [];
		this.ready = false;

		if( PB.browser.isIE ) {

			this.element = $('<object id="'+this.scope.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,40,0" width="0" height="0">'
					+'<param name="movie" value="'+this.scope.options.path+'pbplayer.swf?ac='+Date.now()+'">'
					+'<param name="quality" value="high">'
					+'<param name="bgcolor" value="#FFFFFF">'
					+'<param name="allowScriptAccess" value="always">'
				+'</object>');
		}
		else {

			this.element = $('<embed width="0" height="0" id="'+this.scope.id+'" '
				+'src="'+this.scope.options.path+'pbplayer.swf?ac='+Date.now()+'"'
				+'allowscriptaccess="always" type="application/x-shockwave-flash"'
				+'pluginspage="http://www.macromedia.com/go/getflashplayer"></embed>');
		}

		this.element = this.element.node;

		$(document.body).append(this.element);

		this.volume( this.scope.options.volume );

		this.isLoadedWrapper = this.isLoaded.bind(this);
		this.isLoadedTimer = setInterval( this.isLoadedWrapper, 1000 );
	},

	isLoaded: function () {

		try {

			this.element._playerId( this.scope.id );

			this.ready = true;
			this.queue.forEach(function ( item ){

				if( item.args === null ) {

					this[item.method].call(this);
				} else {

					this[item.method].call(this, Array.prototype.slice.call(item.args));
				}
			}, this);

			clearTimeout( this.isLoadedTimer );

		} catch (e){};
	},

	addToQueue: function ( method, args ) {

		this.queue.push({

			method: method,
			args: args || null
		});
	},


	setAudio: function ( src ) {

		if( this.ready === false ) {

			this.addToQueue( 'setAudio', arguments );
			return;
		}

		this.element._src( src );
	},

	play: function () {

		if( this.ready === false ) {

			this.addToQueue( 'play' );
			return;
		}

		this.element._play();
	},

	pause: function () {

		this.element._pause();
	},

	stop: function () {

		if( this.ready === false ) {

			this.addToQueue( 'stop' );
			return;
		}

		this.element._stop();
	},

	volume: function ( volume ) {

		if( this.ready === false ) {

			this.addToQueue( 'volume', arguments );
			return;
		}

		this.element._volume( volume );
	},

	playAt: function ( position ) {

		if( this.ready === false ) {

			this.addToQueue( 'playAt', arguments );
			return;
		}

		this.element._playAt( position );
	}
}));

PB.Player.Plugin.register(PB.Class(PB.Player.Plugin.Core, {

	name: 'flash_stream',

	codec: {

		mp3: true,
		mp4: true
	},

	navigator: navigator.userAgent.toLowerCase(),

	hasFlash: function () {

		var flash,
			hasFlash = false,
			requiredFlashVersion = 9;

		if( !!window.ActiveXObject ) {

			try {

				flash = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.'+requiredFlashVersion);
				hasFlash = true;
			} catch(e){};
		} else {

			flash = navigator.plugins['Shockwave Flash'];

			if( flash && parseFloat(flash.description.match(/\d+\.\d+/)[0], 10) >= requiredFlashVersion ) {

				hasFlash = true;
			}
		}

		return hasFlash;
	}(),

	supports: function ( metadata ) {

		return this.hasFlash && this.codec[metadata.codec] && metadata.stream;
	},

	construct: function () {

		this.parent.apply(this, arguments);

		this.queue = [];
		this.ready = false;

		if( PB.browser.isIE ) {

			this.element = $('<object id="'+this.scope.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,40,0" width="0" height="0">'
					+'<param name="movie" value="'+this.scope.options.path+'pbstreamplayer.swf?ac='+Date.now()+'">'
					+'<param name="quality" value="high">'
					+'<param name="bgcolor" value="#FFFFFF">'
					+'<param name="allowScriptAccess" value="always">'
				+'</object>');
		}
		else {

			this.element = $('<embed width="0" height="0" id="'+this.scope.id+'" '
				+'src="'+this.scope.options.path+'pbstreamplayer.swf?ac='+Date.now()+'"'
				+'allowscriptaccess="always" type="application/x-shockwave-flash"'
				+'pluginspage="http://www.macromedia.com/go/getflashplayer"></embed>');
		}

		this.element = this.element.node;

		$(document.body).append(this.element);

		this.volume( this.scope.options.volume );

		this.isLoadedWrapper = this.isLoaded.bind(this);
		this.isLoadedTimer = setInterval( this.isLoadedWrapper, 1000 );
	},

	isLoaded: function () {

		try {

			this.element._playerId( this.scope.id );

			this.ready = true;
			this.queue.forEach(function ( item ){

				if( item.args === null ) {

					this[item.method].call(this);
				} else {

					this[item.method].call(this, Array.prototype.slice.call(item.args));
				}
			}, this);

			clearTimeout( this.isLoadedTimer );

		} catch (e){};
	},

	addToQueue: function ( method, args ) {

		this.queue.push({

			method: method,
			args: args || null
		});
	},


	setAudio: function ( src ) {

		if( this.ready === false ) {

			this.addToQueue( 'setAudio', arguments );
			return;
		}

		this.element._src( src );

	},

	play: function () {

		if( this.ready === false ) {

			this.addToQueue( 'play' );
			return;
		}

		this.element._play();
	},

	pause: function () {

		this.element._pause();
	},

	stop: function () {

		if( this.ready === false ) {

			this.addToQueue( 'stop' );
			return;
		}

		this.element._stop();
	},

	volume: function ( volume ) {

		if( this.ready === false ) {

			this.addToQueue( 'volume', arguments );
			return;
		}

		this.element._volume( volume );
	},

	playAt: function ( position ) {

		if( this.ready === false ) {

			this.addToQueue( 'playAt', arguments );
			return;
		}

		this.element._playAt( position );
	}
}));

PB.Player.Plugin.register(PB.Class(PB.Player.Plugin.Core, {

	name: 'embed',

	codec: ['wma', 'asx', 'aif', 'raw', 'wav', 'au', 'flac', 'ra', 'ogg', 'ram'],

	supports: function ( metadata ) {

		return this.codec.indexOf(metadata.codec) >= 0;
	},

	construct: function () {

		this.parent.apply(this, arguments);
	},

	/**
	 *
	 */
	create: function ( url ) {

		url = url || this._src;

		if( PB.browser.isIE ) {

			this.element = $('<object id="'+this.scope.id+'" type="audio/x-mpeg" data="'+url+'" autoplay="true" height="0" style="width: 0; height: 0;" volume="80">\
				<param name="src" value="'+url+'" />\
				<param name="controller" value="true" />\
				<param name="autoplay" value="true" />\
				<param name="autostart" value="1" />\
				<param naem="volume" value="80" />\
			</object>');
		} else {

			this.element = $('<embed id="'+this.scope.id+'" type="application/x-mplayer2" src="'+url+'" autostart="1" enablejavascript="true" uiMode="invisible" volume="80" style="width: 0; height: 0;"></embed>');
		}

		this.element = this.element.appendTo(document.body).node;

		this._src = url;
	},

	remove: function () {

		if( PB(this.scope.id) ) {

			PB(this.scope.id).remove();
		}
	},

	setAudio: function ( src ) {

		try {

		} catch (e){};

		this._src = src;

		this.scope.fire('src', [src]);
	},

	play: function () {

		this.scope.fire('play');

		try {

			this.element.Play();
		} catch (e){

			this.remove();
			this.create();
		};
	},

	pause: function () {

		this.scope.fire('pause');

		try {

			this.element.Pause();
		} catch (e){

			this.remove();
		};
	},

	/**
	 * Stop playing, will kill loading
	 */
	stop: function () {

		this.scope.fire('stop');

		try {

			this.element.Stop();
		} catch (e){};

		this.remove();
	},

	volume: function ( volume ) {

		try {

			this.element.volume = volume;
			this.element.SetVolume( volume );

		} catch (e){};
	},

	playAt: function ( position ) {

		try {

			this.element.SetTime( position * 1000 ); // Miliseconds
		} catch (e){};
	}
}));


})( PB, this );

