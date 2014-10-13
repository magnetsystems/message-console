
require.config({
    paths : {
        "modernizr"         : "libs/modernizr",
        "jquery"            : "libs/jquery",
        "underscore"        : "libs/underscore",
        "backbone"          : "libs/backbone-min",
        "bootstrap"         : "libs/bootstrap.min",
        "fuelux"            : "libs/fuelux.min",
        "resources"         : "libs/resources"
    },
    shim : {
        "resources"  : {
            "deps"    : ["backbone", "jquery"]
        },
        "bootstrap"  : {
            "deps"    : ["jquery"]
        },
        "fuelux"  : {
            "deps"    : ["bootstrap", "jquery"]
        }
    }
});
require(['modernizr', 'jquery', 'backbone', 'routers/accountRouter', 'resources', 'bootstrap', 'fuelux'], function(Modernizr, $, Backbone, Desktop){
    // create new desktop instance
    this.router = new Desktop();
});