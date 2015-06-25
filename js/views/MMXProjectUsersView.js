define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-users',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectusers', function(model){
                me.model = model;
                me.selectedElements = [];
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
            });
            me.createUserModal = $('#new-user-modal');
            me.updateUserModal = $('#update-user-modal');
            me.createUserBtn = $('#mmx-users-create-btn');
            me.createUserBtn.click(function(){
                if(me.createUserBtn.hasClass('disabled')) return;
                me.createUser();
            });
            me.updateUserBtn = $('#mmx-users-update-btn');
            me.updateUserModal.find('#mmx-users-update-btn').click(function(){
                me.saveUser();
            });
        },
        events: {
//            'click .sendmessage': 'showSendMessageModal',
            'click #mmx-users-show-create-modal': 'showCreateUser',
            'click .repeater-header .glyphicon-pencil': 'showEditUser',
            'click .repeater-header .glyphicon-trash': 'removeUser',
//            'click .repeater-header .fa-lock': 'lockUser',
//            'click .repeater-header .fa-unlock-alt': 'unlockUser',
            'change .repeater-header-left select[name="searchby"]': 'changeSearchBy',
            'click input[type="checkbox"]': 'toggleUserRow',
            'click .mmx-user-list-refresh-btn': 'refresh'
        },
        render: function(){
            var me = this;
            me.sorts = {};
            if(me.rendered) return me.refresh();
            me.rendered = true;
            me.$el.find('.view-container').html(_.template($('#MessagingUsersListTmpl').html(), {
                filters : me.filters
            }));
            me.list = $('#mmx-users-list');
            me.list.repeater({
                dataSource       : function(options, cb){
                    me.buildList(options, cb)
                },
                list_selectable  : false,
                list_noItemsHTML : '',
                stretchHeight    : false
            });
        },
        refresh: function(){
            utils.resetRows(this, this.list);
            this.list.repeater('render');
        },
        filters : {
            username : {
                title : 'Username',
                type  : 'search'
            },
            email : {
                title : 'Email',
                type  : 'search'
            },
            name : {
                title : 'Name',
                type  : 'search'
            }
        },
        changeSearchBy: function(e){
            utils.changeSearchBy(this, $(e.currentTarget).val());
        },
        retrieve: function(options, cb){
            var me = this;
            var filters = utils.collectFilters(me.$el);
            var params = {};
            for(var i=0;i<filters.length;++i){
                params = typeof filters[i].val == 'object' ? filters[i].val : {search : filters[i].val};
                params.searchby = filters[i].name;
            }
            var query = {};
            if(options.pageIndex !== 0) query.offset = options.pageIndex !== 0 ? (options.pageSize * options.pageIndex) : 1;
            query.size = options.pageSize || 10;
//            if(params.searchby && (params.fromDt || params.toDt || params.search || options.search)) query.searchby = params.searchby;
            if(params.fromDt) query.sentSince = new Date(params.fromDt.replace(/-/g, '/')).getTime() / 1000;
            if(params.toDt && params.toDt.length){
                var toDateTime = new Date(params.toDt.replace(/-/g, '/'));
                toDateTime = new Date(toDateTime.getFullYear(), toDateTime.getMonth(), toDateTime.getDate(), 23, 59, 59);
                query.sentUntil = toDateTime.getTime() / 1000;
            }
            if(params.search || options.search) query[params.searchby] = params.search || options.search;
            if(options.sortDirection && options.sortProperty){
                me.sorts = {
                    sortby    : options.sortProperty,
                    sortorder : options.sortDirection,
                    index     : utils.getIndexByAttr(me.columns, 'property', options.sortProperty)
                };
                if(options.sortProperty == 'dateSent') options.sortProperty = 'SENT';
                if(options.sortProperty == 'dateAcknowledged') options.sortProperty = 'ACK';
                if(options.sortProperty == 'deviceId') options.sortProperty = 'DEVICEID';
                if(options.sortProperty == 'state') options.sortProperty = 'STATE';
                query.sortby = options.sortProperty;
                query.sortorder = options.sortDirection == 'asc' ? 'ASCENDING' : 'DESCENDING';
            }
            var qs = '';
            for(var key in query){
                qs += '&'+key+'='+query[key];
            }
            qs = qs.replace('&', '?');
            AJAX('apps/'+me.model.attributes.id+'/users'+qs, 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                me.users = [];
                if(res && res.results){
                    for(var i=0;i<res.results.length;++i){
                        res.results[i].id = res.results[i].username;
                        if(res.results[i].creationDate) res.results[i].creationDate = moment(res.results[i].creationDate).format('lll');
                        if(res.results[i].modificationDate) res.results[i].modificationDate = moment(res.results[i].modificationDate).format('lll');
                        if(res.results[i].username != 'serveruser') res.results[i].checkbox = '<input type="checkbox" />';
                    }
                    me.users = res.results;
                }
                cb(res);
            }, function(xhr, status, thrownError){
                cb();
                alert(xhr.responseText || 'Server is not responding.');
            }, [{
                name : 'appAPIKey',
                val  : me.model.attributes.appAPIKey
            }]);
        },
        buildList: function(options, callback){
            var me = this;
            me.retrieve(options, function(res){
                res = res || {
                    total  : 0,
                    offset : 0
                };
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
                    if(!$.isEmptyObject(me.sorts)){
                        $('#mmx-users-list .repeater-list-items tbody tr:first td').each(function(i){
                            var td = $(this);
                            var glyph = 'glyphicon';
                            if(me.sorts.index === i){
                                td.addClass('sorted');
                                if(me.sorts.sortorder == 'asc'){
                                    td.find('.'+glyph).removeClass(glyph+'-chevron-down').addClass(glyph+'-chevron-up');
                                }else{
                                    td.find('.'+glyph).removeClass(glyph+'-chevron-up').addClass(glyph+'-chevron-down');
                                }
                            }
                        });
                    }
                    $('#mmx-users-list .repeater-list-items tr td:nth-child(1)').css('width', '30px');
                    $('#mmx-users-list').find('img').tooltip();
                }, 20);
                callback(data);
            });
        },
        columns: [
            {
                label    : '',
                property : 'checkbox',
                sortable : false
            },
            {
                label    : 'Username',
                property : 'username',
                sortable : true
            },
            {
                label    : 'Email Address',
                property : 'email',
                sortable : true
            },
            {
                label    : 'Name',
                property : 'name',
                sortable : true
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
            }
        ],
        selectRow: function(params){
            if(params.state) this.displayDevices(params.did, params.tog.closest('tr'));
        },
        toggleUserRow: function(e){
            utils.toggleRow(this, $(e.currentTarget), 'users', 'username');
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
        getUsersByUsername: function(username, cb){
            AJAX('apps/'+this.model.attributes.id+'/users?username='+username, 'GET', 'application/x-www-form-urlencoded', null, function(res){
                cb(res && res.results ? res.results : []);
            }, function(e){
                alert(e);
            }, [{
                name : 'appAPIKey',
                val  : this.model.attributes.appAPIKey
            }]);
        },
        renderDevices: function(dom, uid, devices){
            dom.after(_.template($('#MessagingUserDevicesView').html(), {
                uid     : uid,
                devices : devices
            }));
        },
        validateUserModal: function(dom, obj, isEdit){
            if($.trim(obj.username.length) < 5 && !isEdit){
                utils.showError(dom, 'username', 'Username must contain five or more characters.', true);
                return false;
            }else if(!/^[a-zA-Z0-9-_.]+$/i.test(obj.username) && !isEdit){
                utils.showError(dom, 'username', 'Username can only contain letters, numbers, - and _.', true);
                return false;
            }else if($.trim(obj.password.length) < 1 && !isEdit){
                utils.showError(dom, 'password', 'A password is required. Enter a password.', true);
                return false;
            }else if(obj.email && $.trim(obj.email).length && !utils.isValidEmail(obj.email)){
                utils.showError(dom, 'email', 'The Email Address must be a valid email address.', true);
                return false;
            }else if(obj.password != obj.passwordVerify){
                utils.showError(dom, 'passwordVerify', 'Passwords do not match.', true);
                return false;
            }
            return true;
        },
        showCreateUser: function(){
            var me = this;
            var template = _.template($('#CreateUserView').html());
            me.createUserModal.find('.modal-body').html(template);
            var userNameDom = me.createUserModal.find('input[name="username"]');
            me.createUserModal.find('input').keyup(function(){
//                me.getUsersByUsername(userNameDom.val(), function(users){
//                    if(!users.length){
//                        utils.resetError(userNameDom.closest('.form-group'));
//                        if(me.validateUserModal(me.createUserModal, utils.collect(me.createUserModal))){
//                            me.createUserBtn.removeClass('disabled');
//                            utils.resetError(me.createUserModal);
//                        }else{
//                            me.createUserBtn.addClass('disabled');
//                        }
//                    }else{
//                        me.createUserBtn.addClass('disabled');
//                        utils.showError(me.createUserModal, 'username', 'This Username already exists. It cannot be added to the list.');
//                    }
//                });
                utils.resetError(userNameDom.closest('.form-group'));
                if(me.validateUserModal(me.createUserModal, utils.collect(me.createUserModal))){
                    me.createUserBtn.removeClass('disabled');
                    utils.resetError(me.createUserModal);
                }else{
                    me.createUserBtn.addClass('disabled');
                }
            });
            me.createUserModal.modal('show');
        },
        createUser: function(){
            var me = this;
            var obj = utils.collect(me.createUserModal);
            utils.resetError(me.createUserModal);
            if(!me.validateUserModal(me.createUserModal, obj))
                return;
            var btn = $('#mmx-users-create-btn');
            me.options.eventPubSub.trigger('btnLoading', btn);
            AJAX('apps/'+me.model.attributes.id+'/users', 'POST', 'application/json', obj, function(res){
                me.createUserModal.modal('hide');
                me.users.push(obj);
                me.list.repeater('render');
                Alerts.General.display({
                    title   : 'User Created',
                    content : 'A new user with username of "'+obj.username+'" has been created.'
                });
            }, function(xhr){
                if(xhr.responseText == 'user-exists'){
                    xhr.responseText = 'A user with this username already exists.';
                }else{
                    xhr.responseText = 'A server error has occurred. Please check the server logs.';
                }
                alert(xhr.responseText);
            }, [{
                name : 'appAPIKey',
                val  : me.model.attributes.appAPIKey
            }], {
                btn : btn
            });
        },
        showEditUser: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements.length ? me.selectedElements[0].username : $(e.currentTarget).closest('tr').attr('did');
            me.activeUser = utils.getByAttr(me.users, 'username', did)[0];
            var template = _.template($('#CreateUserView').html(), {
                model : me.activeUser
            });
            me.updateUserModal.find('.modal-body').html(template);
            me.updateUserModal.find('input').keyup(function(){
                if(me.validateUserModal(me.updateUserModal, utils.collect(me.updateUserModal), true)){
                    me.updateUserBtn.removeClass('disabled');
                    utils.resetError(me.updateUserModal);
                }else{
                    me.updateUserBtn.addClass('disabled');
                }
            });
            me.updateUserModal.modal('show');
        },
        saveUser: function(){
            var me = this;
            var btn = $('#mmx-users-update-btn');
            var obj = utils.collect(me.updateUserModal);
            utils.resetError(me.updateUserModal);
            if(!me.validateUserModal(me.updateUserModal, obj, true))
                return;
            if(!$.trim(obj.password).length) delete obj.password;
            me.options.eventPubSub.trigger('btnLoading', btn);
            AJAX('apps/'+me.model.attributes.id+'/users/'+obj.username, 'PUT', 'application/json', obj, function(){
                utils.resetRows(me, me.list);
                me.list.repeater('render');
                me.updateUserModal.modal('hide');
                Alerts.General.display({
                    title   : 'User Updated',
                    content : 'The user "'+me.activeUser.username+'" has been updated.'
                });
                delete me.activeUser;
            }, function(xhr){
                alert(xhr.responseText);
            }, [{
                name : 'appAPIKey',
                val  : me.model.attributes.appAPIKey
            }], {
                btn : btn
            });
        },
        lockUser: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements[0].username;
            AJAX('apps/'+me.model.attributes.id+'/users/'+did+'/deactivate', 'POST', 'application/json', null, function(res){
                utils.resetRows(me, me.list);
                me.list.repeater('render');
            }, function(xhr){
                alert(xhr.responseText);
            });
        },
        unlockUser: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements[0].username;
            AJAX('apps/'+me.model.attributes.id+'/users/'+did+'/activate', 'POST', 'application/json', null, function(res){
                utils.resetRows(me, me.list);
                me.list.repeater('render');
            }, function(xhr){
                alert(xhr.responseText);
            });
        },
        removeUser: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements[0].username;
            Alerts.Confirm.display({
                title   : 'Delete User',
                content : 'The selected user will be deleted. This can not be undone. Are you sure you want to continue?'
            }, function(){
                AJAX('apps/'+me.model.attributes.id+'/users/'+did, 'DELETE', 'application/json', null, function(res){
                    utils.removeByAttr(me.users, 'username', did);
                    var list = $(e.currentTarget).closest('.repeater');
                    var dom = list.find('.repeater-list-items tr[did="'+did+'"]');
                    utils.resetRows(me, me.list);
                    dom.hide('slow', function(){
                        dom.remove();
                    });
                }, function(xhr){
                    alert(xhr.responseText);
                }, [{
                    name : 'appAPIKey',
                    val  : me.model.attributes.appAPIKey
                }]);
            });
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