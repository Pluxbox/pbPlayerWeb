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
		
	//	this.scope.stop();
		$(this.scope.id).remove();
	}
});

