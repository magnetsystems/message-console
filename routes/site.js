var ejs = require('ejs')
, fs = require('fs');

module.exports = function(app){

/* PAGES */
//
//    app.get('/', function(req, res){
//        res.render('index', {
//            locals : {
//                title           : 'Home',
//                activePage      : 'home'
//            }
//        });
//    });

    app.get('/mab', function(req, res){
        res.render('mab', {
            locals : {
                title           : 'Home',
                activePage      : 'home'
            }
        });
    });

/* GENERAL */

    // render 404
    function do404(req, res){
        res.status(404);
        res.render('error/404', {
            locals : {
                title       : 'Page Not Found',
                bodyType    : 'dev',
                activePage  : '404'
            }
        });
    }
    
    // handle unknown requests
	app.get('*', function(req, res){ 
        do404(req, res);
    });

};