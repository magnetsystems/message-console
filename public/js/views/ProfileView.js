define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#profile-container',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initProfile', function(){
                me.getProfile(function(data){
                     me.render(data);
                });
            });
        },
        events: {
            'click #profile-save': 'saveProfile',
            'keyup .password-inputs .col-sm-6 input': 'validatePassword'
        },
        getProfile: function(cb){
            AJAX('/rest/profile', 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                cb(res);
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        render: function(data){
            var template = _.template($('#ProfileTmpl').html(), {
                model  : data
            });
            $('#user-profile-container').html(template);
        },
        saveProfile: function(){
            var me = this;
            var form = $('#user-profile-container');
            var data = utils.collect(form);
            if(me.hasPassword(data) && data.newpassword != data.newpassword2){
                return Alerts.Error.display({
                    title   : 'Password Doesn\'t Match',
                    content : 'The re-typed password doesn\'t match the original.'
                });
            }
            delete data.userName;
            AJAX('/rest/profile', 'PUT', 'application/x-www-form-urlencoded', data, function(res, status, xhr){
                me.$el.find('.password-inputs input').val('');
                Alerts.General.display({
                    title   : 'Profile Updated',
                    content : 'Your user profile has been updated successfully.'
                });
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        hasPassword: function(data){
            return ($.trim(data.oldpassword).length !== 0) || ($.trim(data.newpassword).length !== 0 || $.trim(data.newpassword2).length !== 0);
        },
        validatePassword: function(){
            var dom = this.$el.find('.password-inputs');
            if($('.password-inputs input[name="newpassword"]').val() != $('.password-inputs input[name="newpassword2"]').val()){
                utils.showError(dom, 'newpassword2', 'New password does not match.');
                $('#profile-save').addClass('disabled');
            }else{
                utils.resetError(dom);
                $('#profile-save').removeClass('disabled');
            }
        }
    });
    return View;
});