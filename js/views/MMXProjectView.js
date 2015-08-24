define(['jquery', 'backbone', 'models/AppModel', 'views/MMXProjectDashboardView', 'views/MMXProjectUsersView', 'views/MMXProjectEndpointsView',
    'views/MMXProjectSettingsView', 'views/MMXProjectMessagesView', 'views/MMXProjectNotificationsView', 'views/MMXProjectTopicsView',
    'views/MMXProjectQuickstartView', 'views/MMXAdvancedView'],
    function($, Backbone, AppModel, MMXProjectDashboardView, MMXProjectUsersView, MMXProjectEndpointsView,
     MMXProjectSettingsView, MMXProjectMessagesView, MMXProjectNotificationsView, MMXProjectTopicsView,
     MMXProjectQuickstartView, MMXAdvancedView){
    var View = Backbone.View.extend({
        el: '#mmx-active-project-container',
        initialize: function(options){
            var me = this;
            initDatagrid();
            var pdv = new MMXProjectDashboardView(options);
            var psv = new MMXProjectSettingsView(options);
            var puv = new MMXProjectUsersView(options);
            var pev = new MMXProjectEndpointsView(options);
            var pmv = new MMXProjectMessagesView(options);
            var ppv = new MMXProjectNotificationsView(options);
            var ptv = new MMXProjectTopicsView(options);
            var pqv = new MMXProjectQuickstartView(options);
            var av = new MMXAdvancedView(options);
            me.options = options;
            me.model = new AppModel();
            me.options.eventPubSub.bind('initMMXProject', function(params){
                me.setElement('#mmx-active-project-container');
                me.model = params.model || me.model;
                setTimeout(function(){
                    me.$el.show();
                }, 201);
//                $('#mmx-maximum-devices-reached').hide();
//                $('#mmx-container .view-wrapper').css('margin-top', function(index, curValue){
//                    var curr = parseInt(curValue, 10);
//                    return (curr == 78 || curr == 112) ? (curr - 35) : curr + 'px';
//                });
                if(['Quickstart', 'RPSLS', 'Soapbox'].indexOf(me.model.attributes.name) != -1){
                    params.view = params.view || 'quickstart';
                }
                me.setTab(params.view || 'dashboard');
                $('#breadcrumb .same-line').hide();
                me.options.eventPubSub.trigger('showCollapsibleMenu', {
                    mmxView : true
                });
            });
        },
        events: {
            'click #mmx-start-console-tour' : 'startMMXConsoleTour'
        },
        setTab: function(view){
            $('.mmx-nav a').removeClass('active');
            $('.mmx-nav a[href="#'+view+'"]').addClass('active');
            this.$el.find('.tab-pane').removeClass('active');
            this.$el.find('#mmx-'+view).addClass('active');
            var title = $('#collapsible-menu-list a[href="#'+view+'"]').text();
            this.options.eventPubSub.trigger('updateBreadcrumb', {
                title : title+(view == 'dashboard' ? ' for '+this.model.attributes.name : '')
            });
            this.options.eventPubSub.trigger('initMMXProject'+view, this.model);
        },
        toUpper: function(str){
            return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        },
        startMMXConsoleTour: function(e){
            e.preventDefault();
            this.options.opts.tour = MMXMessagingTour(this.model.attributes.appId);
        }
    });
    return View;
});