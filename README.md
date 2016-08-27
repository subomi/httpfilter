# filter

A filter middleware to filter http requests, and block some unwanted requests type.

## Installation 

```sh
$ npm install filter
```


## API
There are two major ways to use the filter API.

### Configure Model
```js

var filter = require('filter');

filter(serverOptions)
```
#### filter(serverOptions)

Returns an Object that would be ready to filter on a call to .start(). It would recieved the request, response and next args and run filter. E.g filter.start(request, response, next); IT integrates into expressjs to call next for the next middleware

### On-the-fly Model
```js

var filter = require('filter');
```

#### filter(request, response, serverOptions, next)

Does not return any object, it passes the serverOptions directly to the middleware call and off they go into processing


### serverOptions 
This is a plain object containing strictly the following

#### versions
This contains an array of strings containing http versions allowed on this server e.g
```js
	versions: ["1.0", "1.1"] // this server does not support http2
```

#### allow
This contains an array of strings containing http methods allowed on this server e.g
```js
	allow: ["GET", "POST"] // this server does allows only GET and POST methods
```

#### proxy
This identifies a proxying requests and allows or denies them depending on the value of proxy property. The value options are: allow, less-strict, deny
```js
	proxy: "deny" // this server does not support http2
```
##### allow 
This does not put any restriction. But allows any form of proxying take place, e.g proxying to another machine, or host number.

##### less-strict
This restricts proxying to an external machine, but not proxying to the same machine, but on different ports.

##### deny
This restricts every form of proxying both to an external machince, and even internal proxying

#### hostname
This is a string contains the virtual hostname. To parse against the hostname, when running a number on virtual hosts on the same machine.
```js
	hostname: "localhost" // this server supports requests from localhost only.
```

#### alias
This is a string containing hostname aliases seperated by " ". Used for detailed checking of the hostname field
```js
	alias: "home filter" // alias used to add more options for hostname test above
```

#### ip 
This is used to check for proxying requests. ip is a string in numeric form. 
```js
	ip: "127.0.0.1" // this server restricts requests not sent to localhost, when proxy is set to deny
```

## Examples
Using expressjs

### Configure Model

```js

var filter = require('filter');
var express = require('express');

var app = express();

filter = filter(serverOptions)

app.use(filter);

```
### On-the-fly Model

```js
var filter = require('filter');
var express = require('express');

var app = express();
var serverOptions = {};

app.use(function(req, res, next) {
	filter(req, res, serverOptions, next);
})


## Tests
There are no tests ... coming soon.

## License 

[MIT](LICENSE)
