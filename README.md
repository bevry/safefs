# Safe FS [![Build Status](https://secure.travis-ci.org/bevry/safefs.png?branch=master)](http://travis-ci.org/bevry/safefs)
Say goodbye to EMFILE errors! Open only as many files as the operating system supports


## Install

### Backend

1. [Install Node.js](http://bevry.me/node/install)
2. `npm install --save safefs`

### Frontend

1. [See Browserify](http://browserify.org)



## Usage

### Example

``` javascript
// Import
var safefs = require('safefs');

// Indicate we're wanting to open a file and reserve our space in the queue
// If there is space in the pool, our callback will run right away
// If there isn't space, our callback will fire as soon as there is
safefs.openFile(function(){
	// We just got some available space, lets do our stuff with the file
	require('fs').writeFileSync('some-file', 'data')
	// Once we're done, indicate it, so that other tasks can swim in the pool too
	safefs.closeFile();
});

// If we're working with an asynchronous function, it'll look like this
safefs.openFile(function(){
	require('fs').writeFile('some-file', 'data', function(err){
		safefs.closeFile();
	});
});
// as we only want to close file once we are completely done with it

// However, that's pretty annoying have to wrap all our calls in openFile and closeFile
// so it's a good thing that safefs provides wrappers for all the asynchronous fs methods for us
// allowing us to just do
safefs.writeFile('some-file', 'data', function(err){
	// all done
});
// which will open and close the spot in the pool for us automatically, yay!
```


### Methods

- Custom methods:
	- `openFile(next)`
	- `closeFile()`
- Wrapped fs/path methods:
	- `readFile`
	- `writeFile`
	- `appendFile`
	- `mkdir`
	- `stat`
	- `readdir`
	- `unlink`
	- `rmdir`
	- `exists`
	- `existsSync`



### Notes

- You should call `openFile` before and `afterFile` after ALL file system interaction
- To make this possible, we maintain the following globals:
	- `numberOfOpenFiles` - defaults to `0`
	- `maxNumberOfOpenFiles` - defaults to `process.env.NODE_MAX_OPEN_FILES` if available, otherwise sets to `100`
	- `waitingToOpenFileDelay` - defaults to `100`



## History
You can discover the history inside the [History.md](https://github.com/bevry/safefs/blob/master/History.md#files) file



## License
Licensed under the incredibly [permissive](http://en.wikipedia.org/wiki/Permissive_free_software_licence) [MIT License](http://creativecommons.org/licenses/MIT/)
<br/>Copyright © 2013+ [Bevry Pty Ltd](http://bevry.me)
<br/>Copyright © 2011-2012 [Benjamin Arthur Lupton](http://balupton.com)
