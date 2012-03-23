PB.Player = PB.Class(PB.Observer, {
	
	VERSION: '<%= PB_VERSION %>',
	
	/**
	 * 
	 */
	construct: function ( files, config ) {
		
		// Construct observer
		this.parent();
		
		if( arguments.length == 1 ) {
			
			config = files;
		}
		
		this.plugin;
		// Playlist position
		this.position = 0;
		this.id = 'pb-player-'+PB.id();
		this.config = PB.overwrite(PB.overwrite({}, PB.Player.defaults), config);
		
		this.setMedia( files );	// Do some more checking with these
		
		if( this.config.renderTo ) {
			
			this.config.renderTo = PB(this.config.renderTo);
		} else {
			
			var scripts = document.getElementsByTagName('script');
			
			this.config.renderTo = scripts[scripts.length - 1];
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
		
		// Kill self
	},
	
	setMedia: function ( files, isPlaylist ) {
		
		if( this.config.playlist || isPlaylist ) {
			
			this.setPlaylist( files );
		} else {
			
			this.setFile( files );
		}
	},
	
	// Should be fixed for a 'best select'
	setFile: function ( file ) {
		
		this.files = [ this.formatMediaObject(file) ];
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
			
			if( i = url.indexOf('?') ) {
				
				url = url.substr( 0, i );
			}
			
			if( i = url.lastIndexOf('.') ) {
				
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
		
		var files = this.files,
			position = this.position;
		
		PB.each(PB.Player.plugins, function ( key, plugin ) {
			
			// if( Array.isArray(files[position]) )
			// files[position].forEach()
			// else
			
			if( plugin.supports(files[position]) ) {
				
				this.stream = !!files[position].stream;
				
				this.plugin = new PB.Player.plugins[key]( this );
				
				// Set defaults
				this.plugin.set( files[position].url );
				this.plugin.volume( this.config.volume );
				
				return true;
			}
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

// Helds pbplayer instances
PB.Player.instances = {};

// Helds container instances
PB.Player.plugins = {};

/**
 * Register containers to PB.Player
 */
PB.Player.register = function ( name, klasse ) {
	
	klasse.supports = klasse.prototype.supports;
	PB.Player.plugins[name] = klasse;
};