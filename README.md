# README #

This is a standalone messaging console which talks to an MMX-enabled developer factory instance using CORS. The console (./public) has no dependency on the node.js platform on which it resides; the console can be placed on any platform.

### SETUP ###

* cd messaging-console
* npm install
* vi public/js/libs/resources.js and find the following:
~~~~
var GLOBAL = {
    baseUrl : 'http://localhost:3001',
    polling : false
};
~~~~
* change `baseUrl` property to the developer factory host. If the messaging console is on the same hostname and port as the developer factory, the property can be removed altogether to avoid using CORS.