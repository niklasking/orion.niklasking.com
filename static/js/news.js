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
    $('#uploadFileButton').hide();
    $('#previewOldImages').hide();
    var now = new Date();
    var endDate = moment(now).add(14, 'days').format('YYYY-MM-DD HH:mm:ss');
    $('#datetimepickerValidTo').val(endDate);
    var startDate = moment(now).format('YYYY-MM-DD HH:mm:ss');
    $('#datetimepickerValidFrom').val(startDate);


    $('#showOldFiles').click(function() {
        $('#previewOldImages').show();
        $('#showOldFiles').show();
        $('#uploadFileButton').hide();
        $('#previewImage').hide();
        $.ajax({
            url : "/news/imgs/old",
            type: "GET",
            data : "",
            async: false,
            cache: false,
            contentType: false,
            processData: false
        }).done(function(response){ 
            $('#previewOldImages').empty();
            response.oldImages.forEach(function(img) {
                var oldImageDiv = $('<div class="col-2">');
                var oldImage = $('<img class="img-fluid">');
                oldImage.attr('src', img);
                oldImage.appendTo(oldImageDiv);
                oldImageDiv.appendTo($('#previewOldImages'));
                oldImage.click(function() {
                    // var srcParts = ($(this).attr("src")).split('/');
                    // var src = "/static/imgs/uploaded/src/" + srcParts[5];
                    
                    var src = $(this).attr("src").replace("thumbnail_small", "src");
                    showpreviewOld(src);
                });
            });
            $('#showOldFiles').hide();
        });
    });

    // $("#previewOldImages").click(function () {
	// 	alert('Img btn clicked');
	// });


    $('#add-emoji').click(function() {
        var s = ""
        if ($('#nyhetKlubb').is(":checked"))
        {
            s += "<div>Visas på OK Orions sida.</div>";
        }
        if ($('#nyhetElit').is(":checked"))
        {
            s += "<div>Visas på elitsidan.</div>";
        }
        if ($('#nyhetUngdon').is(":checked"))
        {
            s += "<div>Visas på ungdomssidan.</div>";
        }
        if ($('#nyhetFacebook').is(":checked"))
        {
            s += "<div>Visas på OK Orions Facebooksida.</div>";
        }

        $('#output').html("<hr><h2>" + $('#rubrik').val() + "</h2>" + 
                        $('#news-input').html() +
                        "<div><strong>Visas till: </strong>" + $('#datetimepickerValidTo').val() + "</div>" +
                        "<div><strong>Visas från: </strong>" + $('#datetimepickerValidFrom').val() + "</div>" +
                        s
        );
    });  

    $('#pictureDiv').on('show.bs.collapse', function () {
        $('#emojisDiv').collapse('hide');
        $('#linkDiv').collapse('hide');
        $('#previewOldImages').empty();
    });
    $('#emojisDiv').on('show.bs.collapse', function () {
        $('#pictureDiv').collapse('hide');
        $('#linkDiv').collapse('hide');
    });
    $('#linkDiv').on('show.bs.collapse', function () {
        $('#pictureDiv').collapse('hide');
        $('#emojisDiv').collapse('hide');
    });
    $('#uploadFileButton').click(function () {
        $('#pictureDiv').collapse('hide');
        $("#previewImage").attr("src", "");
        $('#uploadFileButton').hide();
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
            "<li class=\"nav-item shadow-sm mr-2\">" +
            "<a class=\"nav-link bg-light text-secondary active show\" id=\"" + category + "-tab\" href=\"#" + category + "\" role=\"tab\" aria-controls=\"" + category + "\" data-toggle=\"pill\" aria-selected=\"true\">" + category + "</a>" +
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
                    "<li class=\"nav-item shadow-sm mr-2\">" +
                    "<a class=\"nav-link bg-light text-secondary\" id=\"" + category + "-tab\" href=\"#" + category + "\" role=\"tab\" aria-controls=\"" + category + "\" data-toggle=\"pill\" >" + category + "</a>" +
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





    $("#uploadForm").submit(function(event){
        event.preventDefault(); //prevent default action 
        var post_url = $(this).attr("action"); //get form action url
        var request_method = $(this).attr("method"); //get form GET/POST method
        var form_data = new FormData($(this)[0]);
        $.ajax({
            url : post_url,
            type: request_method,
            data : form_data,
            async: false,
            cache: false,
            contentType: false,
            processData: false
        }).done(function(response){ 
            document.getElementById('news-input').focus(); pasteHtmlAtCaret("<img class=\"img-fluid\" src=\"" + response.uploadedFile + "\">");
            document.getElementById('news-input').focus(); pasteHtmlAtCaret("<div>&nbsp;</div>");
            $('#news-input img').on('load', function() {
                autoExpand(document.getElementById('news-input'));
            });
        });
    });

    $("#linkForm").submit(function(event){
        event.preventDefault();
        var linkUrl = $('#inputAdress').val();
        var linkText = $('#inputText').val();
        document.getElementById('news-input').focus(); pasteHtmlAtCaret("<a href=\"" + linkUrl + "\">" + linkText + "</a>");
        $('#linkDiv').collapse('hide');
    });
});


function showpreview(e) {
    var reader = new FileReader();
    reader.onload = function (e) {
        $("#previewImage").attr("src", e.target.result);
        $('#showOldFiles').show();
        $('#previewOldImages').hide();
        $('#uploadFileButton').show();
        $('#previewImage').show();    
    }
    reader.readAsDataURL(e.files[0]);
}
function showpreviewOld(src) {
    $("#previewImage").attr("src", src);
    $('#showOldFiles').show();
    $('#previewOldImages').hide();
    $('#uploadFileButton').show();
    $('#previewImage').show();    
}

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