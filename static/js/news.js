document.addEventListener('input', function (event) {
    if (!event.target.matches('.news-input')) return;
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
    $('#add-emoji').click(function() {
        $('#output').html("<h2>" + $('#rubrik').val() + "</h2>" + $('#news-input').html());
    });  

    $('#pictureDiv').on('show.bs.collapse', function () {
        $('#emojisDiv').collapse('hide');
    });
    $('#emojisDiv').on('show.bs.collapse', function () {
        $('#pictureDiv').collapse('hide');
    });

    $.getJSON('../../static/json/emojis.json', function(data) {         
        var i = 0;
        var category = "Klubbar";
        $('#emojis-tabContent').append(
            "<div class=\"tab-pane fade active show\" id=\"" + category +"\" role=\"tabpanel\" aria-labelledby=\"" + category + "-tab\">" +
            "<table id=\"" + category + "-table\"></table>" +
            "</div>"
        );
        var row = "<tr><td>" + 
                    "<button class=\"add-club\" data-toggle=\"tooltip\" title=\"" + "OK Orion" + 
                    "\" style=\"background: url(https://eventor.orientering.se/Organisation/Logotype/288?type=MediumIcon); height: 32px; width: 32px;\" value=\"" + 
                    "https://eventor.orientering.se/Organisation/Logotype/288?type=SmallIcon" + "\">" + "</button>" +
                    "</td>";
        row += "<td>" + 
                    "<button class=\"add-club\" data-toggle=\"tooltip\" title=\"" + "Karlskrona SOK" + 
                    "\" style=\"background: url(https://eventor.orientering.se/Organisation/Logotype/2698?type=MediumIcon); height: 32px; width: 32px;\" value=\"" + 
                    "https://eventor.orientering.se/Organisation/Logotype/2698?type=SmallIcon" + "\">" + "</button>" +
                    "</td>";
        row += "<td>" + 
                    "<button class=\"add-club\" data-toggle=\"tooltip\" title=\"" + "Ronneby OK" + 
                    "\" style=\"background: url(https://eventor.orientering.se/Organisation/Logotype/310?type=MediumIcon); height: 32px; width: 32px;\" value=\"" + 
                    "https://eventor.orientering.se/Organisation/Logotype/310?type=SmallIcon" + "\">" + "</button>" +
                    "</td>";
        row += "<td>" + 
                    "<button class=\"add-club\" data-toggle=\"tooltip\" title=\"" + "OK Skogsfalken" + 
                    "\" style=\"background: url(https://eventor.orientering.se/Organisation/Logotype/339?type=MediumIcon); height: 32px; width: 32px;\" value=\"" + 
                    "https://eventor.orientering.se/Organisation/Logotype/339?type=SmallIcon" + "\">" + "</button>" +
                    "</td>";
        row += "<td>" + 
                    "<button class=\"add-club\" data-toggle=\"tooltip\" title=\"" + "OL Teamet Ologström" + 
                    "\" style=\"background: url(https://eventor.orientering.se/Organisation/Logotype/497?type=MediumIcon); height: 32px; width: 32px;\" value=\"" + 
                    "https://eventor.orientering.se/Organisation/Logotype/497?type=SmallIcon" + "\">" + "</button>" +
                    "</td>";
        row += "<td>" + 
                    "<button class=\"add-club\" data-toggle=\"tooltip\" title=\"" + "BroSö OK" + 
                    "\" style=\"background: url(https://eventor.orientering.se/Organisation/Logotype/495?type=MediumIcon); height: 32px; width: 32px;\" value=\"" + 
                    "https://eventor.orientering.se/Organisation/Logotype/495?type=SmallIcon" + "\">" + "</button>" +
                    "</td></tr>";
        $('#' + category + '-table').append(row);
        $('#emojis-tab').append(
            "<li class=\"nav-item\">" +
            "<a class=\"nav-link active\" id=\"" + category + "-tab\" href=\"#" + category + "\" role=\"tab\" aria-controls=\"" + category + "\" data-toggle=\"pill\" >" + category + "</a>" +
            "</li>"
        );

        row = "<tr>";
        var emojisArray = $.map(data, function(value, index) {
            if (category != value.category) {
                row += "</tr>";
                $('#' + category + '-table').append(row);    
                category = value.category;
                row = "<tr>";
                $('#emojis-tab').append(
                    "<li class=\"nav-item\">" +
                    "<a class=\"nav-link\" id=\"" + category + "-tab\" href=\"#" + category + "\" role=\"tab\" aria-controls=\"" + category + "\" data-toggle=\"pill\" >" + category + "</a>" +
                    "</li>"
                );
                $('#emojis-tabContent').append(
                    "<div class=\"tab-pane fade\" id=\"" + category +"\" role=\"tabpanel\" aria-labelledby=\"" + category + "-tab\">" +
                    "<table id=\"" + category + "-table\"></table>" +
                    "</div>"
                );
                i = 0;
            }
            i++;
            row +=  "<td>" + 
                    "<button class=\"add-emoji\" data-toggle=\"tooltip\" title=\"" + index + "\" value=\"" + value.char + "\">" + 
                    "<span>" + value.char + "</span>" + "</button>" +
                    "</td>";
            if ( i > 9) {
                i = 0;
                row += "</tr>";
                $('#' + category + '-table').append(row);
                row = "<tr>";
            }
        });
    });
    $(document).on("click", ".add-emoji", function (ev) {
        document.getElementById('news-input').focus(); pasteHtmlAtCaret('<span>' + $(this).attr('value') + '</span>');
    });
    $(document).on("click", ".add-club", function (ev) {
        document.getElementById('news-input').focus(); pasteHtmlAtCaret("<img src=\"" + $(this).attr('value') + "\">");
    });

    // $('#uploadFileButton').click(function() {
        $("#uploadForm").submit(function(event){
            event.preventDefault(); //prevent default action 
            var post_url = $(this).attr("action"); //get form action url
            var request_method = $(this).attr("method"); //get form GET/POST method
            var form_data = $(this).serialize(); //Encode form elements for submission
            
            $.ajax({
                url : post_url,
                // type: "POST",
                type: request_method,
                // method: request_method,
                data : form_data
            }).done(function(response){ 
                alert("HA HA HA");
                $("#output").html(response);
            });
        });
    // });  

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