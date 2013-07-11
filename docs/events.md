## pbPlayer events

A short example of how to assign events to pbPlayer.

```js
var player = pbPlayer({
  
  autostart: true  
});

// Listen to duration event
player.on('duration', function ( e ) {
  
  console.log(e.length);
});

// Listen to timeupdate event
player.on('timeupdate', function ( e ) {
  
  console.log(e.position, e.progress);
});

// It's posible to listen to multiple events at once
player.on('progress loaded', function ( e ) {
  
  console.log(e.type);
});

player.addMedia({
  
  mp3: 'myAwesomeSong.mp3'
});

```

### duration

Dispatched when duration of current media object is avaible.

###### Event data
```
{
  type: {String} "duration",
  target: {Object} pbPlayer,
  length: {Float} Total time in seconds
}
```

---






### mediaadded

Dispatched when a media object is added to the playlist.

###### Event data
```
{
  type: {String} "mediaadded",
  target: {Object} pbPlayer,
  media: {Object} The media object that was added to the playlist.
}
```

---

### mediaremoved

Dispatched when a media object is removed from the playlist.

###### Event data
```
{
  type: {String} "mediaremoved",
  target: {Object} pbPlayer,
  media: {Object} The media object that was removed from the playlist.
}
```

---

### mediachanged

Dispatched when the current media has changed, i.e. by calling the `next()` or `previous()` function.

###### Event data
```
{
  type: {String} "mediachanged",
  target: {Object} pbPlayer,
  media: {Object} The current media object in use
}
```

---
