define(['jquery', 'backbone', 'models/AppModel', 'views/MMXProjectDashboardView', 'views/MMXProjectEndpointsView',
    'views/MMXProjectSettingsView', 'views/MMXProjectMessagesView', 'views/MMXProjectTopicsView', 'views/MMXProjectQuickstartView'],
    function($, Backbone, AppModel, MMXProjectDashboardView, MMXProjectEndpointsView,
     MMXProjectSettingsView, MMXProjectMessagesView, MMXProjectTopicsView, MMXProjectQuickstartView){
    var View = Backbone.View.extend({
        el: '#mmx-active-project-container',
        initialize: function(options){
            var me = this;
            initDatagrid();
            var pdv = new MMXProjectDashboardView(options);
            var psv = new MMXProjectSettingsView(options);
            var pev = new MMXProjectEndpointsView(options);
            var pmv = new MMXProjectMessagesView(options);
            var ptv = new MMXProjectTopicsView(options);
            var pqv = new MMXProjectQuickstartView(options);
            me.options = options;
            me.model = new AppModel();
            me.options.eventPubSub.bind('initMMXProject', function(params){
                me.setElement('#mmx-active-project-container');
                me.model = params.model || me.model;
                me.setTab(params.view || 'dashboard');
                me.$el.show();
                if(me.options.opts.newMMXUser === true){
                    me.options.opts.newMMXUser = false;
                    me.options.opts.tour = MMXInitialAppTour(params.model.attributes.id);
                }
                me.options.eventPubSub.trigger('showCollapsibleMenu', {
                    mmxView : true
                });
            });
        },
        setTab: function(view){
            $('.mmx-nav a').removeClass('active');
            $('.mmx-nav a[href="#'+view+'"]').addClass('active');
            this.$el.find('.tab-pane').removeClass('active');
            this.$el.find('.tab-pane[id="mmx-'+view+'"]').addClass('active');
            this.options.eventPubSub.trigger('updateBreadcrumb', {
                title : this.toUpper(view)+(view == 'dashboard' ? ' for '+this.model.attributes.appName : '')
            });
            this.options.eventPubSub.trigger('initMMXProject'+view, this.model);
        },
        toUpper: function(str){
            return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        }
    });
    return View;
});