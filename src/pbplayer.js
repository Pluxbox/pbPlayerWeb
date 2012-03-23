//= compat
/*!
 * pbPlayer v<%= PB_VERSION %>
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (> 0.5)
 * https://github.com/Saartje87/pbjs
 */
(function ( $, global ){
	
if( typeof global.PB === 'undefined' ) {
	
	throw new Error('pbjs required. Visit https://github.com/Saartje87/pbjs for the latest release!');
}

var local = {};

//= require "./player/player-core"
//= require "./player/plugin-core"
//= require "./player/skin-core"

//= require "./plugins/html5"
//= require "./plugins/flash"
//= require "./plugins/flash-stream"
//= require "./plugins/embed"
	
})( PB, this );

