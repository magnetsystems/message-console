define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-messages',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectmessages', function(model){
                me.model = model;
                me.render();
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
        },
        events: {
            'change .repeater-header-left select[name="searchby"]': 'changeSearchBy',
            'click .mmx-messagelist-refresh-btn': 'refresh'
        },
        render: function(){
            var me = this;
            me.sorts = {};
            if(me.rendered) return me.refresh();
            me.rendered = true;
            me.$el.find('.view-container').html(_.template($('#MessagingMessagesListTmpl').html(), {
                filters : me.filters
            }));
            me.list = $('#mmx-messages-list');
            me.list.repeater({
                dataSource       : function(options, cb){
                    me.buildList(options, cb)
                },
                list_selectable  : false,
                list_noItemsHTML : '',
                stretchHeight    : false
            });
        },
        filters : {
            messageid : {
                title : 'Message Id',
                type  : 'search'
            },
            datesent : {
                title : 'Date Sent',
                type  : 'daterange'
            },
            dateack : {
                title : 'Date Acknowledged',
                type  : 'daterange'
            },
            targetdevid : {
                title : 'Target Device Id',
                type  : 'search'
            },
            state : {
                title : 'State',
                type  : 'enum',
                props : [
                    {key:'DELIVERY_ATTEMPTED', val:'DELIVERY_ATTEMPTED'},
                    {key:'WAKEUP_REQUIRED', val:'WAKEUP_REQUIRED'},
                    {key:'WAKEUP_TIMEDOUT', val:'WAKEUP_TIMEDOUT'},
                    {key:'WAKEUP_SENT', val:'WAKEUP_SENT'},
                    {key:'DELIVERED', val:'DELIVERED'},
                    {key:'RECEIVED', val:'RECEIVED'}
                ]
            }
        },
        changeSearchBy: function(e){
            utils.changeSearchBy(this, $(e.currentTarget).val());
        },
        refresh: function(){
            this.list.repeater('render');
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
            if(params.searchby && (params.fromDt || params.toDt || params.search || options.search)) query.searchby = params.searchby;
            if(params.fromDt) query.value = new Date(params.fromDt.replace(/-/g, '/')).getTime() / 1000;
            if(params.toDt && params.toDt.length){
                var toDateTime = new Date(params.toDt.replace(/-/g, '/'));
                toDateTime = new Date(toDateTime.getFullYear(), toDateTime.getMonth(), toDateTime.getDate(), 23, 59, 59);
                query.value2 = toDateTime.getTime() / 1000;
            }
            if(params.search || options.search) query.value = params.search || options.search;
            if(options.sortDirection && options.sortProperty){
                me.sorts = {
                    sortby    : options.sortProperty,
                    sortorder : options.sortDirection,
                    index     : utils.getIndexByAttr(me.columns, 'property', options.sortProperty)
                };
                if(options.sortProperty == 'deliveryAckAt') options.sortProperty = 'dateack';
                if(options.sortProperty == 'queuedAt') options.sortProperty = 'datesent';
                if(options.sortProperty == 'deviceId') options.sortProperty = 'targetdevid';
                if(options.sortProperty == 'messageId') options.sortProperty = 'messageid';
                query.sortby = options.sortProperty;
                query.sortorder = options.sortDirection == 'asc' ? 'ASCENDING' : 'DESCENDING';
            }
            var qs = '';
            for(var key in query){
                qs += '&'+key+'='+query[key];
            }
            qs = qs.replace('&', '?');
            AJAX('apps/'+me.model.attributes.id+'/messages'+qs, 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                if(res && res.results){
                    for(var i=0;i<res.results.length;++i){
                        if(res.results[i].queuedAt) res.results[i].queuedAt = moment(res.results[i].queuedAt).format('lll');
                        if(res.results[i].deliveryAckAt) res.results[i].deliveryAckAt = moment(res.results[i].deliveryAckAt).format('lll');
                        res.results[i].state = '<img src="images/dashboard/mmx_state_'+res.results[i].state+'.png" data-toggle="tooltip" data-placement="right" title="'+me.deliveryStates[res.results[i].state]+'" />';
                    }
                }
                cb(res);
            }, function(xhr, status, thrownError){
                cb();
                alert(xhr.responseText || 'Server is not responding.');
            });
        },
        deliveryStates: {
            'DELIVERY_ATTEMPTED' : 'Delivery attempted',
            'WAKEUP_REQUIRED'    : 'Wake up required',
            'WAKEUP_TIMEDOUT'    : 'Wake up timeout',
            'WAKEUP_SENT'        : 'Wake up sent',
            'DELIVERED'          : 'Delivered',
            'PENDING'            : 'Pending',
            'RECEIVED'           : 'Received'
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
                    $('#mmx-messages-list .repeater-list-header tr').addClass('head').detach().prependTo('#mmx-messages-list .repeater-list-items tbody');
                    if(!$.isEmptyObject(me.sorts)){
                        $('#mmx-messages-list .repeater-list-items tbody tr:first td').each(function(i){
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
                    $('#mmx-messages-list').find('img').tooltip();
                }, 20);
                callback(data);
            });
        },
        columns: [
            {
                label    : 'State',
                property : 'state',
                sortable : true
            },
            {
                label    : 'Date Sent',
                property : 'queuedAt',
                sortable : true
            },
            {
                label    : 'Date Acknowledged',
                property : 'deliveryAckAt',
                sortable : true
            },
            {
                label    : 'Sender',
                property : 'from',
                sortable : false
            },
            {
                label    : 'Recipient',
                property : 'to',
                sortable : false
            },
            {
                label    : 'Recipient Device Id',
                property : 'deviceId',
                sortable : true
            },
            {
                label    : 'Message Id',
                property : 'messageId',
                sortable : true
            }
        ]
    });
    return View;
});