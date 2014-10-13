define(['jquery', 'backbone', 'collections/FilterCollection', 'models/FilterModel'], function($, Backbone, FilterCollection, FilterModel){
    var View = Backbone.View.extend({
        el: '#mmx-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.fCol = new FilterCollection();
            me.options.eventPubSub.bind('initMMXProject', function(params){
                me.displayFilters();
            });
        },
        events: {
            'click #project-messaging-filter-add a' : 'addFilter',
            'click #project-messaging-filter-list .glyphicon-remove': 'removeFilter'
        },
        displayFilters: function(){
            var me = this;
            if(me.fCol.length > 0)
                $('#project-messaging-filter-list').html('');
            me.fCol.each(function(model){
                me.renderFilter(model);
            });
        },
        addFilter: function(e){
            e.preventDefault();
            if(this.fCol.length == 0)
                $('#project-messaging-filter-list').html('');
            var model = new FilterModel({
                id   : utils.getGUID(),
                type : $(e.currentTarget).attr('did')
            });
            this.fCol.add(model);
            this.renderFilter(model);
        },
        renderFilter: function(model){
            var template = _.template($('#'+model.attributes.type+'MessageFilterView').html(), {
                model : model.attributes
            });
            $('#project-messaging-filter-list').append(template);
            return this;
        },
        removeFilter: function(e){
            var me = this;
            var filter = $(e.currentTarget).closest('.alert');
            var model = me.fCol.get(filter.attr('did'));
            me.fCol.remove(model);
            filter.hide('slow', function(){
                filter.remove();
                if(me.fCol.length == 0)
                    $('#project-messaging-filter-list').html('No filters have been added.');
            });
        }
    });
    return View;
});