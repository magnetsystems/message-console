/* Development Environment Variables */

module.exports = {

    // App Configuration
    App : {
        port          : 3002,
        sessionSecret : 'ThisSecretShouldBeChanged'
    },

    // Database Configuration
    Database : {
        options : {
            sync        : true,
            createAdmin : true
        },
        dbName   : 'developercenter',
        username : 'root',
        password : null,
        params   : {
            host    : 'localhost',
            port    : 3306,
            logging : winston.verbose
        }
    },

    // Log Configuration
    Logging : {
        console : {
            enabled          : true,
            handleExceptions : false, // display uncaught exceptions
            level            : 'silly' // lowest level to log
        },
        file : {
            enabled          : false,
            handleExceptions : false, // display uncaught exceptions
            level            : 'info', // lowest level to log
            folder           : './log',
            filename         : 'server0.log',
            maxsize          : 100000, // size in bytes
            maxFiles         : 20  // maximum number of rotating files
        },
        email : {
            enabled          : false,
            recipient        : 'manager1@magnetapi.com', // recipient of log emails
            handleExceptions : false, // display uncaught exceptions
            level            : 'error' // lowest level to log
        }
    }

};