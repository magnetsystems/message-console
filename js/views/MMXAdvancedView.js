define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-advanced',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectadvanced', function(model){
                me.model = model;
                me.getMMXConfig(function(config){
                    me.config = config;
                    me.render();
                });
            });
        },
        events: {
            'click button[did="save"]': 'saveConfig'
        },
        render: function(){
            this.$el.find('.view-container').html(_.template($('#MessagingProjectAdvancedView').html(), {
                model  : this.model,
                config : this.config
            }));
            this.$el.find('.glyphicon-info-sign').tooltip();
        },
        getMMXConfig: function(cb){
            AJAX('apps/configs', 'GET', 'application/json', null, function(res){
                cb(res.configs || res);
            }, function(){
                cb();
            }, null, {
                timeout : 10000
            });
        },
        saveConfig: function(e, btn, obj){
            var me = this;
            btn = btn || $(e.currentTarget);
            utils.resetError(me.$el);
            obj = obj || utils.collect(me.$el, false, false, true);
            var optionals = [];
            if(!this.isValid(me.$el, obj, optionals)) return;
            me.options.eventPubSub.trigger('btnLoading', btn);
            AJAX('apps/configs', 'POST', 'application/json', obj, function(res){
                Alerts.General.display({
                    title   : 'Config Updated Successfully',
                    content : 'The advanced configuration has been updated successfully.'
                });
            }, function(e, status){
                Alerts.Error.display({
                    title   : 'Error Updating Config',
                    content : e
                });
            }, null, {
                timeout : 15000,
                btn     : btn
            });
        },
        isValid: function(form, obj, optionals){
            optionals = optionals || [];
            var valid = true;
            var val;
            if(typeof obj.enabled !== 'undefined' && !obj.enabled) return true;
            for(var key in obj){
                var name = form.find('input[name="'+key+'"]').closest('div[class^="col"]').find('> label').text();
                if(optionals.indexOf(key) === -1 && !$.trim(obj[key]).length){
                    utils.showError(form, key, 'Invalid '+name+'. '+name+' is a required field.');
                    valid = false;
                    break;
                }
                if(['mmx.wakeup.frequency', 'mmx.retry.interval.minutes', 'mmx.retry.count', 'mmx.timeout.period.minutes', 'mmx.push.callback.port'].indexOf(key) != -1){
                    val = parseInt(obj[key]);
                    if(!utils.isNumeric(val) || (key != 'mmx.retry.count' && val <= 0)){
                        utils.showError(form, key, 'Invalid '+name+'. '+name+' must be a valid number greater than 0.');
                        valid = false;
                        break;
                    }
                }
                if(['mmx.push.callback.host', 'appUrl', 'host'].indexOf(key) != -1  && !utils.isValidHost(obj[key])){
                    utils.showError(form, key, 'Invalid '+name+'. '+name+' must be a valid hostname or IP address.');
                    valid = false;
                    break;
                }
            }
            return valid;
        }
    });
    return View;
});