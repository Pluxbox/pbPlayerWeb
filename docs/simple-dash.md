# Simple Dash (Beta)

### Calling pbPlayer with *Simple dash* file

```js
var player = new pbPlayer('#player', {

  'simpledash': 'http://example.com/manifest.json'
});
```

## Events

See [events](/docs/events.md) for more pbPlayer events.

### module-data

Dispatched when (new) module data is provided from manifest file.

###### Event data
```
{
  type: {String} "module-data",
  target: {Object} pbPlayer,
  data: {Object} Module data
}
```