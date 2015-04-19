var clientMap       = {};
var clientConvoMap  = {};
var convoMap        = {};
var convos          = [];
var convoCounter    = 1000;

exports.findClient = function(handle) {
    return clientMap[handle] || null;
};

exports.registerClient = function(handle, socket) {
    if (clientMap[handle]) return false;
    clientMap[handle] = socket;
    return true;
};

exports.unregisterClient = function(handle) {
    if (clientMap[handle]) {
        clientMap[handle] = undefined;
        delete clientMap[handle];
        return true;
    }
    return false;
};

exports.clientIsInConvo = function(handle) {
    return !!(clientConvoMap[handle]);
};

exports.findConvo = function(convoId) {
    return convoMap[convoId] || null;
};

exports.createConvo = function(handle1, handle2) {
    var convoId = convoCounter++;
    var convo = {
        id: convoId,
        clients: [handle1, handle2]
    };
    clientConvoMap[handle1] = convo;
    clientConvoMap[handle2] = convo;
    convos.push(convoId);
    convoMap[convoId] = convo;
    return convoId;
};

exports.findConvoByClientHandle = function(handle) {
    if (clientConvoMap[handle]) {
        return clientConvoMap[handle];
    } else {
        return null;
    }
};

exports.destroyConvoByClientHandle = function(handle) {
    if (clientConvoMap[handle]) {
        var handle1 = clientConvoMap[handle].clients[0],
            handle2 = clientConvoMap[handle].clients[1],
            convoId = clientConvoMap[handle].id;
        clientConvoMap[handle1] = undefined;
        clientConvoMap[handle2] = undefined;
        convoMap[convoId] = undefined;
        delete clientConvoMap[handle1];
        delete clientConvoMap[handle2];
        delete convoMap[convoId];
        // Find and remove convo from array
        var i = convos.indexOf(convoId);
        if (i !== -1) {
            convos.splice(i, 1);
        }
        return true;
    } else {
        return false;
    }
};
