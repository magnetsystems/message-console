define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-summary-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXSummary', function(params){
                me.setElement('#mmx-summary-container');
                $('#mmx-active-project-container').hide();
                me.options.eventPubSub.trigger('hideCollapsibleMenu', {
                    mmxView : true
                });
                me.options.eventPubSub.trigger('updateBreadcrumb', {title : 'Summary'});
                me.render([]);
                $('#breadcrumb .same-line').show();
                $('#mmx-summary-container').show('fast');
                me.options.opts.firstLogin = false;
                if(!params.col.length && !me.options.opts.newMMXUser){
                    return me.options.opts.tour = MMXNoAppTour();
                }
                if(me.options.opts.newMMXUser === true){
                    var model = params.col.where({
                        name : 'Quickstart'
                    });
                    Backbone.history.navigate('#/messaging/'+model[0].attributes.appId+'/quickstart');
                }
                me.getStats(params.col, function(col){
                    me.render(col);
                });
            });
        },
        getStats: function(col, cb){
            AJAX('apps/stats', 'GET', 'application/json', null, function(res){
                for(var j=0;j<col.models.length;++j){
                    for(var i=0;i<res.length;++i){
                        if(res[i].appId == col.models[j].attributes.id){
                            col.models[j].set({
                                statistics : utils.calcStats(res[i])
                            });
                        }
                    }
                }
                cb(col);
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        render: function(col){
            this.$el.html(_.template($('#MessagingSummaryView').html(), {
                col          : col.models,
                configs      : this.options.opts.configs,
                renderSingle : this.renderSingle
            }));
            this.$el.find('.fa-exclamation-triangle').tooltip();
        },
        renderSingle: function(model, configs){
            if(!model.attributes.statistics) return 'No information is available about this app yet.';
            return _.template($('#MessagingDashboardItemTmpl').html(), {
                model      : model,
                configs    : configs,
                statistics : model.attributes.statistics || {}
            })
        }
    });
    return View;
});