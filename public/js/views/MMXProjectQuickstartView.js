define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-quickstart',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectquickstart', function(model){
                me.setElement('#mmx-quickstart');
                me.model = model;
                me.render();
            });
        },
        events : {
            'click .download-compiled-source': 'downloadCompiledSource'
        },
        render: function(){
            this.$el.html(_.template($('#MessagingQuickstartTmpl').html(), {
                model : this.model
            }));
        },
        downloadCompiledSource: function(e){
            e.preventDefault();
            var ifId = 'fileDownload';
            var iframe = document.getElementById(ifId);
            if(iframe === null){
                iframe = document.createElement('iframe');
                iframe.id = ifId;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = GLOBAL.baseUrl+'/rest/mmx/apps/'+this.model.attributes.id+'/sample?platform=android';
        }
    });
    return View;
});