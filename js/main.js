/**
 *
 * Created by Nat on 5/15/2016 AD.
 */


var wsbroker = "mqtt.espert.io";  //mqtt websocket enabled broker
var wsport = 8000 // port for above

var client = new Paho.MQTT.Client(wsbroker, wsport,
    "myclientid_" + parseInt(Math.random() * 100, 10));

client.onConnectionLost = function (responseObject) {
    log("connection lost: " + responseObject.errorMessage);
    $('#mqtt_status').text("disconnected");
};

client.onMessageArrived = function (message) {
    log(message.destinationName, ' -- ', message.payloadString);
};

var options = {
    timeout: 10,
    onSuccess: function () {
        log("mqtt connected");
        $('#mqtt_status').text("connected");
    },
    onFailure: function (message) {
        log("Connection failed: " + message.errorMessage);
        $('#mqtt_status').text("connect failed");
    }
};

window.init = function () {
    $('#mqtt_status').text("connecting..");
    client.connect(options);
};

window.log = function () {
    if (this.console) {
        console.log(Array.prototype.slice.call(arguments));
    }
};

var fnGenerator = function (pickerSelector, previewSelector) {
    var fn = function () {
        var data = {};
        var bCanPreview = true; // can preview

        // create canvas and context objects
        var jqPicker = $(pickerSelector);
        var jqPreview = $(previewSelector);
        var canvas = jqPicker[0];

        var ctx = canvas.getContext('2d');

        // drawing active image
        var image = new Image();
        image.onload = function () {
            ctx.drawImage(image, 0, 0, image.width, image.height); // draw the image on the canvas
        };

        // select desired colorwheel
        var imageSrc = '../images/colorwheel1.png';
        switch ($(canvas).attr('var')) {
            case '2':
                imageSrc = '../images/colorwheel2.png';
                break;
            case '3':
                imageSrc = '../images/colorwheel3.png';
                break;
            case '4':
                imageSrc = '../images/colorwheel4.png';
                break;
            case '5':
                imageSrc = '../images/colorwheel5.png';
                break;
        }
        image.src = imageSrc;

        var moveEvent = function (e) {
            bCanPreview = true;
            if (bCanPreview) {
                // get coordinates of current position
                var canvasOffset = $(canvas).offset();
                var canvasX = Math.floor(e.pageX - canvasOffset.left);
                var canvasY = Math.floor(e.pageY - canvasOffset.top);

                // get current pixel
                var imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
                var pixel = imageData.data;
                var sum = (pixel[0] + pixel[1] + pixel[2]);

                // filter black or white
                if (sum != 0 || sum >= 254 * 3) {
                    // update preview color
                    var pixelColor = "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
                    jqPreview.css('backgroundColor', pixelColor);

                    // update controls
                    $('#rVal').val(pixel[0]);
                    $('#gVal').val(pixel[1]);
                    $('#bVal').val(pixel[2]);
                    $('#rgbVal').val(pixel[0] + ',' + pixel[1] + ',' + pixel[2]);

                    var dColor = pixel[2] + 256 * pixel[1] + 65536 * pixel[0];
                    $('#hexVal').val('#' + ('0000' + dColor.toString(16)).substr(-6));

                    publishColor();
                }
            }

        };

        jqPicker.mousemove(function (e) { // mouse move handler
            moveEvent(e);
        });


        var publishColor = function () {
            var _R = data.R;
            var _G = data.G;
            var _B = data.B;

            data.R = $('#rVal').val();
            data.G = $('#gVal').val();
            data.B = $('#bVal').val();

            if ((_R + _G + _B) != (data.R + data.G + data.B)) {
                log("published: ", data);
                message = new Paho.MQTT.Message(JSON.stringify(data));
                message.destinationName = "/qrx/" + pickerSelector.split("#picker")[1];
                client.send(message);
            }
        };

        jqPicker.bind('mousedown', function (e) { // click event handler
            bCanPreview = !bCanPreview;
            publishColor();
        });

        var handleStart = function (evt) {
            log("handleStart");
            evt.preventDefault();
            bCanPreview = true;
        };

        var handleMove = function (evt) {
            log("handleMove");
            evt.preventDefault();
            moveEvent(evt);
        };

        var handleEnd = function (evt) {
            log("handleEnd");
            evt.preventDefault();
            bCanPreview = false;
        };

        var handleCancel = function (evt) {
            log("handleCancel");
            evt.preventDefault();
        };

        function startup() {
            var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (iOS) {
                //var el = document.body;
                var el = $("#canvas_wrapper")[0];

                el.removeEventListener("touchstart", handleStart);
                el.removeEventListener("touchend", handleEnd);
                el.removeEventListener("touchcancel", handleCancel);
                el.removeEventListener("touchleave", handleEnd);

                el.addEventListener("touchstart", handleStart, true);
                el.addEventListener("touchend", handleEnd, false);
                el.addEventListener("touchcancel", handleCancel, false);
                el.addEventListener("touchleave", handleEnd, false);

                //el.removeEventListener("touchmove", handleMove);
                //el.addEventListener("touchmove", handleMove, false);
                log('iOS');
            }
            log("initialized.");
        }

        //startup();
    };


    return fn;

};

