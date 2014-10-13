define(['jquery', 'backbone'], function($, Backbone){
    var View = Backbone.View.extend({
        el: "body",
        initialize: function(options){
            var me = this;
            me.options = options;
            me.options.eventPubSub.bind("btnLoading", function(btn){
                btn.attr('txt', btn.html()).html('Loading..').addClass('disabled');
            });
            me.options.eventPubSub.bind("btnComplete", function(btn){
                btn.html(btn.attr('txt')).removeClass('disabled');
            });
            options.eventPubSub.bind("resetGlobalPages", function(domId){
                me.resetMainView(domId);
            });
            options.eventPubSub.bind("resetPages", function(tabName){
                me.resetSubView(tabName);
            });
            $('#user-nav-popover').popover({
                placement : 'bottom',
                template  : '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div><h3 class="popover-title"></h3></div>',
                html      : true
            });
        },
        events: {
            'click .goBack': 'goBack',
            'click #logout-btn': 'logout',
            'click .repeater-list-items td .glyphicon-plus': 'toggleRow',
            'click .repeater-list-items td .glyphicon-minus': 'toggleRow',
            'click #mmx-sendmessage-btn': 'sendMMXMessage'
        },
        goBack: function(e){
            e.preventDefault();
            window.history.back();
        },
        logout: function(){
            Cookie.remove('magnet_auth');
            $('#user-nav').addClass('hidden');
            $('#user-nav-popover').attr('data-content', '');
            AJAX('/logout', 'POST', 'application/json', null, function(){
                Backbone.history.navigate('#/login');
            }, function(e){
                Backbone.history.navigate('#/login');
            });
        },
        resetMainView: function(domId){
            $('.app-view').hide();
            $('#'+domId).show();
        },
        resetSubView: function(tabName){
            $('#main-nav-menu li').removeClass('active');
            $('#main-nav-menu li a[href="#/'+tabName+'"]').closest('li').addClass('active');
            this.handleView(tabName);
        },
        handleView: function(view){
            var list = this.$el.find('.project-menu');
            list.find('li').removeClass('active');
            list.find('li a[href$="/'+view+'"]').closest('li').addClass('active');
            var section = this.$el.find('.main-section');
            section.find('.tab-content > .tab-pane').removeClass('active');
            section.find('#project-'+view+'-tab').addClass('active');
        },
        selectPage: function(page, view){
            $('#user-panel').slideUp('fast');
            var pages = $(view || '.page-view');
            pages.addClass('hidden');
            if(page){
                $('#'+page).removeClass('hidden');
            }
        },
        toggleRow: function(e){
            var tog = $(e.currentTarget);
            var row = tog.closest('tr');
            var parent = row.closest('tbody');
            var did = row.attr('did');
            if(tog.hasClass('glyphicon-minus')){
                tog.removeClass('glyphicon-minus').addClass('glyphicon-plus');
                parent.find('tr[did="el'+did+'"]').remove();
            }else{
                parent.find('.glyphicon-minus').removeClass('glyphicon-minus').addClass('glyphicon-plus');
                parent.find('tr[did^="el"]').remove();
                tog.removeClass('glyphicon-plus').addClass('glyphicon-minus');
            }
            this.options.eventPubSub.trigger('toggleRow', {
                table : tog.closest('.repeater'),
                tog   : tog,
                did   : did,
                state : tog.hasClass('glyphicon-minus')
            });
        },
        sendMMXMessage: function(e){
            this.options.eventPubSub.trigger('sendMMXMessage');
        }
    });
    return View;
});