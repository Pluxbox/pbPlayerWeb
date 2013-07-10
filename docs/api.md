# pbPlayer API Documentation

### Constructor
```js
var player = new pbPlayer('#player', {

	'ogg': 'http://example.com/track.ogg',
	'mp3': 'http://example.com/track.mp3'
});
```

##### Parameters
element : String / DOMElement / PbDom - The element to use as a container for the player, can be a selector DOM element or PBDom element.
params : Object - The paramaters for the player.

### Methods

#### play()
Starts/resumes the playback of the current media object.


#### pause()
Pauses the playback of the current media object.


#### stop()
Stops the playback of the current media object.


#### registerMediaContainer( key : String, container : MediaContainer )
Registers a media container for playback.

##### Parameters
key : String - String to use as a key for the container.
container : MediaContainer - The container to register.


#### useMediaContainers( containers : String )
Specifies what media containers to use in a specific order.

##### Parameters
containers : String - The names of the container keys to use.

##### Example with multiple containers
```js
player.registerMediaContainer('html5', ...);
player.registerMediaContainer('flash', ...);

player.useContainers('html5 flash'); // Will use HTML5 first and then Flash
player.useContainers('flash html5'); // Will use Flash first and then HTML5
player.useContainers('html5'); // Will use only HTML5
```


#### addMedia( media : Object / Array )
Adds a media object to the playlist. Also accepts a collection.

##### Example with single media
```js
player.addMedia({

	'ogg': 'http://example.com/track.ogg',
	'mp3': 'http://example.com/track.mp3'
});
```

##### Example with multiple media
```js
player.addMedia([
	{
		'ogg': 'http://example.com/track1.ogg',
		'mp3': 'http://example.com/track1.mp3'
	},
	{
		'ogg': 'http://example.com/track2.ogg',
		'mp3': 'http://example.com/track2.mp3'
	}
]);
```

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

