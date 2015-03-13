define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-topics',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjecttopics', function(model){
                me.model = model;
                me.selectedElements = [];
                $('#mmx-new-topic-input').val('');
                me.render();
            });
            me.newTopicModal = $('#mmx-create-topic-modal');
            me.createTopicBtn = $('#create-messaging-topic-btn');
            me.newTopicModal.find('input').keyup(function(){
                utils.resetError(me.newTopicModal);
                if(me.validateTopicModal(me.newTopicModal, utils.collect(me.newTopicModal))){
                    me.createTopicBtn.removeClass('disabled');
                    utils.resetError(me.newTopicModal);
                }else{
                    me.createTopicBtn.addClass('disabled');
                }
            });
            me.createTopicBtn.click(function(){
                if(me.createTopicBtn.hasClass('disabled')) return;
                me.createTopic();
            });
            me.modal = $('#mmx-publishtopic-modal');
            me.modal.find('#mmx-publishtopic-btn').click(function(){
                me.publishTopic();
            });
        },
        events : {
            'click input[type="checkbox"]': 'toggleRow',
            'click .mmx-topic-list-refresh-btn': 'refresh',
            'change .repeater-header-left select[name="searchby"]': 'changeSearchBy',
            'click .repeater-header .glyphicon-envelope': 'showPublishModal',
            'click .repeater-header .glyphicon-trash': 'deleteTopic',
            'click .repeater-header .glyphicon-plus': 'showCreateTopicModal'
        },
        toggleRow: function(e){
            utils.toggleRow(this, $(e.currentTarget), 'topics', 'id');
        },
        render: function(){
            var me = this;
            me.sorts = {};
            if(me.rendered) return me.refresh();
            me.rendered = true;
            me.$el.find('.view-container').html(_.template($('#MessagingTopicsListView').html(), {
                filters : me.filters
            }));
            me.list = $('#mmx-topics-list');
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
            this.list.repeater('render');
        },
        filters : {
            displayName : {
                title : 'Name',
                type  : 'search'
            },
            description : {
                title : 'Description',
                type  : 'search'
            },
            tags : {
                title : 'Tag',
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
            if(options.pageIndex !== 0) query.offset = options.pageIndex !== 0 ? Math.round((options.pageSize * options.pageIndex)) : 1;
            query.size = options.pageSize || 10;
            if(params.search || options.search) query[params.searchby] = params.search || options.search;
            var qs = '';
            for(var key in query){
                qs += '&'+key+'='+query[key];
            }
            qs = qs.replace('&', '?');
            AJAX('apps/'+me.model.attributes.id+'/topics'+qs, 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                me.topics = [];
                if(res && res.results){
                    for(var i=0;i<res.results.length;++i){
                        res.results[i].checkbox = '<input type="checkbox" />';
                    }
                    me.topics = res.results;
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
                    items   : me.topics,
                    page    : Math.round((res.offset / options.pageSize)),
                    columns : me.columns
                };
                data.pages = Math.ceil(data.count / options.pageSize);
                data.start = data.page * options.pageSize;
                data.end = data.start + options.pageSize;
                data.end = (data.end <= data.count) ? data.end : data.count;
                data.start = data.start + 1;
                setTimeout(function(){
                    $('#mmx-topics-list .repeater-list-header tr').addClass('head').detach().prependTo('#mmx-topics-list .repeater-list-items tbody');
                    $('#mmx-topics-list .repeater-list-items tr td:nth-child(1)').css('width', '30px');
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
                label    : 'Topic Name',
                property : 'name',
                sortable : false
            },
            {
                label    : 'Description',
                property : 'description',
                sortable : false
            },
            {
                label    : 'Tags',
                property : 'tags',
                sortable : false
            },
            {
                label    : 'Subscribers',
                property : 'subscriptionCount',
                sortable : false
            }
        ],
        showCreateTopicModal: function(){
            var me = this;
            me.newTopicModal.find('input').val('');
            me.createTopicBtn.addClass('disabled');
            me.newTopicModal.modal('show');
        },
        validateTopicModal: function(dom, obj, isEdit){
            if($.trim(obj.name).length < 1 && !isEdit){
                utils.showError(dom, 'name', 'Invalid Topic Name. Topic Name is a required field.');
                return false;
            }
            return true;
        },
        createTopic: function(){
            var me = this;
            var obj = utils.collect(me.newTopicModal);
            utils.resetError(me.newTopicModal);
            if(!me.validateTopicModal(me.newTopicModal, obj))
                return;
            me.options.eventPubSub.trigger('btnLoading', me.createTopicBtn);
            AJAX('apps/'+me.model.attributes.id+'/topics', 'POST', 'application/json', obj, function(res){
                me.newTopicModal.modal('hide');
                me.topics.push(obj);
                me.list.repeater('render');
                Alerts.General.display({
                    title   : 'Topic Created',
                    content : 'A new topic with name of "'+obj.name+'" has been created.'
                });
            }, function(e){
                var msg = 'A server error has occurred. Please check the server logs.';
                if(e) msg = e;
                alert('A topic by this name already exists.');
            }, null, {
                btn : me.createTopicBtn
            });
        },
        deleteTopic: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements[0].id;
            Alerts.Confirm.display({
                title   : 'Delete Topic',
                content : 'The selected topic will be deleted. This can not be undone. Are you sure you want to continue?'
            }, function(){
                AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(did), 'DELETE', 'application/json', null, function(res, status, xhr){
                    utils.removeByAttr(me.topics, 'id', did);
                    me.selectedElements = [];
                    var list = $(e.currentTarget).closest('.repeater');
                    var dom = list.find('.repeater-list-items tr[did="'+did+'"]');
                    utils.resetRows(me.list);
                    dom.hide('slow', function(){
                        dom.remove();
                    });
                }, function(e){
                    alert(e);
                });
            });
        },
        showPublishModal: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements[0].id;
            this.activeTopic = utils.getByAttr(this.topics, 'id', did)[0];
            this.modal.find('span.mmx-topic-name-placeholder').text(this.activeTopic.name);
            this.modal.modal('show');
        },
        publishTopic: function(){
            var me = this;
            var msg = this.modal.find('textarea');
            AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(this.activeTopic.id)+'/publish', 'POST', 'application/json', {
                payload : msg.val()
            }, function(res, status, xhr){
                msg.val('');
                alert('message sent');
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        }
    });
    return View;
});