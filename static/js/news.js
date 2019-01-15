document.addEventListener('input', function (event) {
    if (!event.target.matches('.news-input')) return;
    // if (event.target.tagName.toLowerCase() !== 'textarea') return;
    $('.news-input').removeClass("text-secondary");
    autoExpand(event.target);
}, false);

var autoExpand = function (field) {
    // Reset field height
    field.style.height = 'inherit';

    // Get the computed styles for the element
    var computed = window.getComputedStyle(field);

    // Calculate the height
    var height = parseInt(computed.getPropertyValue('border-top-width'), 10)
                + parseInt(computed.getPropertyValue('padding-top'), 10)
                + field.scrollHeight
                + parseInt(computed.getPropertyValue('padding-bottom'), 10)
                + parseInt(computed.getPropertyValue('border-bottom-width'), 10);

    field.style.height = height + 'px';
};
$(document).ready(function() {
    $("#add-emoji").click(function() {
        // document.getElementById('news-input').focus(); pasteHtmlAtCaret('<img src="https://cdn.okccdn.com/media/img/emojis/apple/1F60C.png" width=\"20px\" height=\"20px\"/>');
        document.getElementById('news-input').focus(); pasteHtmlAtCaret('<span>&#x1F601;</span>');
    });
    // $("#add-emoji2").click(function() {
    //     $("#oj").append('<img src="https://cdn.okccdn.com/media/img/emojis/apple/1F60C.png"/>');
    // });
    $('#get-news').click(function() {
        console.log($('#news-input').html());
    });  
    $.getJSON('../../static/json/emojis.json', function(data) {         
        var i = 0;
        var category = "";
        var row = "<tr>";
        var myArray = $.map(data, function(value, index) {
                // console.log([value][0].char + " " + [value][0].category + " " + index);
                i++;
                if (category != [value][0].category) {
                    if (category != "") {
                        row += "</tr>";
                        $('#' + category + '-table').append(row);    
                    }
                    category = [value][0].category;
                    row = "<tr>";
                    $('#emojis-tab').append(
                        "<li class=\"nav-item\">" +
                        "<a class=\"nav-link\" id=\"" + category + "-tab\" href=\"#" + category + " role=\"tab\" aria-controls=\"" + category + "\" >" + category + "</a>" +
                        "</li>"
                    );
                    $('#emojis-tabContent').append(
                        "<div class=\"tab-pane fade show\" id=\"" + category +"\" role=\"tabpanel\" aria-labelledby=\"" + category + "-tab\">" +
                        "<table id=\"" + category + "-table\"></table>" +
                        "</div>"
                    );
                    i = 1;
                }
                row +=  "<td>" + 
                        "<button class=\"add-emoji\" data-toggle=\"tooltip\" title=\"" + index + "\">" + 
                        "<span>" + [value][0].char + "</span>" + "</button>" +
                        "</td>";
                if ( i > 10) {
                    i = 0;
                    row += "</tr>";
                    $('#' + category + '-table').append(row);
                    row = "<tr>";
                }
            // }
        });
    });
});

function pasteHtmlAtCaret(html) {
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            
            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != "Control") {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
}