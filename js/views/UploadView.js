define(['jquery', 'backbone', 'backbone', 'fileuploader'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#upload-domid-placeholder',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.el = me.options.el;
            // ie < 10 will not support application/json since it is uploading from iframe
            var accepts = 'application/json';
            if(window.navigator.userAgent.indexOf('MSIE ') != -1){
                accepts = 'text/plain';
            }
            // create upload component
            var uploader = new qq.FileUploader({
                multiple                    : false,
                maxConnections              : 1,
                forceMultipart              : true,
                disableCancelForFormUploads : true,
                autoUpload                  : false,
                uploadButtonText            : options.uploadButtonText || undefined,
                action                      : options.path,
                element                     : document.getElementById(me.options.el.replace('#', '')),
                text: {
                    uploadButton : me.options.buttonName ? me.options.buttonName : 'Upload'
                },
                // debug : true,
                request: {
                    endpoint      : '',
                    method        : me.options.method,
                    inputName     : 'filename'
                },
                dragAndDrop: {
                    disableDefaultDropzone : true
                },
                validation: me.options.validation,
                onComplete: function(id, filename, res){
//                        setTimeout(function(){
//                            me.$el.find('.qq-upload-list li').hide('3000', function(){
//                                $(this).remove();
//                            });
//                        }, 3000);
                    me.options.eventPubSub.trigger('upload'+me.options.context+'Complete', {
                        id       : id,
                        filename : filename,
                        params   : me.params,
                        res      : res
                    });
                },
                onSubmit: function(id, filename){
                    return (options.onSubmit || function(){})(uploader, id, filename);
                }
            });
            me.params = options.params;
            uploader._options.action = options.path;
            me.$el.find('.qq-upload-button').addClass('btn btn-primary');
            // bind upload event to set upload endpoint and upload files
            me.options.eventPubSub.bind('upload'+me.options.context, function(path, params){
                me.params = params || {};
                uploader.setParams(params);
                uploader.uploadStoredFiles();
            });
        }
    });
    return View;
});