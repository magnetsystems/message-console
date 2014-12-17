define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-settings',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectsettings', function(model){
                me.model = model;
                me.render();
            });
        },
        events: {
            'click .controls button[did="save"]': 'saveProject',
            'click .controls button[did="delete"]': 'deleteProject'
        },
        render: function(){
            this.$el.find('.view-container').html(_.template($('#MessagingProjectSettingsView').html(), {
                model : this.model
            }));
            this.$el.find('.glyphicon-info-sign').tooltip();
        },
        saveProject: function(){
            var me = this;
            var obj = utils.collect(me.$el);
            if($.trim(obj.guestUserSecret).length < 1) return alert('Guest Access Secret is a required field.');
            if($.trim(obj.appName).length < 1) return alert('App Name is a required field.');
            if(me.model.attributes.appName != obj.appName && me.options.opts.col.where({appName:obj.appName}).length) return alert('The App name you specified already exists. Please choose another name.');
            me.model.save(obj, {
                success: function(){
                    me.model.set({
                        gcm : {
                            googleProjectId : obj.googleProjectId,
                            googleApiKey    : obj.googleApiKey
                        }
                    });
                    me.options.eventPubSub.trigger('renderMMXList', me.model.attributes.id);
                    Alerts.General.display({
                        title   : 'App Updated',
                        content : 'Your changes have been saved.'
                    });
                },
                error: function(e){
                    alert(e.responseText);
                }
            });
        },
        deleteProject: function(){
            var me = this;
            Alerts.Confirm.display({
                title   : 'Confirm App Deletion',
                content : 'Please verify that you wish to delete this app.'
            }, function(){
                me.model.destroy({
                    success: function(){
                        me.options.eventPubSub.trigger('renderMMXList');
                        var ret = Backbone.history.navigate('#/', true);
                        if(ret === undefined)
                            Backbone.history.loadUrl('#/');
                        else
                            Alerts.General.display({
                                title   : 'App Deleted',
                                content : 'Your app has been deleted.'
                            });
                    },
                    error: function(e){
                        alert(e.responseText);
                    }
                });
            });
        }
    });
    return View;
});