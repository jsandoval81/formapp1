/*
 * Purl (A JavaScript URL parser) v2.3.1
 * Developed and maintanined by Mark Perkins, mark@allmarkedup.com
 * Source repository: https://github.com/allmarkedup/jQuery-URL-Parser
 * Licensed under an MIT-style license. See https://github.com/allmarkedup/jQuery-URL-Parser/blob/master/LICENSE for details.
 */

;(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        window.purl = factory();
    }
})(function() {

    var tag2attr = {
            a       : 'href',
            img     : 'src',
            form    : 'action',
            base    : 'href',
            script  : 'src',
            iframe  : 'src',
            link    : 'href',
            embed   : 'src',
            object  : 'data'
        },

        key = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'], // keys available to query

        aliases = { 'anchor' : 'fragment' }, // aliases for backwards compatability

        parser = {
            strict : /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,  //less intuitive, more accurate to the specs
            loose :  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
        },

        isint = /^[0-9]+$/;

    function parseUri( url, strictMode ) {
        var str = decodeURI( url ),
        res   = parser[ strictMode || false ? 'strict' : 'loose' ].exec( str ),
        uri = { attr : {}, param : {}, seg : {} },
        i   = 14;

        while ( i-- ) {
            uri.attr[ key[i] ] = res[i] || '';
        }

        // build query and fragment parameters
        uri.param['query'] = parseString(uri.attr['query']);
        uri.param['fragment'] = parseString(uri.attr['fragment']);

        // split path and fragement into segments
        uri.seg['path'] = uri.attr.path.replace(/^\/+|\/+$/g,'').split('/');
        uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g,'').split('/');

        // compile a 'base' domain attribute
        uri.attr['base'] = uri.attr.host ? (uri.attr.protocol ?  uri.attr.protocol+'://'+uri.attr.host : uri.attr.host) + (uri.attr.port ? ':'+uri.attr.port : '') : '';

        return uri;
    }

    function getAttrName( elm ) {
        var tn = elm.tagName;
        if ( typeof tn !== 'undefined' ) return tag2attr[tn.toLowerCase()];
        return tn;
    }

    function promote(parent, key) {
        if (parent[key].length === 0) return parent[key] = {};
        var t = {};
        for (var i in parent[key]) t[i] = parent[key][i];
        parent[key] = t;
        return t;
    }

    function parse(parts, parent, key, val) {
        var part = parts.shift();
        if (!part) {
            if (isArray(parent[key])) {
                parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
                parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
                parent[key] = val;
            } else {
                parent[key] = [parent[key], val];
            }
        } else {
            var obj = parent[key] = parent[key] || [];
            if (']' == part) {
                if (isArray(obj)) {
                    if ('' !== val) obj.push(val);
                } else if ('object' == typeof obj) {
                    obj[keys(obj).length] = val;
                } else {
                    obj = parent[key] = [parent[key], val];
                }
            } else if (~part.indexOf(']')) {
                part = part.substr(0, part.length - 1);
                if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                parse(parts, obj, part, val);
                // key
            } else {
                if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                parse(parts, obj, part, val);
            }
        }
    }

    function merge(parent, key, val) {
        if (~key.indexOf(']')) {
            var parts = key.split('[');
            parse(parts, parent, 'base', val);
        } else {
            if (!isint.test(key) && isArray(parent.base)) {
                var t = {};
                for (var k in parent.base) t[k] = parent.base[k];
                parent.base = t;
            }
            if (key !== '') {
                set(parent.base, key, val);
            }
        }
        return parent;
    }

    function parseString(str) {
        return reduce(String(str).split(/&|;/), function(ret, pair) {
            try {
                pair = decodeURIComponent(pair.replace(/\+/g, ' '));
            } catch(e) {
                // ignore
            }
            var eql = pair.indexOf('='),
                brace = lastBraceInKey(pair),
                key = pair.substr(0, brace || eql),
                val = pair.substr(brace || eql, pair.length);

            val = val.substr(val.indexOf('=') + 1, val.length);

            if (key === '') {
                key = pair;
                val = '';
            }

            return merge(ret, key, val);
        }, { base: {} }).base;
    }

    function set(obj, key, val) {
        var v = obj[key];
        if (typeof v === 'undefined') {
            obj[key] = val;
        } else if (isArray(v)) {
            v.push(val);
        } else {
            obj[key] = [v, val];
        }
    }

    function lastBraceInKey(str) {
        var len = str.length,
            brace,
            c;
        for (var i = 0; i < len; ++i) {
            c = str[i];
            if (']' == c) brace = false;
            if ('[' == c) brace = true;
            if ('=' == c && !brace) return i;
        }
    }

    function reduce(obj, accumulator){
        var i = 0,
            l = obj.length >> 0,
            curr = arguments[2];
        while (i < l) {
            if (i in obj) curr = accumulator.call(undefined, curr, obj[i], i, obj);
            ++i;
        }
        return curr;
    }

    function isArray(vArg) {
        return Object.prototype.toString.call(vArg) === "[object Array]";
    }

    function keys(obj) {
        var key_array = [];
        for ( var prop in obj ) {
            if ( obj.hasOwnProperty(prop) ) key_array.push(prop);
        }
        return key_array;
    }

    function purl( url, strictMode ) {
        if ( arguments.length === 1 && url === true ) {
            strictMode = true;
            url = undefined;
        }
        strictMode = strictMode || false;
        url = url || window.location.toString();

        return {

            data : parseUri(url, strictMode),

            // get various attributes from the URI
            attr : function( attr ) {
                attr = aliases[attr] || attr;
                return typeof attr !== 'undefined' ? this.data.attr[attr] : this.data.attr;
            },

            // return query string parameters
            param : function( param ) {
                return typeof param !== 'undefined' ? this.data.param.query[param] : this.data.param.query;
            },

            // return fragment parameters
            fparam : function( param ) {
                return typeof param !== 'undefined' ? this.data.param.fragment[param] : this.data.param.fragment;
            },

            // return path segments
            segment : function( seg ) {
                if ( typeof seg === 'undefined' ) {
                    return this.data.seg.path;
                } else {
                    seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end
                    return this.data.seg.path[seg];
                }
            },

            // return fragment segments
            fsegment : function( seg ) {
                if ( typeof seg === 'undefined' ) {
                    return this.data.seg.fragment;
                } else {
                    seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end
                    return this.data.seg.fragment[seg];
                }
            }

        };

    }
    
    purl.jQuery = function($){
        if ($ != null) {
            $.fn.url = function( strictMode ) {
                var url = '';
                if ( this.length ) {
                    url = $(this).attr( getAttrName(this[0]) ) || '';
                }
                return purl( url, strictMode );
            };

            $.url = purl;
        }
    };

    purl.jQuery(window.jQuery);

    return purl;

});

/*! 
jQuery.awesomeCloud v0.2 indyarmy.com
by Russ Porosky
IndyArmy Network, Inc.

Usage:
    $( "#myContainer" ).awesomeCloud( settings );

    Your container must contain words in the following format:
        <element data-weight="12">Word</element>
    The <element> can be any valid HTML element (for example, <span>), and
    the weight must be a decimal or integer contained in the "data-weight"
    attribute. The content of the <element> is the word that will be
    displayed. The original element is removed from the page (but not the DOM).

Settings:
    "size" {
        "grid" : 8, // word spacing; smaller is more tightly packed but takes longer
        "factor" : 0, // font resizing factor; default "0" means automatically fill the container
        "normalize" : true // reduces outlier weights for a more attractive output
    },
    "color" {
        "background" : "rgba(255,255,255,0)", // default is transparent
        "start" : "#20f", // color of the smallest font
        "end" : "#e00" // color of the largest font
    },
    "options" {
        "color" : "gradient", // if set to "random-light" or "random-dark", color.start and color.end are ignored
        "rotationRatio" : 0.3, // 0 is all horizontal words, 1 is all vertical words
        "printMultiplier" : 1 // 1 will look best on screen and is fastest; setting to 3.5 gives nice 300dpi printer output but takes longer
    },
    "font" : "Futura, Helvetica, sans-serif", // font family, identical to CSS font-family attribute
    "shape" : "circle", // one of "circle", "square", "diamond", "triangle", "triangle-forward", "x", "pentagon" or "star"; this can also be a function with the following prototype - function( theta ) {}

Notes:
    AwesomeCloud uses the HTML5 canvas element to create word clouds
    similar to http://wordle.net/. It may or may not work for you.

    If your words are all fairly evenly weighted and are large compared to
    the containing element, you may need to adjust the size.grid setting
    to make the output more attractive. Conversely, you can adjust the
    size.factor setting instead.

    It should be noted that the more words you have, the smaller the size.grid,
    and the larger the options.printMultiplier, the longer it will take to
    generate and display the word cloud.

Extra Thanks:
    Without Timothy Chien's work (https://github.com/timdream/wordcloud),
    this plugin would have taken much longer and been much uglier. Fate
    smiled and I found his version while I was searching out the equations
    I needed to make a circle-shaped cloud. I've simplified and, in places,
    dumbified his code for this plugin, and even outright copied chunks of
    it since those parts just worked far better than what I had originally
    written. Many thanks, Timothy, for saving some of my wits, sanity and
    hair over the past week.

    Thanks to http://www.websanova.com/tutorials/jquery/jquery-plugin-development-boilerplate
    for providing a great boilerplate I could use for my first jQuery plugin.
    My original layout worked, but this one was much better.
 */
