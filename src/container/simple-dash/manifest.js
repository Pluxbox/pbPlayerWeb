var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable,
		Chunk = SimpleDash.Chunk;

	var Manifest = function( src, player ) {

		this._player = player;
		this._src = src;
		this._segments = [];
		this.metaData = null;
	};

	Manifest.prototype.getSegments = function() {

		if( this._segments.length ) {
			return Promise.resolve(this._segments);
		}

		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();

			request.onload = function() {

				var manifest = JSON.parse(request.response);

				this._parseSegments(manifest.containers[0].segments);
				this._parseModuleData(manifest.modules || []);
				this._parseMetaData(manifest);

				resolve(this._segments);

			}.bind(this);

			request.onerror = function() {
				reject('Could not load manifest from server');
			};

			request.open('GET', this._src, true);
			request.send();

		}.bind(this));
		
	};

	Manifest.prototype._parseSegments = function( segments ) {

		// Map segments to instances
		var results = segments.map(function( segment ) {

			switch( segment.type ) {
				case 'chunk':
					return new Chunk(segment);
					break;
				case 'manifest':
					return new Manifest(segment.url, this._player);
					break;
			}

			return segment;

		}.bind(this));

		return this._segments = results;
	};

	/**
	 * 
	 */
	Manifest.prototype._parseModuleData = function ( moduleData ) {

		var i = 0,
			module;

		moduleData.push({

			"type": "dash:pb-hour-info",
			"data": {

				"id": 1,
				"startdatetime": "2014-01-23 03:00:00",
				"stopdatetime": "2014-01-23 04:00:00",
			}
		});

		for( ; i < moduleData.length; i++ ) {

			module = moduleData[i];

			this._player.emit('module:'+module.type, module.data);

			// this.emit('module:'+module.type, module.data);
			// console.log(module);
		}
	};

	Manifest.prototype._parseMetaData = function( manifest ) {

		var meta = {};

		meta.duration = manifest.duration || Infinity;

		this.metaData = meta;
	};

	SimpleDash.Manifest = Manifest;

})(SimpleDash);