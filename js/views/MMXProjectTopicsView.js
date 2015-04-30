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
            me.createTopicBtn.click(function(){
                if(me.createTopicBtn.hasClass('disabled')) return;
                me.createTopic();
            });
            me.updateTopicModal = $('#update-topic-modal');
            me.updateTopicBtn = $('#mmx-topics-update-btn');
            me.updateTopicModal.find('#mmx-topics-update-btn').click(function(){
                me.saveTopic();
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
            'click .repeater-header .glyphicon-pencil': 'showEditTopic',
            'click .repeater-header .glyphicon-plus': 'showCreateTopicModal'
        },
        toggleRow: function(e){
            utils.toggleRow(this, $(e.currentTarget), 'topics', 'topicName');
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
            utils.resetRows(this, this.list);
            this.list.repeater('render');
        },
        filters : {
            topicName : {
                title : 'Name',
                type  : 'search'
            },
            description : {
                title : 'Description',
                type  : 'search'
            },
            tag : {
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
                        res.results[i].id = res.results[i].topicName;
                        if(res.results[i].creationDate) res.results[i].creationDate = moment(res.results[i].creationDate).format('lll');
                        if(res.results[i].maxItems === -1) res.results[i].maxItems = 'unlimited';
                        if(res.results[i].maxItems === 0) res.results[i].maxItems = 'non persistent';
                        res.results[i].checkbox = '<input type="checkbox" />';
                    }
                    me.topics = res.results;
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
                property : 'topicName',
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
            },
            {
                label    : 'Max Items',
                property : 'maxItems',
                sortable : false
            },
            {
                label    : 'Publisher Type',
                property : 'publisherType',
                sortable : false
            },
            {
                label    : 'Created',
                property : 'creationDate',
                sortable : false
            }
        ],
        showCreateTopicModal: function(){
            var me = this;
            me.createTopicBtn.addClass('disabled');
            var template = _.template($('#CreateTopicView').html());
            me.newTopicModal.find('.modal-body').html(template);
            me.newTopicModal.find('input').keyup(function(){
                utils.resetError(me.newTopicModal);
                if(me.validateTopicModal(me.newTopicModal, utils.collect(me.newTopicModal))){
                    me.createTopicBtn.removeClass('disabled');
                    utils.resetError(me.newTopicModal);
                }else{
                    me.createTopicBtn.addClass('disabled');
                }
            });
            me.newTopicModal.find('.pill-container').html(_.template($('#TagsListView').html(), {
                tags : []
            }));
            me.newTopicModal.find('.pillbox').pillbox({
                edit : true
            });
            me.newTopicModal.find('.topic-tag-container .glyphicon-plus').click(function(){
                me.setTopicTag($(this));
            });
            me.newTopicModal.modal('show');
        },
        validateTopicModal: function(dom, obj, isEdit){
            if($.trim(obj.topicName).length < 1 && !isEdit){
                utils.showError(dom, 'topicName', 'Invalid Topic Name. Topic Name is a required field.');
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
            delete obj.tagName;
            delete obj.tags;
            var tags = utils.collect(me.newTopicModal.find('.topic-tag-container'));
            AJAX('apps/'+me.model.attributes.id+'/topics', 'POST', 'application/json', obj, function(res){
                if(tags.tags && tags.tags.length){
                    AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(obj.topicName)+'/tags', 'POST', 'application/json', {
                        tags : tags.tags
                    }, function(res){
                        me.createTopicComplete(obj);
                    }, function(xhr){
                        alert('An error has occurred: '+xhr.responseText+'.');
                    }, [{
                        name : 'appAPIKey',
                        val  : me.model.attributes.appAPIKey
                    }]);
                }else{
                    me.options.eventPubSub.trigger('btnComplete', me.createTopicBtn);
                    me.createTopicComplete(obj);
                }
            }, function(xhr){
                alert('An error has occurred'+(xhr.responseText ? ': '+xhr.responseText : '.'));
                me.options.eventPubSub.trigger('btnComplete', me.createTopicBtn);
            }, [{
                name : 'appAPIKey',
                val  : me.model.attributes.appAPIKey
            }], {
                btn : me.createTopicBtn
            });
        },
        createTopicComplete: function(obj){
            var me = this;
            me.newTopicModal.modal('hide');
            me.topics.push(obj);
            me.list.repeater('render');
            Alerts.General.display({
                title   : 'Topic Created',
                content : 'A new topic with name of "'+obj.topicName+'" has been created.'
            });
        },
        showEditTopic: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements.length ? me.selectedElements[0].topicName : $(e.currentTarget).closest('tr').attr('did');
            me.activeTopic = utils.getByAttr(me.topics, 'topicName', did)[0];
            var template = _.template($('#CreateTopicView').html(), {
                model : me.activeTopic
            });
            me.updateTopicModal.find('.modal-body').html(template);
            me.updateTopicModal.find('.pill-container').html(_.template($('#TagsListView').html(), {
                tags : me.activeTopic.tags
            }));
            me.updateTopicModal.find('.pillbox').pillbox({
                edit : true
            });
            me.updateTopicModal.find('.topic-tag-container .glyphicon-plus').click(function(){
                me.setTopicTag($(this));
            });
            me.updateTopicModal.find('.btn').removeClass('disabled');
            me.updateTopicModal.modal('show');
        },
        saveTopic: function(){
            var me = this;
            var btn = $('#mmx-topics-update-btn');
            var obj = utils.collect(me.updateTopicModal);
            utils.resetError(me.updateTopicModal);
            if(!me.validateTopicModal(me.updateTopicModal, obj, true))
                return;
            me.options.eventPubSub.trigger('btnLoading', btn);
            AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(me.activeTopic.topicName)+'/deleteTags', 'POST', 'application/json', {
                tags : me.activeTopic.tags
            }, function(res){
                if(obj.tags && obj.tags.length){
                    AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(me.activeTopic.topicName)+'/tags', 'POST', 'application/json', {
                        tags    : obj.tags
                    }, function(res){
                        me.saveTopicComplete(me);
                    }, function(xhr, status, thrownError){
                        alert('An error has occurred'+(xhr.responseText ? ': '+xhr.responseText : '.'));
                    }, [{
                        name : 'appAPIKey',
                        val  : me.model.attributes.appAPIKey
                    }]);
                }else{
                    me.options.eventPubSub.trigger('btnComplete', btn);
                    me.saveTopicComplete(me);
                }
            }, function(xhr, status, thrownError){
                alert('An error has occurred'+(xhr.responseText ? ': '+xhr.responseText : '.'));
                me.options.eventPubSub.trigger('btnComplete', btn);
            }, [{
                name : 'appAPIKey',
                val  : me.model.attributes.appAPIKey
            }], {
                btn : me.updateTopicBtn
            });

        },
        saveTopicComplete: function(me){
            utils.resetRows(me, me.list);
            me.list.repeater('render');
            me.updateTopicModal.modal('hide');
            Alerts.General.display({
                title   : 'Topic Updated',
                content : 'The topic "'+me.activeTopic.topicName+'" has been updated.'
            });
            delete me.activeTopic;
        },
        deleteTopic: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements[0].topicName;
            Alerts.Confirm.display({
                title   : 'Delete Topic',
                content : 'The selected topic will be deleted. This can not be undone. Are you sure you want to continue?'
            }, function(){
                AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(did), 'DELETE', 'application/json', null, function(res, status, xhr){
                    utils.removeByAttr(me.topics, 'topicName', did);
                    var list = $(e.currentTarget).closest('.repeater');
                    var dom = list.find('.repeater-list-items tr[did="'+did+'"]');
                    utils.resetRows(me, me.list);
                    dom.hide('slow', function(){
                        dom.remove();
                    });
                }, function(xhr, status, thrownError){
                    alert('An error has occurred'+(xhr.responseText ? ': '+xhr.responseText : '.'));
                }, [{
                    name : 'appAPIKey',
                    val  : me.model.attributes.appAPIKey
                }]);
            });
        },
        showPublishModal: function(e){
            var me = this;
            if(!me.selectedElements.length) return;
            var did = me.selectedElements[0].topicName;
            this.activeTopic = utils.getByAttr(this.topics, 'topicName', did)[0];
            this.modal.find('span.mmx-topic-name-placeholder').text(this.activeTopic.topicName);
            this.modal.find('textarea').val('');
            this.modal.modal('show');
        },
        publishTopic: function(){
            var me = this;
            var msg = this.modal.find('textarea');
            var form = me.modal.find('.modal-body');
            utils.resetError(form);
            if(!$.trim(msg.val()).length)
                return utils.showError(form, 'payload', 'You must enter a message to publish');
            AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(this.activeTopic.topicName)+'/publish', 'POST', 'application/json', {
                content     : msg.val(),
                messageType : 'normal',
                contentType : 'text'
            }, function(res, status, xhr){
                msg.val('');
                utils.showSuccess(form, 'payload', 'Your message has been sent!');
            }, function(xhr, status, thrownError){
                alert('An error has occurred'+(xhr.responseText ? ': '+xhr.responseText : '.'));
            }, [{
                name : 'appAPIKey',
                val  : me.model.attributes.appAPIKey
            }]);
        },
        setTopicTag: function(btn){
            var input = btn.closest('.same-line').find('input');
            var name = $.trim(input.val());
            if(name.length){
                var pillbox = btn.closest('.topic-tag-container').find('.pillbox');
                pillbox.pillbox('addItems', -1, [{
                    text  : name,
                    value : name
                }]);
                input.val('');
            }
        }
    });
    return View;
});