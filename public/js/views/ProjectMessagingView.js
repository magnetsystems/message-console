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
                    me.options.opts.appCount = me.col.length;
                    if(params.id && me.col.get(params.id)){
                        me.selectProject(params.id, params.view);
                    }else if(me.col.length == 1){
                        me.selectProject(me.col.models[0].attributes.id, params.view);
                    }else if(!me.col.length || me.col.length > 1){
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
            me.newAppModal = $('#mmx-create-app-modal');
            me.newAppModal.find('#create-messaging-app-btn').click(function(){
                me.createMessagingApp();
            });
        },
        events: {
            'click #create-messaging-app-modal': 'showCreateMessagingAppModal',
            'change #mmx-app-list': 'onSelectApp'
        },
        showCreateMessagingAppModal: function(){
            if(this.options.opts.tour) this.options.opts.tour.end();
            this.newAppModal.find('input').val('');
            this.newAppModal.modal('show');
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
            var input = me.newAppModal.find('input');
            if($.trim(input.val()).length < 1) return alert('App Name is a required field.');
            var model = new AppModel();
            model.save({
                appName : input.val()
            }, {
                success: function(){
                    input.val('');
                    me.col.add(model);
                    me.options.opts.appCount = me.col.length;
                    me.newAppModal.modal('hide');
                    Backbone.history.navigate('#/messaging/'+model.attributes.id);
                },
                error: function(e){
                    alert('The App name you specified already exists. Please choose another name.');
                }
            });
        },
        selectProject: function(id, view){
            $('#mmx-summary-container').hide();
            $('#mmx-app-list').val(id);
            this.options.eventPubSub.trigger('initMMXProject', {
                model : this.col.get(id),
                view  : view
            });
        },
        onSelectApp: function(){
            var appId = $('#mmx-app-list').val();
            if(appId) Backbone.history.navigate('#/messaging/'+appId);
        }
    });
    return View;
});