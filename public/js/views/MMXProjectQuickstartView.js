define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-quickstart',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectquickstart', function(model, apps){
                console.log(apps);
                me.model = model;
                me.render();
            });
        },
        events : {
            'click .download-compiled-source': 'downloadCompiledSource'
        },
        render: function(){
            this.$el.html(_.template($('#MessagingQuickstartTmpl').html(), {
                isFirstApp : (this.options.opts && this.options.opts.appCount < 2)
            }));
        },
        downloadCompiledSource: function(){
            alert('is feature is not available yet');
        }
    });
    return View;
});