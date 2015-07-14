define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-quickstart',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectquickstart', function(model){
                me.options.eventPubSub.trigger('updateBreadcrumb', {
                    title : 'Getting Started with '+(['Quickstart', 'RPSLS', 'Soapbox'].indexOf(model.attributes.name) != -1 ? model.attributes.name : 'Quickstart')
                });
                me.model = model;
                if(['quickstart', 'rpsls', 'soapbox'].indexOf(model.attributes.name.toLowerCase()) != -1)
                    me.sampleId = model.attributes.name;
                else
                    me.sampleId = 'Quickstart';
                me.render();
                if(me.options.opts.newMMXUser === true){
                    me.options.opts.newMMXUser = false;
                    me.options.opts.tour = MMXFirstTimeUserTour(model.attributes.appId);
                }
            });
        },
        events : {
            'click .download-compiled-source': 'downloadCompiledSource',
            //'click .nav-tabs li a': 'stopTour',
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
                model   : this.model,
                appName : this.sampleId
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
            iframe.src = GLOBAL.baseUrl+'apps/'+this.model.attributes.id+'/sample?platform='+platformType+'&sampleId='+this.sampleId.toLowerCase();
        },
        stopTour: function(){
            $('.tour').remove();
            if(this.options.opts.tour)
                this.options.opts.tour.end();
        }
    });
    return View;
});