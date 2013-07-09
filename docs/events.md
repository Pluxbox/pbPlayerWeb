duration
```js
{
	type: 'duration',
	length: float
}
```

error
```js
{
	type: 'error',
	code: int,
	message: string
}
```

loadProgress(\<3.4) -> progress
```js
{
	type: 'progress',
	loaded: int		// In percentage
}
```

load(\<3.4) -> loaded
```js
{
	type: 'loaded'
}
```

pause
```js
{
	type: 'pause'
}
```

play
```js
{
	type: 'play'
}
```

volumechange
```js
{
	type: 'volumechange',
	volume: int
}
```

ended
```js
{
	type: 'ended'
}
```

timeupdate
```js
{
	type: 'timeupdate',
	position: float,
	progress: float		// Percentage played
}
```


change 
```js
{
	type: 'change'
}
```
