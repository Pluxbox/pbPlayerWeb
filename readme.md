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

Installation
------------

* Put pbplayer.js and the container folder + all contents in the same folder.

* Include pbplayer.js:


```xml
<script src="/pbPlayer/dist/pbplayer.min.js"></script>
```

* Initialize pbPlayer:

```js
var player = new pbPlayer(/* options here */);
```

* Add media and start playing (Api is chainable)

```js
player.addMedia({

	mp3: "http://example.com/songy.mp3"
});

player.play();
```

Examples
--------

Example 1: [Listening to events](...)    
Example 2: [Simple skin](...)    
Example 3: [Custom skin](...)

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

Using pbPlayer with a skin

```js
var pbplayer = new PB.Player(document.getElementById('element'), /* options */);
```

Using pbPlayer as pbjs / jQuery plugin

```js
PB.$('#element').pbplayer(/* options */);
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

#### Media configuration

When adding media object a few more options can be specified to make sure pbPlayer makes a correct choose to specify which container should play the given media. In the example below the given file is a live stream, so we specifed `stream: true` so the file will now be handled by a container which handles streams. Also all information set here is avaible for the skin, so the title can now be used as display name.

It's possible to specify multiple sources which helpes you to play audio across platform / device. This is done by key value, where key is the audio type (mp3/ogg/...) and the value is the path to the audio file.

```js
pbplayer.addMedia({
	
	title: "foo bar",
	mp3: "/foo.mp3",
	stream: true		// Optional, defaults to false
});
```

When the filetype is unknown or could be dynamicly and has an extension the 'reserved' `url` property should be set wich tries to guess the filetype. But for the best results it is advised to specify a filetype.  

```js
pbplayer.addMedia({
	
	title: "foo bar",
	url: "/foo.ogg"
});
```

Custom Skin
-----------

Creating your own skin for the player is straight forward. You just need to declare some HTML markup and specify some CSS. Further details can be found in the [skins/template.js](...).


Browser support
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
 Copyright (c) 2013 Pluxbox

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
