# pbPlayer API Documentation

### Constructor
```js
var player = new pbPlayer('#player', {

	'ogg': 'http://example.com/track.ogg',
	'mp3': 'http://example.com/track.mp3'
});
```

##### Parameters
{String / DOMElement / PbDom} (Optional) - The element to use as a container for the player, can be a selector DOM element or PBDom element.
{Object} - The paramaters for the player.

### Methods

#### play()
Starts/resumes the playback of the current media object.


#### pause()
Pauses the playback of the current media object.


#### stop()
Stops the playback of the current media object.


#### registerMediaContainer( key, container )
Registers a media container for playback.

##### Parameters
{String} - String to use as a key for the container.
{MediaContainer} - The container to register.


#### useMediaContainers( containers )
Specifies what media containers to use in a specific order.

##### Parameters
{String} - The names of the container keys to use.

##### Example with multiple containers
```js
player.registerMediaContainer('html5', ...);
player.registerMediaContainer('flash', ...);

player.useContainers('html5 flash'); // Will use HTML5 first and then Flash
player.useContainers('flash html5'); // Will use Flash first and then HTML5
player.useContainers('html5'); // Will use only HTML5
```


#### isPlaying() {boolean}
Checks if the player is currently playing.


#### isPaused() {boolean}
Checks if the player is currently paused.


#### isStopped() {boolean}
Checks if the player is currently stopped.


#### getPlayState() {String}
Gets the play state of the player.

##### Returns
{String} The current play state, can be `playing`, `paused` or `stopped`.


##### Parameters
{String} - String to use as a key for the container.
{MediaContainer} - The container to register.


#### setVolume( volume )
Sets the volume, values between 0 and 100 are valid.

##### Parameters
{int} The amount of volume to set, values between 0 and 100 are valid.


#### getVolume() : int
Gets the volume

##### Returns
{int} The amount of volume, value between 0 and 100.

#### hasDuration() {boolean}
Checks if it's possible to read the duration of the current media, i.e. streams do not have a duration.


#### getDuration() {int}
Gets the total duration of the current media in milliseconds.


#### getPosition() {int}
Gets the current position of the playback in milliseconds.


#### setPosition( position )
Sets the current position of the playback in milliseconds.

##### Parameters
{int} New postion of the playback in milliseconds.

#### isBuffering() {boolean}
Checks if the player is currently buffering.


#### destroy()
Destroys the player and removes event listeners.


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

