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

var TYPE_REGEX = /"type"\s*:\s*"(.+)"/;

clients = [];

app.use(morgan('dev'));

/*
/////////////////////////////////////////////
//              TCP SERVER                 //
/////////////////////////////////////////////
*/

var server = net.createServer(function(socket) {
    // Init the buffer @ 10KB
    var buff = new Buffer(10240),
        cursor = 0,
        messageEmitter = new events.EventEmitter();
    // Identify client
    socket.name = undefined;
    socket.targetExists = false;
    
    clients.push(socket);

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
        var typeRegexResults = TYPE_REGEX.exec(messageText);
        if (typeRegexResults) {
            var typeString = typeRegexResults[1];
            switch (typeString) {
                case 'identity':
                    // TODO parse the JSON and read the handle and name information
                    var message = JSON.parse(messageText);
                    socket.name = message.name;
                    socket.handle = message.handle;
                    break;
                case 'target':
                    // TODO parse the JSON and read the handle information
                    var message = JSON.parse(messageText);
                    socket.traget = message.target;
                    break;
                case 'videoframe':
                    // TODO pass off to target without doing JSON parse
                    if(targetExists(socket)) 
                        socket.target.write(messageText);
                    
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

    socket.on('end', function() {
        console.log(socket.name +' has disconnected');
        clients.splice(clients.indexOf(socket), 1);
        //console.log("people in client " +clients);
    });

    socket.write("connected");
    socket.pipe(socket);
});

//serveddr.listen(4000, '23.96.82.19');
server.listen(4000, '0.0.0.0');

/*
///////////////////////////////////////////////
//             HTTP SERVER/API               //
///////////////////////////////////////////////
*/

var loggedIn = [];

app.get('/find', function(req, res) {   
    res.send({"users": loggedIn});
    //res.send("find");
});

app.post('/login', function(req, res) {
    req.on('data', function(data) {
        var bodyObject = JSON.parse(data);
        loggedIn.push(bodyObject);
    });
    req.on('end', function() {
        console.log("Request complete"); 
    });   
    res.status(200).send("done");
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
