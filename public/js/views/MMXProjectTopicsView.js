define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-topics-tab',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectTopics', function(model){
                me.model = model;
                $('#mmx-new-topic-input').val('');
                me.getTopics(function(){
                    me.render();
                });
                me.modal = $('#mmx-publishtopic-modal');
                $('#mmx-publishtopic-btn').click(function(){
                    me.publishTopic();
                });
            });
        },
        events : {
            'click #mmx-new-topic-btn': 'createTopic',
            'click #mmx-topic-list table tbody td .topic-delete-btn': 'deleteTopic',
            'click #mmx-topic-list table tbody td .topic-publish-btn': 'showPublishModal'
        },
        getTopics: function(cb){
            var me = this;
            AJAX('apps/'+me.model.attributes.id+'/topics', 'GET', 'application/json', null, function(res, status, xhr){
                me.topics = res;
                cb();
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        render: function(){
            this.$el.find('#mmx-topic-list').html(_.template($('#MessagingTopicsListView').html(), {
                col : this.topics
            }));
        },
        createTopic: function(){
            var me = this;
            var input = $('#mmx-new-topic-input');
            AJAX('apps/'+me.model.attributes.id+'/topics', 'POST', 'application/json', {
                name : input.val()
            }, function(res, status, xhr){
                input.val('');
                me.topics.push(res);
                me.render();
            }, function(xhr, status, thrownError){
                alert(xhr.responseText);
            });
        },
        deleteTopic: function(e){
            var me = this;
            Alerts.Confirm.display({
                title   : 'Confirm Topic Deletion',
                content : 'Please verify that you wish to delete this topic.'
            }, function(){
                var row = $(e.currentTarget).closest('tr');
                AJAX('apps/'+me.model.attributes.id+'/topics/'+encodeURIComponent(row.attr('did')), 'DELETE', 'application/json', null, function(res, status, xhr){
                    utils.removeByAttr(me.topics, 'id', row.attr('did'));
                    row.hide('slow', function(){
                        row.remove();
                    });
                }, function(xhr, status, thrownError){
                    alert(xhr.responseText);
                });
            });
        },
        showPublishModal: function(e){
            var tid = $(e.currentTarget).closest('tr').attr('did');
            this.activeTopic = utils.getByAttr(this.topics, 'id', tid);
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