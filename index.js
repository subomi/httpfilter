module.exports = filter;

//modules
const urlParser = require('url').parser;
const dns = require('dns');

/**
 * Filter http headers to identify bad requests
	checks 
	
	=> http version - done
	=> Method - done
	=> hostname - done
	=> proxing - done

	TODO
	=> Priviledged IP
	=> Client IP

	=>
	
*/

function filter(opts) {
	
	var options = opts;
	// setup lasthandler
	// check global space - flash setup
	if(!lasthandler) {
		//not flash
		if(!opts.lasthandler) {
			function lasthandler() {}
		} 
		lasthandler = opts.lasthandler;
	}
	
	if(arguments.length > 1) {
		// jump into on-the fly processing;
		return filter(arguments);
	}

	// Lightweight middlewares

	function httpVersion(request, server) {
		/**
 		 * Tests if http version is supported
		 */
		var version = request.httpVersion;
		var predefined_versions = server.versions;

		if(!version || !predefined_versions) {
			throw new Error("version type was wrongly given");
		}
		if(Array.isArray(version)) {
			// version can be an array httpVersionMajor and httpVersionMinor
			return version.some(function(value) { 
				// do checking
				return predefined_versions.some(function(item) {
					return item == value 
					}) 
				})
			}
		return predefined_versions.indexOf(version) === -1 ? false : true;
	}

	function method(request, server) {
		/**
		 * Tests if method is allowed 
		 */
		var requestMethod = request.method;
		var allowables = server.allow;
		requestMethod = requestMethod.toLowerCase();
		return allowables.some(function(item) {
		 	return requestMethod === item.toLowerCase();
		});
	}

	function hostname(request, server) {
		/**
 		 * Tests if there exists a hostname in uri or hostname header
		 */
		return extract(request);
	}

	function matchHostName(request, server) {
		/**
		 * Tests if hostname matches our hostname and list of alias.
		 */		
		var extracted = extract(request, "arg");
		var hostname = extracted[0];
		var alias = server.alias.split(" ").concat(server.hostname);
		return alias.some(function(item) {
			return item === hostname;
		});
	}


	function proxy(request, server) {
		/**
 		 * Tests if request comes to us, or we are acting as a proxy.
		 */
		var proxyOption = server.proxy;
		var extracted = extract(request, "arg");
		var hostname = extracted[0];
		var client_ip = ipresolve(hostname);
		var client_port = extracted[1];
		var ip = server.ip;
		var port = server.port;	
		
		function ipresolve() {
			// TODO: do proper resolving
			return "127.0.0.1";
			//return dns.resolve4()
		}

		function vhostresolve(arg) {
			if(typeof arg === "string") {
				return arg.split(" ");
			}
			return arg;
		}

		function matchAgainstIp() {
			if(client_ip === ip) {
				// origin
				return true;
			}
			return false;
		}

		function matchAgainstPort() {
			if(!client_port) {
				// there was no port number given
				return true;
			}
			
			if(client_port == port) {
				// origin
				return true;
			}
			return false;
		}

		function denyProxy() {
			if(!matchAgainstIp()) {
				return false;
			}
			if(!matchAgainstPort()) {

				return false;
			}
			return true;
		}

		function lessStrict() {
			if(!matchAgainstIp()) {
				return false;
			}
			return true;
		}

		function allow() {
			// always true
			return true;
		}
		
		switch (proxyOption) {
			case "deny": 
				return denyProxy();
			case "less-strict":
				return lessStrict();
			case "allow":
				return allow();
		}
	}

	/*
	function privileged(request, server) {
		var ipFam = request.socket.remoteFamily;
		var ip = request.socket.remoteAddress;
		var privilegedIps = server.priviledged_ip;

		if(ipFam === "IPv6") {
			return false;
		}

		ip = ip.replace("*", "")
	
	}
	*/

	function filter(request, response, server, next) {
		if(!request || !response) {
			throw new Error("Both request, response streams and server object must be provided");
		}

		if(server && typeof server === "function"){
			// means next
			if(!options) {
				throw new Error("opts should have been configured earlier");

			}
			next = server;
			server = options;
		}
		if (!server) {
			if(opts) {
				server = opts;
			}else {
				throw new Error("server object not provided anywhere");	
			}
			
		}

		if(!httpVersion(request, server)) {
			console.log('bad - version')
			lasthandler(request, response, server) // setup not supported http request;
			return;
		}
		if(!method(request, server)) {
			console.log('bad - method')
			lasthandler(request, response, server) // setup method not allowed
			return;
		}
		if(!hostname(request, server)) {
			console.log('bad - hostname')
			lasthandler(request, response, server) // setup no hostname - bad request
			return;
		}
		if(!matchHostName(request, server)) {
			console.log("wrong - hostname")
			lasthandler(request, response, server);
		}
		if(!proxy(request, server)) {
			console.log('bad - proxy')
			lasthandler() // setup bad request - no proxying
			return;
		}
		/* if(!privileged(request, server)) {
			console.log('Not privileged to access secret server');
			lasthandler(); // Forbidden
			return;
		} */

		if(!typeof next === "function") {
			lasthandler();
		}
	}

	/**
 	 * @public api
	 */
	return {
		init: function(request, response, next) {
			return filter(request, response, next);
		}
	}
}

// Utilities

function extract(request, arg) {
	
	var hostname = request.headers.host.split(":");
	var port;
	if(hostname.length === 0) {
	 	// host field was empty.
	 	hostname = urlParser(request.url).hostname;
	 	port = urlParser(request.url).port;
	 	if(!hostname || hostname.length === 0) {
	 		//bad request
	 		return false;
		}
	 	// found in url
	 	if(arg) {
	 		return [hostname, port];
	 	}
	 	return true;
	} else if(hostname.length > 1) {
	 	// host field contained necessary information
	 	host = hostname[0];
	 	port = hostname[1];
	 	if(arg) {
	 		return [host, port];
	 	}
		return true;
	}
}