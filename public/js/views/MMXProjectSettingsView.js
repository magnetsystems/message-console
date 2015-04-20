define(['jquery', 'backbone', 'views/UploadView'], function($, Backbone, UploadView){
    var View = Backbone.View.extend({
        el: '#mmx-settings',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectsettings', function(model){
                me.model = model;
                me.render();
                me.initCertUploader();
            });
            me.options.eventPubSub.bind('uploadAPNSCertFileComplete', function(params){
                if(params.res.success){
                    me.model.set({
                        apnsCertUploaded : true
                    });
                    $('#mmx-settings-apns-cert-file-upload').find('.qq-upload-list').html(me.certUploadedTmpl);
                }else{
                    Alerts.Error.display({
                        title   : 'Error Uploading Certificate',
                        content : 'There was an error uploading the certificate. Please make sure you are uploading a valid APNS certificate.'
                    });
                }
                me.options.eventPubSub.trigger('btnComplete', $('#mmx-settings-apns-cert-file-upload-btn'));
            });
        },
        events: {
            'click .controls button[did="save"]': 'saveProject',
            'click .controls button[did="delete"]': 'deleteProject',
            'click #mmx-settings-apns-cert-file-upload-btn': 'uploadCertificate',
            'click .remove-cert-btn': 'deleteAPNSCertificate'
        },
        render: function(){
            this.$el.find('.view-container').html(_.template($('#MessagingProjectSettingsView').html(), {
                model   : this.model,
                configs : this.options.opts.configs
            }));
            this.$el.find('.glyphicon-info-sign').tooltip();
        },
        saveProject: function(){
            var me = this;
            var obj = utils.collect(me.$el);
            if($.trim(obj.guestSecret).length < 1) return alert('Guest Access Secret is a required field.');
            if($.trim(obj.name).length < 1) return alert('App Name is a required field.');
            if(me.model.attributes.name != obj.name && me.options.opts.col.iwhere('name', obj.name).length) return alert('The App name you specified already exists. Please choose another name.');
            AJAX('apps/'+me.model.attributes.id, 'PUT', 'application/json', obj, function(res, status, xhr){
                me.model.set(obj);
                for(var key in obj)
                    if($.trim(obj[key]) === '')
                        me.model.unset(key);
                me.options.eventPubSub.trigger('renderMMXList', me.model.attributes.id);
                Alerts.General.display({
                    title   : 'App Updated',
                    content : 'Your changes have been saved.'
                });
            }, function(e){
                alert(e.responseText);
            });
        },
        deleteProject: function(){
            var me = this;
            Alerts.Confirm.display({
                title   : 'Delete App',
                content : 'By deleting this app any device using the app will no longer be able to send or receive Magnet' +
                    ' Message. <br/><br /> This action can not be undone. Are you sure you want to delete <b>'+me.model.attributes.name+'</b>?',
                btns    : {
                    yes : 'Delete App',
                    no  : 'Cancel'
                }
            }, function(){
                me.model.destroy({
                    success: function(){
                        me.options.eventPubSub.trigger('imposeAppLimit');
                        me.options.eventPubSub.trigger('renderMMXList');
                        var ret = Backbone.history.navigate('#/', true);
                        if(ret === undefined)
                            Backbone.history.loadUrl('#/');
                        else
                            Alerts.General.display({
                                title   : 'App Deleted',
                                content : 'Your app has been deleted.'
                            });
                    },
                    error: function(e){
                        alert(e.responseText);
                    }
                });
            });
        },
        initCertUploader: function(){
            var container = '#mmx-settings-apns-cert-file-upload';
            var uploader = new UploadView({
                el          : container,
                context     : 'APNSCertFile',
                method      : 'POST',
                validation  : {
                    allowedExtensions : ['p12'],
                    sizeLimit         : 500000
                },
                eventPubSub : this.options.eventPubSub,
                path        : '/rest/apps/'+this.model.attributes.id+'/uploadAPNSCertificate'
            });
//            $('<button id="mmx-settings-apns-cert-file-upload-btn" class="btn btn-primary" type="button" txt="Upload">Upload</button>').insertAfter(container+' .qq-upload-button');
            if(this.model.attributes.apnsCertUploaded){
                $(container).find('.qq-upload-list').html(this.certUploadedTmpl);
            }else{
                $(container).find('.qq-upload-list').html(this.noCertTmpl);
            }
        },
        certUploadedTmpl : '<li class="qq-upload-success"><span class="qq-upload-file">certificate uploaded</span><button class="remove-cert-btn btn btn-sm"><span class="glyphicon glyphicon-remove"></span></button></li>',
        noCertTmpl : '<li class=" qq-upload-error"><span class="qq-upload-file">no certificate</span></li>',
        uploadCertificate: function(e){
            var me = this;
            var btn = $(e.currentTarget);
            var file = btn.parent().find('.qq-upload-list > li > .qq-upload-file');
            if(!file.length || file.text().indexOf('No Certificate Uploaded') != -1 || file.text().indexOf('Certificate Uploaded') != -1)
                return false;
            me.options.eventPubSub.trigger('btnLoading', btn);
            me.options.eventPubSub.trigger('uploadAPNSCertFile', '/rest/apps/'+me.model.attributes.id+'/uploadAPNSCertificate');
        },
        deleteAPNSCertificate: function(e){
            e.preventDefault();
            var me = this;
            AJAX('apps/'+me.model.attributes.id+'/deleteAPNSCertificate', 'DELETE', 'application/json', null, function(res, status, xhr){
                $('#mmx-settings-apns-cert-file-upload').find('.qq-upload-list').html(me.noCertTmpl);
            }, function(e){
                alert(e.responseText);
            });
        }
    });
    return View;
});