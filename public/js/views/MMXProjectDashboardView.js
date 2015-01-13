define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-dashboard',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectdashboard', function(model){
                me.setElement('#mmx-dashboard');
                me.model = model;
                me.getStats(function(stats){
                    me.render(stats);
                });
            });
        },
        getStats: function(cb){
            var me = this;
            AJAX('mmx/apps/'+me.model.attributes.id+'/stats', 'GET', 'application/json', null, function(res, status, xhr){
                cb(res);
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        render: function(stats){
            this.$el.find('.view-container').html(_.template($('#MessagingDashboardItemTmpl').html(), {
                model      : this.model,
                configs    : this.options.opts.configs,
                statistics : utils.calcStats(stats)
            }));
            this.$el.find('.view-container .fa-exclamation-triangle').tooltip();
        }
    });
    return View;
});