# pbPlayer API Documentation

### Constructor
```js
var player = new PBPlayer('#player', {

	'ogg': 'track.ogg',
	'mp3': 'track.mp3'
});
```

##### Parameters
element : String / DOMElement / PbDom - The element to use as a container for the player, can be a selector DOM element or PBDom element.
params : Object - The paramaters for the player.

### Methods

#### addMedia( media : Object / Array )
Adds a media object to the playlist. Also accepts a collection.

##### Parameters
media : Object - The media object to add.


#### removeMedia( media : Object / Array )
Removes a media object from the playlist.

##### Parameters
media : Object - The media object to remove. Also accepts a collection.


#### emptyPlaylist()
Removes all media objects from the playlist.


#### next()
Switches to the next media object in the playlist, if any.


#### previous()
Switches to the previous media object in the playlist, if any.


### Events

`mediaadded` Dispatched when a media object is added to the playlist.

##### Parameters
type : String - The type of event dispatched, in this case `mediaadded`.
media : Object - The media object that was added to the playlist.

`mediaremoved` Dispatched when a media object is removed from the playlist.


##### Parameters
type : String - The type of event dispatched, in this case `mediaremoved`.
media : Object - The media object that was added to the playlist.


`mediachanged` Dispatched when the current media has changed, i.e. by calling the `next()` or `previous()` function.

##### Parameters
type : String - The type of event dispatched, in this case `mediachanged`.
media : Object - The media object that was added to the playlist.

