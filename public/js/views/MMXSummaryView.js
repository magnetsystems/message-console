define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-summary-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXSummary', function(params){
                $('#mmx-active-project-container').hide();
                $('#mmx-summary-container').show('fast');
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
                renderSingle : this.renderSingle
            }));
        },
        renderSingle: function(model){
            if(!model.attributes.statistics) return 'No information is available about this app yet.';
            return _.template($('#MessagingDashboardItemTmpl').html(), {
                model      : model,
                statistics : model.attributes.statistics || {}
            })
        }
    });
    return View;
});