(function($) {
	/**
	 * Searches after a term in every descendant of one (or many) dom element(s).
	 * Every text node is handled in the same way (handling is not splitted 
	 * by ancestor DOM element).
	 * Every modified node can be restored by explicitely searching 
	 * after the boolean false.
	 * Handles properly conseciutive matches (both searching and restoring).
	 * For restoring, does not keep original HTML chunks in memory (avoid wasting memory).
	 * Most of private functions use good ol' javascript as handling text node is not
	 * that easy with jQuery.
	 * @author Aurélien Scoubeau
	 */
	$.fn.textSearch = function(term, options) {
		var opts = $.extend({}, $.fn.textSearch.defaults, options);
		var matches = [];

		/**
		 * Helper function. Remove an element highlighting by
		 * restoring the previous inner HTML.
		 */
		function downlight(node) {
			$node = $(node);
			parent = node.parentNode;
			if (!parent)
				return;
			previous = node.previousSibling;
			next = node.nextSibling;
			value = [$node.text()];
			if (previous && previous.nodeType == 3) {
				value.unshift(previous.nodeValue);
				parent.removeChild(previous);
			}
			if (next && next.nodeType == 3) {
				value.push(next.nodeValue);
				parent.removeChild(next);
			}
			$node.after(value.join(''));
			parent.removeChild(node);
		}

		/**
		 * Helper function. Finds every match of a searched string.
		 * Uses indexOf to be lighter than regexp.
		 */
		function getIndicesOf(haystack, needle, caseSensitive) {
			var startIndex = 0;
			var index, indices = [];
			if (!caseSensitive) {
				haystack = haystack.toLowerCase();
				needle = needle.toLowerCase();
			}
			while ((index = haystack.indexOf(needle, startIndex)) > -1) {
				indices.push(index);
				startIndex = index + needle.length;
			}
			return indices;
		}

		/**
		 * Helper function. Splits matched text node values and 
		 * wraps them with a given element.
		 */
		function highlight(node, indices, length, wrap) {
			$parent = $(node.parentNode);
			if ($parent.is(':visible')) {
				var value = [], startIndex = 0;
				for (var i = 0, length = indices.length; i < length; ++i) {
					var slice = node.nodeValue.substring(startIndex, indices[i]);
					var occurrence = node.nodeValue.substr(indices[i], term.length);
					value.push(slice, $(wrap).text(occurrence));
					startIndex = indices[i] + term.length;
				}
				var slice = node.nodeValue.substring(startIndex);
				value.push(slice);
				$.each(value, function(i, el) {
					$parent.append(el);
				});
				node.parentNode.removeChild(node);
			}
		}

		// when the term is explicitely set to false, cancel the search.
		if (typeof term == 'boolean' && term == false) {
			return $(this).each(function() {
				$(this).find('span.search').each(function() {
					downlight(this);
				});
			});
		}
		// if the term is empty, return.
		if (term.length == 0)
			return this;

		// for each element, get its text nodes and search after the term in each of them.
		$(this).each(function() {
			node = this;
			$.each(getText(node), function() {
				nodeMatches = getIndicesOf(this.nodeValue, term, opts.caseSensitive);
				if (nodeMatches && nodeMatches.length)
					matches.push({node: this, indices: nodeMatches});
			});
		});

		// highlight every match found using the index position for each node.
		for (var i = 0, length = matches.length; i < length; ++i) {
			var match = matches[i];
			highlight(match.node, match.indices, term.length, opts.wrap);
		}

		return this;
	}
	$.fn.textSearch.defaults = {
		caseSensitive : false,
		wrap: '<span class="search">',
	};

	/**
	 * Returns the node descendant that are text nodes.
	 * Whitespace text nodes can be ignored.
	 */
	getText = function(node, options) {
		var opts = $.extend({}, {whitespaceNodes : false}, options);
		var textNodes = [], whitespace = /^\s*$/;

		/**
		 * Helper function. Recursively fetches text nodes using plain 
		 * javascript (way more efficient than jQuery on this one).
		 */
		function getTextNodes(node) {
			if (node.nodeType == 3) {
				if (opts.whitespaceNodes || !whitespace.test(node.nodeValue)) {
					textNodes.push(node);
				}
			} else {
				for (var i = 0, length = node.childNodes.length; i < length; ++i) {
					getTextNodes(node.childNodes[i]);
				}
			}
		}

		getTextNodes(node);
		return textNodes;
	}
})(jQuery);
