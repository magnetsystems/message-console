define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: '#mmx-quickstart',
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind('initMMXProjectquickstart', function(model){
                me.options.eventPubSub.trigger('updateBreadcrumb', {
                    title : 'Getting Started with '+model.attributes.name
                });
                me.model = model;
                me.sampleId = model.attributes.name;
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
            'click .nav-tabs li a': 'togglePlatformResources',
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
                appName : this.sampleId,
                status  : this.options.opts.serverStatus,
                version : GLOBAL.version
            }));
        },
        togglePlatformResources: function(e){
            var link = $(e.currentTarget).attr('href');
            console.log(link);
            if(link.indexOf('android') != -1){
                this.$el.find('.android-resource').removeClass('hidden');
                this.$el.find('.ios-resource').addClass('hidden');
            }else{
                this.$el.find('.android-resource').addClass('hidden');
                this.$el.find('.ios-resource').removeClass('hidden');
            }
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