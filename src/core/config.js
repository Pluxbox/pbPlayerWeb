/**
 * Defaults config for instances
 */
PB.Player.defaults = {

	swfPath: 'static/pbplayer/',
	skinPath: 'static/pbplayer/skins/',
	volume: 80,
	autostart: false,
	skin: false,
	// Append skin to ...
	renderTo: null,
	loop: false,
	simple: true,
	playlist: true
};

/**
 * Overwrite defaults
 */
PB.Player.config = function ( config ) {
	
	PB.overwrite(PB.Player.defaults, config);
}