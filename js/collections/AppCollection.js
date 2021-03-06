define(["jquery", "backbone", "models/AppModel"], function($, Backbone, AppModel){
    var Collection = Backbone.Collection.extend({
        model: AppModel,
        urlRoot: 'apps',
        parse: function(res){
            if(res.data){
                for(var i=res.data.length;i--;){
                    res.data[i].gcm = res.data[i].gcm || {};
                    res.data[i].id = res.data[i].appId;
                    res.data[i].magnetId = res.data[i].appId;
                }
            }
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