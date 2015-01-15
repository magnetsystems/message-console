define(["jquery", "backbone", "models/AppModel"], function($, Backbone, AppModel){
    var Collection = Backbone.Collection.extend({
        model   : AppModel,
        urlRoot : 'mmx/apps',
        parse: function(res){
            return res.data;
        }
    });
    return Collection;
});