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

### timeupdate

Dispatched when the play time of the current media container changes.

###### Event data
```
{
  type: {String} "duration",
  target: {Object} pbPlayer,
  position: {Float} Played time in seconds,
  progress: {Float} Played progress in percentage
}
```

---

### progress

Dispatched when download progress occurs.

###### Event data
```
{
  type: {String} "duration",
  target: {Object} pbPlayer,
  loaded: {Number} Download progress in percentage
}
```

---

### loaded

Dispatched when download is completed.

###### Event data
```
{
  type: {String} "loaded",
  target: {Object} pbPlayer
}
```

---

### play

Dispatched when pbPlayer starts playing.

###### Event data
```
{
  type: {String} "play",
  target: {Object} pbPlayer
}
```

---

### pause

Dispatched when pbPlayer get paused.

###### Event data
```
{
  type: {String} "pause",
  target: {Object} pbPlayer
}
```

---

### stop

Dispatched when pbPlayer get stopped.

###### Event data
```
{
  type: {String} "stop",
  target: {Object} pbPlayer
}
```

---

### ended

Dispatched when audio playback has ended.

###### Event data
```
{
  type: {String} "ended",
  target: {Object} pbPlayer
}
```

---

### volumechange

Dispatched when volume has changed.

###### Event data
```
{
  type: {String} "volumechange",
  target: {Object} pbPlayer,
  volume: {Number} Volume range from 0 to 100
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
