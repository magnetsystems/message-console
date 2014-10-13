define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-mgmt-tab',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectSettings', function(model){
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
        },
        saveProject: function(){
            var me = this;
            var input = me.$el.find('input[name="appName"]');
            me.model.save({
                appName : input.val()
            }, {
                success: function(){
                    me.options.eventPubSub.trigger('renderMMXList', me.model.attributes.id);
                    Alerts.General.display({
                        title   : 'Project Updated',
                        content : 'Your changes have been saved.'
                    });
                },
                error: function(e){
                    alert(e);
                }
            });
        },
        deleteProject: function(){
            var me = this;
            Alerts.Confirm.display({
                title   : 'Confirm Project Deletion',
                content : 'Please verify that you wish to delete this project.'
            }, function(){
                me.model.destroy({
                    success: function(){
                        me.options.eventPubSub.trigger('renderMMXList');
                    },
                    error: function(e){
                        alert(e);
                    }
                });
            });
        }
    });
    return View;
});