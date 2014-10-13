define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#forgotpassword-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initForgotPassword', function(){
                me.$el.find('input').val('');
                me.$el.find('input:first').focus();
            });
        },
        events: {
            'click #forgotpassword-btn': 'startResetPassword'
        },
        startResetPassword: function(e){
            var me = this;
            if(me.validate(me.$el) === true){
                utils.resetError(me.$el);
                var data = utils.collect(me.$el);
                data.source = window.location.protocol+'//'+window.location.host;
                AJAX('/rest/forgotPassword', 'POST', 'application/x-www-form-urlencoded', data, function(res, status, xhr){
                    me.$el.find('input').val('');
                    Alerts.General.display({
                        title   : 'Password Reset Email Sent',
                        content : 'Your request to reset password has been sent successfully. Check your email for further instructions.'
                    });
                }, function(xhr, status, thrownError){
                    utils.showError(me.$el, 'Password Reset Failure', 'We cannot find this email address in our records.');
                });
            }
        },
        validate: function(dom){
            var valid = true;
            var emailRxp = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
            if(!emailRxp.test(dom.find('input[name="email"]').val())){
                utils.showError(dom, 'email', 'The format of the email address you provided is invalid.');
                valid = false;
            }
            return valid;
        }
    });
    return View;
});
