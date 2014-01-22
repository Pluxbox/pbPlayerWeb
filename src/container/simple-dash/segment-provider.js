var SegmentProvider = PB.Class({

	construct: function( manifestUrl ) {

		this._manifestUrl = manifestUrl;
		this._manifest = null;
		this._currentSegment = 0;
		this._segments = [];
	},

	_addManifest: function( url ) {

		return new Promise(function( resolve, reject ) {

			var request = new PB.Request({
				url: url,
				method: 'GET',
				json: true
			});

			request.on('success', function( request ) {

				this._manifest = request.responseJSON;
				this._addSegments(this._manifest.components[0].segments);

				resolve();

			}.bind(this));

			request.on('error', function( request, code ) {

				reject(code);
			});

			request.send();

		}.bind(this));
	},

	_addSegments: function( segments ) {

		var queuedSegments = this._getSegmentIds(this._segments);

		segments = segments.filter(function( segment ) {
			return segment.id !== undefined && queuedSegments.indexOf(segment.id) === -1;
		});

		return this._segments = this._segments.concat(segments);
	},

	_getSegmentIds: function( segments ) {

		return segments.map(function( segment ) {
			return segment.id;
		}).filter(function( id ) {
			return id !== undefined;
		});
	},

	_getSegmentAt: function( index ) {

		var segment = this._segments[index] || null,
			segmentIsManifest = !!(segment && segment.type === 'manifest'),
			manifestUrl = segmentIsManifest ? segment.url : this._manifestUrl;

		if( this._manifest === null || segmentIsManifest ) {

			return this._addManifest(manifestUrl).then(function() {
				return this._getSegmentAt(index);
			}.bind(this));
		}

		return Promise.resolve(segment);
	},

	nextSegment: function() {

		return this._getSegmentAt(this._currentSegment).then(function( segment ) {

			this._currentSegment++;

			return segment;

		}.bind(this));
	}

});

window.SegmentProvider = SegmentProvider;
window.segmentProvider = new SegmentProvider('http://192.168.3.187:1337/output/station1/manifest.json');