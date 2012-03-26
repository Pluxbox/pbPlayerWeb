var PBPlayer = PB.Class(PB.Observer, {
	
	VERSION: '<%= PB_VERSION %>',
	
	/**
	 * 
	 */
	construct: function ( files, config ) {
		
		// Construct observer
		this.parent();
		
		this.plugin;
		// Playlist position
		this.position = 0;
		this.id = 'pb-player-'+PB.id();
		// Clone defaults and overwrite with given config
		this.config = PB.overwrite(PB.overwrite({}, PB.Player.defaults), config);
		
		this.setMedia( files );	// Do some more checking with these
		
		if( this.config.renderTo ) {
			
			this.config.renderTo = PB(this.config.renderTo);
		} else {
			
			var scripts = document.getElementsByTagName('script');
			
			this.config.renderTo = scripts[scripts.length - 1];
		}
		
		if( config.skin ) {
			
			if( !PB.Player.skins[ config.skin ] ) {
				
				throw new Error('Skin '+config.skin+' not found');
			} else {
				
				this.skin = new PB.Player.skins[ config.skin ]( this );
			}
		}
		
		if( this.config.autostart ) {
			
			this.play();
		}
		
		PB.Player.instances[this.id] = this;
	},
	
	destroy: function () {
		
		// Kill plugin
		if( this.plugin ) {
			
			this.plugin.destroy();
		}
		
		if( this.skin ) {
			
			this.skin.destroy();
			this.skin = null;
		}
		
		// Kill self
		PB.Player.instances[this.id] = null;
	},
	
	setMedia: function ( files ) {
		
		if( PB.is('String', files) ) {
			
			files = [this.formatMediaObject({
				
				url: files
			})];
		} else if ( PB.is('Object', files) ) {
			
			files = [this.formatMediaObject(files)];
		}
		
		this.setPlaylist( files );
	},
	
	setPlaylist: function ( files ) {
		
		if( Array.isArray(files) === false ) {
			
			this.emit('error', {
				
				message: 'Given playlist is not an array'
			});
			
			return;
		}
		
		this.files = files.map(this.formatMediaObject);
	},
	
	formatMediaObject: function ( file ) {
		
		// Try getting the codec, defaults to mp3
		if( !file.codec ) {
			
			var url = file.url,
				codec,
				i;
			
			if( (i = url.indexOf('?')) > 0 ) {
				
				url = url.substr( 0, i );
			}
			
			if( (i = url.lastIndexOf('.')) > 0 ) {
				
				file.codec = url.substr( i+1 );
			} else {
				
				file.codec = 'mp3';
			}
		}
		
		return file;
	},
	
	/**
	 * Event normalisation
	 */
	emit: function ( type, data ) {
		
		// Event object
		var me = this,
			e = PB.overwrite({
			
			type: type,
			target: me
		}, data);
		
		this.parent( type, e );
	},
	
	getPlugin: function () {
		
		if( this.plugin ) {
			
			return;
		}
		
		var files = this.files[this.position],
			position = this.position;
		
		if( PB.is('Object', files) ) {
			
			files = [files];
		}
		
		files.forEach(function ( file ){
			
			PB.each(PB.Player.plugins, function ( key, plugin ) {

				if( plugin.supports(file) ) {

					this.stream = !!file.stream;

					this.plugin = new PB.Player.plugins[key]( this );

					// Set defaults
					this.plugin.set( file.url );
					this.plugin.volume( this.config.volume );

					return true;
				}
			}, this);
		}, this);
	},
	
	// Trigger events, delegation to plugins
	play: function () {
		
		this.getPlugin();
		
		this.plugin.play();
	},
	
	pause: function () {
		
		this.getPlugin();
		
		this.plugin.pause();
	},
	
	stop: function () {
		
		this.getPlugin();
		
		this.plugin.stop();
	},
	
	volume: function ( volume ) {
		
		this.getPlugin();
		
		volume = parseInt(volume, 10);
		volume = ( volume < 0 ) ? 0 : ( volume > 100 ) ? 100 : volume;
		
		this.config.volume = volume;
		
		this.plugin.volume( volume );
	},
	
	mute: function () {
		
		this.getPlugin();
		
		this.plugin.mute();
	},
	
	unmute: function () {
		
		this.getPlugin();
		
		this.plugin.unmute();
	},
	
	playAt: function ( position ) {
		
		this.getPlugin();
		
		this.plugin.playAt( parseFloat(position) );
	}
});

PB.Player = function ( files, config ) {
	
	if( arguments.length == 1 ) {
		
		config = files;
	}
	
	return new PBPlayer( files, config );
};

// Helds pbplayer instances
PB.Player.instances = {};

// Helds container instances
PB.Player.plugins = {};

// Helds skin instances
PB.Player.skins = {};

/**
 * Register containers to PB.Player
 */
PB.Player.register = function ( name, klasse ) {
	
	klasse.supports = klasse.prototype.supports;
	PB.Player.plugins[name] = klasse;
};

/**
 * Register containers to PB.Player
 */
PB.Player.registerSkin = function ( name, klasse ) {
	
	PB.Player.skins[name] = klasse;
};