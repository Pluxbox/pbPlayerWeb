pbPlayer
========

About
-----

*pbPlayer* is a cross-browser/cross-plattform audio player build upon [pbjs]([https://github.com/Saartje87/pbjs]).

He supports common formats and gracefully fallsback if its not possible to play them natively. Providing different resource formats, allows to choose the best solution. Through the decoupling of the player logic, its easy to create own configurations and skins.

Features:

- simple syntax & configurable

- supported file formats: MP3, AAC, OGG

- possibility to embed audio streams

- support multiple sources in a playlist

- customizable through skins (see skin/default.js)

A list of examples can be found [here](http://github.com/pluxbox/pbPlayer/index.html).


Usage
-----

### Basic Structure: PB.Player( files , *config );

#### Embedding

The simple embedding of a track can be done in one line, using the pre-defined configurations.
Since by default no skin is defined, it will just play the audio.

    PB.Player('http://example.com/test.mp3');

Even using a playlist with multiple files is simple.

    PB.Player(['http://example.com/nice.mp3',
			   'http://example.com/nice.mp3']);


#### Player Configuration

The Configuration of the player can be done in two ways: either global for all instances of the player or local for a specific one.

Global (default settings)

    PB.Player.config({

    	swfPath: '/pbPlayer/bin/flex/',
    	skin: 'skin_name'
    });


Lokal (disregarding the defaults)

    PB.Player('http://example.com/test.mp3', {

    	autostart: false,
        volume: 80
    });

#### Properties

> All path values must end with a slash.

- **renderTo:** <string/node>
> description: choose a target element to place the player
> options: - (element ID)
> default: none (uses the last script tag at the page)

- **swfPath:** <string>
> description: specify the path of the flash files (for fallbacks)
> options: - (local path)
> default: '/pbPlayer/bin/flex/'

- **skin:** <string>
> description: select the name of the skin (specified in the skin.js)
> options: - (skin name)
> default: none

- **skinPath:** <string>
> description: specify the location of the skinName.js
>  options:  - (local path)
>  default: /pbPlayer/skin/yourSkinName OR none

- **volume:** <number>
> description: the volume in percent
>  options: 0 - 100
>  default: 80

- **autostart:** <boolean>
> description: starts automaticly and play the next track in a playlist
> options: true or false
> default: true


#### Upcoming

- **limit:** <boolean>
> description: limit to single concurrent player (stops other instances)
>  options: true or false
>  default: false

- **repeat:** <string>
> description: unlimited loops through the selection
> options: 'list', 'track', none
> default: none

- **shuffle:** <boolean>
> description: randomize the order of the played tracks
> options: true or false
> default: false


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
            codec: 'acc'
        }
    ]);

- **url:** <string>
> description: the path of the track
>  options: - (local path)
>  default: none

- **codec:** <string>
> description: the file format of the track (required if not provided by the file extension)
>  options: MP3, OGG, ACC
>  default: path/file.extension

- **stream:** <boolean>
> description: recognise the resource as an audio web-stream
>  options: true or false
>  default: false


Custom Skin
-----------

Creating your own skin for the player is straight forward. You just need to declare some HTML markup, specify the CSS and attach the events accordingly. Further details can be found in the [skins/template.js](http://github.com/pluxbox/pbPlayer/skins/test.js).


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

*Copyright 2011-1012, Pluxbox*