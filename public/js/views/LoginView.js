define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#login-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            var lc = new LoginController();
            this.lv = new LoginValidator();
            me.options.eventPubSub.bind('initLogin', function(callback){
                me.callback = callback;
                me.options.opts.newMMXUser = false;
                me.options.opts.firstLogin = false;
                Cookie.remove('magnet_auth');
                $('#user-nav').addClass('hidden');
                $('#user-nav-popover').attr('data-content', '').popover('hide');
                $('#user-nav-popover').hide();
                me.$el.find('input').val('');
                me.$el.find('input[name="username"]').focus();
            });
        },
        events: {
            'click #login-btn': 'login',
            'keypress input[type=text]': 'filterOnEnter',
            'keypress input[type=password]': 'filterOnEnter'
        },
        login: function(){
            var me = this;
            if(me.lv.validateForm() === true){
                var user = me.$el.find('input[name="username"]');
                var pass = me.$el.find('input[name="password"]');
                AJAX('login', 'POST', 'application/x-www-form-urlencoded', {
                    name      : user.val(),
                    password  : pass.val()
                }, function(res, status, xhr){
                    if(xhr.getResponseHeader('X-New-MMX-User') === 'enabled')
                        me.options.opts.newMMXUser = true;
                    else
                        me.options.opts.firstLogin = true;
                    delete me.options.opts.configs;
                    AJAX('/rest/profile', 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                        Cookie.create('magnet_auth', res.firstName+':'+res.lastName+':'+res.email, 1);
                        $('#user-nav-popover').attr('data-content', '<b>'+res.firstName+' '+res.lastName+'</b><br />'+user.val());
//                        $('#user-nav').removeClass('hidden');
                        user.val('');
                        if(typeof me.callback === typeof Function){
                            me.callback();
                        }else{
                            Backbone.history.navigate('#/messaging');
                        }
                    }, function(xhr, status, thrownError){
                        alert(xhr.responseText);
                    });
                }, function(xhr, status, thrownError){
                    if(xhr.responseText == 'invalid-login'){
                        Alerts.Error.display({
                            title   : 'Login Failure',
                            content : 'Please check your username and password.'
                        });
                    }else{
                        Alerts.Error.display({
                            title   : 'Not Authorized',
                            content : 'You are not authorized to access this application.'
                        });
                    }
                });
            }
        },
        filterOnEnter: function(e){
            if(e.keyCode != 13){
                return;
            }else{
                this.login();
            }
        }
    });
    return View;
});

/* CONTROLLERS */

function LoginController(){
    // bind event listeners to button clicks
    $('#login-form #forgot-password').click(function(){
        $('#get-credentials').modal('show');
    });
    // automatically toggle focus between the email modal window and the login form
    $('#get-credentials').on('shown', function(){
        $('#email-tf').focus();
    });
    $('#get-credentials').on('hidden', function(){
        $('#user-tf').focus();
    });
}

/* VALIDATORS */

function EmailValidator(){
    // bind this to _local for anonymous functions
    var _local = this;
    // modal window to allow users to request credentials by email
    _local.retrievePassword = $('#get-credentials');
    _local.retrievePassword.modal({
        show     : false,
        keyboard : true,
        backdrop : true
    });
    _local.retrievePasswordAlert = $('#get-credentials .alert');
    _local.retrievePassword.on('show', function(){
        $('#get-credentials-form').resetForm();
        _local.retrievePasswordAlert.hide();
    });
}
EmailValidator.prototype.validateEmail = function(e){
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(e);
}
EmailValidator.prototype.showEmailAlert = function(m){
    this.retrievePasswordAlert.attr('class', 'alert alert-error');
    this.retrievePasswordAlert.html(m);
    this.retrievePasswordAlert.show();
}
EmailValidator.prototype.hideEmailAlert = function(){
    this.retrievePasswordAlert.hide();
}
EmailValidator.prototype.showEmailSuccess = function(m){
    this.retrievePasswordAlert.attr('class', 'alert alert-success');
    this.retrievePasswordAlert.html(m);
    this.retrievePasswordAlert.fadeIn(500);
}

function LoginValidator(){}
LoginValidator.prototype.showLoginError = function(t, m){

}
LoginValidator.prototype.validateForm = function(){
    if ($('#user-tf').val() == ''){
        this.showLoginError('Required Field Missing', 'Please enter a valid username');
        return false;
    }else if($('#pass-tf').val() == ''){
        this.showLoginError('Required Field Missing', 'Please enter a valid password');
        return false;
    }else{
        return true;
    }
}