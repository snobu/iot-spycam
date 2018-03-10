// read secrets from .env
require('dotenv').config()
const IOTHUB_CONNSTR = process.env.IOTHUB_CONNSTR;

// needs fswebcam on Linux and imagesnap on macOS
// Use imagesnap 0.2.5 from http://iharder.sourceforge.net/current/macosx/imagesnap/
// until this bug gets fixed: https://github.com/rharder/imagesnap/issues/16
const NodeWebcam = require("node-webcam");
const Duplex = require('stream').Duplex;
const colors = require('colors');
const fs = require('fs');
const mqtt = require('azure-iot-device-mqtt').Mqtt;
const clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
const client = clientFromConnectionString(IOTHUB_CONNSTR);

let capture = null;
const intervalInMs = 1000 * 15; // snap a pic every X sec

let webcam = NodeWebcam.create({
    width: 1280,
    height: 720,
    quality: 60,
    delay: 1,
    skip: 20,
    // Save shots in memory
    saveShots: true,
    output: 'jpeg',
    // false = default webcam
    device: false,
    // [location, buffer, base64]
    callbackReturn: 'buffer',
    verbose: false
});

colors.setTheme({
    silly: 'rainbow',
    info: 'green',
    warn: 'yellow',
    debug: 'cyan',
    error: 'red'
});

function bufferToStream(buffer) {  
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);

    return stream;
}

function uploadToBlob(blobName, data) {
    let bytes = bufferToStream(data);
    client.uploadToBlob(blobName, bytes, data.length, (err) => {
        if (err) {
            console.error(`Error uploading file: ${err.toString()}`.error);
        } else {
            console.log('File uploaded.'.info);
        }
    });
}

function captureAndUpload(request, response) {
    response.send(200, 'Capture has started.', (err) => {
        if (err) {
            console.error(`An error ocurred when sending a method response:\n ${err.toString()}`.error);
        } else {
            console.log(`Response to method ${request.methodName} sent successfully.`.debug);
        }
    });
    capture = setInterval(() => {
        webcam.capture('in_memory_image', function (err, data) {
            console.log('Image capture ready. Uploading...'.debug);
            uploadToBlob('faces.jpg', data);
        });
    }, intervalInMs);
}

function stopCapture(request, response) {
    clearInterval(capture);
    console.log('Capture stopped via direct method.'.debug);
    response.send(200, 'Capture has stopped.', (err) => {
        if (err) {
            console.error(`An error ocurred when sending a method response:\n ${err.toString()}`.error);
        } else {
            console.log(`Response to method ${request.methodName} sent successfully.`.debug);
        }
    });
}

// "Main()"
console.log(IOTHUB_CONNSTR.split(';')[1].debug);
console.log('Client connected over MQTT.'.info);

// Attach handlers for device methods
client.onDeviceMethod('capture', captureAndUpload);
client.onDeviceMethod('start', captureAndUpload);
client.onDeviceMethod('stop', stopCapture);

