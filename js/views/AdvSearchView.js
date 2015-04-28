define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initAdvSearch', function(params){
                me.setElement(params.el);
                me.tag = params.tag;
                me.identifier = utils.getGUID();
                me.filters = params.filters;
                me.filterCount = 0;
                me.render();
            });
        },
        events: {
            'click .advsearch-addfilter': 'addFilter',
            'click .advsearch-refresh': 'refresh',
            'click .advsearch-filter-list .glyphicon-remove': 'onRemoveFilter'
        },
        render: function(){
            this.$el.html(_.template($('#AdvancedSearchTmpl').html(), {
                filters    : this.filters,
                identifier : this.identifier
            }));
            this.filterListTitle = this.$el.find('.panel-title a span');
        },
        addFilter: function(){
            var name = this.$el.find('select[name="filters"]').val();
            var filter = this.filters[name];
            this.$el.find('.advsearch-filter-list').append(_.template($('#ADV'+filter.type+'Filter').html(), {
                filter : filter,
                name   : name
            }));
            ++this.filterCount;
            this.displayFilterListTitle();
            $('#collapse'+this.identifier).collapse('show');
        },
        onRemoveFilter: function(){
            --this.filterCount;
            this.displayFilterListTitle();
        },
        displayFilterListTitle: function(){
            this.filterListTitle.text('('+this.filterCount+' filter'+(this.filterCount === 1 ? '' : 's')+')');
        },
        collect: function(){
            var me = this, ary = [];
            me.$el.find('.advsearch-filter-item').each(function(){
                var val = utils.collect($(this));
                ary.push({
                    name : $(this).attr('did'),
                    val  : (val.enum || val.search) ? (val.enum || val.search) : val
                });
            });
            return ary;
        },
        refresh: function(){
            $('#collapse'+this.identifier).collapse('hide');
            this.options.eventPubSub.trigger('AdvSearchRefresh', this.tag);
        }
    });
    return View;
});