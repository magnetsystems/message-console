define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-endpoints',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectendpoints', function(model){
                me.model = model;
                me.render();
            });
            me.sendMessageModal = $('#mmx-sendmessage-modal');
            me.sendMessageModal.on('hidden.bs.modal', function(e){
                timer.stop('#messages-refresh');
            });
            me.sendMessageModal.find('input:radio').change(function(){
                me.changeMMXMessageType($(this));
            });
            me.sendMessageModal.find('.message-types button[did="message"]').click(function(){
                me.sendMessage($(this));
            });
            me.sendMessageModal.find('.message-types button[did!="message"]').click(function(){
                me.sendNotification($(this));
            });
            $.fn.datepicker.defaults = {
                date : new Date(),
                momentConfig : {
                    culture    : 'en',
                    formatCode : 'L'
                },
                dropdownWidth  : 170,
                allowPastDates : true
            };
            $('#mmx-sendmessage-modal').find('.tooltip-danger').tooltip();
        },
        events: {
            'click .mmx-endpoints-showdetails-modal-btn': 'showDeviceDetailsModal',
            'change .repeater-header-left select[name="searchby"]': 'changeSearchBy',
            'click .search-btn': 'refresh',
            'click button[did="actions-sendmessage"]': 'showSendMessageModal',
            'click button[did="actions-deleterow"]': 'deleteEndpoint',
            'click #mmx-endpoints-list input[type="checkbox"]': 'toggleRow'
        },
        render: function(){
            var me = this;
            me.sorts = {};
            me.selectedEndpoints = [];
            this.$el.find('.view-container').html(_.template($('#MessagingEndpointsListTmpl').html(), {
                filters : me.filters
            }));
            this.list = $('#mmx-endpoints-list');
            this.list.repeater({
                dataSource       : function(options, cb){
                    me.buildList(options, cb)
                },
                list_selectable  : false,
                list_noItemsHTML : ''
            });
            this.selectedEndpoints = [];
        },
        filters : {
            epname : {
                title : 'Device Name',
                type  : 'search'
            },
            epdatecreated : {
                title : 'Date Created',
                type  : 'daterange'
            },
            epstatus : {
                title : 'Status',
                type  : 'enum',
                props : [
                    {key:'ACTIVE', val:'ACTIVE'},
                    {key:'INACTIVE', val:'INACTIVE'}
                ]
            },
            epostype : {
                title : 'OS',
                type  : 'enum',
                props : [
                    {key:'ANDROID', val:'ANDROID'}
                ]
            }
        },
        refresh: function(){
            this.$el.find('.repeater-search .same-line-button[did^="action"]').addClass('disabled');
            var params = utils.collect(this.$el.find('.repeater-header'));
            if(this.validate(params))
                this.list.repeater('render');
        },
        validate: function(params){
            params = params || {};
            if(params.searchby == 'epname' && params.search.length && params.search.length < 3)
                return alert('Search value needs at least 3 characters.');
            return true;
        },
        collect: function(){
            var me = this, ary = [];
            me.$el.find('.advsearch-filter-item').each(function(){
                var val = utils.collect($(this));
                ary.push({
                    name : $(this).attr('did'),
                    val  : (val.enum || val.search) ? (val.enum || val.search) : val
                });
            });
            return ary;
        },
        retrieve: function(options, cb){
            var me = this;
            var filters = this.collect();
            var params = {};
            for(var i=0;i<filters.length;++i){
                params = typeof filters[i].val == 'object' ? filters[i].val : {search : filters[i].val};
                params.searchby = filters[i].name;
            }
            var query = {};
            if(options.pageIndex !== 0) query.offset = options.pageIndex !== 0 ? (options.pageSize * options.pageIndex) : 1;
            if(options.pageSize != 10) query.size = options.pageSize || 10;
            if(params.searchby && (params.fromDt || params.toDt || params.search || options.search)) query.searchby = params.searchby;
            if(params.fromDt) query.value = new Date(params.fromDt.replace(/-/g, '/')).getTime() / 1000;
            if(params.toDt && params.toDt.length){
                var toDateTime = new Date(params.toDt.replace(/-/g, '/'));
                toDateTime = new Date(toDateTime.getFullYear(), toDateTime.getMonth(), toDateTime.getDate(), 23, 59, 59);
                query.value1 = toDateTime.getTime() / 1000;
            }
            if(params.search || options.search) query.value = params.search || options.search;
            if(options.sortDirection && options.sortProperty){
                me.sorts = {
                    sortby    : options.sortProperty,
                    sortorder : options.sortDirection,
                    index     : utils.getIndexByAttr(me.columns, 'property', options.sortProperty)
                };
                if(options.sortProperty == 'name') options.sortProperty = 'epname';
                if(options.sortProperty == 'status') options.sortProperty = 'epstatus';
                if(options.sortProperty == 'osType') options.sortProperty = 'epostype';
                query.sortby = options.sortProperty;
                query.sortorder = options.sortDirection == 'asc' ? 'ASCENDING' : 'DESCENDING';
            }
            var qs = '';
            for(var key in query){
                qs += '&'+key+'='+query[key];
            }
            qs = qs.replace('&', '?');
            AJAX('apps/'+me.model.attributes.id+'/endpoints'+qs, 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                if(res && res.results){
                    me.endpoints = [];
                    me.users = [];
                    for(var i=0;i<res.results.length;++i){
                        res.results[i].device.created = moment.unix(res.results[i].device.created / 1000).format('lll');
                        if(res.results[i].device.updated) res.results[i].device.updated = moment.unix(res.results[i].device.updated / 1000).format('lll');
                        res.results[i].device.nameEdited = res.results[i].device.name.substr(0, 30)+'...';
                        res.results[i].device.ownerIdEdited = res.results[i].device.ownerId.substr(0, 10)+'...';
                        res.results[i].device.osTypeEdited = '<i class="fa fa-2x fa-'+(res.results[i].device.osType == 'ANDROID' ? 'android' : 'apple')+'"></i>';
                        res.results[i].device.deviceIdEdited = '<a href="#" class="mmx-endpoints-showdetails-modal-btn">'+res.results[i].device.deviceId.substr(0, 30)+'...</a>';
                        res.results[i].device.checkbox = '<input type="checkbox" />';
                        if(res.results[i].userEntity){
                            if(res.results[i].userEntity.creationDate) res.results[i].userEntity.creationDate = moment.unix(res.results[i].userEntity.creationDate / 1000).format('lll');
                            if(res.results[i].userEntity.modificationDate) res.results[i].userEntity.modificationDate = moment.unix(res.results[i].userEntity.modificationDate / 1000).format('lll');
                        }
                        me.endpoints.push(res.results[i].device);
                        me.users.push(res.results[i].userEntity || null);
                    }
                    if(me.options.opts.configs['cluster.max.devices.per.app'] > 0 && me.options.opts.configs['cluster.max.devices.per.app'] <= res.active){
                        $('#mmx-maximum-devices-reached').show();
                        $('#mmx-container .view-wrapper').css('margin-top', function(index, curValue){
                            var curr = parseInt(curValue, 10);
                            return (curr == 43 || curr == 77) ? (curr + 35) : curr + 'px';
                        });
                    }else{
                        $('#mmx-maximum-devices-reached').hide();
                        $('#mmx-container .view-wrapper').css('margin-top', function(index, curValue){
                            var curr = parseInt(curValue, 10);
                            return (curr == 78 || curr == 112) ? (curr - 35) : curr + 'px';
                        });
                    }
                }
                cb(res);
            }, function(xhr, status, thrownError){
                cb();
                alert(xhr.responseText);
            });
        },
        buildList: function(options, callback){
            var me = this;
            me.retrieve(options, function(res){
                var data = {
                    count   : res.total,
                    items   : me.endpoints,
                    page    : (res.offset / options.pageSize),
                    columns : me.columns
                };
                data.pages = Math.ceil(data.count / options.pageSize);
                data.start = data.page * options.pageSize;
                data.end = data.start + options.pageSize;
                data.end = (data.end <= data.count) ? data.end : data.count;
                data.start = data.start + 1;
                setTimeout(function(){
                    $('#mmx-endpoints-list .repeater-list-header tr').addClass('head').detach().prependTo('#mmx-endpoints-list .repeater-list-items tbody');
                    if(!$.isEmptyObject(me.sorts)){
                        $('#mmx-endpoints-list .repeater-list-items tbody tr:first td').each(function(i){
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
                    $('#mmx-endpoints-list .repeater-list-items tr td:nth-child(1)').css('width', '30px');
                    $('#mmx-endpoints-list .repeater-list-items tr td:nth-child(2), #mmx-endpoints-list .repeater-list-items tr td:nth-child(3)').css('width', '30%');
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
                label    : 'Device Id',
                property : 'deviceIdEdited',
                sortable : false
            },
            {
                label    : 'Device Name',
                property : 'nameEdited',
                sortable : true
            },
            {
                label    : 'OS',
                property : 'osTypeEdited',
                sortable : true
            },
            {
                label    : 'Token',
                property : 'tokenType',
                sortable : false
            },
            {
                label    : 'Status',
                property : 'status',
                sortable : true
            },
            {
                label    : 'User Id',
                property : 'ownerIdEdited',
                sortable : false
            }
        ],
        changeSearchBy: function(e){
            var val = $(e.currentTarget).val();
            if(this.filters[val]){
                var filter = this.filters[val];
                this.$el.find('.searchby-input-container').html(_.template($('#ADV'+filter.type+'Filter').html(), {
                    filter : filter,
                    name   : val
                }));
            }else{
                this.$el.find('.searchby-input-container').html('');
            }
        },
        toggleRow: function(e){
            var checkbox = $(e.currentTarget);
            var parent = checkbox.closest('tbody');
            var row = checkbox.closest('tr');
            var id = row.attr('did');
            parent.find('tr[did!="'+id+'"] input[type="checkbox"]').attr('checked', false);
            if(checkbox.is(':checked')){
                this.selectedEndpoints = []; // support only one endpoint at a time
                this.selectedEndpoints.push(utils.getByAttr(this.endpoints, 'id', parseInt(id))[0]);
                if(this.selectedEndpoints.length)
                    this.$el.find('.repeater-search .same-line-button[did^="action"]').removeClass('disabled');
            }else{
                this.selectedEndpoints.splice(utils.getIndexByAttr(this.selectedEndpoints, 'id', parseInt(id)), 1);
                if(!this.selectedEndpoints.length)
                    this.$el.find('.repeater-search .same-line-button[did^="action"]').addClass('disabled');
            }
        },
        showDeviceDetailsModal: function(e){
            e.preventDefault();
            var row = $(e.currentTarget).closest('tr');
            var index = utils.getIndexByAttr(this.endpoints, 'id', row.attr('did'));
            var modal = $('#mmx-device-showdetails-modal');
            modal.find('.modal-body').html(_.template($('#MessagingDeviceDetailsTmpl').html(), {
                device : this.endpoints[index],
                user   : this.users[index]
            }));
            modal.modal('show');
        },
        showSendMessageModal: function(e){
            var text = '', pushActivated = true;
            var index = utils.getIndexByAttr(this.endpoints, 'id', this.selectedEndpoints[0].id);
            this.activeDevice = this.endpoints[index];
            this.activeUser = this.users[index] || null;
            this.latestMessageId = null;
            this.sendMessageModal.find('.radio').removeClass('disabled').show();
            this.sendMessageModal.find('.message-push-history').html('');
            this.sendMessageModal.find('input[name="message-type"][value="message"]').prop('checked', true);
            if(!this.activeDevice.clientToken || !this.model.attributes.googleProjectId || !this.model.attributes.googleAPIKey){
                this.sendMessageModal.find('input[name="message-type"][value="push"]').closest('.radio').addClass('disabled');
                pushActivated = false;
            }
            this.sendMessageModal.find('.user-placeholder').html(this.activeUser ? '<b>Endpoint:</b> '+this.activeUser.userId : '');
            this.sendMessageModal.find('.device-placeholder').html('<b>Device:</b> '+this.activeDevice.name);
            if(pushActivated) this.getRecentMessages(null, true);
            utils.resetError(this.sendMessageModal);
            this.sendMessageModal.find('.message-types > div').addClass('hidden');
            this.sendMessageModal.find('.message-types > div[did="message"]').removeClass('hidden');
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
            me.polling = true;
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
        changeMMXMessageType: function(dom){
            var option = dom.val();
            if(option == 'push' && dom.closest('.radio').hasClass('disabled')) return;
            this.sendMessageModal.find('.message-types > div').addClass('hidden');
            this.sendMessageModal.find('.message-types > div[did="'+option+'"]').removeClass('hidden');
        },
        sendMessage: function(){
            var me = this;
            var body = {
                receipt : true,
                headers : {
                    'content-type'     : 'text',
                    'content-encoding' : 'simple'
                },
                appAPIKey : me.model.attributes.appAPIKey
            };
            var input = me.sendMessageModal.find('.message-types > div[did="message"] textarea');
            var url = 'apps/'+me.model.attributes.id+'/endpoints/'+this.activeDevice.id+'/message';
            if(!$.trim(input.val()).length)
                return alert('Payload is required for sending a push notification');
            if(me.activeDevice && me.activeDevice.deviceId)
                body.deviceId = me.activeDevice.deviceId;
            if(me.activeUser && me.activeUser.userId)
                body.recipientId = me.activeUser.userId;
            if($.trim(input.val()).length)
                body.content = input.val();
            utils.resetError(me.sendMessageModal);
            AJAX(url, 'POST', 'application/json', body, function(res, status, xhr){
                input.val('');
                alert('message sent');
            }, function(xhr, status, thrownError){
                utils.showError(me.sendMessageModal, '', 'message delivery error.');
            });
        },
        sendNotification: function(dom){
            var type = dom.attr('did');
            var me = this;
            var body = {
                target : {
                    deviceIds : []
                },
                appAPIKey : me.model.attributes.appAPIKey
            };
            var input = me.sendMessageModal.find('.message-types > div[did="push"] textarea');
            var url = 'apps/'+me.model.attributes.id+'/endpoints/'+this.activeDevice.id;
            if(me.activeDevice && me.activeDevice.deviceId)
                body.target.deviceIds.push(me.activeDevice.deviceId);
            if(type == 'notification' && $.trim(input.val()).length)
                body.body = input.val();
            url += '/'+type;
            utils.resetError(me.sendMessageModal);
            AJAX(url, 'POST', 'application/x-www-form-urlencoded', body, function(res, status, xhr){
                input.val('');
                alert(type+' sent');
                if(body.target.deviceIds.length) me.pollRecentMessages();
            }, function(xhr, status, thrownError){
                utils.showError(me.sendMessageModal, '', type+' delivery error.');
            });
        },
        deleteEndpoint: function(){
            var endpoints = '';
            for(var i=0;i<this.selectedEndpoints.length;++i)
                endpoints += '<br />' + this.selectedEndpoints[i].deviceId;
            Alerts.Confirm.display({
                title   : 'Confirm Endpoint Deletion',
                content : 'Please verify that you wish to delete the selected endpoints: <br />'+endpoints
            }, function(){
                alert('this feature is not yet supported.');
            });
        }
    });
    return View;
});