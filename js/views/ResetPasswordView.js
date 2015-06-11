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
            var btn = $(e.currentTarget);
            var token = utils.getQuerystring('t');
            if(!token) return utils.showError(me.$el, '', 'Invalid password reset information. Try to copy and paste the url specified in the password reset email into your web browser.');
            if(me.validate(me.$el) === true){
                utils.resetError(me.$el);
                var data = utils.collect(me.$el);
                data.passwordResetToken = token;
                me.options.eventPubSub.trigger('btnLoading', btn);
                AJAX('resetPassword', 'POST', 'application/x-www-form-urlencoded', data, function(res, status, xhr){
                    me.$el.find('input').val('');
                    Backbone.history.navigate('#/login');
                    Alerts.General.display({
                        title   : 'Password Reset Successfully',
                        content : 'Your password has been reset successfully. '
                    });
                }, function(xhr, status, thrownError){
                    if(xhr.responseText == '"USER_DOES_NOT_EXIST"')
                        xhr.responseText = 'Your account password has already been reset. Please try to login now.';
                    utils.showError(me.$el, '', xhr.responseText);
                }, null, {
                    btn : btn
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
