var AWS = require('aws-sdk');
console.log('Loading function');

exports.handler = async(event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('PayloadData =', event.PayloadData);

    var data = Buffer.from(event.PayloadData, 'base64');
    console.log('Data =', data);

    var params = decode(data);
    
    function decode(bytes) {
        var exti = bytes[8] & 0x01 ? "TRUE" : "FALSE"; //
        return {

            //External sensor
            Ext_sensor: {
                "0": "No external sensor",
                "1": "Temperature Sensor",
                "2": "Door Sensor",
                "3": "Water Leak Sensor",
            }[bytes[6] & 0xff],

            //Battery,units:V
            BatteryV: (((bytes[0] << 8) | bytes[1]) & 0x3fff) / 1000,

            //SHT20,temperature,units:â„ƒ
            Alert_Temp: ((((((bytes[2] << 24) >> 16) | bytes[3]) / 100).toFixed(2)) * 9 / 5 + 32).toFixed(2),

            //SHT20,Humidity,units:%
            Humidity: (((bytes[4] << 8) | bytes[5]) / 10).toFixed(1),

            //DS18B20,temperature,units:â„ƒ
            Probe_Temp: {
                "1": ((((bytes[7] << 24) >> 16) | bytes[8]) / 100).toFixed(2),
            }[bytes[6] & 0xff],

        };
    }
    console.log(params.temperature);
    var iotdata = new AWS.IotData({ endpoint: 'xxxxxxxxxxxx.iot.us-east-1.amazonaws.com' });
    
    
   var response = {
        
        topic: event.Metadata.LoRaWAN.DevEUI.concat("/project/sensor/decoded"),
        payload: JSON.stringify(params),
        qos: 0
    };

    return iotdata.publish(response, function(err, data) {
        if (err) {
            console.log("ERROR => " + JSON.stringify(err));
        }
        else {
            console.log("Success");
        }
    }).promise();
    
};
