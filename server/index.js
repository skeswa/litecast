/*
/////////////////////////////////////////////
//         VARIABLE DECLARATION            //
/////////////////////////////////////////////
*/

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var net = require('net');
var events = require('events');
var morgan = require('morgan');

var data = require('./data');
var twilio = require('./twilio');

var TYPE_REGEX = /"type"\s*:\s*"(.+)"/;

app.use(morgan('dev'));

/*
/////////////////////////////////////////////
//              TCP SERVER                 //
/////////////////////////////////////////////
*/

var respond = {
    initSucceeded: function(sock) {
        sock.write('{"type":"init_succeeded"}\0');
    },
    initFailed: function(sock, reason) {
        sock.write('{"type":"init_failed","data":{"reason":"' + reason + '"}}\0');
    },
};

var server = net.createServer(function(socket) {
    // Init the buffer @ 10KB
    var buff = new Buffer(10240),
        cursor = 0,
        messageEmitter = new events.EventEmitter();

    socket.on('data', function(data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i] === 0) {
                // Flush the buffer
                var outputStr = buff.toString('utf8', 0, cursor);
                cursor = 0;
                messageEmitter.emit('message', outputStr);
            } else {
                if (cursor + i >= buff.length) {
                    // Double the buffer
                    var newBuffer = new Buffer(buff.length * 2);
                    buff.copy(newBuffer, 0, 0);
                    buff = newBuffer;
                }
                // Append to the buffer
                buff[cursor] = data[i];
                // Increment the cursor
                cursor++;
            }
        }
    });

    messageEmitter.on('message', function(messageText) {
        console.log('on message:', messageText);

        var typeRegexResults = TYPE_REGEX.exec(messageText);
        if (typeRegexResults) {
            var typeString = typeRegexResults[1];
            switch (typeString) {
                case 'init':
                    console.log('Initialization message received');
                    var message = JSON.parse(messageText);
                    // Record identity information
                    socket.name = message.data.from.name;
                    socket.handle = message.data.from.handle;
                    socket.number = message.data.from.number
                    socket.target = message.data.to;
                    // Validate the handle of the client
                    if (data.findClient(socket.handle)) {
                        respond.initFailed(socket, 'User handle has already been taken');
                        socket.close();
                        return;
                    }
                    if (data.findClient(socket.target)) {
                        respond.initFailed(socket, 'Target user does not exist');
                        socket.close();
                        return;
                    }
                    if (data.clientIsInConvo(socket.target)) {
                        respond.initFailed(socket, 'Target is already in a convo');
                        socket.close();
                        return;
                    }
                    // Perform registration
                    socket.targetClient = data.findClient(socket.target);
                    data.registerClient(socket.handle, socket);
                    // Attempt to create a convo with the target
                    var convoId = data.createConvo(socket.handle, socket.target);
                    // TODO inform target of new convo
                    respond.initSucceeded(socket);
                    // Start the twilio conference
                    twilio.call(convoId);
                    break;
                case 'videoframe':
                    console.log('Frame message received');
                    // TODO pass off to target without doing JSON parse
                    if (targetExists(socket)) socket.target.write(messageText);
                    break;
                case 'chat':
                    // TODO pass off to target without doing JSON parse
                    if(targetExists(socket))
                        socket.target.write(messageText);
                case 'audiosnippet':
                    // TODO pass off to target without doing JSON parse
                    socket.target.write(messageText);
                    break;
                default:
                    // TODO print that we have no idea what the fuck happened
                    socket.write("we literally have no-idea what happened, please try again later");

                    break;
            }
        } else {
            // TODO print that we have no idea what the fuck happened
            socket.write("We literally have no-idea what happened, please try again later");
            // Print the message to the server console
            process.stdout.write(messageText);
        }
    });

    socket.on('error', function() {
        console.log(socket.name +' has disconnected due to error');
        data.unregisterClient(socket.handle);
        data.destroyConvoByClientHandle(socket.handle);
        // TODO notify the other client of session dying
    });

    socket.on('end', function() {
        console.log(socket.name +' has disconnected');
        data.unregisterClient(socket.handle);
        data.destroyConvoByClientHandle(socket.handle);
        // TODO notify the other client of session dying
    });
});

//serveddr.listen(4000, '23.96.82.19');
server.listen(4000, '0.0.0.0');

/*
///////////////////////////////////////////////
//             HTTP SERVER/API               //
///////////////////////////////////////////////
*/

var loggedIn = [];
var error;

app.get('/find', function(req, res) {
    var user = req.params('username');
    
    res.send({"users": loggedIn});
    //res.send("find");
});

app.post('/login', function(req, res) {
    req.on('data', function(data) {
        error = false;
        var bodyObject = JSON.parse(data);
        //Checking for duplicate names before storing
        for(var i = 0; i < loggedIn.length; i++) {
            if(loggedIn[i].username == bodyObject.username) {
                error = true;
                console.log("error: "+error);  
            }
        }
        if(!error)
            loggedIn.push(bodyObject);
    });
    req.on('end', function() {
        console.log("Request complete");
    });
    res.status(200).send({"users": loggedIn, "failed": error});
});

app.post('/logout', function(req,res) {
    req.on('data', function(data) {
        var bodyObject = JSON.parse(data);
        for(var i = 0; i < loggedIn.length; i++) {
            if(loggedIn[i].name === bodyObject.name) {
                loggedIn.splice(i,1);
            }
        }
    });
    req.on('end', function() {
        console.log("Request complete");
    });
    res.status(200).send("done");
});

app.listen(port, function() {
    console.log("server is listening on port "+port);
});


/*
///////////////////////////////////////////////
//                 FUNCTIONS                 //
///////////////////////////////////////////////
*/

function targetExists(sender) {
    clients.forEach(function (client) {
        if(sender.targetExists || client.handle == sender.target) {
            sender.targetExists = true;
            sender.target = client;
            return true;
        }else{
            return false;
        }
    });
};

function broadcastALL(message, sender) {
    clients.forEach(function (client) {
        if(client == sender) return;
        client.write(message);
    });
    process.stdout.write(message);
};

function broadcast(message, sender) {
    sender.pair.write(message);

    process.stdout.write(message);
};
