define(["jquery", "backbone", "models/FilterModel"], function($, Backbone, FilterModel){
    var Collection = Backbone.Collection.extend({
        model : FilterModel,
        url   : '/rest/filters'
    });
    return Collection;
});