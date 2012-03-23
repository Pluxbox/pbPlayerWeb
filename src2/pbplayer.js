//= compat
/*!
 * pbPlayer v<%= PB_VERSION %>
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (> 0.5)
 * https://github.com/Saartje87/pbjs
 */
!function ( name, context, definition ) {
	
	if( typeof module !== 'undefined' && typeof module.exports === 'object' ) {
		
		module.exports = definition(context);
	} else if ( typeof define === 'function' && typeof define.amd === 'object' ) {
		
		define( function () { return definition(context) } ) ;
	} else {
		
		this[name] = definition(context);
	}
}('PBPlayer', this, function ( context, undefined ) {

"use strict";

//= require "./core/core"

return PB;
});

