duration

{
	type: 'duration',
	length: float
}

error

{
	type: 'error',
	code: int,
	message: string
}

loadProgress(<3.4) -> progress

{
	type: 'progress',
	percent: int	`in percents`
}

load(<3.4) -> loaded

{
	type: 'loaded'
}

pause

{
	type: 'pause'
}

play

{
	type: 'play'
}

volumechange

{
	type: 'volumechange',
	volume: int
}

ended

{
	type: 'ended'
}

timeupdate

{
	type: 'timeupdate',
	position: float,
	progress: float `percentage played`
}