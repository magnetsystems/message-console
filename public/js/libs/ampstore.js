/*!
 * Amplify Store - Persistent Client-Side Storage 1.1.0
 * 
 * Copyright 2011 appendTo LLC. (http://appendto.com/team)
 * Dual licensed under the MIT or GPL licenses.
 * http://appendto.com/open-source-licenses
 * 
 * http://amplifyjs.com
 */
(function(m,j){function l(b,c){e.addType(b,function(a,d,k){var f,g=d,i=(new Date).getTime();if(!a){g={};k=[];d=0;try{for(a=c.length;a=c.key(d++);)n.test(a)&&(f=JSON.parse(c.getItem(a)),f.expires&&f.expires<=i?k.push(a):g[a.replace(n,"")]=f.data);for(;a=k.pop();)c.removeItem(a)}catch(h){}return g}a="__amplify__"+a;if(d===j)if(f=(f=c.getItem(a))?JSON.parse(f):{expires:-1},f.expires&&f.expires<=i)c.removeItem(a);else return f.data;else if(null===d)c.removeItem(a);else{f=JSON.stringify({data:d,expires:k.expires? i+k.expires:null});try{c.setItem(a,f)}catch(l){e[b]();try{c.setItem(a,f)}catch(m){throw e.error();}}}return g})}var e=m.store=function(b,c,a,d){d=e.type;a&&(a.type&&a.type in e.types)&&(d=a.type);return e.types[d](b,c,a||{})};e.types={};e.type=null;e.addType=function(b,c){e.type||(e.type=b);e.types[b]=c;e[b]=function(a,d,c){c=c||{};c.type=b;return e(a,d,c)}};e.error=function(){return"amplify.store quota exceeded"};var n=/^__amplify__/,h;for(h in{localStorage:1,sessionStorage:1})try{window[h].getItem&& l(h,window[h])}catch(o){}if(window.globalStorage)try{l("globalStorage",window.globalStorage[window.location.hostname]),"sessionStorage"===e.type&&(e.type="globalStorage")}catch(p){}(function(){if(!e.types.localStorage){var b=document.createElement("div");b.style.display="none";document.getElementsByTagName("head")[0].appendChild(b);try{b.addBehavior("#default#userdata"),b.load("amplify")}catch(c){b.parentNode.removeChild(b);return}e.addType("userData",function(a,d,c){b.load("amplify");var f,g,i=d, h=(new Date).getTime();if(!a){i={};g=[];for(a=0;d=b.XMLDocument.documentElement.attributes[a++];)f=JSON.parse(d.value),f.expires&&f.expires<=h?g.push(d.name):i[d.name]=f.data;for(;a=g.pop();)b.removeAttribute(a);b.save("amplify");return i}a=a.replace(/[^-._0-9A-Za-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u37f-\u1fff\u200c-\u200d\u203f\u2040\u2070-\u218f]/g,"-");if(d===j)if(f=(d=b.getAttribute(a))?JSON.parse(d):{expires:-1},f.expires&&f.expires<=h)b.removeAttribute(a);else return f.data;else null===d?b.removeAttribute(a): (g=b.getAttribute(a),f=JSON.stringify({data:d,expires:c.expires?h+c.expires:null}),b.setAttribute(a,f));try{b.save("amplify")}catch(l){null===g?b.removeAttribute(a):b.setAttribute(a,g);e.userData();try{b.setAttribute(a,f),b.save("amplify")}catch(m){throw null===g?b.removeAttribute(a):b.setAttribute(a,g),e.error();}}return i})}})();(function(){var b={},c={};e.addType("memory",function(a,d,e){if(!a)return b===j?j:JSON.parse(JSON.stringify(b));if(d===j)return b[a]===j?j:JSON.parse(JSON.stringify(b[a])); c[a]&&(clearTimeout(c[a]),delete c[a]);if(null===d)return delete b[a],null;b[a]=d;e.expires&&(c[a]=setTimeout(function(){delete b[a];delete c[a]},e.expires));return d})})()})(this.amplify=this.amplify||{});
