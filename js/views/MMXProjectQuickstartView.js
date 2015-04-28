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
            'click .nav-tabs li a': 'stopTour',
            'click .centered .btn' : 'selectQuickstartView'

        },
        selectQuickstartView : function(e){
            var me = this;
            setTimeout(function(){
                var control = $(e.currentTarget).closest('.centered');
                var selections = utils.collect(control);
                me.$el.find('.tab-pane').removeClass('active');
                me.$el.find('#mmx-quickstart-'+selections.platform+'-'+selections.type).addClass('active');
            }, 50);
        },
        render: function(){
            this.$el.html(_.template($('#MessagingQuickstartTmpl').html(), {
                model : this.model
            }));
        },
        downloadCompiledSource: function(e){
            e.preventDefault();
            var platformType = $(e.currentTarget).attr('did');
            var ifId = 'fileDownload';
            var iframe = document.getElementById(ifId);
            if(iframe === null){
                iframe = document.createElement('iframe');
                iframe.id = ifId;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = GLOBAL.baseUrl+'/rest/apps/'+this.model.attributes.id+'/sample?platform='+platformType;
        },
        stopTour: function(){
            $('.tour').remove();
            if(this.options.opts.tour)
                this.options.opts.tour.end();
        }
    });
    return View;
});