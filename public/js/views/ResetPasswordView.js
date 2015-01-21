define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#resetpassword-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initResetPassword', function(){
                me.$el.find('input').val('');
                me.$el.find('input:first').focus();
            });
        },
        events: {
            'click #resetpassword-btn': 'resetPassword'
        },
        resetPassword: function(e){
            var me = this;
            var token = utils.getQuerystring('t');
            if(!token) return utils.showError(me.$el, '', 'Invalid password reset information. Try to copy and paste the url specified in the password reset email into your web browser.');
            if(me.validate(me.$el) === true){
                utils.resetError(me.$el);
                var data = utils.collect(me.$el);
                var re = /(?![\x00-\x7F]|[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3})./g;
                data.email = data.email.replace(re, '');
                data.passwordResetToken = token;
                AJAX('/rest/resetPassword', 'POST', 'application/x-www-form-urlencoded', data, function(res, status, xhr){
                    me.$el.find('input').val('');
                    Backbone.history.navigate('#/login');
                    Alerts.General.display({
                        title   : 'Password Reset Successfully',
                        content : 'Your password has been reset successfully. '
                    });
                }, function(xhr, status, thrownError){
                    utils.showError(me.$el, '', xhr.responseText);
                });
            }
        },
        validate: function(dom){
            var valid = true;
            if(this.$el.find('input[name="password"]').val() != this.$el.find('input[name="password2"]').val()){
                utils.showError(dom, 'password2', 'verification password does not match.');
                valid = false;
            }else if($.trim(this.$el.find('input[name="password"]').val()).length < 6){
                utils.showError(dom, 'password', 'Password must be at least 6 characters in length.');
                valid = false;
            }
            return valid;
        }
    });
    return View;
});
