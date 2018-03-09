Add an `.env` file with the device connection string:

```bash
IOTHUB_CONNSTR=HostName=poorlyfundedskynet.azure-devices.net;DeviceId=botnet;SharedAccessKey=123TheSecretKey321=
```

`npm start` or `node app.js` to start listening to Azure IoT Hub for direct methods.

Currently implemented device methods:

* `capture` - Starts capture, on a loop. 
* `stop` - Stops capture

Node 8+ required, could work with 6+, but that's on you.