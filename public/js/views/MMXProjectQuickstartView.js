define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-quickstart',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectquickstart', function(model){
                me.model = model;
                me.render();
            });
        },
        events : {
            'click .download-compiled-source': 'downloadCompiledSource',
            'click .nav-tabs li a': 'stopTour'

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
            iframe.src = GLOBAL.baseUrl+'/rest/apps/'+this.model.attributes.id+'/sample?platform=android';
        },
        stopTour: function(){
            $('.tour').remove();
            if(this.options.opts.tour)
                this.options.opts.tour.end();
        }
    });
    return View;
});