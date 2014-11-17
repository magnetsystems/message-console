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
            options.eventPubSub.bind('updateBreadcrumb', function(params){
                me.updateBreadcrumb(params);
            });
            options.eventPubSub.bind('hideCollapsibleMenu', function(){
                $('#toggle-collapsible-menu').hide();
                me.hideCollapseMenu();
            });
            options.eventPubSub.bind('showCollapsibleMenu', function(){
                if($(window).width() < 786) return;
                $('#toggle-collapsible-menu').show();
                $('#collapsible-menu-list').show();
                me.showCollapseMenu();
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
            'click #toggle-collapsible-menu': 'toggleCollapseMenu',
            'click .repeater-list-items td .glyphicon-plus': 'toggleRow',
            'click .repeater-list-items td .glyphicon-minus': 'toggleRow',
            'click .radio.disabled': 'doNothing',
            'click .mmx-nav a': 'selectMMXView'
        },
        goBack: function(e){
            e.preventDefault();
            window.history.back();
        },
        doNothing: function(e){
            return e.preventDefault();
        },
        logout: function(){
            Cookie.remove('magnet_auth');
            $('#user-nav').addClass('hidden');
            $('#user-nav-popover').attr('data-content', '');
            AJAX('/rest/logout', 'POST', 'application/json', null, function(){
                Backbone.history.navigate('#/login');
            }, function(e){
                Backbone.history.navigate('#/login');
            });
        },
        toggleCollapseMenu: function(){
            var btn = $('#toggle-collapsible-menu');
            if(btn.hasClass('fa-arrow-circle-o-left')){
                this.hideCollapseMenu();
            }else{
                this.showCollapseMenu();
            }
        },
        hideCollapseMenu: function(params){
            var btn = $('#toggle-collapsible-menu');
            $('#collapsible-menu-list a').hide('fast');
            $('#collapsible-menu-list').animate({
                width  : '1px'
            }, 500, function(){
                btn.removeClass('fa-arrow-circle-o-left').addClass('fa-arrow-circle-o-right');
            });
        },
        showCollapseMenu: function(){
            if($(window).width() < 786) return;
            var btn = $('#toggle-collapsible-menu');
            $('#collapsible-menu-list').animate({
                width  : '200px'
            }, 500, function(){
                $('#collapsible-menu-list a').show('fast');
                btn.removeClass('fa-arrow-circle-o-right').addClass('fa-arrow-circle-o-left');
            });
        },
        resetMainView: function(domId){
            $('.app-view').hide();
            $('#'+domId).show();
        },
        resetSubView: function(tabName){
            $('#main-nav-menu li').removeClass('active');
            $('#collapsible-menu-list a').removeClass('active');
            $('#main-nav-menu li a[href="#/'+tabName+'"]').closest('li').addClass('active');
            var vertical = $('#collapsible-menu-list a[href="#/'+tabName+'"]');
            vertical.addClass('active');
            this.updateBreadcrumb({
                title : vertical.text()
            });
            this.handleView(tabName);
        },
        updateBreadcrumb: function(params){
            params = params || {};
            if(typeof params.title !== 'undefined')
                $('#breadcrumb .bc-title').html(params.title+' <span></span>');
            if(params.sub)
                $('#breadcrumb .bc-title span').html(params.sub);
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
        selectMMXView: function(e){
            e.preventDefault();
            var link = $(e.currentTarget);
            var view = link.attr('href');
            this.options.eventPubSub.trigger('initMMXProject', {
                view : view.slice(1)
            });
        }
    });
    return View;
});