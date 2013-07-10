(function ( name, context, definition ) {
	
	this[name] = definition( context );

})('PB', this, function ( context ) {

'use strict';

var PB = context.PB || {},
	OLD_PBPlayer = PB.Player;
