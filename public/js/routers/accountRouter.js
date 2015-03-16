define(['jquery', 'backbone','views/AlertGeneralView','views/AlertConfirmView','views/AlertErrorView','views/GlobalView','views/LoginView',
        'views/RegistrationView','views/CompleteRegistrationView','views/ForgotPasswordView','views/ResetPasswordView','views/ProjectMessagingView',
    'views/ProfileView']
    , function($, Backbone, AlertGeneralView, AlertConfirmView, AlertErrorView, GlobalView, LoginView,
               RegistrationView, CompleteRegistrationView, ForgotPasswordView, ResetPasswordView, ProjectMessagingView,
               ProfileView){
    // bind alerts
    Alerts.General = new AlertGeneralView();
    Alerts.Confirm = new AlertConfirmView();
    Alerts.Error = new AlertErrorView();
    // main router
    var Router = Backbone.Router.extend({
        initialize: function(){
            var me = this;
            // establish event pub/sub 
            this.eventPubSub = _.extend({}, Backbone.Events);
            // init HTTP request methods
            this.httpreq = new HTTPRequest('/rest/');
            // init model connector for REST
            this.mc = new ModelConnector(this.httpreq);
            this.opts = {};
            utils.setIndexOf();
            this.GLOBAL = {};
            // init site views
            var gv = new GlobalView({opts:this.opts, eventPubSub:this.eventPubSub});
            var lv = new LoginView({opts:this.opts,mc:this.mc, router:this, eventPubSub:this.eventPubSub});
            var rv = new RegistrationView({opts:this.opts,mc:this.mc, router:this, eventPubSub:this.eventPubSub});
            var crv = new CompleteRegistrationView({opts:this.opts,mc:this.mc, router:this, eventPubSub:this.eventPubSub});
            var fpv = new ForgotPasswordView({opts:this.opts,mc:this.mc, router:this, eventPubSub:this.eventPubSub});
            var rpv = new ResetPasswordView({opts:this.opts,mc:this.mc, router:this, eventPubSub:this.eventPubSub});
            var mv = new ProjectMessagingView({opts:this.opts,mc:this.mc, router:this, eventPubSub:this.eventPubSub});
            var pv = new ProfileView({opts:this.opts,mc:this.mc, router:this, eventPubSub:this.eventPubSub});
            // override default backbone model sync method to be compatible with Magnet REST APIs
            syncOverride(this.mc, this.eventPubSub);
            Backbone.history.start();
        },
        routes: {
            ''                  : 'messaging',
            'login'             : 'login',
            'register'          : 'register',
            'complete-register' : 'completeRegister',
            'forgot-password'   : 'forgotPassword',
            'reset-password'    : 'resetPassword',
            'messaging'         : 'messaging',
            'messaging/:id'     : 'messaging',
            'messaging/:id/:view' : 'messaging',
            'profile'           : 'profile',
            '*notFound'         : 'messaging'
        },
        login: function(callback){
            var me = this;
            me.eventPubSub.trigger('resetGlobalPages', 'login-container');
            me.eventPubSub.trigger('initLogin', callback);
        },
        register: function(callback){
            var me = this;
            me.eventPubSub.trigger('resetGlobalPages', 'registration-container');
            me.eventPubSub.trigger('initRegistration', callback);
        },
        completeRegister: function(callback){
            var me = this;
            me.eventPubSub.trigger('resetGlobalPages', 'completeregistration-container');
            me.eventPubSub.trigger('initCompleteRegistration', callback);
        },
        forgotPassword: function(callback){
            var me = this;
            me.eventPubSub.trigger('resetGlobalPages', 'forgotpassword-container');
            me.eventPubSub.trigger('initForgotPassword', callback);
        },
        resetPassword: function(callback){
            var me = this;
            me.eventPubSub.trigger('resetGlobalPages', 'resetpassword-container');
            me.eventPubSub.trigger('initResetPassword', callback);
        },
        messaging: function(id, view){
            var me = this;
            me.auth(function(){
                me.eventPubSub.trigger('resetGlobalPages', 'mmx-container');
                me.eventPubSub.trigger('initMessaging', {
                    id   : id,
                    view : view
                });
            });
        },
        profile: function(){
            var me = this;
            me.auth(function(){
                me.eventPubSub.trigger('resetGlobalPages', 'profile-container');
                me.eventPubSub.trigger('initProfile');
            });
        },
        auth: function(callback){
            timer.stop();
            var popover = $('#user-nav-popover');
            popover.popover('hide');
            var auth = Cookie.get('magnet_auth');
            if(!auth || $.trim(auth).length < 1){
                this.eventPubSub.trigger('getUserProfile', callback);
            }else{
                auth = auth.split(':');
                popover.attr('data-content', '<b>'+auth[0]+' '+auth[1]+'</b><br />'+auth[2]);
                $('#user-nav').removeClass('hidden');
                $('#user-nav-popover').show();
                callback();
            }
        }
    });
    return Router;
});
var Alerts = {};