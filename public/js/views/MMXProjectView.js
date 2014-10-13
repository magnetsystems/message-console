define(['jquery', 'backbone', 'models/AppModel', 'views/MMXProjectUsersView', 'views/MMXProjectSettingsView', 'views/MMXProjectMessagesView'], function($, Backbone, AppModel, MMXProjectUsersView, MMXProjectSettingsView, MMXProjectMessagesView){
    var View = Backbone.View.extend({
        el: '#mmx-active-project-container',
        initialize: function(options){
            var me = this;
            initDatagrid();
            var psv = new MMXProjectSettingsView(options);
            var puv = new MMXProjectUsersView(options);
            var pmv = new MMXProjectMessagesView(options);
            me.options = options;
            me.model = new AppModel();
            me.options.eventPubSub.bind('initMMXProject', function(params){
                me.model = params.model;
                me.setTab(null, me.$el.find('.nav-tabs li.active a').attr('did'));
                me.$el.show('fast');
            });
        },
        events: {
            'click .nav-tabs li a': 'setTab'
        },
        setTab: function(e, view){
            this.options.eventPubSub.trigger('initMMXProject'+(view ? view : $(e.currentTarget).attr('did')), this.model);
        }
    });
    return View;
});