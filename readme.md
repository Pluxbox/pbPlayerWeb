# pbPlayer
=============

pbPlayer is cross-browser/cross-platform audio player build upon [pbjs]([https://github.com/Saartje87/pbjs]).

Usage
-----

### Global config

To Define a global config

	PB.Player.config({
		
		swfPath: '/pbPlayer/bin/flex/',
		volume: 80,
		skin: 'skin_name'
	});

> The global config is inherence by all single PB.Player instances.	
The global config can be used for all default values, the recommend global config properties are swfPath, skinPath, skin


### Config

* **swfPath** <string>
	* Path to swf files
* **skinPath** <string>
	* Path to skin files/folder structure
* **volume** <number>
	* Volume in percent, default: 80
* **autostart** <boolean>
	* Default: false
* **skin**
	* Default: false
* **renderTo** <Node/String/PBDom>
	* Element where the pbplayer should be rendered to. Default: null, Note: If none given, renders after script tag

> All path values must end with a slash


### PB.Player

	var player = PB.Player({
		
		url: 'url/to/audio/file',
		name: 'Title - Used in skin'
	}, {
		
		// Instance specific config
		autostart: true,
		volume: 50
	});


### Listen to the player

	// Listen to pbplayer error(s)
	player.on('error', function ( e ) {
		
		console.log( e );
	});
	
	// When playing starts
	player.on('play', function ( e ) {
		
		alert('Audio playing!');
	});


### Compatibility

- IE7+
- Firefox 3.5+
- Safari 4+
- Opera
- Chrome
- IOS
- Android


License
-------
This project is under the MIT License.

*Copyright 2011-1012, Pluxbox*