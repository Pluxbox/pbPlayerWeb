pbPlayer
========

About
-----

*pbPlayer* is a cross-browser/cross-plattform audio player.

He supports common formats and gracefully fallsback if its not possible to play them natively. Providing different resource formats, allows to choose the best solution. Through the decoupling of the player logic, its easy to create own configurations and skins and even implement own media containers.

Features:

- simple syntax & configurable

- supported common file formats: MP3, AAC, OGG

- possibility to embed audio streams

- supports playlist

- customizable skins

A list of examples can be found [here](...).


Usage
-----

### Basic Structure: PB.Player([HTMLElementNode], options);

#### Embedding

The simple embedding of a track can be done in a few lines lines, using the pre-defined configurations.
Since there is no skin defined by default, the audio will be played in the background.

```js
var pbplayer = new PB.Player({
	
	autostart: true
});

pbplayer.addMedia({
	
	mp3: "http://path.to/file.mp3",
	ogg: "http://path.to/file.ogg"
});
```

#### Player Configuration

The Configuration of the player can be done in two ways: either global for all instances of the player or local for a specific one.
Its recommended to specify the general settings for the paths global.

Global (default settings)
```js
PB.Player.config({

    containerPath: '/pbPlayer/dist/containers/',
    skin: 'default',
    volume: 100
});
```

Lokal (disregarding the defaults)
```js
PB.Player({
	
	autostart: false,
	volume: 80
});
```
#### Properties

> All path values must end with a slash.

- **containerPath:**
	- description: specify the path of the container files (for example swf files)
	- options: - (local path)
	- default: '/pbPlayer/dist/.../'

- **skin:**
	- description: select the name of the skin
	- options: - (skin name)
	- default: none

- **volume:**
	- description: the volume in percentage
	- options: 0 - 100
	- default: 80

- **autostart:**
	- description: start playing when audiofile starts automaticly and play the next track in a playlist
	- options: true or false
	- default: false


#### Upcoming

- **limit:**
	- description: limit to single concurrent player (stops other instances)
	- options: true or false
	- default: false

- **position:**
	- description: set the entrypoint of the playlist
	- options: 0 - list.length
	- default: 0

- **repeat:**
	- description: unlimited loops through the selection
	- options: 'list', 'track', none
	- default: none

- **shuffle:**
	- description: randomize the order of the played tracks
	- options: true or false
	- default: false


#### Input Configuration

Its also possible to use additional information to configure the sources.

    // Single Selection (ressource evaluation)

     PB.Player({

        url: 'files/example, files/example.acc, example.mp3',
        codec: 'ogg'
    });

    // Different entries

    PB.Player([
        {
            url: 'http://example.com/shoutcast;nsc',
            stream: true,
    	    codec: 'mp3'
        },
        {
            url: 'http://example.com/test',
            name: '1337',
            codec: 'acc'
        }
    ]);

- **url:**
	- description: the path of the track
	- options: - (local path)
	- default: none

- **name:**
    - description: the displayed title at the player
    - options: - (String: name)
    - default: none

- **codec:**
	- description: the file format of the track (required if not provided by the file extension)
	- options: mp3, aac, ogg
	- default: path/file.extension

- **stream:**
	- description: recognise the resource as an audio web-stream
	- options: true or false
	- default: false


Custom Skin
-----------

Creating your own skin for the player is straight forward. You just need to declare some HTML markup, specify the CSS and attach the events accordingly. Further details can be found in the [skins/template.js](https://github.com/Pluxbox/pbPlayer/blob/master/skins/template.js).


Compatibility
-------------

- IE7+
- Firefox 3.5+
- Safari 4+
- Opera
- Chrome
- IOS 4+
- Android 2.1+


License
-------
This project is under the MIT License.

*Copyright 2011-2012, Pluxbox*
