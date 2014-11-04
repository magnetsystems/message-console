define(['jquery', 'backbone', 'models/AppModel', 'collections/AppCollection', 'views/MMXProjectView', 'views/MMXSummaryView'], function($, Backbone, AppModel, AppCollection, MMXProjectView, MMXSummaryView){
    var View = Backbone.View.extend({
        el: '#mmx-container',
        initialize: function(options){
            var me = this;
            var pv = new MMXProjectView(options);
            var sv = new MMXSummaryView(options);
            me.options = options;
            me.col = new AppCollection();
            me.options.eventPubSub.bind('initMessaging', function(params){
                $('#mmx-project-new-name').val('');
                $('#mmx-summary-container').hide();
                $('#mmx-active-project-container').hide();
                me.getApps(function(){
                    me.renderAppList(params.id);
                    if(params.id && me.col.get(params.id)){
                        me.selectProject(params.id);
                    }else if(me.col.length == 1){
                        me.selectProject(me.col.models[0].attributes.id);
                    }else if(me.col.length > 1){
                        me.options.eventPubSub.trigger('initMMXSummary', {
                            col : me.col
                        });
                    }
                }, params.id);
            });
            me.options.eventPubSub.bind('renderMMXList', function(id){
                if(!id) $('#mmx-active-project-container').hide('fast');
                me.renderAppList(id);
            });
        },
        events: {
            'click #create-messaging-app-btn': 'createMessagingApp',
            'keypress #mmx-project-new-name': 'onCreateMessagingAppEnter',
            'click #mmx-app-list li a': 'onSelectApp'
        },
        getApps: function(cb, isSubView){
            var me = this;
            if(me.col.length && isSubView) return cb();
            $('#mmx-app-list').html('');
            me.col.fetch({
               success: function(){
                   cb();
               },
               error: function(e){
                   alert(e);
               }
            });
        },
        renderAppList: function(id){
            $('#mmx-app-list').html(_.template($('#MessagingAppsListView').html(), {
                col : this.col.models
            }));
        },
        createMessagingApp: function(){
            var me = this;
            var input = $('#mmx-app-selected-item');
            if($.trim(input.val()).length < 1) return;
            var model = new AppModel();
            model.save({
                appName : input.val()
            }, {
                success: function(){
                    input.val('');
                    me.col.add(model);
                    Backbone.history.navigate('#/messaging/'+model.attributes.id);
                },
                error: function(e){
                    alert(e);
                }
            });
        },
        onCreateMessagingAppEnter: function(e){
            if(e.keyCode != 13)  return;
            this.createMessagingApp();
        },
        selectProject: function(id){
            $('#mmx-summary-container').hide();
            $('#mmx-project-list-container').combobox('selectByValue', id);
            this.options.eventPubSub.trigger('initMMXProject', {
                model : this.col.get(id)
            });
        },
        onSelectApp: function(){
            var sel = $('#mmx-project-list-container').combobox('selectedItem');
            Backbone.history.navigate('#/messaging/'+sel.value);
        }
    });
    return View;
});