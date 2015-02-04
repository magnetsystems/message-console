define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-users',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectusers', function(model){
                me.model = model;
                me.render();
            });
            me.options.eventPubSub.bind('toggleRow', function(params){
                me.selectRow(params);
            });
            me.options.eventPubSub.bind('changeMMXMessageType', function(e){
                me.changeMMXMessageType(e);
            });
            me.options.eventPubSub.bind('sendMMXMessage', function(e){
                me.sendMessage(e);
            });
            me.sendMessageModal = $('#mmx-sendmessage-modal');
            me.sendMessageModal.on('hidden.bs.modal', function(e){
                timer.stop('#messages-refresh');
            })
        },
        events: {
            'click .sendmessage': 'showSendMessageModal'
        },
        render: function(){
            var me = this;
            this.$el.find('.view-container').html(_.template($('#MessagingUsersListTmpl').html()));
            this.list = $('#mmx-users-list');
            this.list.repeater({
                dataSource       : function(options, cb){
                    me.buildList(options, cb)
                },
                list_selectable  : false,
                list_noItemsHTML : '',
                stretchHeight    : false
            });
        },
        refresh: function(){
            this.list.repeater('render');
        },
        retrieve: function(options, cb){
            var me = this;
            var params = utils.collect(me.$el.find('.repeater-header'));
            var query = {};
            if(options.pageIndex !== 0) query.offset = options.pageIndex !== 0 ? (options.pageSize * options.pageIndex) : 1;
            if(options.pageSize != 10) query.size = options.pageSize || 10;
            if(params.searchby && (params.search || options.search)) query.searchby = params.searchby;
            if(params.search || options.search) query.value = params.search || options.search;
            var qs = '';
            for(var key in query){
                qs += '&'+key+'='+query[key];
            }
            qs = qs.replace('&', '?');
            AJAX('apps/'+me.model.attributes.id+'/users'+qs, 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                if(res && res.results){
                    for(var i=0;i<res.results.length;++i){
                        res.results[i].id = res.results[i].userId;
                        res.results[i].creationDate = utils.fromISO8601(res.results[i].creationDate);
                        res.results[i].modificationDate = utils.fromISO8601(res.results[i].modificationDate);
                    }
                }
                me.users = res.results;
                cb(res);
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        buildList: function(options, callback){
            var me = this;
            me.retrieve(options, function(res){
                var data = {
                    count   : res.total,
                    items   : res.results,
                    page    : (res.offset / options.pageSize),
                    columns : me.columns
                };
                data.pages = Math.ceil(data.count / options.pageSize);
                data.start = data.page * options.pageSize;
                data.end = data.start + options.pageSize;
                data.end = (data.end <= data.count) ? data.end : data.count;
                data.start = data.start + 1;
                setTimeout(function(){
                    $('#mmx-users-list .repeater-list-header tr').addClass('head').detach().prependTo('#mmx-users-list .repeater-list-items tbody');
                }, 20);
                callback(data);
            });
        },
        columns: [
            {
                label    : '',
                property : 'toggle',
                sortable : false
            },
            {
                label    : 'Id',
                property : 'userId',
                sortable : false
            },
            {
                label    : 'Name',
                property : 'name',
                sortable : false
            },
            {
                label    : 'Created',
                property : 'creationDate',
                sortable : false
            },
            {
                label    : 'Modified',
                property : 'modificationDate',
                sortable : false
            },
            {
                label    : 'Send Message',
                property : 'sendmessage',
                sortable : false
            }
        ],
        selectRow: function(params){
            if(params.state) this.displayDevices(params.did, params.tog.closest('tr'));
        },
        displayDevices: function(uid, row){
            var me = this;
            AJAX('apps/'+me.model.attributes.id+'/users/'+uid+'/devices', 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                me.devices = res.results;
                me.renderDevices(row, uid, res.results);
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        renderDevices: function(dom, uid, devices){
            dom.after(_.template($('#MessagingUserDevicesView').html(), {
                uid     : uid,
                devices : devices
            }));
        },
        showSendMessageModal: function(e){
            var text = '';
            this.activeUser = {};
            this.activeDevice = {};
            this.latestMessageId = null;
            var btn = $(e.currentTarget);
            var type = btn.attr('btype');
            var item = btn.closest('tr');
            var did = item.attr('did');
            if(type == 'device'){
                this.activeUser = utils.getByAttr(this.users, 'id', item.closest('.nohover').attr('did').replace('el', ''))[0];
                this.activeDevice = utils.getByAttr(this.devices, 'deviceId', did)[0];
                this.sendMessageModal.find('select option[value="push"]').show();
                text = ' device <b>'+did+'</b>';
                this.getRecentMessages(null, true);
            }else{
                this.activeUser = utils.getByAttr(this.users, 'id', did)[0];
                this.sendMessageModal.find('select option[value="push"]').hide();
                this.sendMessageModal.find('select').val('notification');
                this.renderDeviceMessages();
            }
            this.sendMessageModal.find('.sendmessage-to').html('endpoint <b>'+this.activeUser.id+'</b>,'+text);
            utils.resetError(this.sendMessageModal);
            this.sendMessageModal.find('.message-types > div').addClass('hidden');
            this.sendMessageModal.find('.message-types > div[did="'+this.sendMessageModal.find('select').val()+'"]').removeClass('hidden');
            this.sendMessageModal.modal('show');
        },
        getRecentMessages: function(cb, isFirstCall){
            var me = this;
            AJAX('apps/'+me.model.attributes.id+'/devices/'+this.activeDevice.deviceId+'/messages', 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                me.renderDeviceMessages(res.mlist);
                if(isFirstCall) me.latestMessageId = res.mlist.length > 0 ? res.mlist[0].messageId : null;
                if(typeof cb === typeof Function) cb();
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        pollRecentMessages: function(){
            var me = this;
            var id = '#messages-refresh';
            timer.poll(function(loop){
                me.getRecentMessages(function(){
                    loop.paused = false;
                }, function(xhr){
                    timer.stop(id);
                });
            }, 1000 * 5 * 1, id);
        },
        renderDeviceMessages: function(messages){
            var hasNewMessage = (messages.length > 0 && this.latestMessageId && this.latestMessageId !== messages[0].messageId);
            var dom = this.sendMessageModal.find('.message-push-history');
            dom.html(_.template($('#MessagingDeviceMessagesListView').html(), {
                col : messages,
                hl  : hasNewMessage
            }));
            if(hasNewMessage){
                dom.find('tr.highlighted-row').show('slow');
                setTimeout(function(){
                    dom.find('tr.highlighted-row').removeClass('highlighted-row green');
                }, 5000);
            }
        },
        changeMMXMessageType: function(e){
            var option = $(e.currentTarget).val();
            this.sendMessageModal.find('.message-types > div').addClass('hidden');
            this.sendMessageModal.find('.message-types > div[did="'+option+'"]').removeClass('hidden');
        },
        sendMessage: function(e){
            var type = $(e.currentTarget).attr('did');
            var me = this;
            var body = {};
            var input = me.sendMessageModal.find('.message-types > div[did="'+type+'"] textarea');
            var url = 'apps/'+me.model.attributes.id+'/users/'+this.activeUser.id;
            if(me.activeDevice && me.activeDevice.deviceId)
                body.deviceId = me.activeDevice.deviceId;
            if(input.length)
                body.payload = input.val();
            url += '/'+type;
            utils.resetError(me.sendMessageModal);
            AJAX(url, 'POST', 'application/x-www-form-urlencoded', body, function(res, status, xhr){
                if(input.length) input.val('');
                alert('message sent');
                if(body.deviceId) me.pollRecentMessages();
            }, function(xhr, status, thrownError){
                utils.showError(me.sendMessageModal, '', 'message delivery error.');
//                alert(xhr.responseText);
            });
        }
    });
    return View;
});