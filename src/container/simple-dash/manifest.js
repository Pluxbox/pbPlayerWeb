var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable,
		Chunk = SimpleDash.Chunk;

	var _lastRequest = null;

	var Manifest = function( src ) {

		this._src = src;
		this._segments = [];
		this.metaData = null;
		this.moduleData = null;
	};

	Manifest.prototype.getSegments = function() {

		if( this._segments.length ) {

			return Promise.resolve(this._segments);
		}

		if( Date.now() - _lastRequest < 5000 ) {

			return Promise.reject('Manifest requested too fast after request for other manifest.');
		}

		return new Promise(function( resolve, reject ) {

			var request = new XMLHttpRequest();

			request.onload = function() {

				var manifest = JSON.parse(request.response),
					index = -1,
					audio = new Audio();

				manifest.containers.forEach(function ( container, i ) {

					var canPlay = audio.canPlayType(container.content_type);

					if( index === -1 && (canPlay === 'probably' || canPlay === 'maybe') ) {

						index = i;
					}
				});

				if( index === -1 ) {

					throw new TypeError();
				}

				this._parseSegments(manifest.containers[index].segments);
				this._parseModuleData(manifest.modules || []);
				this._parseMetaData(manifest);

				_lastRequest = Date.now();

				resolve(this._segments);

			}.bind(this);

			request.onerror = function() {

				_lastRequest = Date.now();

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

	Manifest.prototype._parseModuleData = function ( moduleData ) {

		this.moduleData = moduleData;
	};

	Manifest.prototype._parseMetaData = function( manifest ) {

		var meta = {};

		meta.duration = manifest.duration ? (manifest.duration / 1000) : Infinity;

		this.metaData = meta;
	};

	SimpleDash.Manifest = Manifest;

})(SimpleDash);