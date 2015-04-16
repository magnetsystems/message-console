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
            if(utils.detectIE())  $.ajaxSetup({cache:false});
            // init model connector for REST
            this.mc = new ModelConnector(this.httpreq);
            this.opts = {
                hasInit : false
            };
            utils.setIndexOf();
            this.setState(function(){});
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
            me.setState(function(){
                if(!me.opts.emailEnabled) return me.handleEmailDisabled();
                me.eventPubSub.trigger('resetGlobalPages', 'registration-container');
                me.eventPubSub.trigger('initRegistration', callback);
            });
        },
        completeRegister: function(callback){
            var me = this;
            me.setState(function(){
                me.eventPubSub.trigger('resetGlobalPages', 'completeregistration-container');
                me.eventPubSub.trigger('initCompleteRegistration', callback);
            });
        },
        forgotPassword: function(callback){
            var me = this;
            me.setState(function(){
                if(!me.opts.emailEnabled) return me.handleEmailDisabled();
                me.eventPubSub.trigger('resetGlobalPages', 'forgotpassword-container');
                me.eventPubSub.trigger('initForgotPassword', callback);
            });
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
        setState: function(cb){
            var me = this;
            if(me.opts.hasInit) return cb();
            $.ajax({
                type : 'GET',
                url  : '/rest/status'
            }).done(function(res){
                switch(res.platform){
                    case 'init': {
                        return window.location.href = '/wizard';
                    }
                    case 'standalone': {
                        $('#leave-feedback-container').remove();
                        $('#confirm-tos-dialog').remove();
                        if(res.newMMXUser){
                            me.opts.newMMXUser = true;
                        }
                        break;
                    }
                }
                if(res.emailEnabled){
                    me.opts.emailEnabled = res.emailEnabled;
                }
                me.opts.hasInit = true;
                cb();
            });
        },
        handleEmailDisabled: function(){
            Alerts.Error.display({
                title   : 'Email Feature Disabled',
                content : 'The email feature has not yet been enabled. As a result, users will not be able to register or recover their password on their own. See the README for more information.'
            });
            Backbone.history.navigate('#/login');
        },
        auth: function(callback){
            var me = this;
            timer.stop();
            var popover = $('#user-nav-popover');
            popover.popover('hide');
            me.setState(function(){
                if(!me.opts.user){
                    me.eventPubSub.trigger('getUserProfile', callback);
                }else{
                    callback();
                }
            });
        }
    });
    return Router;
});
var Alerts = {};