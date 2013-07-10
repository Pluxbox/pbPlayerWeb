(function ( name, context, definition ) {
	
	this[name] = definition( context );

})('pbPlayer', this, function ( context ) {

'use strict';

	// Export
var pbPlayer,
	
	// Keep track of all created pbPlayers
	pbPlayerInstances = [],

	// Reference to PB
	PB = context.PB,

	// 
	OLD_PBPlayer = context.pbPlayer;

// pbjs required..
if( !PB ) {

	throw new Error('Missing dependency pbjs');
}
