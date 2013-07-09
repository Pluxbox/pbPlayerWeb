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

loadProgress(<3.4) -> progress
```js
{
	type: 'progress',
	loaded: int	`in percents`
}
```

```js
load(<3.4) -> loaded

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
	progress: float `percentage played`
}
```


change 

{
	type: 'change'
}
