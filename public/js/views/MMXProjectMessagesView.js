define(['jquery', 'backbone', 'views/AdvSearchView'], function($, Backbone, AdvSearchView){
    var View = Backbone.View.extend({
        el: '#mmx-msgs-tab',
        initialize: function(options){
            var me = this;
            me.advsearch = new AdvSearchView(options);
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectMessages', function(model){
                me.model = model;
                me.render();
                me.changeSearchBy();
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
            me.options.eventPubSub.bind('AdvSearchRefresh', function(tag){
                if(tag == 'Messages') me.refresh();
            });
        },
        events: {
            'change .repeater-search select[name="searchby"]': 'changeSearchBy'
        },
        render: function(){
            var me = this;
            if(me.rendered) return me.refresh(true);
            me.rendered = true;
            me.$el.find('.view-container').html(_.template($('#MessagingMessagesListTmpl').html()));
            me.list = $('#mmx-messages-list');
            me.list.repeater({
                dataSource       : function(options, cb){
                    me.buildList(options, cb)
                },
                list_selectable  : false,
                list_noItemsHTML : '',
                stretchHeight    : false
            });
            me.options.eventPubSub.trigger('initAdvSearch', {
                tag     : 'Messages',
                el      : '#mmx-advsearch-container',
                filters : {
                    queuedAt : {
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
                            {key:'DELIVERY_ATTEMPTED', val:'Delivery Attempted'},
                            {key:'DELIVERY_ACKNOWLEDGED', val:'Delivery Acknowledged'},
                            {key:'SENT', val:'Sent'}
                        ]
                    },
                    from : {
                        title : 'Sender',
                        type  : 'search'
                    },
                    to : {
                        title : 'Recipient',
                        type  : 'search'
                    }
                }
            });
//            me.list.find('.fromDt, .toDt').on('changed.fu.datepicker', function(){
//                me.refresh();
//            });
        },
        changeSearchBy: function(){
            var val = $('.repeater-search select[name="searchby"]').val();
            if(val == 'datesent' || val == 'dateack'){
                this.$el.find('.dt-container .col-sm-12').hide().find('input').val('');
                this.$el.find('.dt-container .col-sm-6').show('fast').find('input').val('');
            }else{
                this.$el.find('.dt-container .col-sm-12').show('fast').find('input').val('');
                this.$el.find('.dt-container .col-sm-6').hide().find('input').val('');
            }
        },
        refresh: function(clearQuery){
            if(clearQuery){
                this.$el.find('.repeater-header input').val('');
                this.$el.find('.repeater-header .search button span:first').removeClass('glyphicon-remove').addClass('glyphicon-search');
            }
            this.list.repeater('render');
        },
        retrieve: function(options, cb){
            var me = this;
//            var params = utils.collect(me.$el.find('.repeater-header'));
            var filters = this.advsearch.collect();
            var params = {};
            /* TEMP */
            for(var i=0;i<filters.length;++i){
                params = typeof filters[i].val == 'object' ? filters[i].val : {search : filters[i].val};
                params.searchby = (filters[i].name == 'queuedAt') ? 'datesent' : filters[i].name;
            }
            /* TEMP */
            var query = {};
            if(options.pageIndex !== 0) query.param8 = options.pageIndex !== 0 ? (options.pageSize * options.pageIndex) : 1;
            if(options.pageSize != 10) query.param9 = options.pageSize || 10;
            if(params.searchby && (params.fromDt || params.toDt || params.search || options.search)) query.searchby = params.searchby;
            if(params.fromDt) query.value = new Date(params.fromDt.replace(/-/g, '/')).getTime() / 1000;
            if(params.toDt) query.value2 = new Date(params.toDt.replace(/-/g, '/')).getTime() / 1000;
            if(params.search || options.search) query.value = params.search || options.search;
            var qs = '';
            for(var key in query){
                qs += '&'+key+'='+query[key];
            }
            qs = qs.replace('&', '?');
            AJAX('apps/'+me.model.attributes.id+'/messages'+qs, 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                if(res && res.results){
                    for(var i=0;i<res.results.length;++i){
                        res.results[i].queuedAt = utils.fromISO8601(res.results[i].queuedAt);
                    }
                }
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
                    page    : res.offset,
                    columns : me.columns
                };
                data.pages = Math.ceil(data.count / options.pageSize);
                data.start = data.page * options.pageSize;
                data.end = data.start + options.pageSize;
                data.end = (data.end <= data.count) ? data.end : data.count;
                setTimeout(function(){
                    $('#mmx-messages-list .repeater-list-header tr').addClass('head').detach().prependTo('#mmx-messages-list .repeater-list-items tbody');
                }, 20);
                callback(data);
            });
        },
        columns: [
            {
                label    : 'Date Sent',
                property : 'queuedAt',
                sortable : false
            },
            {
                label    : 'Date Acknowledged',
                property : 'dateack',
                sortable : false
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
                label    : 'State',
                property : 'state',
                sortable : false
            },
            {
                label    : 'Device Id',
                property : 'deviceId',
                sortable : false
            },
            {
                label    : 'App Id',
                property : 'appId',
                sortable : false
            }
        ]
    });
    return View;
});