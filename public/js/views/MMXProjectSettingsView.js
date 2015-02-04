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
                        apnsCertName : params.filename
                    });
                    $('#mmx-settings-apns-cert-file-upload .qq-upload-file').html('Certificate Uploaded');
                }else{
                    Alerts.Error.display({
                        title   : 'Error Uploading Certificate',
                        content : 'There was an error uploading the certificate.'
                    });
                }
                me.options.eventPubSub.trigger('btnComplete', $('#mmx-settings-apns-cert-file-upload-btn'));
            });
        },
        events: {
            'click .controls button[did="save"]': 'saveProject',
            'click .controls button[did="delete"]': 'deleteProject',
            'click #mmx-settings-apns-cert-file-upload-btn': 'uploadCertificate'
        },
        render: function(){
            this.$el.find('.view-container').html(_.template($('#MessagingProjectSettingsView').html(), {
                model : this.model
            }));
            this.$el.find('.glyphicon-info-sign').tooltip();
        },
        saveProject: function(){
            var me = this;
            var obj = utils.collect(me.$el);
            if($.trim(obj.guestUserSecret).length < 1) return alert('Guest Access Secret is a required field.');
            if($.trim(obj.appName).length < 1) return alert('App Name is a required field.');
            if(me.model.attributes.appName != obj.appName && me.options.opts.col.iwhere('appName', obj.appName).length) return alert('The App name you specified already exists. Please choose another name.');
            me.model.save(obj, {
                success: function(){
                    me.model.set({
                        gcm : {
                            googleProjectId : obj.googleProjectId,
                            googleApiKey    : obj.googleApiKey
                        }
                    });
                    me.options.eventPubSub.trigger('renderMMXList', me.model.attributes.id);
                    Alerts.General.display({
                        title   : 'App Updated',
                        content : 'Your changes have been saved.'
                    });
                },
                error: function(e){
                    alert(e.responseText);
                }
            });
        },
        deleteProject: function(){
            var me = this;
            Alerts.Confirm.display({
                title   : 'Confirm App Deletion',
                content : 'Please verify that you wish to delete this app.'
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
                validation  : {},
                eventPubSub : this.options.eventPubSub
            });
            $('<button id="mmx-settings-apns-cert-file-upload-btn" class="btn btn-primary" type="button" txt="Upload">Upload</button>').insertAfter(container+' .qq-upload-button');
            if(this.model.attributes.hasAPNSCert){
                $(container).find('.qq-upload-list').html('<li class=" qq-upload-success"><span class="qq-upload-file">Certificate Uploaded</span></li>');
            }else{

                $(container).find('.qq-upload-list').html('<li class=" qq-upload-error"><span class="qq-upload-file">No Certificate Uploaded</span></li>');
            }
        },
        uploadCertificate: function(){
            var me = this;
            var file = this.$el.find('.qq-upload-file');
            if(!file.length){
                return false;
            }
            var btn = $('#mmx-settings-apns-cert-file-upload-btn');
            me.options.eventPubSub.trigger('btnLoading', btn);
            me.options.eventPubSub.trigger('uploadAPNSCertFile', '/rest/apps/'+me.model.attributes.id+'/uploadAPNSCertificate');
        }
    });
    return View;
});