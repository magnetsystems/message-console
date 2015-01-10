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
        register: function(){
            var me = this;
            if(me.validate(me.$el) === true){
                utils.resetError(me.$el);
                var data = utils.collect(me.$el);
                data.companyName = 'magnet';
                data.source = window.location.protocol+'//'+window.location.host;
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
                    alert(xhr.responseText);
                });
            }
        },
        validate: function(dom){
            var valid = true;
            dom.find('input[name!="captcha"]').each(function(){
                if($.trim($(this).val()).length < 1 || $(this).val() == $(this).attr('placeholder')){
                    utils.showError(dom, $(this).attr('name'), 'Please enter a '+$(this).attr('placeholder'));
                    valid = false;
                }
            });
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
