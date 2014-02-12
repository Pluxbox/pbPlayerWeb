var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable,
		Chunk = SimpleDash.Chunk;

	var _lastRequest = null;

	var Manifest = function( src ) {

		this._src = src;
		this._segments = [];
		this._containers = [];
		this._currentContainer = 0;
		this.duration = 0;
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
					container;

				this._parseContainers(manifest.containers);

				container = this._containers[0];

				this._setContainer(container);

				if( !container ) {

					reject('Unable to decode any of the provided containers.');
					return;
				}

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

	Manifest.prototype.isLoaded = function() {

		return this._segments.length !== 0;
	};

	Manifest.prototype.scaleDown = function() {

		this._scaleContainer(-1);
	};

	Manifest.prototype.scaleUp = function() {

		this._scaleContainer(1);
	};

	Manifest.prototype._scaleContainer = function( direction ) {
		
		var container = this._containers[this._currentContainer + direction];

		if( container ) {

			this._currentContainer += direction;
			this._setContainer(container);

			return true;
		}

		return false;
	};

	Manifest.prototype._setContainer = function( container ) {

		if( !container ) {

			return;
		}

		this._parseSegments(container.segments);
	};

	Manifest.prototype._parseContainers = function( containers ) {

		var container,
			audio = new Audio();

		// Remove unsupported codecs
		containers = containers.filter(function( container ) {

			return audio.canPlayType(container.content_type) !== '';
		});

		// Sort containers by bitrate
		containers = containers.sort(function( a, b ) {

			return a.bitrate - b.bitrate;
		});

		return this._containers = containers;
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

		return this._segments = results;
	};

	Manifest.prototype._parseModuleData = function ( moduleData ) {

		return this.moduleData = moduleData;
	};

	Manifest.prototype._parseMetaData = function( manifest ) {

		this.duration = manifest.duration ? (manifest.duration / 1000) : Infinity;
	};

	SimpleDash.Manifest = Manifest;

})(SimpleDash);