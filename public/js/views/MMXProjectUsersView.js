define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-users-tab',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectUsers', function(model){
                me.model = model;
                me.render();
            });
            me.options.eventPubSub.bind('toggleRow', function(params){
                me.selectRow(params);
            });
            me.options.eventPubSub.bind('sendMMXMessage', function(){
                me.sendMessage();
            });
            me.sendMessageModal = $('#mmx-sendmessage-modal');
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
            AJAX('apps/'+me.model.attributes.id+'/users', 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                me.users = res.rows;
                cb(res);
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        buildList: function(options, callback){
            var me = this;
            me.retrieve(options, function(res){
                var data = {
                    count   : res.paging.total,
                    items   : res.rows,
                    page    : options.pageIndex,
                    start   : res.paging.start,
                    end     : (res.paging.start + res.rows.length),
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
                label    : 'First Name',
                property : 'firstName',
                sortable : false
            },
            {
                label    : 'Last Name',
                property : 'lastName',
                sortable : false
            },
            {
                label    : 'Email',
                property : 'email',
                sortable : false
            },
            {
                label    : 'Type',
                property : 'userType',
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
                me.devices = res;
                me.renderDevices(row, uid, res);
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
            var btn = $(e.currentTarget);
            var type = btn.attr('btype');
            var item = btn.closest('tr');
            var did = item.attr('did');
            if(type == 'device'){
                this.activeUser = utils.getByAttr(this.users, 'id', item.closest('.nohover').attr('did').replace('el', ''))[0];
                this.activeDevice = utils.getByAttr(this.devices, 'id', did)[0];
                text = ' device '+did;
            }else{
                this.activeUser = utils.getByAttr(this.users, 'id', did)[0];
            }
            this.sendMessageModal.find('.sendmessage-to').text('user '+this.activeUser.firstName+' '+this.activeUser.lastName+text);
            utils.resetError(this.sendMessageModal);
            this.sendMessageModal.modal('show');
        },
        sendMessage: function(){
            var me = this;
            var input = me.sendMessageModal.find('textarea');
            var url = 'apps/'+me.model.attributes.id+'/users/'+this.activeUser.id;
            if(me.activeDevice && me.activeDevice.id)
                url += '/devices/'+me.activeDevice.id;
            url += '/sendMessage';
            utils.resetError(me.sendMessageModal);
            AJAX(url+'?message='+encodeURIComponent(input.val()), 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                input.val('');
                alert('message sent');
            }, function(xhr, status, thrownError){
                utils.showError(me.sendMessageModal, '', 'message delivery error.');
//                alert(xhr.responseText);
            });
        }
    });
    return View;
});