define(['jquery', 'backbone', 'models/AppModel', 'collections/AppCollection', 'views/MMXProjectView'], function($, Backbone, AppModel, AppCollection, MMXProjectView){
    var View = Backbone.View.extend({
        el: '#mmx-container',
        initialize: function(options){
            var me = this;
            var pv = new MMXProjectView(options);
            me.options = options;
            me.col = new AppCollection();
            me.options.eventPubSub.bind('initMessaging', function(params){
                $('#mmx-project-new-name').val('');
                $('#mmx-active-project-container').hide();
                me.getApps(function(){
                    me.renderAppList(params.id);
                    if(params.id && me.col.get(params.id)){
                        me.selectProject(params.id);
                        me.options.eventPubSub.trigger('initMMXProject', {
                            model : me.col.get(params.id)
                        });
                    }
                });
            });
            me.options.eventPubSub.bind('renderMMXList', function(id){
                if(!id) $('#mmx-active-project-container').hide('fast');
                me.renderAppList(id);
            });
        },
        events: {
            'click #create-messaging-app-btn': 'createMessagingApp',
            'keypress #mmx-project-new-name': 'onCreateMessagingAppEnter'
        },
        getApps: function(cb){
            var me = this;
            if(me.col.length) return cb();
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
                col      : this.col.models,
                activeId : id || ''
            }));
        },
        createMessagingApp: function(){
            var me = this;
            var input = $('#mmx-project-new-name');
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
            var appList = $('#mmx-app-list');
            appList.find('a').removeClass('active');
            appList.find('a[href="#/messaging/'+id+'"]').addClass('active');
        }
    });
    return View;
});