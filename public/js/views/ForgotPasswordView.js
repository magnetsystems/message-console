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
                var re = /(?![\x00-\x7F]|[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3})./g;
                data.email = data.email.replace(re, '');
                data.source = window.location.protocol+'//'+window.location.host;
                AJAX('/rest/forgotPassword', 'POST', 'application/x-www-form-urlencoded', data, function(res, status, xhr){
                    me.$el.find('input').val('');
                    Alerts.General.display({
                        title   : 'Password Reset Email Sent',
                        content : 'Your request to reset password has been sent successfully. Check your email for further instructions.'
                    });
                }, function(xhr, status, thrownError){
                    xhr.responseText = xhr.responseText.replace(/"/g, '');
                    var msg;
                    switch(xhr.responseText){
                        case 'USER_DOES_NOT_EXIST': msg = 'We cannot find this email address in our records.'; break;
                        case 'EMAIL_FAILED': msg = 'An email could not be sent to the email address you provided.'; break;
                        case 'email-recovery-disabled': msg = 'The password recovery feature has been disabled. Please contact your administrator to reset your password.'; break;
                    }
                    utils.showError(me.$el, 'email', msg);
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
