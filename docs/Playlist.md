## Playlist
The playlist object is used to manage media objects. It allows you to switch between media objects and add and remove them.

### Methods

#### add( media : Object )
Adds a media object to the playlist.

##### Parameters
media : Object - The media object to add.


#### remove( media : Object )
Removes a media object from the playlist.

##### Parameters
media : Object - The media object to remove.


#### empty()
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
