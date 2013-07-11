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
  type: {String} "mediaadded",
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
  type: {String} "mediaadded",
  target: {Object} pbPlayer,
  media: {Object} The current media object in use
}
```

---
