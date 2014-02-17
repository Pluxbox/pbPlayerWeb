var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = SimpleDash.Eventable,
		Chunk = SimpleDash.Chunk;

	var _lastRequest = null;

	var Manifest = function( data ) {

		this.url = data.url;
		this.duration = data.duration || Infinity;
		this._isLoaded = false;
		this._segments = [];
		this._containers = [];
		this._modules = [];
		this._currentContainerIndex = 0;
	};

	Manifest.prototype.getModules = function() {

		return this._modules;
	};

	Manifest.prototype.getSegments = function() {

		if( this._isLoaded ) {

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

				if( !container ) {

					reject('Unable to decode any of the provided containers.');
					return;
				}

				this._segments = this._parseSegments(container.segments);
				this._modules = manifest.modules || [];
				this._parseMetaData(manifest);

				this._isLoaded = true;

				_lastRequest = Date.now();

				resolve(this._segments);

			}.bind(this);

			request.onerror = function() {

				_lastRequest = Date.now();

				reject('Could not load manifest from server');
			};

			request.open('GET', this.url, true);
			request.send();

		}.bind(this));
		
	};

	Manifest.prototype.isLoaded = function() {

		return this._isLoaded;
	};

	Manifest.prototype.scaleDown = function() {

		this._scaleContainer(-1);
	};

	Manifest.prototype.scaleUp = function() {

		this._scaleContainer(1);
	};

	Manifest.prototype._scaleContainer = function( direction ) {
		
		var container = this._containers[this._currentContainerIndex + direction];

		if( container ) {

			this._currentContainerIndex += direction;
			this._segments = container.segments;

			return true;
		}

		return false;
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

		return segments.map(function( segment ) {

			switch( segment.type ) {
				case 'chunk':
					return new Chunk(segment);
					break;
				case 'manifest':
					return new Manifest(segment);
					break;
			}

			return segment;
		});
	};

	Manifest.prototype._parseMetaData = function( manifest ) {

		this.duration = manifest.duration ? (manifest.duration / 1000) : Infinity;
	};

	SimpleDash.Manifest = Manifest;

})(SimpleDash);