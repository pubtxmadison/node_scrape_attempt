jQuery.extend({
    highlight: function (node, re, nodeName, className) {
        if (node.nodeType === 3) {
            var match = node.data.match(re);
            if (match) {
                var highlight = document.createElement(nodeName || 'span');
                highlight.className = className || 'highlight';
                var wordNode = node.splitText(match.index);
                wordNode.splitText(match[0].length);
                var wordClone = wordNode.cloneNode(true);
                highlight.appendChild(wordClone);
                wordNode.parentNode.replaceChild(highlight, wordNode);
                return 1; //skip added node in parent
            }
        } else if ((node.nodeType === 1 && node.childNodes) && // only element nodes that have children
                !/(script|style)/i.test(node.tagName) && // ignore script and style nodes
                !(node.tagName === nodeName.toUpperCase() && node.className === className)) { // skip if already highlighted
            for (var i = 0; i < node.childNodes.length; i++) {
                i += jQuery.highlight(node.childNodes[i], re, nodeName, className);
            }
        }
        return 0;
    }
});

jQuery.fn.unhighlight = function (options) {
    var settings = { className: 'highlight', element: 'span' };
    jQuery.extend(settings, options);

    return this.find(settings.element + "." + settings.className).each(function () {
        var parent = this.parentNode;
        parent.replaceChild(this.firstChild, this);
        parent.normalize();
    }).end();
};

jQuery.fn.highlight = function (words, options) {
    console.log(words.toString());
    var title = words.toString().replace(/[\„\“\‟\”\’\"\❝\❞\⹂\〝\〞\〟\＂\‚\‘\‛\❛\❜\❟\'\"\`]/g,"[\„\“\‟\”\’\"\❝\❞\⹂\〝\〞\〟\＂\‚\‘\‛\❛\❜\❟\'\"\`]");
    console.log(title)
    var settings = { className: 'highlight', element: 'span', caseSensitive: false, wordsOnly: false };
    jQuery.extend(settings, options);

    if (words.constructor === String) {
        words = [words];
    }
    words = jQuery.grep(words, function(word, i){
      return word != '';
    });
    words = jQuery.map(words, function(word, i) {
      return word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    });
    if (words.length == 0) { return this; };

    var flag = settings.caseSensitive ? "" : "i";
    var pattern = "(" + title + ")";
    if (settings.wordsOnly) {
        pattern = "(" + words.join("|") + ")";
        pattern = "\\b" + pattern + "\\b";
    }
    console.log(pattern)
    var re = new RegExp(pattern, flag);

    return this.each(function () {
        jQuery.highlight(this, re, settings.element, settings.className);
    });

};

function doTheHighlight() {
    var theTitle = "replaceMeTitle";
    //console.log('ok');
	$('body').append("<style>.rumhlFull {background:lime !important;color:black !important;} .rumhlParts {background:yellow !important;color:black !important;}</style>")
	$('body').highlight(theTitle,{caseSensitive:false,wordsOnly:false,element:'em',className:'rumhlFull'})
	if ( $('.rumhlFull').length == 0 ) {
		// no full match was found, so highlight all words from the title
		theTitle = theTitle.replace(/["'.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		var theTitleParts = theTitle.split(" ");
		$('body').highlight(theTitleParts,{caseSensitive:false,wordsOnly:true,element:'em',className:'rumhlParts'})
		
	}
};

$(document).ready(function(){
    //console.log('wat');
	doTheHighlight();
    //console.log('hokay');
	
})
