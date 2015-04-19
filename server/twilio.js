var client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
var data = require('./data');

exports.setup = function(app) {
    app.post('/', function (req, res) {
        var convoId = req.query('convoId') || -1;
        res.send('<?xml version="1.0" encoding="UTF-8" ?><Response><Say voice="alice">Welcome to Litecast!  Connecting you  now.</Say><Dial><Conference maxParticipants="2">Lite' + convoId + '</Conference></Dial></Response>');
    });
};

exports.call = function(convoId) {
    var convo = data.findConvo(convoId);
    if (convo) {
        var clientHandles = convo.clients;
        console.log('convo', convo);
        var clientNumbers = [data.findClient(clientHandles[0]).number, data.findClient(clientHandles[1]).number];

        client.makeCall({
            to: clientNumbers[0],
            from: '+12676139323',
            url: 'http://litecst.cloudapp.net/?convoId=' + convo.id
        }, function(err, responseData) {
            if(err) { console.trace(err) }
            else{ console.log(responseData.from); }
        });

        client.makeCall({
            to: clientNumbers[1],
            from: '+12676139323',
            url: 'http://litecst.cloudapp.net/?convoId=' + convo.id
        }, function(err, responseData) {
            if(err) { console.trace(err) }
            else{ console.log(responseData.from); }
        });
    }
};
