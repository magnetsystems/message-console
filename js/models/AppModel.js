define(["jquery", "backbone"], function($, Backbone){
    var View = Backbone.Model.extend({
        urlRoot: 'apps',
        parse: function(res){
            if(res){
                res.gcm = res.gcm || {};
                res.id = res.appId;
                res.magnetId = res.appId;
            }
            return res;
        }
    });
    return View;
});