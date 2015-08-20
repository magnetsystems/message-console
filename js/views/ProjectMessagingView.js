define(['jquery', 'backbone', 'models/AppModel', 'collections/AppCollection', 'views/MMXProjectView', 'views/MMXSummaryView'], function($, Backbone, AppModel, AppCollection, MMXProjectView, MMXSummaryView){
    var View = Backbone.View.extend({
        el: '#mmx-container',
        initialize: function(options){
            var me = this;
            var pv = new MMXProjectView(options);
            var sv = new MMXSummaryView(options);
            me.options = options;
            me.col = new AppCollection();
            me.options.opts.col = me.col;
            me.options.eventPubSub.bind('initMessaging', function(params){
                $('#mmx-project-new-name').val('');
                $('#mmx-summary-container').hide();
                $('#mmx-active-project-container').hide();
                me.getConfigs(function(){
                    me.getApps(function(){
                        me.renderAppList(params.id);
                        me.options.opts.appCount = me.col.length;
                        me.options.eventPubSub.trigger('imposeAppLimit');
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
            });
            me.options.eventPubSub.bind('renderMMXList', function(id){
                if(!id) $('#mmx-active-project-container').hide('fast');
                me.renderAppList(id);
            });
            me.newAppModal = $('#mmx-create-app-modal');
            me.newAppModal.find('#create-messaging-app-btn').click(function(){
                me.createMessagingApp();
            });
            me.options.eventPubSub.bind('imposeAppLimit', function(){
                if(me.options.opts.configs['mmx.cluster.max.apps'] > 0 && me.options.opts.configs['mmx.cluster.max.apps'] <= me.col.length){
                    $('#mmx-maximum-apps-reached').show();
                    $('#mmx-container .view-wrapper').css('margin-top', function(index, curValue){
                        var curr = parseInt(curValue, 10);
                        return (curr == 43 || curr == 78) ? (curr + 34) : curr + 'px';
                    });
                }else{
                    $('#mmx-maximum-apps-reached').hide();
                    $('#mmx-container .view-wrapper').css('margin-top', function(index, curValue){
                        var curr = parseInt(curValue, 10);
                        return (curr == 77 || curr == 112) ? (curr - 34) : curr + 'px';
                    });
                }
            });
        },
        events: {
            'click #create-messaging-app-modal': 'showCreateMessagingAppModal',
            'click #create-messaging-app-modal2': 'showCreateMessagingAppModal',
            'change #mmx-app-list': 'onSelectApp',
            'change #mmx-app-list2': 'onSelectApp2'
        },
        showCreateMessagingAppModal: function(){
            if(this.options.opts.tour) this.options.opts.tour.end();
            if(this.options.opts.configs['mmx.cluster.max.apps'] > 0 && this.options.opts.configs['mmx.cluster.max.apps'] <= this.col.length) return alert('You have the maximum number of apps. You will need to delete an app to create one. ');
            this.newAppModal.find('input').val('');
            this.newAppModal.modal('show');
        },
        getApps: function(cb, isSubView){
            var me = this;
            if(me.col.length && isSubView) return cb();
            $('#mmx-app-list, #mmx-app-list2').html('');
            me.col.fetch({
               success: function(){
                   cb();
               },
               error: function(e){
                   alert(e);
               }
            });
        },
        getConfigs: function(cb){
            var me = this;
            if(me.options.opts.configs) return cb();
            AJAX('apps/configs', 'GET', 'application/json', null, function(res){
                res.configs['mmx.cluster.max.apps'] = parseInt(res.configs['mmx.cluster.max.apps']);
                res.configs['mmx.cluster.max.devices.per.app'] = parseInt(res.configs['mmx.cluster.max.devices.per.app']);
                me.options.opts.configs = res.configs;
                cb();
            }, function(xhr){
                alert(xhr.responseText);
            });
        },
        renderAppList: function(id){
            $('#mmx-app-list, #mmx-app-list2').html(_.template($('#MessagingAppsListView').html(), {
                col : this.col.models
            }));
        },
        createMessagingApp: function(){
            var me = this;
            var input = me.newAppModal.find('input');
            if($.trim(input.val()).length < 1) return alert('App Name is a required field.');
            var model = new AppModel();
            model.save({
                name : input.val()
            }, {
                success: function(){
                    input.val('');
                    me.col.add(model);
                    me.options.opts.appCount = me.col.length;
                    me.options.eventPubSub.trigger('imposeAppLimit');
                    me.newAppModal.modal('hide');
                    Backbone.history.navigate('#/messaging/'+model.attributes.id+'/quickstart');
                },
                error: function(e){
                    alert('The App name you specified already exists. Please choose another name.');
                }
            });
        },
        selectProject: function(id, view){
            $('#mmx-summary-container').hide();
            $('#mmx-app-list, #mmx-app-list2').val(id);
            this.options.eventPubSub.trigger('initMMXProject', {
                model : this.col.get(id),
                view  : view
            });
        },
        onSelectApp: function(){
            var appId = $('#mmx-app-list').val();
            if(appId) Backbone.history.navigate('#/messaging/'+appId);
        },
        onSelectApp2: function(){
            var appId = $('#mmx-app-list2').val();
            if(appId) Backbone.history.navigate('#/messaging/'+appId);
        }
    });
    return View;
});