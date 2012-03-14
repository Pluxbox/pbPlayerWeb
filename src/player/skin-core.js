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

