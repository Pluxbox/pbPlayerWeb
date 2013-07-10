var Playlist = PB.Class({

	/**
	 * Constructs the Playlist class
	 * @param {pbPlayer} reference of the pbPlayer to trigger events
	 */
	construct: function ( player ) {

		this._player = player;
		this._entries = [];
		this._currentEntryIndex = 0;
	},

	/**
	 * Adds a media object to the playlist.
	 * @param {Object / Array} The media object to add to the playlist.
	 */
	add: function ( media ) {

		var i = 0;

		if( media instanceof Array ) {

			for( ; i < media.length; i++ ) {
				this.add(media[i]);
			}

			return;
		}

		if( !media instanceof Object || this.has(media) ) {
			return;
		}

		this._entries.push(media);
		this._player.emit('mediaadded', { media: media });
	},

	/**
	 * Checks if a media object already exists in the playlist.
	 * @param {Object} The media object check.
	 */
	has: function ( media ) {

		return this._entries.indexOf(media) !== -1;
	},

	/**
	 * Removes a media object to the playlist.
	 * @param {Object / Array} The media object to remove from the playlist.
	 */
	remove: function ( media ) {

		var i = 0;

		if( media instanceof Array ) {

			for( ; i < media.length; i++ ) {
				this.remove(media[i]);
			}

			return;
		}

		var index = this._entries.indexOf(media);

		if( index !== -1 ) {
			this._player.emit('mediaremoved', { media: this._entries.splice(index, 1)[0] });
		}
	},

	/**
	 * Removes all media objects from the playlist.
	 */
	empty: function () {
		
		while( this._entries.length ) {

			this.remove(this._entries[0]);
		}
	},

	/**
	 * Gets the current media object.
	 * @returns {Object} the current media or null if not found.
	 */
	getCurrent: function() {

		var entry = this._entries[this._currentEntryIndex];

		return entry ? entry : null;
	},

	/**
	 * Switches to the next media object in the playlist, if any.
	 */
	next: function () {

		var entry = this._entries[this._currentEntryIndex + 1];

		if( entry === undefined ) {
			return;
		}

		this._currentEntryIndex++;
		this._player.emit('mediachanged', { media: entry });
	},

	/**
	 * Switches to the previous media object in the playlist, if any.
	 */
	previous: function () {

		var entry = this._entries[this._currentEntryIndex - 1];

		if( entry === undefined ) {
			return;
		}

		this._currentEntryIndex--;
		this._player.emit('mediachanged', { media: entry });
	}

});