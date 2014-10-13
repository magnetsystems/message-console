var MAB = require('../lib/MAB')
, path = require('path')
, fs = require('fs');

//MAB.start();

module.exports = function(app){

    app.get('/rest/projects', function(req, res){
        MAB.getProjects(function(e, data){
            if(e){
                res.send(e, 400);
            }else{
                res.send(data, 200);
            }
        });
    });

    app.post('/rest/projects', function(req, res){
        MAB.createProject(req.body, function(e, id){
            if(e){
                res.send(e, 400);
            }else{
                res.send({
                    id : id
                }, 201);
            }
        });
    });

    app.delete('/rest/projects/:id', function(req, res){
        MAB.deleteProject(req.params.id, function(e){
            if(e){
                res.send(e, 400);
            }else{
                res.send({
                    id : req.params.id
                }, 200);
            }
        });
    });

    app.get('/rest/projects/:id', function(req, res){
        MAB.getProject(req.params.id, function(e, data){
            if(e){
                res.send(e, 400);
            }else{
                res.send(data, 200);
            }
        });
    });

    app.get('/rest/servers', function(req, res){
        MAB.getServers(function(e, data){
            if(e){
                res.send(e, 400);
            }else{
                res.send(data, 200);
            }
        });
    });

    app.get('/rest/users', function(req, res){
        MAB.getUsers(function(e, data){
            if(e){
                res.send(e, 400);
            }else{
                res.send(data, 200);
            }
        });
    });

};
