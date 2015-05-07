define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#registration-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initRegistration', function(){
                me.$el.find('input').val('');
                me.$el.find('input:first').focus();
            });
        },
        events: {
            'click #registration-btn': 'register'
        },
        register: function(e){
            var me = this;
            var btn = $(e.currentTarget);
            var re = /(?![\x00-\x7F]|[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3})./g;
            me.$el.find('input[name="email"]').val(me.$el.find('input[name="email"]').val().replace(re, ''));
            if(me.validate(me.$el) === true){
                utils.resetError(me.$el);
                var data = utils.collect(me.$el);
                data.companyName = 'magnet';
                data.source = window.location.protocol+'//'+window.location.host;
                me.options.eventPubSub.trigger('btnLoading', btn);
                AJAX('/rest/startRegistration', 'POST', 'application/x-www-form-urlencoded', data, function(res, status, xhr){
                    me.$el.find('input').val('');
                    var msg = {
                        title   : 'Registration Submitted Successfully',
                        content : 'Your invitation confirmation has been sent successfully. An administrator will review your application and contact you through email.'
                    };
                    if(xhr.responseText && xhr.responseText.indexOf('"skipAdminApproval": true') != -1){
                        msg.content = 'Your invitation confirmation has been sent successfully. An email has been sent to the email address you provided. Please check your email and click on the link to complete the registration process.';
                    }
                    Alerts.General.display(msg);
                }, function(xhr, status, thrownError){
                    xhr.responseText = xhr.responseText.replace(/"/g, '');
                    var msg;
                    switch(xhr.responseText){
                        case 'USER_ALREADY_EXISTS': msg = 'This email address has already been used for registration.'; break;
                        case 'EMAIL_FAILED': msg = 'An email could not be sent to the email address you provided.'; break;
                        default: msg = 'An error has occurred during registration. Please contact an administrator for assistance.'; break;
                    }
                    alert(msg);
                }, null, {
                    btn : btn
                });
            }
        },
        validate: function(dom){
            var valid = true;
            dom.find('input[name!="captcha"]').each(function(){
                if($.trim($(this).val()).length < 1 || $(this).val() == $(this).attr('placeholder')){
                    utils.showError(dom, $(this).attr('name'), 'Please enter a '+$(this).attr('placeholder'));
                    valid = false;
                    return false;
                }
            });
            if(!valid) return;
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