(function(e){"use strict";function r(e,t){this.bctx=null;this.bgPixel=null;this.ctx=null;this.diffChannel=null;this.container=t;this.grid=[];this.ngx=null;this.ngy=null;this.settings=e;this.size=null;this.words=[];this.linkTable=[];this.match=null;return this}var t="awesomeCloud",n={size:{grid:8,factor:0,normalize:true},color:{background:"rgba(255,255,255,0)",start:"#20f",end:"#e00"},options:{color:"gradient",rotationRatio:.3,printMultiplier:1,sort:"highest"},font:"Helvetica, Arial, sans-serif",shape:"circle"};e.fn.awesomeCloud=function(i,s){if(typeof i==="object"){s=i}else if(typeof i==="string"){var o=this.data("_"+t);if(o){if(n[i]!==undefined){if(s!==undefined){o.settings[i]=s;return true}else{return o.settings[i]}}else{return false}}else{return false}}s=e.extend(true,{},n,s||{});return this.each(function(){var n=e(this),i=jQuery.extend(true,{},s),o=new r(i,n);o.create();n.data("_"+t,o)})};r.prototype={create:function(){var n=this,r=0,i=null,s=0,o=0,u=t+"TempCheck",a=null,f=false,l=0,c=.1,h=0,p=0,d=0,v=0,m=null,g=null,y=null,b,w,E,S,x;this.settings.weightFactor=function(e){return e*n.settings.size.factor};this.settings.gridSize=Math.max(this.settings.size.grid,4)*this.settings.options.printMultiplier;this.settings.color.start=this.colorToRGBA(this.settings.color.start);this.settings.color.end=this.colorToRGBA(this.settings.color.end);this.settings.color.background=this.colorToRGBA(this.settings.color.background);this.settings.minSize=this.minimumFontSize();this.settings.ellipticity=1;switch(this.settings.shape){case"square":this.settings.shape=function(e){var t=(e+Math.PI/4)%(2*Math.PI/4);return 1/(Math.cos(t)+Math.sin(t))};break;case"diamond":this.settings.shape=function(e){var t=e%(2*Math.PI/4);return 1/(Math.cos(t)+Math.sin(t))};break;case"x":this.settings.shape=function(e){var t=e%(2*Math.PI/4);return 1/(Math.cos(t)+Math.sin(t)-2*Math.PI/4)};break;case"triangle":this.settings.shape=function(e){var t=(e+Math.PI*3/2)%(2*Math.PI/3);return 1/(Math.cos(t)+Math.sqrt(3)*Math.sin(t))};break;case"triangle-forward":this.settings.shape=function(e){var t=e%(2*Math.PI/3);return 1/(Math.cos(t)+Math.sqrt(3)*Math.sin(t))};break;case"pentagon":this.settings.shape=function(e){var t=(e+.955)%(2*Math.PI/5);return 1/(Math.cos(t)+.726543*Math.sin(t))};break;case"star":this.settings.shape=function(e){var t=(e+.955)%(2*Math.PI/10);if((e+.955)%(2*Math.PI/5)-2*Math.PI/10>=0){return 1/(Math.cos(2*Math.PI/10-t)+3.07768*Math.sin(2*Math.PI/10-t))}else{return 1/(Math.cos(t)+3.07768*Math.sin(t))}};break;case"circle":this.settings.shape=function(e){return 1};break;default:this.settings.shape=function(e){return 1};break}this.size={left:this.container.offset().left,top:this.container.offset().top,height:this.container.height()*this.settings.options.printMultiplier,width:this.container.width()*this.settings.options.printMultiplier,screenHeight:this.container.height(),screenWidth:this.container.width()};this.settings.ellipticity=this.size.height/this.size.width;if(this.settings.ellipticity>2){this.settings.ellipticity=2}if(this.settings.ellipticity<.2){this.settings.ellipticity=.2}this.settings.weight={lowest:null,highest:null,average:null};this.container.children().each(function(t,r){m=null;y=null;o=parseInt(e(this).attr("data-weight"),10);s+=o;if(!n.settings.weight.lowest){n.settings.weight.lowest=o}if(!n.settings.weight.highest){n.settings.weight.highest=o}if(o<n.settings.weight.lowest){n.settings.weight.lowest=o}if(o>n.settings.weight.highest){n.settings.weight.highest=o}n.settings.weight.average=s/(t+1);e(this).css("display","none");if(e(this).has("a").length===0){y=e(this).html()}else{var i=e(this).children(":first");m=i.attr("href");g=i.attr("target");y=i.html()}n.words.push([y,o,m,g])});this.settings.range=this.settings.weight.highest-this.settings.weight.lowest;if(this.settings.size.normalize===true){this.words.sort(function(e,t){return e[1]-t[1]});for(r=0;r<this.words.length;r++){if(a===null){a=this.words[r][1]}else{if(this.words[r][1]-a>this.settings.weight.average){this.words[r][1]-=(this.words[r][1]-a)/(this.settings.weight.average*.38)+a}}}}this.words.sort(function(e,t){if(n.settings.options.sort==="random"){return.5-Math.random()}else if(n.settings.options.sort==="lowest"){return e[1]-t[1]}else{return t[1]-e[1]}});if(this.settings.size.factor===parseInt(0,10)){this.settings.size.factor=1;i=t+"SizeTest";f=false;l=0;c=.1;h=0;p=0;d=0;v=0;b=Math.min(this.size.width,this.size.height);w=this.createCanvas({id:i,width:b,height:b,left:0,top:0});for(r=0;r<this.words.length;r++){w.font=this.settings.weightFactor(this.words[r][1])+"px "+this.settings.font;v=w.measureText(this.words[r][0]).width;if(v>h){h=v;p=this.words[r]}}while(!f){l=this.settings.weightFactor(p[1]);w.font=l.toString(10)+"px "+this.settings.font;v=w.measureText(p[0]).width;if(v>b*.95){this.settings.size.factor-=c}else if(v<b*.9){this.settings.size.factor+=c}else{f=true}d+=1;if(d>1e4){f=true}}this.destroyCanvas(i);this.settings.size.factor-=c}this.settings.color.increment={r:(this.settings.color.end.r-this.settings.color.start.r)/this.settings.range,g:(this.settings.color.end.g-this.settings.color.start.g)/this.settings.range,b:(this.settings.color.end.b-this.settings.color.start.b)/this.settings.range,a:(this.settings.color.end.a-this.settings.color.start.a)/this.settings.range};this.ngx=Math.floor(this.size.width/this.settings.gridSize);this.ngy=Math.floor(this.size.height/this.settings.gridSize);this.grid=[];i=t+this.container.attr("id");this.ctx=this.createCanvas({parent:this.container,id:i,width:this.size.width,height:this.size.height,left:"0px",top:"0px"});this.bctx=this.createCanvas({id:u,width:1,height:1,left:0,top:0});this.bctx.fillStyle=this.settings.color.background.rgba;this.bctx.clearRect(0,0,1,1);this.bctx.fillStyle=this.settings.color.background.rgba;this.bctx.fillRect(0,0,1,1);this.bgPixel=this.bctx.getImageData(0,0,1,1).data;if(typeof this.settings.options.color!=="function"&&this.settings.options.color.substr(0,6)!=="random"&&this.settings.options.color.substr(0,8)!=="gradient"){this.bctx.fillStyle=this.colorToRGBA(this.settings.options.color).rgba;this.bctx.fillRect(0,0,1,1);E=this.bctx.getImageData(0,0,1,1).data;r=4;while(r--){if(Math.abs(E[r]-this.bgPixel[r])>10){this.diffChannel=r;break}}}else{this.diffChannel=NaN}this.destroyCanvas(u);S=this.ngx;while(S--){this.grid[S]=[];x=this.ngy;while(x--){this.grid[S][x]=true}}this.ctx.fillStyle=this.settings.color.background.rgba;this.ctx.clearRect(0,0,this.ngx*(this.settings.gridSize+1),this.ngy*(this.settings.gridSize+1));this.ctx.fillRect(0,0,this.ngx*(this.settings.gridSize+1),this.ngy*(this.settings.gridSize+1));this.ctx.textBaseline="top";r=0;window.setImmediate(function T(){if(r>=n.words.length){return}n.putWord(n.words[r][0],n.words[r][1],n.words[r][2],n.words[r][3]);r+=1;window.setImmediate(T)});n.allDone(i);return true},allDone:function(t){var n=this,r=document.getElementById(t);e("#"+t).width(this.size.screenWidth);e("#"+t).height(this.size.screenHeight);e("#"+t).css("display","block");e("#"+t).css("visibility","visible");r.addEventListener("mousemove",function(t){var i=0,s=0;if(t.layerX||t.layerX===0){i=t.layerX;s=t.layerY}i-=r.offsetLeft;i+=e(r).position().left;i=Math.floor(i*n.settings.options.printMultiplier);s-=r.offsetTop;s+=e(r).position().top;s=Math.floor(s*n.settings.options.printMultiplier);n.match=null;for(var o=0,u=n.linkTable.length;o<u;o++){var a=n.linkTable[o];if(i>=a.x&&i<=a.x+a.width&&s>=a.y&&s<=a.y+a.height){n.match=a}}if(n.match!==null){document.body.style.cursor="pointer"}else{document.body.style.cursor=""}},false);r.addEventListener("click",function(e){if(n.match!==null){if(n.match.target){window.open(n.match.link,n.match.target)}else{window.location=n.match.link}}},false)},minimumFontSize:function(){var e=t+"FontTest",n=this.createCanvas({id:e,width:50,height:50,left:0,top:0}),r=20,i,s;while(r){n.font=r.toString(10)+"px sans-serif";if(n.measureText("Ｗ").width===i&&n.measureText("m").width===s){this.destroyCanvas(e);return(r+1)/2}i=n.measureText("Ｗ").width;s=n.measureText("m").width;r-=1}this.destroyCanvas(e);return 0},createCanvas:function(t){var n=t.id,r,i=e("body");if(t.parent!==undefined){i=t.parent}i.append('<canvas id="'+n+'" width="'+t.width+'" height="'+t.height+'">.</canvas>');e("#"+n).css("visibility","hidden");e("#"+n).css("display","none");e("#"+n).css("position","relative");e("#"+n).css("z-index",1e4);e("#"+n).width(t.width);e("#"+n).height(t.height);e("#"+n).offset({top:t.top,left:t.left});r=document.getElementById(n);r.setAttribute("width",t.width);r.setAttribute("height",t.height);return r.getContext("2d")},destroyCanvas:function(t){e("#"+t).remove()},putWord:function(e,n,r,i){var s=this,o=Math.random()<this.settings.options.rotationRatio,u=this.settings.weightFactor(n),a=null,f=null,l,c,h,p,d={},v,m,g,y,b,w,E,S,x,T,N,C,k,L,A;if(u<=this.settings.minSize){return false}this.ctx.font=u.toString(10)+"px "+this.settings.font;if(o){a=this.ctx.measureText(e).width;f=Math.max(u,this.ctx.measureText("m").width,this.ctx.measureText("Ｗ").width);if(/[Jgpqy]/.test(e)){f*=3/2}f+=Math.floor(u/6);a+=Math.floor(u/6)}else{f=this.ctx.measureText(e).width;a=Math.max(u,this.ctx.measureText("m").width,this.ctx.measureText("Ｗ").width);if(/[Jgpqy]/.test(e)){a*=3/2}a+=Math.floor(u/6);f+=Math.floor(u/6)}f=Math.ceil(f);a=Math.ceil(a);y=Math.ceil(f/this.settings.gridSize);b=Math.ceil(a/this.settings.gridSize);w=[this.ngx/2,this.ngy/2];E=Math.floor(Math.sqrt(this.ngx*this.ngx+this.ngy*this.ngy));S=this.ngx+this.ngy;x=E+1;while(x--){T=S;A=[];while(T--){N=this.settings.shape(T/S*2*Math.PI);A.push([Math.floor(w[0]+(E-x)*N*Math.cos(-T/S*2*Math.PI)-y/2),Math.floor(w[1]+(E-x)*N*this.settings.ellipticity*Math.sin(-T/S*2*Math.PI)-b/2),T/S*2*Math.PI])}if(A.shuffle().some(function(l){if(s.canFitText(l[0],l[1],y,b)){m=Math.floor(l[0]*s.settings.gridSize+(y*s.settings.gridSize-f)/2);g=Math.floor(l[1]*s.settings.gridSize+(b*s.settings.gridSize-a)/2);if(o){L=t+"Rotator";k=s.createCanvas({id:L,width:f,height:a,left:0,top:0});C=document.getElementById(L);k.fillStyle=s.settings.color.background.rgba;k.fillRect(0,0,f,a);k.fillStyle=s.wordcolor(e,n,u,E-x,l[2]);k.font=u.toString(10)+"px "+s.settings.font;k.textBaseline="top";if(o){k.translate(0,a);k.rotate(-Math.PI/2)}k.fillText(e,Math.floor(u/6),0);s.ctx.clearRect(m,g,f,a);s.ctx.drawImage(C,m,g,f,a);s.destroyCanvas(L)}else{v=u.toString(10)+"px "+s.settings.font;s.ctx.font=v;s.ctx.fillStyle=s.wordcolor(e,n,u,E-x,l[2]);s.ctx.fillText(e,m,g);a=s.getTextHeight(v).height;f=s.ctx.measureText(e).width}if(r!==null){s.linkTable.push({x:m,y:g,width:f,height:a,word:e,link:r,target:i})}s.updateGrid(l[0],l[1],y,b);return true}return false})){return true}}return false},canFitText:function(e,t,n,r){if(e<0||t<0||e+n>this.ngx||t+r>this.ngy){return false}var i=n,s;while(i--){s=r;while(s--){if(!this.grid[e+i][t+s]){return false}}}return true},wordcolor:function(e,t,n,r,i){var s=null;switch(this.settings.options.color){case"gradient":s="rgba("+Math.round(this.settings.color.start.r+this.settings.color.increment.r*(t-this.settings.weight.lowest))+","+Math.round(this.settings.color.start.g+this.settings.color.increment.g*(t-this.settings.weight.lowest))+","+Math.round(this.settings.color.start.b+this.settings.color.increment.b*(t-this.settings.weight.lowest))+","+Math.round(this.settings.color.start.a+this.settings.color.increment.a*(t-this.settings.weight.lowest))+")";break;case"random-dark":s="rgba("+Math.floor(Math.random()*128).toString(10)+","+Math.floor(Math.random()*128).toString(10)+","+Math.floor(Math.random()*128).toString(10)+",1)";break;case"random-light":s="rgba("+Math.floor(Math.random()*128+128).toString(10)+","+Math.floor(Math.random()*128+128).toString(10)+","+Math.floor(Math.random()*128+128).toString(10)+",1)";break;default:if(typeof this.settings.wordColor!=="function"){s="rgba(127,127,127,1)"}else{s=this.settings.wordColor(e,t,n,r,i)}break}return s},updateGrid:function(e,t,n,r,i){var s=n,o,u=this.ctx.getImageData(e*this.settings.gridSize,t*this.settings.gridSize,n*this.settings.gridSize,r*this.settings.gridSize);while(s--){o=r;while(o--){if(!this.isGridEmpty(u,s*this.settings.gridSize,o*this.settings.gridSize,n*this.settings.gridSize,r*this.settings.gridSize,i)){this.grid[e+s][t+o]=false}}}},isGridEmpty:function(e,t,n,r,i,s){var o=this.settings.gridSize,u,a;if(!isNaN(this.diffChannel)&&!s){while(o--){u=this.settings.gridSize;while(u--){if(this.getChannelData(e.data,t+o,n+u,r,i,this.diffChannel)!==this.bgPixel[this.diffChannel]){return false}}}}else{while(o--){u=this.settings.gridSize;while(u--){a=4;while(a--){if(this.getChannelData(e.data,t+o,n+u,r,i,a)!==this.bgPixel[a]){return false}}}}}return true},getChannelData:function(e,t,n,r,i,s){return e[(n*r+t)*4+s]},colorToRGBA:function(e){e=e.replace(/^\s*#|\s*$/g,"");if(e.length===3){e=e.replace(/(.)/g,"$1$1")}e=e.toLowerCase();var t={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dodgerblue:"1e90ff",feldspar:"d19275",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslateblue:"8470ff",lightslategray:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",violetred:"d02090",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32"},n=[{re:/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,example:["rgb(123, 234, 45)","rgb(255,234,245)"],process:function(e){return[parseInt(e[1],10),parseInt(e[2],10),parseInt(e[3],10),1]}},{re:/^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d+(?:\.\d+)?|\.\d+)\s*\)/,example:["rgb(123, 234, 45, 1)","rgb(255,234,245, 0.5)"],process:function(e){return[parseInt(e[1],10),parseInt(e[2],10),parseInt(e[3],10),parseFloat(e[4])]}},{re:/^(\w{2})(\w{2})(\w{2})$/,example:["#00ff00","336699"],process:function(e){return[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16),1]}},{re:/^(\w{1})(\w{1})(\w{1})$/,example:["#fb0","f0f"],process:function(e){return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16),1]}}],r,i,s,o,u,a,f,l,c,h;for(u in t){if(e===u){e=t[u]}}for(a=0;a<n.length;a++){f=n[a].re;l=n[a].process;c=f.exec(e);if(c){h=l(c);r=h[0];i=h[1];s=h[2];o=h[3]}}r=r<0||isNaN(r)?0:r>255?255:r;i=i<0||isNaN(i)?0:i>255?255:i;s=s<0||isNaN(s)?0:s>255?255:s;o=o<0||isNaN(o)?0:o>1?1:o;return{r:r,g:i,b:s,a:o,rgba:"rgba("+r+", "+i+", "+s+", "+o+")"}},getTextHeight:function(t){var n=e('<span style="font: '+t+'">Hg</span>'),r=e('<div style="display: inline-block; width: 1px; height: 0px;"></div>'),i=e("<div></div>"),s=e("body"),o={};i.append(n,r);s.append(i);try{o={};r.css({verticalAlign:"baseline"});o.ascent=r.offset().top-n.offset().top;r.css({verticalAlign:"bottom"});o.height=r.offset().top-n.offset().top;o.descent=o.height-o.ascent}finally{i.remove()}return o}}})(jQuery);Array.prototype.shuffle=function(){"use strict";for(var e,t,n=this.length;n;e=parseInt(Math.random()*n,10),t=this[--n],this[n]=this[e],this[e]=t);return this};if(!window.setImmediate){window.setImmediate=function(){"use strict";return window.msSetImmediate||window.webkitSetImmediate||window.mozSetImmediate||window.oSetImmediate||function(){if(window.postMessage&&window.addEventListener){var e=[],t=-1,n=-1,r="zero-timeout-message",i=function(t){e.push(t);window.postMessage(r,"*");return++n},s=function(n){if(n.data===r){n.stopPropagation();if(e.length>0){var i=e.shift();i();t+=1}}},o;window.addEventListener("message",s,true);window.clearImmediate=function(r){if(typeof r!=="number"||r>n){return}o=r-t-1;e[o]=function(){}};return i}}()||function(e){window.setTimeout(e,0)}}()}if(!window.clearImmediate){window.clearImmediate=function(){"use strict";return window.msClearImmediate||window.webkitClearImmediate||window.mozClearImmediate||window.oClearImmediate||function(e){window.clearTimeout(e)}}()}

/*
    A simple jQuery modal (http://github.com/kylefox/jquery-modal)
    Version 0.5.5
*/
!function(a){var b=null;a.modal=function(c,d){a.modal.close();var e,f;if(this.$body=a("body"),this.options=a.extend({},a.modal.defaults,d),this.options.doFade=!isNaN(parseInt(this.options.fadeDuration,10)),c.is("a"))if(f=c.attr("href"),/^#/.test(f)){if(this.$elm=a(f),1!==this.$elm.length)return null;this.open()}else this.$elm=a("<div>"),this.$body.append(this.$elm),e=function(a,b){b.elm.remove()},this.showSpinner(),c.trigger(a.modal.AJAX_SEND),a.get(f).done(function(d){b&&(c.trigger(a.modal.AJAX_SUCCESS),b.$elm.empty().append(d).on(a.modal.CLOSE,e),b.hideSpinner(),b.open(),c.trigger(a.modal.AJAX_COMPLETE))}).fail(function(){c.trigger(a.modal.AJAX_FAIL),b.hideSpinner(),c.trigger(a.modal.AJAX_COMPLETE)});else this.$elm=c,this.open()},a.modal.prototype={constructor:a.modal,open:function(){var b=this;this.options.doFade?(this.block(),setTimeout(function(){b.show()},this.options.fadeDuration*this.options.fadeDelay)):(this.block(),this.show()),this.options.escapeClose&&a(document).on("keydown.modal",function(b){27==b.which&&a.modal.close()}),this.options.clickClose&&this.blocker.click(a.modal.close)},close:function(){this.unblock(),this.hide(),a(document).off("keydown.modal")},block:function(){var b=this.options.doFade?0:this.options.opacity;this.$elm.trigger(a.modal.BEFORE_BLOCK,[this._ctx()]),this.blocker=a('<div class="jquery-modal blocker"></div>').css({top:0,right:0,bottom:0,left:0,width:"100%",height:"100%",position:"fixed",zIndex:this.options.zIndex,background:this.options.overlay,opacity:b}),this.$body.append(this.blocker),this.options.doFade&&this.blocker.animate({opacity:this.options.opacity},this.options.fadeDuration),this.$elm.trigger(a.modal.BLOCK,[this._ctx()])},unblock:function(){this.options.doFade?this.blocker.fadeOut(this.options.fadeDuration,function(){a(this).remove()}):this.blocker.remove()},show:function(){this.$elm.trigger(a.modal.BEFORE_OPEN,[this._ctx()]),this.options.showClose&&(this.closeButton=a('<a href="#close-modal" rel="modal:close" class="close-modal '+this.options.closeClass+'">'+this.options.closeText+"</a>"),this.$elm.append(this.closeButton)),this.$elm.addClass(this.options.modalClass+" current"),this.center(),this.options.doFade?this.$elm.fadeIn(this.options.fadeDuration):this.$elm.show(),this.$elm.trigger(a.modal.OPEN,[this._ctx()])},hide:function(){this.$elm.trigger(a.modal.BEFORE_CLOSE,[this._ctx()]),this.closeButton&&this.closeButton.remove(),this.$elm.removeClass("current"),this.options.doFade?this.$elm.fadeOut(this.options.fadeDuration):this.$elm.hide(),this.$elm.trigger(a.modal.CLOSE,[this._ctx()])},showSpinner:function(){this.options.showSpinner&&(this.spinner=this.spinner||a('<div class="'+this.options.modalClass+'-spinner"></div>').append(this.options.spinnerHtml),this.$body.append(this.spinner),this.spinner.show())},hideSpinner:function(){this.spinner&&this.spinner.remove()},center:function(){this.$elm.css({position:"fixed",top:"50%",left:"50%",marginTop:-(this.$elm.outerHeight()/2),marginLeft:-(this.$elm.outerWidth()/2),zIndex:this.options.zIndex+1})},_ctx:function(){return{elm:this.$elm,blocker:this.blocker,options:this.options}}},a.modal.prototype.resize=a.modal.prototype.center,a.modal.close=function(a){if(b){a&&a.preventDefault(),b.close();var c=b.$elm;return b=null,c}},a.modal.resize=function(){b&&b.resize()},a.modal.isActive=function(){return b?!0:!1},a.modal.defaults={overlay:"#000",opacity:.75,zIndex:1,escapeClose:!0,clickClose:!0,closeText:"Close",closeClass:"",modalClass:"modal",spinnerHtml:null,showSpinner:!0,showClose:!0,fadeDuration:null,fadeDelay:1},a.modal.BEFORE_BLOCK="modal:before-block",a.modal.BLOCK="modal:block",a.modal.BEFORE_OPEN="modal:before-open",a.modal.OPEN="modal:open",a.modal.BEFORE_CLOSE="modal:before-close",a.modal.CLOSE="modal:close",a.modal.AJAX_SEND="modal:ajax:send",a.modal.AJAX_SUCCESS="modal:ajax:success",a.modal.AJAX_FAIL="modal:ajax:fail",a.modal.AJAX_COMPLETE="modal:ajax:complete",a.fn.modal=function(c){return 1===this.length&&(b=new a.modal(this,c)),this},a(document).on("click.modal",'a[rel="modal:close"]',a.modal.close),a(document).on("click.modal",'a[rel="modal:open"]',function(b){b.preventDefault(),a(this).modal()})}(jQuery);


//== Extend the inArray() functionality to compare case-insensitive and compressed strings
(function($){
    $.extend({
        // Case insensative inArray
        inArrayIn: function(elem, arr, i){
            //== If not looking for string then use default method
            if (typeof elem !== 'string'){
                return $.inArray.apply(this, arguments);
            }
            //== Confirm array is populated
            if (arr){
                var len = arr.length;
                    i = i ? (i < 0 ? Math.max(0, len + i) : i) : 0;
                //== Prepare match value
                elem = elem.toLowerCase();
                elemNS = elem.replace(/ /g, '');
                //== Loop array
                for (; i < len; i++){
                    if (i in arr) {
                        //== Prepare array values
                        arrElem = arr[i].toLowerCase();
                        arrElemNS = arrElem.replace(/ /g, '');
                        //== Return index if match is found
                        if (elem == arrElem || elemNS == arrElemNS) {
                          return i;
                        }
                    }
                }
            }
            //== Stick with inArray/indexOf and return -1 on no match
            return -1;
        }
    });
})(jQuery);

/*
  jQuery Tags Input Plugin 1.3.3
  Copyright (c) 2011 XOXCO, Inc
  Documentation for this plugin lives here:
  http://xoxco.com/clickable/jquery-tags-input
  Licensed under the MIT license:
  http://www.opensource.org/licenses/mit-license.php
  ben@xoxco.com
*/

(function($) {

  var delimiter = new Array();
  var tags_callbacks = new Array();
  $.fn.doAutosize = function(o){
      var minWidth = $(this).data('minwidth'),
          maxWidth = $(this).data('maxwidth'),
          val = '',
          input = $(this),
          testSubject = $('#'+$(this).data('tester_id'));

      if (val === (val = input.val())) {return;}

      // Enter new content into testSubject
      var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      testSubject.html(escaped);
      // Calculate new width + whether to change
      var testerWidth = testSubject.width(),
          newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
          currentWidth = input.width(),
          isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                               || (newWidth > minWidth && newWidth < maxWidth);

      // Animate width
      if (isValidWidthChange) {
          input.width(newWidth);
      }


  };
  $.fn.resetAutosize = function(options){
    // alert(JSON.stringify(options));
    var minWidth =  $(this).data('minwidth') || options.minInputWidth || $(this).width(),
        maxWidth = $(this).data('maxwidth') || options.maxInputWidth || ($(this).closest('.tagsinput').width() - options.inputPadding),
        val = '',
        input = $(this),
        testSubject = $('<tester/>').css({
            position: 'absolute',
            top: -9999,
            left: -9999,
            width: 'auto',
            fontSize: input.css('fontSize'),
            fontFamily: input.css('fontFamily'),
            fontWeight: input.css('fontWeight'),
            letterSpacing: input.css('letterSpacing'),
            whiteSpace: 'nowrap'
        }),
        testerId = $(this).attr('id')+'_autosize_tester';
    if(! $('#'+testerId).length > 0){
      testSubject.attr('id', testerId);
      /*testSubject.appendTo('body');*/
    }

    input.data('minwidth', minWidth);
    input.data('maxwidth', maxWidth);
    input.data('tester_id', testerId);
    input.css('width', minWidth);
  };
  
  $.fn.addTag = function(value,options) {
      options = jQuery.extend({focus:false,callback:true},options);
      this.each(function() { 
        var id = $(this).attr('id');

        var tagslist = $(this).val().split(delimiter[id]);
        if (tagslist[0] == '') { 
          tagslist = new Array();
        }

        value = jQuery.trim(value);

        if (options.unique) {
          var skipTag = $(this).tagExist(value);
          if(skipTag == true) {
              //Marks fake input as not_valid to let styling it
                $('#'+id+'_tag').addClass('not_valid');
            }
        } else {
          var skipTag = false; 
        }

        if (value !='' && skipTag != true) { 
                    $('<span>').addClass('tag').append(
                        $('<span>').text(value).append('&nbsp;&nbsp;'),
                        $('<a>', {
                            href  : '#',
                            title : 'Removing tag',
                            text  : 'x'
                        }).click(function () {
                            return $('#' + id).removeTag(escape(value));
                        })
                    ).insertBefore('#' + id + '_addTag');

          tagslist.push(value);

          $('#'+id+'_tag').val('');
          if (options.focus) {
            $('#'+id+'_tag').focus();
          } else {    
            $('#'+id+'_tag').blur();
          }

          $.fn.tagsInput.updateTagsField(this,tagslist);

          if (options.callback && tags_callbacks[id] && tags_callbacks[id]['onAddTag']) {
            var f = tags_callbacks[id]['onAddTag'];
            f.call(this, value, id, "Add");
          }
          if(tags_callbacks[id] && tags_callbacks[id]['onChange'])
          {
            var i = tagslist.length;
            var f = tags_callbacks[id]['onChange'];
            f.call(this, $(this), tagslist[i-1]);
          }         
        }

      });   

      return false;
    };

  $.fn.removeTag = function(value) { 
      value = unescape(value);
      this.each(function() { 
        var id = $(this).attr('id');

        var old = $(this).val().split(delimiter[id]);

        $('#'+id+'_tagsinput .tag').remove();
        str = '';
        for (i=0; i< old.length; i++) { 
          if (old[i]!=value) { 
            str = str + delimiter[id] +old[i];
          }
        }

        $.fn.tagsInput.importTags(this,str);

        if (tags_callbacks[id] && tags_callbacks[id]['onRemoveTag']) {
          var f = tags_callbacks[id]['onRemoveTag'];
          f.call(this, value, id, "Remove");
        }
      });

      return false;
    };

  $.fn.tagExist = function(val) {
    var id = $(this).attr('id');
    var tagslist = $(this).val().split(delimiter[id]);
    return (jQuery.inArrayIn(val, tagslist) >= 0); //true when tag exists, false when not
  };

  // clear all existing tags and import new ones from a string
  $.fn.importTags = function(str) {
                id = $(this).attr('id');
    $('#'+id+'_tagsinput .tag').remove();
    $.fn.tagsInput.importTags(this,str);
  }

  $.fn.tagsInput = function(options) { 
    var settings = jQuery.extend({
      interactive:true,
      defaultText:'add a tag',
      minChars:0,
      width:'300px',
      height:'100px',
      autocomplete: {selectFirst: false },
      'hide':true,
      'delimiter':',',
      'unique':true,
      removeWithBackspace:true,
      placeholderColor:'#666666',
      autosize: true,
      comfortZone: 20,
      inputPadding: 6*2
    },options);

    this.each(function() { 
      if (settings.hide) { 
        $(this).hide();       
      }
      var id = $(this).attr('id');
      if (!id || delimiter[$(this).attr('id')]) {
        id = $(this).attr('id', 'tags' + new Date().getTime()).attr('id');
      }

      var data = jQuery.extend({
        pid:id,
        real_input: '#'+id,
        holder: '#'+id+'_tagsinput',
        input_wrapper: '#'+id+'_addTag',
        fake_input: '#'+id+'_tag'
      },settings);

      delimiter[id] = data.delimiter;

      if (settings.onAddTag || settings.onRemoveTag || settings.onChange) {
        tags_callbacks[id] = new Array();
        tags_callbacks[id]['onAddTag'] = settings.onAddTag;
        tags_callbacks[id]['onRemoveTag'] = settings.onRemoveTag;
        tags_callbacks[id]['onChange'] = settings.onChange;
      }

      var markup = '<div id="'+id+'_tagsinput" class="tagsinput"><div id="'+id+'_addTag">';

      if (settings.interactive) {
        markup = markup + '<input id="'+id+'_tag" value="" data-default="'+settings.defaultText+'" />';
      }

      markup = markup + '</div><div class="tags_clear"></div></div>';

      $(markup).insertAfter(this);

      $(data.holder).css('width',settings.width);
      $(data.holder).css('min-height',settings.height);
      $(data.holder).css('height','100%');

      if ($(data.real_input).val()!='') { 
        $.fn.tagsInput.importTags($(data.real_input),$(data.real_input).val());
      }   
      if (settings.interactive) { 
        $(data.fake_input).val($(data.fake_input).attr('data-default'));
        $(data.fake_input).css('color',settings.placeholderColor);
            $(data.fake_input).resetAutosize(settings);

        $(data.holder).bind('click',data,function(event) {
          $(event.data.fake_input).focus();
        });

        $(data.fake_input).bind('focus',data,function(event) {
          if ($(event.data.fake_input).val()==$(event.data.fake_input).attr('data-default')) { 
            $(event.data.fake_input).val('');
          }
          $(event.data.fake_input).css('color','#000000');    
        });

        if (settings.autocomplete_url != undefined) {
          autocomplete_options = {source: settings.autocomplete_url};
          for (attrname in settings.autocomplete) { 
            autocomplete_options[attrname] = settings.autocomplete[attrname]; 
          }

          if (jQuery.Autocompleter !== undefined) {
            $(data.fake_input).autocomplete(settings.autocomplete_url, settings.autocomplete);
            $(data.fake_input).bind('result',data,function(event,data,formatted) {
              if (data) {
                $('#'+id).addTag(data[0] + "",{focus:true,unique:(settings.unique)});
              }
              });
          } else if (jQuery.ui.autocomplete !== undefined) {
            $(data.fake_input).autocomplete(autocomplete_options);
            $(data.fake_input).bind('autocompleteselect',data,function(event,ui) {
              $(event.data.real_input).addTag(ui.item.value,{focus:true,unique:(settings.unique)});
              return false;
            });
          }


        } else {
            // if a user tabs out of the field, create a new tag
            // this is only available if autocomplete is not used.
            $(data.fake_input).bind('blur',data,function(event) { 
              var d = $(this).attr('data-default');
              if ($(event.data.fake_input).val()!='' && $(event.data.fake_input).val()!=d) { 
                if( (event.data.minChars <= $(event.data.fake_input).val().length) && (!event.data.maxChars || (event.data.maxChars >= $(event.data.fake_input).val().length)) )
                  $(event.data.real_input).addTag($(event.data.fake_input).val(),{focus:true,unique:(settings.unique)});
              } else {
                $(event.data.fake_input).val($(event.data.fake_input).attr('data-default'));
                $(event.data.fake_input).css('color',settings.placeholderColor);
              }
              return false;
            });

        }
        // if user types a comma, create a new tag
        $(data.fake_input).bind('keypress',data,function(event) {
          if (event.which==event.data.delimiter.charCodeAt(0) || event.which==13 ) {
              event.preventDefault();
            if( (event.data.minChars <= $(event.data.fake_input).val().length) && (!event.data.maxChars || (event.data.maxChars >= $(event.data.fake_input).val().length)) )
              $(event.data.real_input).addTag($(event.data.fake_input).val(),{focus:true,unique:(settings.unique)});
              $(event.data.fake_input).resetAutosize(settings);
            return false;
          } else if (event.data.autosize) {
                  $(event.data.fake_input).doAutosize(settings);
            
                }
        });
        //Delete last tag on backspace
        data.removeWithBackspace && $(data.fake_input).bind('keydown', function(event)
        {
          if(event.keyCode == 8 && $(this).val() == '')
          {
             event.preventDefault();
             var last_tag = $(this).closest('.tagsinput').find('.tag:last').text();
             var id = $(this).attr('id').replace(/_tag$/, '');
             last_tag = last_tag.replace(/[\s]+x$/, '');
             $('#' + id).removeTag(escape(last_tag));
             $(this).trigger('focus');
          }
        });
        $(data.fake_input).blur();

        //Removes the not_valid class when user changes the value of the fake input
        if(data.unique) {
            $(data.fake_input).keydown(function(event){
                if(event.keyCode == 8 || String.fromCharCode(event.which).match(/\w+|[áéíóúÁÉÍÓÚñÑ,/]+/)) {
                    $(this).removeClass('not_valid');
                }
            });
        }
      } // if settings.interactive
    });

    return this;

  };

  $.fn.tagsInput.updateTagsField = function(obj,tagslist) { 
    var id = $(obj).attr('id');
    $(obj).val(tagslist.join(delimiter[id]));
  };

  $.fn.tagsInput.importTags = function(obj,val) {     
    $(obj).val('');
    var id = $(obj).attr('id');
    var tags = val.split(delimiter[id]);
    for (i=0; i<tags.length; i++) { 
      $(obj).addTag(tags[i],{focus:false,callback:false});
    }
    if(tags_callbacks[id] && tags_callbacks[id]['onChange'])
    {
      var f = tags_callbacks[id]['onChange'];
      f.call(obj, obj, tags[i]);
    }
  };

})(jQuery);

(function ($) {
    "use strict";

    //========================
    //== FUNCTION VARIABLES ==
    //========================
    //== Store the parsable page URI
    var pageURL = $.url();

    //======================
    //== NAVIGATION MENUS ==
    //======================
    //== Highlight the top nav menu items
    $("#top-menu a").filter(function () {
        var thisURL = $(this).url();
        return thisURL.segment(2) === pageURL.segment(2);
    }).parent().addClass("active");

    //== Highlight the sub nav menu items
    $("#profile-menu a, #about-menu a").filter(function () {
        var thisURL = $(this).url();
        return thisURL.segment(3) === pageURL.segment(3);
    }).parent().addClass("active");

    //====================
    //== PROFILE VIEWER ==
    //====================
    //== Handle changes to profile filters
    $("#profile-filters-container select").change(function (e, data) {

        //== Set selected values
        var companyVal = $("#company-filter").val().trim(),
            teamVal    = $("#team-filter").val().trim();

        //== If Company and Team selections have been made send the data request
        if (companyVal && teamVal) {
            $.ajax({
                url:  "/ti/profiles/filter",
                type: "POST",
                data: {
                    "company":    companyVal,
                    "department": teamVal
                },
                success: function (data, textStatus, jqXHR) {
                    if (data.trim()) {
                        $("#profile-list").html(data);
                    } else {
                        $("#profile-list").html($("#invalid-filter-text").html());
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(errorThrown + ". Unable to return results");
                    location.reload(true);
                }
            });
        } else {
            $("#profile-list").html($("#initial-filter-text").html());
        }
    });

    //== Handle profile click
    $(document).on("touchstart click", ".profile-item", function (e) {
        $.ajax({
            url:  "/ti/profiles/detail",
            type: "POST",
            data: {
                "profileID": this.id
            },
            success: function (data, textStatus, jqXHR) {
                if (data.trim()) {
                    $("#modal-content").html(data);
                    $(".modal").modal({
                        fadeDuration: 250
                    });
                } else {
                    alert("Failed to grab profile detail");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });

    $(function () {
        //== Trigger selection on ready. It will automatically select the logged in values, or display instructional text
        $("#company-filter").trigger("change", [{ initial: true }]);
    });

    //====================
    //== SUMMARY REPORT ==
    //====================
    //== Handle changes to profile filters
    $("#summary-filters-container select").change(function (e, data) {

        //== Set selected values
        var companyVal = $("#company-filter").val().trim(),
            teamVal    = $("#team-filter").val().trim();

        //== If Company and Team selections have been made send the data request
        if (companyVal && teamVal) {
            $.ajax({
                url:  "/ti/summary/filter",
                type: "POST",
                data: {
                    "company":    companyVal,
                    "department": teamVal
                },
                success: function (data, textStatus, jqXHR) {
                    if (data.trim()) {
                        $("#summary-content").html(data);
                        var settings = {
                            "size": {
                                "grid": 8,
                                "normalize": false
                            },
                            "options": {
                                "color":          "random-dark",
                                "printMultiplier": 1,
                                "sort":           "highest"
                            },
                            "font":  "Futura, Helvetica, sans-serif",
                            "shape": "square"
                        };
                        $("#summary-wordcloud").awesomeCloud(settings);
                    } else {
                        $("#summary-content").html($("#invalid-filter-text").html());
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(errorThrown + ". Unable to return results");
                    location.reload(true);
                }
            });
        } else {
            $("#summary-content").html($("#initial-filter-text").html());
        }
    });

    //==================
    //== ABOUT (HELP) ==
    //==================
    //== Handle the activation of the accordion list
    function enableAccordion(container, headerTag, active, callback) {
        $(container).accordion({
            event:       "click",
            header:       headerTag,
            heightStyle: "content",
            collapsible:  true,
            active:       active,
            // Intercept the events to allow more than one pane to be open at a time
            beforeActivate: function (event, ui) {
                var currHeader,
                    currContent,
                    isPanelSelected;
                if (ui.newHeader[0]) {
                    currHeader  = ui.newHeader;
                    currContent = currHeader.next(".ui-accordion-content");
                } else {
                    currHeader  = ui.oldHeader;
                    currContent = currHeader.next(".ui-accordion-content");
                }
                isPanelSelected = currHeader.attr("aria-selected") === "true";

                currHeader.toggleClass("ui-corner-all", isPanelSelected).toggleClass("accordion-header-active ui-state-active ui-corner-top", !isPanelSelected).attr("aria-selected", ((!isPanelSelected).toString()));

                currHeader.children(".ui-icon").toggleClass("ui-icon-triangle-1-e", isPanelSelected).toggleClass("ui-icon-triangle-1-s", !isPanelSelected);

                currContent.toggleClass("accordion-content-active", !isPanelSelected);
                if (isPanelSelected) {
                    currContent.slideUp();
                } else {
                    currContent.slideDown();
                }

                return false;
            }
        });
        //== Execute the callback
        if (callback && typeof callback === "function") {
            callback();
        }
    }

    //== Enable to expandable accordion list
    $("#about-accordion-enable").on("touchstart click", function () {
        enableAccordion(".ui-accordion-top", "h3", false);
        enableAccordion(".ui-accordion-sub", "h4", false);
        $("#about-accordion-enable").slideToggle("fast", function () {
            $("#about-accordion-disable").slideToggle("fast");
        });
    });

    //== Disable the expandable accordion list
    $("#about-accordion-disable").on("touchstart click", function () {
        $(".ui-accordion-sub").accordion("destroy");
        $(".ui-accordion-top").accordion("destroy");
        $("#about-accordion-disable").slideToggle("fast", function () {
            $("#about-accordion-enable").slideToggle("fast");
        });
    });

    $(function () {
        //== Determine the accordion active state
        var activeIndex = $(".ui-accordion-top > div").index($("div.active")),
            active;
        if (activeIndex === -1) {
            active = false;
        } else {
            active = activeIndex;
        }
        //== Enable accordion on ready
        enableAccordion(".ui-accordion-top", "h3", active);
        enableAccordion(".ui-accordion-sub", "h4", false, function () {
            //== Show help text
            $("#about-main-text").fadeIn('slow');
        });
    });

    //==============================
    //== PROFILE HOME - STRENGTHS ==
    //==============================
    //== Update strength tags
    function updateTag(tag, id, action) {
        if (tag && id && action) {
            $.ajax({
                url:  "/ti/profiles/strengths",
                type: "PUT",
                data: {
                    "tag":    tag,
                    "type":   id.charAt(5).toUpperCase() + id.substring(6),
                    "action": action
                },
                success: function (data, textStatus, jqXHR) {
                    //alert(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(errorThrown + ". Tag not updated");
                    location.reload(true);
                }
            });
        }
    }

    $(function () {
        //== If page has a tag box
        if ($("#tag-box-container").length) {
            //== Define tags input options
            var tagOptions = {
                    "width":              "100%",
                    "height":             "100px",
                    "defaultText":        "Add...",
                    "removeWithBackspace": false,
                    "maxChars":            20,
                    "onAddTag":            updateTag,
                    "onRemoveTag":         updateTag
                };
            //== Initialize the tag boxes
            $("#tags-team").tagsInput(tagOptions);
            $("#tags-company").tagsInput(tagOptions);
            $("#tags-other").tagsInput(tagOptions);
            //== Show the tag inputs
            $("#tag-box-container").fadeIn('slow');
        }
    });

    //================================
    //== PROFILE HOME - PREFERENCES ==
    //================================
    //== Update <select> group to control/cascade the availability of the <select> elements
    function cascadeSelectAvailability(selectClass, nonCascadeVal) {
        var selectID   = selectClass.replace(".", "#"),
            classSize  = $("select" + selectClass).length,
            selectNum  = "",
            nSelectNum = 0,
            loopNum    = 0,
            keepLoop   = true;
        //== If first selection is No Preference then disable other <select>s
        if ($(selectID + "-1 option:selected").text() === nonCascadeVal) {
            $(selectClass + ":not(" + selectID + "-1)").val("");
            $(selectClass + ":not(" + selectID + "-1)").prop("disabled", true);
        } else {
        //== Otherwise cascade the availability
            $("select" + selectClass).each(function (i, select) {
                selectNum  = select.id.split('-').pop();
                nSelectNum = Number(selectNum);
                //== If <select> is NOT blank then enable the next <select>
                if ($(selectID + "-" + selectNum).val() !== "") {
                    $(selectID + "-" + (nSelectNum + 1).toString()).prop("disabled", false);
                } else {
                //== If <select> is blank then disable the <select>s that follow it
                    for (loopNum = Number(selectNum) + 1; loopNum <= classSize; loopNum += 1) {
                        $(selectID + "-" + loopNum.toString()).val("");
                        $(selectID + "-" + loopNum.toString()).prop("disabled", true);
                    }
                    //== Stop looping <select>s if we found a blank
                    keepLoop = false;
                }
                return keepLoop;
            });
        }
    }

    //== Update <select> group to keep options mutually exclusive
    function mutuallyExclusiveSelects(selectClass, nonCascadeVal) {
        var excludeVals  = [],
            selectedVal  = "",
            selectedText = "";
        //== Catalog the selected values in the group
        $(selectClass).each(function () {
            selectedVal  = $(this).val();
            selectedText = $(this).text();
            if (selectedVal && selectedText !== nonCascadeVal) {
                excludeVals.push({ "selectID": "." + $(this).id, "selectVal": $(this).val() });
            }
        });
        //== Show everything
        $(selectClass + " option").show(0);
        //== Hide the selected values from the catalog
        excludeVals.forEach(function (exclude) {
            $(selectClass + ":not(" + exclude.selectID + ") option[value='" + exclude.selectVal + "']").hide(0);
        });
        //== Then cascade the element availability
        cascadeSelectAvailability(selectClass, nonCascadeVal);
    }

    //== Update preferences in DB
    function updatePrefs(prefType, typeCategory, choiceNum, choiceValue, nonCascadeVal) {
        $.ajax({
            url: "/ti/profiles/preferences",
            type: "PUT",
            data: {
                "prefType":     prefType,
                "typeCategory": typeCategory,
                "choiceNum":    choiceNum,
                "choiceValue":  choiceValue
            },
            success: function (data, textStatus, jqXHR) {
                //== <select> class shall be returned
                //== Now enforce <select> options mutual exclusivity and cascade <select> availability
                mutuallyExclusiveSelects(data, nonCascadeVal);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown + ": Preferences not updated");
                location.reload(true);
            }
        });
    }

    //== Handle changes to Contact choices
    $("select.contact-preferences").change(function (e, data) {
        //== Identify the elements
        var prefType      = this.id.split('-').shift(),
            typeCategory  = this.id.split('-')[1],
            choiceClass   = '.' + prefType + '-' + typeCategory,
            choiceNum     = '',
            choiceValue   = '',
            nonCascadeVal = "No Preference";

        //== If not initial page load trigger then update DB
        if (!data) {
            //== Set the values for the update
            choiceNum   = this.id.split('-').pop();
            choiceValue = this.value;
            //== If values are valid then perform the DB update
            if (choiceNum) {
                updatePrefs(prefType, typeCategory, choiceNum, choiceValue, nonCascadeVal);
            }
        } else {
            //== Remove No Preference option from all but first <select>
            $(choiceClass + ":not(" + choiceClass.replace(".", "#") + "-1) option:contains('" + nonCascadeVal + "')").remove();
            //== Trigger the mutually exclusive and cascade functionality
            mutuallyExclusiveSelects(choiceClass, nonCascadeVal);
        }
    });

    //== Handle changes to meeting preferences
    $("select.meeting-preferences").change(function (e, data) {
        //== Identify the elements
        var id           = this.id,
            prefType     = id.split('-').shift(),
            typeCategory = (function () {
                var className = '',
                    i         = 0,
                    idArr     = id.split('-');
                idArr.shift();
                for (i = 0; i < idArr.length; i += 1) {
                    if (i === 0) {
                        className = idArr[i];
                    } else {
                        className += '-' + idArr[i];
                    }
                }
                return className;
            })(),
            choiceValue = this.value;

        //== If choice value exists then call the async updater
        if (choiceValue && choiceValue !== '') {
            updatePrefs(prefType, typeCategory, 1, choiceValue);
        } else {
            location.reload(true);
        }
    });

    //== Reveal update button for changed Time preferences
    $('.time-update').keyup(function () {
        var btnId = '#' + this.id + '-btn';
        if (!$(btnId).is(':visible') && this.value.trim() !== '') {
            $(btnId).css('visibility', 'visible').hide().fadeIn().removeClass('hidden');
        } else {
            if (this.value === '') {
                $(btnId).hide('fast');
            }
        }
    });

    //== Handle changes to Time preferences
    $(".time-preference-update").click(function (e, data) {
        var idArr        = this.id.split('-'),
            inputId      = '',
            i            = 0,
            prefType,
            typeCategory,
            choiceValue;
        idArr.pop();
        for (i = 0; i < idArr.length; i += 1) {
            if (i === 0) {
                inputId = '#' + idArr[i];
            } else {
                inputId += '-' + idArr[i];
            }
        }
        prefType     = idArr.shift();
        typeCategory = idArr.pop();
        choiceValue  = $(inputId).val();
        if (choiceValue && choiceValue !== '') {
            //== Call the async updater
            updatePrefs(prefType, typeCategory, 1, choiceValue);
            $('#' + this.id).hide('fast');
        } else {
            location.reload(true);
        }
    });

    $(function () {
        //== Trigger selection availability on load - 1 item from each list
        $("#contact-help-1").trigger("change", [{ initial: true}]);
        $("#contact-announcements-1").trigger("change", [{ initial: true}]);
        $("#contact-brainstorm-1").trigger("change", [{ initial: true}]);
    });

    //================================
    //== APPLICATION ADMINISTRATION ==
    //================================
    //== Update changes in the DB
    function updateAdmin(action, updateType, value, id) {
        $.ajax({
            url:  "/ti/profiles/administrator",
            type: "PUT",
            data: {
                "action":     action,
                "updateType": updateType,
                "value":      value,
                "id":         id
            },
            success: function (data, textStatus, jqXHR) {
                if (updateType === "user" && action === "Reset") {
                    //== For password resets, clear the input and populate the server message
                    $("#pw-reset-" + id).val("");
                    if (data !== "success") {
                        $("#admin-reset-error").text(data);
                    } else {
                        $("#admin-reset-success").text("Password successfully reset!");
                    }
                } else {
                    //== For everything else, display any alerts and reload the page
                    if (data !== "success") {
                        alert(data);
                    }
                    location.reload(true);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("SERVER ERROR. DB not updated");
                location.reload(true);
            }
        });
    }

    //== Handle new list values
    $("button.admin-update").click(function () {
        var i             = 0,
            //== Determine the type of list
            updateTypeArr = this.id.split('-'),
            updateType,
            //== Determine which input field to read
            input         = '#' + this.id.replace('btn', 'input'),
            value         = $(input).val();
        updateTypeArr.shift();
        updateTypeArr.pop();
        for (i = 0; i < updateTypeArr.length; i += 1) {
            if (i === 0) {
                updateType = updateTypeArr[i];
            } else {
                updateType += '-' + updateTypeArr[i];
            }
        }
        if (value.trim() !== "") {
            //== Call the async updater
            updateAdmin("Add", updateType, value);
        }
    });

    //== Handle deleted list values
    $(".admin-delete").click(function () {
        var updateTypeArr = this.id.split('-'),
            value         = updateTypeArr.pop(),
            updateType,
            i             = 0;
        updateTypeArr.pop();
        for (i = 0; i < updateTypeArr.length; i += 1) {
            if (i === 0) {
                updateType = updateTypeArr[i];
            } else {
                updateType += '-' + updateTypeArr[i];
            }
        }
        //== Call the async updater
        updateAdmin("Remove", updateType, value);
    });

    //== Handle user detail view
    $(document).on("touchstart click", ".admin-user", function (e) {
        $.ajax({
            url:  "/ti/profiles/administrator/user",
            type: "POST",
            data: {
                "profileID": this.id.split('-').pop()
            },
            success: function (data, textStatus, jqXHR) {
                if (data.trim()) {
                    $("#modal-content").html(data);
                    $(".modal").modal({
                        fadeDuration: 250
                    });
                } else {
                    alert("Failed to grab user detail");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });

    //== Handle password reset start
    $(document).on("touchstart click", "button.admin-reset", function (e) {
        $("button.admin-reset").prop("disabled", true);
        $("#admin-reset-user").show("slide", { direction: "left" }, 500);
    });

    //== Handle password reset cancel
    $(document).on("touchstart click", "button.admin-reset-cancel", function (e) {
        $("#admin-reset-user").hide("slide", { direction: "left" }, 500);
        $("#admin-reset-user input").val("");
        $("button.admin-reset").prop("disabled", false);
    });

    //== Handle password reset confirm
    $(document).on("touchstart click", "button.admin-reset-confirm", function (e) {
        var id         = this.id.split('-').pop(),
            updateType = "user",
            value      = $("#pw-reset-" + id).val();
        //== Call the async updater
        if (updateType && id && value) {
            /*alert("Reset" + ", updateType: " + updateType + ", user: " + id + ", new password: " + value);*/
            updateAdmin("Reset", updateType, value, id);
        } else {
            alert("Invalid password");
        }
    });

    //== Handle user remove start
    $(document).on("touchstart click", "button.admin-remove", function (e) {
        $("button.admin-remove").prop("disabled", true);
        $("#admin-remove-user").show("slide", { direction: "up" }, 500);
    });

    //== Handle user remove cancel
    $(document).on("touchstart click", "button.admin-remove-cancel", function (e) {
        $("#admin-remove-user").hide("slide", { direction: "up" }, 500);
        $("button.admin-remove").prop("disabled", false);
    });

    //== Handle user remove confirm
    $(document).on("touchstart click", "button.admin-remove-confirm", function (e) {
        var id         = this.id.split('-').pop(),
            updateType = "user",
            value      = "";
        //== Call the async updater
        if (updateType && id) {
            /*alert("Remove" + ", updateType: " + updateType + ", user: " + id);*/
            updateAdmin("Remove", updateType, value, id);
        } else {
            alert("Could not determine the user ID");
        }
    });

})(jQuery);