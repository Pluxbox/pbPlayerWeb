/*!
 * pbPlayer v4.0.0
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (>= 0.6.0)
 * https://github.com/Saartje87/pbjs-0.6
 *
 * Copyright 2013 Pluxbox
 * Licensed MIT
 *
 * Build date 2013-07-10 14:26
 */
(function ( name, context, definition ) {
	
	this[name] = definition( context );

})('pbPlayer', this, function ( context ) {

'use strict';

	// Main class
var PBPlayer,

	// Export
	pbPlayer,

	// Reference to PB
	PB = context.PB,

	// 
	OLD_PBPlayer = context.pbPlayer;

// pbjs required..
if( !PB ) {

	throw new Error("Missing dependency pbjs");
}

pbPlayer = PB.Class(PB.Observer, {

	/**
	 *
	 */
	construct: function ( element, options ) {

		if( !(this instanceof pbPlayer) ) {

			return new pbPlayer(element, options)
		}

		//
		this.playlist = this.registerPlaylist();
		this.plugin = null;
		this.skin = null;	// Set when element is true

		this.parent();
	},

	/**
	 * Create new playlist and register events
	 */
	registerPlaylist: function () {

		return new Playlist();
	},

	setMedia: function () {


	},

	play: function () {


	}
});

// Statics

// pbPlayer default settings
pbPlayer.defaults = {

	solution: 'html5, flash'
};

pbPlayer.skins = [];
pbPlayer.plugins = [];
pbPlayer.registerPlugin = function () {};
pbPlayer.registerSkin = function () {};

pbPlayer.config = function ( config ) {

	PB.overwrite(pbPlayer.defaults, config);
}; // Set defaults for all pbplayer instances

return pbPlayer;
});
