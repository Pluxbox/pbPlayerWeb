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
