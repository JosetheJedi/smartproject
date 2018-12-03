var socket = io('/settings');

// if the user checks to repeat the watering, then it will create another
// time input box so the user can say when the other watering will take place.
function repeat() {
    if (document.getElementById("moreTimes").checked) {
        document.getElementById("secondTime").innerText = "Second Start Time: ";
        var nDiv = document.createElement("DIV");
        var nInput = document.createElement("INPUT");
        var breakE = document.createElement("BR");

        nDiv.setAttribute("class", "col-sm-6");

        nInput.setAttribute("id", "datetimepicker2");
        nInput.setAttribute("type", "text");
        nInput.setAttribute("name", "startT2");
        nInput.setAttribute("class", "form-control");
        nInput.setAttribute("onClick", "setDate()");

        nInput.appendChild(breakE);
        nDiv.appendChild(nInput);
        document.getElementById("moreChecks").append(nDiv);
    }
    else {
        document.getElementById("secondTime").innerText = "";
        var node = document.getElementById("moreChecks");

        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    // initializing the setdate function to work
    setDate();
}

// the function is to set the date picker settings on the modal.
function setDate() {
    $('#datetimepicker2').datetimepicker({
        format: 'LT'
    });
}

// this function will set the default watering schedule that is selected
// by emitting a message out to the socket server
function setDefault(num) {
    socket.emit("set schedule", $('#setSettings_' + num).val());
    $( "#schedule_list" ).load(window.location.href + " #schedule_list" );
}

// if a default setting is changed somewhere, then it will apply the change to the website.
socket.on('default_changed', function (msg) {
    $( "#schedule_list" ).load(window.location.href + " #schedule_list" );
});