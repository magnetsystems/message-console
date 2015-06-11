define(['jquery', 'backbone', 'views/UploadView'], function($, Backbone, UploadView){
    var View = Backbone.View.extend({
        el: '#mmx-settings',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.uploadAPNSModal = $('#mmx-setapns-modal');
            me.uploadAPNSBtn = $('#upload-apns-btn');
            me.uploadAPNSBtn.click(function(){
                me.uploadCertificate();
            });
            me.options.eventPubSub.bind('initMMXProjectsettings', function(model){
                me.model = model;
                me.render();
                me.initCertUploader();
            });
            me.options.eventPubSub.bind('uploadAPNSCertFileComplete', function(params){
                if(params.res.success){
                    var pass = me.getAPNSCertPassword();
                    me.model.set({
                        apnsCertUploaded : true,
                        apnsCertPassword : pass
                    });
                    me.uploadAPNSModal.modal('hide');
                    $('#mmx-settings-apns-cert-file-upload').find('.qq-upload-list').html(me.certUploadedTmpl);
                    $('#mmx-settings-apns-cert-status').find('.qq-upload-list').html(me.certUploadedTmpl).find('.remove-cert-btn').remove();
//                    me.$el.find('input[name="apnsCertPassword"]').val(pass);
                    Alerts.General.display({
                        title   : 'APNS Certificate Uploaded',
                        content : 'Your APNS certificate and APNS password have been updated successfully.'
                    });
                }else{
                    utils.showError(me.uploadAPNSModal, 'apnsCertPassword', 'The APNS Password you entered did not match the uploaded APNS certificate. ' +
                        'To upload an APNS  certificate, you must set an APNS Password which corresponds with the certificate.');
                }
            });
        },
        events: {
            'click .controls button[did="save"]': 'saveProject',
            'click .controls button[did="delete"]': 'deleteProject',
            'click #mmx-apns-startupload-btn': 'showUploadCertificateModal',
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
            delete obj.apnsCertPassword;
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
            var me = this;
            var container = '#mmx-settings-apns-cert-file-upload';
            me.uploader = new UploadView({
                el          : container,
                context     : 'APNSCertFile',
                method      : 'POST',
                validation  : {
                    allowedExtensions : ['p12'],
                    sizeLimit         : 500000
                },
                eventPubSub : this.options.eventPubSub,
                path        : GLOBAL.baseUrl+'apps/'+this.model.attributes.id+'/uploadAPNSCertificate',
                uploadButtonText : 'Select a file'
            });
            if(this.model.attributes.apnsCertUploaded){
                $('#mmx-settings-apns-cert-file-upload').find('.qq-upload-list').html(me.certUploadedTmpl);
                $('#mmx-settings-apns-cert-status').find('.qq-upload-list').html(me.certUploadedTmpl).find('.remove-cert-btn').remove();
            }else{
                $('#mmx-settings-apns-cert-file-upload').find('.qq-upload-list').html(me.noCertTmpl);
                $('#mmx-settings-apns-cert-status').find('.qq-upload-list').html(me.noCertTmpl);
            }
        },
        showUploadCertificateModal: function(){
            var me = this;
            me.uploadAPNSModal.find('input[name="apnsCertPassword"]').val(me.model.attributes.apnsCertPassword);
            var removeCertBtn = me.uploadAPNSModal.find('.remove-cert-btn');
            removeCertBtn.unbind('click').click(function(){
                me.deleteAPNSCertificate();
            });
            me.uploadAPNSModal.modal('show');
        },
        getAPNSCertPassword: function(){
            return $.trim(this.uploadAPNSModal.find('input[name="apnsCertPassword"]').val());
        },
        certUploadedTmpl : '<li class="qq-upload-success"><span class="qq-upload-file">certificate uploaded</span><button class="remove-cert-btn btn btn-sm"><span class="glyphicon glyphicon-remove"></span></button></li>',
        noCertTmpl : '<li class=" qq-upload-error"><span class="qq-upload-file">no certificate</span></li>',
        uploadCertificate: function(){
            var me = this;
            utils.resetError(me.uploadAPNSModal);
            var file = me.uploadAPNSModal.find('.qq-upload-list .qq-upload-file').text();
            if(!$.trim(file).length || file.indexOf('no certificate') != -1)
                return utils.showError(me.uploadAPNSModal, 'apnsCertificate', 'Please select an APNS certificate to upload.');
            if(file.indexOf('certificate uploaded') != -1)
                return utils.showError(me.uploadAPNSModal, 'apnsCertificate', 'An APNS certificate has already been uploaded.');
            if(!$.trim(me.uploadAPNSModal.find('input[name="apnsCertPassword"]').val()).length){
                return utils.showError(me.uploadAPNSModal, 'apnsCertPassword', 'APNS Password is required, and must match the APNS certificate.');
            }
            me.options.eventPubSub.trigger('uploadAPNSCertFile', GLOBAL.baseUrl+'apps/'+me.model.attributes.id+'/uploadAPNSCertificate', {
                apnsCertPassword : me.getAPNSCertPassword()
            });
        },
        deleteAPNSCertificate: function(){
            var me = this;
            Alerts.Confirm.display({
                title   : 'Delete Certificate',
                content : 'By deleting the APNS certificate iOS devices will no longer be able to send or receive push notifications.' +
                    ' The APNS Password will also be removed. Are you sure you want to delete the APNS certificate?',
                btns    : {
                    yes : 'Delete Certificate',
                    no  : 'Cancel'
                }
            }, function(){
                AJAX('apps/'+me.model.attributes.id+'/deleteAPNSCertificate', 'DELETE', 'application/json', null, function(res, status, xhr){
                    me.model.unset('apnsCertPassword');
//                    me.$el.find('input[name="apnsCertPassword"]').val('');
                    me.uploadAPNSModal.find('input[name="apnsCertPassword"]').val('');
                    $('#mmx-settings-apns-cert-file-upload, #mmx-settings-apns-cert-status').find('.qq-upload-list').html(me.noCertTmpl);
                }, function(e){
                    alert(e.responseText);
                });
            });
        }
    });
    return View;
});