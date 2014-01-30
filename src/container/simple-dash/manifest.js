var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Chunk = SimpleDash.Chunk;

	var Manifest = function( src, player ) {

		this._player = player;
		this._src = src;
		this._segments = [];
	};

	Manifest.prototype.getSegments = function() {

		var self = this;

		if( this._segments.length ) {
			return Promise.resolve(this._segments);
		}

		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();

			request.onload = function() {

				var data = JSON.parse(request.response);
				var segments = self._parseSegments(data.containers[0].segments);

				self._parseModuleDate(data.modules || []);

				self._segments = segments;

				resolve(self._segments);
			};

			request.onerror = function() {
				reject('Could not load manifest from server');
			};

			request.open('GET', self._src, true);
			request.send();
		});
		
	};

	Manifest.prototype._parseSegments = function( segments ) {

		// Map segments to instances
		var results = segments.map(function( segment ) {

			switch( segment.type ) {
				case 'chunk':
					return new Chunk(segment);
					break;
				case 'manifest':
					return new Manifest(segment.url);
					break;
			}

			return segment;
		});

		return results;
	};

	/**
	 * 
	 */
	Manifest.prototype._parseModuleDate = function ( moduleData ) {

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

	SimpleDash.Manifest = Manifest;

})(SimpleDash);