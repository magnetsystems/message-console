define(["jquery", "backbone", "models/AppModel"], function($, Backbone, AppModel){
    var Collection = Backbone.Collection.extend({
        model: AppModel,
        urlRoot: 'apps',
        parse: function(res){
            return res.data;
        },
        iwhere: function(key, val){
            return this.filter(function(item){
                return item.get(key).toLowerCase() === val.toLowerCase();
            });
        }
    });
    return Collection;
});