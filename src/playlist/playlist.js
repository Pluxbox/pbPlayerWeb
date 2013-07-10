var Playlist = PB.Class(PB.Observer, {

	construct: function() {

		this.parent();

		this._entries = [];
		this._currentEntryIndex = 0;
	},

	/**
	 * Adds a media object to the playlist.
	 * @param {Object} The media object to add to the playlist.
	 */
	add: function( media ) {

		if( typeof media !== 'object' ) {
			return;
		}

		this._entries.push(media);
		this.emit('mediaadded', { media: media });
	},

	/**
	 * Removes a media object to the playlist.
	 * @param {Object} The media object to remove from the playlist.
	 */
	remove: function( media ) {

		var index = this._entries.indexOf(media);

		if( index !== -1 ) {
			this.emit('mediaremoved', { media: this._entries.splice(index, 1)[0] });
		}
	},

	/**
	 * Removes all media objects from the playlist.
	 */
	empty: function() {
		
		while( this._entries.length ) {

			this.remove(this._entries[0]);
		}
	},

	/**
	 * Switches to the next media object in the playlist, if any.
	 */
	next: function() {

		var entry = this._entries[this._currentEntryIndex + 1];

		if( entry === undefined ) {
			return;
		}

		this._currentEntryIndex++;
		this.emit('mediachanged', { media: entry });
	},

	/**
	 * Switches to the previous media object in the playlist, if any.
	 */
	previous: function() {

		var entry = this._entries[this._currentEntryIndex - 1];

		if( entry === undefined ) {
			return;
		}

		this._currentEntryIndex--;
		this.emit('mediachanged', { media: entry });
	}

});