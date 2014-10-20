var express = require('express')
, http = require('http')
, connect = require('connect')()
, app = express()
, session = require('express-session')
, fs = require('fs')
, winston = require('winston');

if(!app.settings.env || app.settings.env == ''){
    throw new Error('The environment variable app.settings.env is not configured.');
}

global.winston = winston;
global.ENV_CONFIG = require('./config/config');
global.APP_CONFIG = {};

app.set('port', ENV_CONFIG.App.port);

// view rendering
app.engine('ejs', require('ejs-locals'));
app.set('views', __dirname + '/views');

app.locals._layoutFile = '/layouts/site';
app.locals.open = '{{';
app.locals.close = '}}';
app.set('view engine', 'ejs');
// allow req.body
app.use(require('body-parser')());
app.use(require('cookie-parser')(ENV_CONFIG.App.sessionSecret));
app.disable('x-powered-by');


if(ENV_CONFIG.Logging.console.enabled){
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        level            : ENV_CONFIG.Logging.console.level,
        handleExceptions : ENV_CONFIG.Logging.console.handleExceptions
    });
    winston.info('Logging: enabled console logging at level: '+ENV_CONFIG.Logging.console.level);
}

if(app.settings.env == 'development' || app.settings.env == 'test'){
    app.use(require('errorhandler')({
        dumpExceptions : true,
        showStack      : true
    }));
//    app.use(session({
//        store  : new session.MemoryStore(),
//        secret : ENV_CONFIG.App.sessionSecret
//    }));
    // prioritize router before public directory
    app.use(express.static(__dirname + '/public'));
}

// Routes
//require('./routes')(app);

http.createServer(app).listen(ENV_CONFIG.App.port, function(){
    winston.info("Express: http server listening on port %d in %s mode", app.get('port'), app.settings.env);
});