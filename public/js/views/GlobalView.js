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
            options.eventPubSub.bind('setHeaderNavigation', function(params){
                me.setHeaderNavigation(params);
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
            options.eventPubSub.bind('getUserProfile', function(callback){
                me.getProfile(callback);
            });
            $('#user-identity').popover({
                placement : 'bottom',
                template  : '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div><h3 class="popover-title"></h3></div>',
                html      : true
            });
            $('#page-select').popover({
                placement : 'bottom',
                template  : '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div><h3 class="popover-title"></h3></div>',
                html      : true
            });
            me.bindFeedbackButton();
        },
        events: {
            'click .goBack': 'goBack',
            'click #logout-btn': 'logout',
            'click #toggle-collapsible-menu': 'toggleCollapseMenu',
            'click .repeater-list-items td .glyphicon-plus': 'toggleRow',
            'click .repeater-list-items td .glyphicon-minus': 'toggleRow',
            'click .pillbox .glyphicon-trash': 'removePillItem',
            'click .radio.disabled': 'doNothing',
            'click .mmx-nav a': 'selectMMXView',
            'click #mmx-contextual-doc-btn': 'viewContextualDocs',
            'click .show-profile-btn': 'showProfile',
            'click .btn-toggle button': 'toggleSwitch',
            'click .toggling-password-input .glyphicon': 'togglePasswordContainer'
        },
        goBack: function(e){
            e.preventDefault();
            window.history.back();
        },
        doNothing: function(e){
            return e.preventDefault();
        },
        showProfile: function(e){
            e.preventDefault();
            this.options.eventPubSub.trigger('initProfile');
        },
        logout: function(e){
            e.preventDefault();
            this.options.eventPubSub.trigger('setHeaderNavigation');
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
            var link = $(e.currentTarget);
            var view = link.attr('href');
            if(view.indexOf('/docs/') != -1)
                return;
            else
                e.preventDefault();
            this.options.eventPubSub.trigger('initMMXProject', {
                view : view.slice(1)
            });
        },
        viewContextualDocs: function(e){
            e.preventDefault();
            var dom = $('#collapsible-menu-list > div > a.active');
            var activeView;
            if(dom.length){
                activeView = dom.attr('href').replace('#', '');
                switch(activeView){
                    case 'dashboard': window.open('/docs/latest/guide/messaging/The+Dashboard.html', '_blank'); break;
                    case 'endpoints': window.open('/docs/latest/guide/messaging/Send+Test+Messages+to+Users.html', '_blank'); break;
                    case 'messages': window.open('/docs/latest/guide/messaging/Message+Logs.html', '_blank'); break;
                    case 'topics': window.open('/docs/latest/guide/messaging/Topic+Management.html', '_blank'); break;
                    case 'quickstart': window.open('/docs/latest/guide/messaging/Establishing+Real-Time+Connection.html', '_blank'); break;
                    case 'settings': window.open('/docs/latest/guide/messaging/Set+Up+Mobile+Messaging.html', '_blank'); break;
                    default: window.open('/docs/latest/guide/messaging/index.html', '_blank');
                }
            }else{
                window.open('/docs/latest/guide/messaging/index.html', '_blank');
            }
        },
        bindFeedbackButton: function(){
            $('#leave-feedback-container').show();
            var div = $('#feedback-content');
            var complete = $('#feedback-complete');
            var error = $('#feedback-error');
            var btn = $('#feedback-btn');
            var submitBtn = $('#submit-feedback-btn');
            var loader = $('#feedback-content img');
            div.find('input, textarea').val('');
            var isActive = false;
            var closed = {
                height  : 0,
                width   : 0,
                padding : 0,
                opacity : 0
            };
            div.each(function(){
                $.data(this, 'baseHeight', $(this).height()+14);
                $.data(this, 'baseWidth', $(this).width());
                $('#leave-feedback-container').css('opacity', '1');
            }).css(closed);
            btn.click(function(e){
                e.preventDefault();
                if(btn.hasClass('active')){
                    btn.removeClass('active');
                    complete.hide('slow');
                    error.hide('slow');
                    div.animate(closed, 600);
                }else{
                    setTimeout(function(){
                        btn.addClass('active');
                        complete.hide('slow');
                        error.hide('slow');
                        div.animate({
                            height  : div.data('baseHeight') + 20,
                            width   : div.data('baseWidth'),
                            padding : '10px',
                            opacity : 1
                        }, 600);
                    }, 100);
                }
            });
            $('html').click(function(e){
                if(btn.hasClass('active')){
                    btn.removeClass('active');
                    complete.hide('slow');
                    error.hide('slow');
                    div.animate(closed, 600);
                }
            });
            $('#leave-feedback-container').click(function(e){
                e.stopPropagation();
            });
            submitBtn.click(function(e){
                e.stopPropagation();
                e.preventDefault();
                var type = $('#feedback-type-field');
                var name = $('#feedback-name');
                var sub = $('#feedback-subject');
                var msg = $('#feedback-message');
                var email = $('#feedback-email');
                if(isActive === false){
                    if($.trim(name.val()).length > 0 && $.trim(sub.val()).length > 0 && $.trim(msg.val()).length > 0 && $.trim(email.val()).length > 0){
                        isActive = true;
                        submitBtn.hide();
                        loader.show();
                        $.ajax({
                            type        : 'POST',
                            url         : GLOBAL.baseUrl+'/rest/submitFeedback',
                            data        : {
                                fullname     : name.val(),
                                type         : type.val(),
                                msg          : msg.val(),
                                sub          : sub.val(),
                                emailaddress : email.val()
                            },
                            contentType : 'application/x-www-form-urlencoded'
                        }).done(function(){
                            complete.show('slow');
                            name.val('');
                            msg.val('');
                            sub.val('');
                            email.val('');
                        }).fail(function(){
                            error.show('slow');
                        }).always(function(){
                            isActive = false;
                            div.css(closed);
                            submitBtn.show();
                            loader.hide();
                        });
                    }else{
                        alert('Please fill in all of the fields.');
                    }
                }
            });
        },
        toggleSwitch: function(e){
            var tog = $(e.currentTarget).parent();
            if(tog.find('.btn').hasClass('disabled')){
                return;
            }
            tog.find('.btn').toggleClass('active');
            if(tog.find('.btn-primary').size()>0)
                tog.find('.btn').toggleClass('btn-primary');
            if(tog.find('.btn-danger').size()>0)
                tog.find('.btn').toggleClass('btn-danger');
            if(tog.find('.btn-success').size()>0)
                tog.find('.btn').toggleClass('btn-success');
            if(tog.find('.btn-info').size()>0)
                tog.find('.btn').toggleClass('btn-info');
            tog.find('.btn').toggleClass('btn-default');
        },
        getProfile: function(cb){
            var me = this;
            AJAX('profile', 'GET', 'application/x-www-form-urlencoded', null, function(res, status, xhr){
                me.options.eventPubSub.trigger('setHeaderNavigation', res);
                cb();
            }, function(xhr, status, thrownError){
                me.options.eventPubSub.trigger('setHeaderNavigation');
                Backbone.history.navigate('#/login');
            });
        },
        setHeaderNavigation: function(params){
            var userIdentityDom = $('#user-identity');
            var userNav = $('#user-navigation');
            if(params){
                if(params.userType != 'admin'){
                    userNav.find('.admin-only-item').hide();
                }else{
                    userNav.find('.admin-only-item').show();
                }
                userNav.show('fast');
                $('#user-identity');
                $('#page-select');
            }else{
                userNav.hide();
                $('#user-identity').popover('hide');
                $('#page-select').popover('hide');
            }
            params = params || {};
            userIdentityDom.find('.placeholder-username').text(params.email || '');
            userIdentityDom.find('.placeholder-role').text(params.userType || '');
        },
        removePillItem: function(e){
            $(e.currentTarget).closest('.pill').remove();
        },
        togglePasswordContainer: function(e){
            var icon = $(e.currentTarget);
            var parent = icon.closest('.toggling-password-input');
            icon.addClass('hidden');
            if(icon.hasClass('glyphicon-eye-open')){
                parent.find('.glyphicon-eye-close').removeClass('hidden');
                parent.find('input').attr('type', 'text');
            }else{
                parent.find('.glyphicon-eye-open').removeClass('hidden');
                parent.find('input').attr('type', 'password');
            }
        }
    });
    return View;
});