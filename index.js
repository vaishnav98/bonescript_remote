var io = require('socket.io-client');
var fs = require('fs');

var _bonescript = {};
_bonescript.modules = {};
_bonescript._callbacks = {};
_bonescript._seqnum = 0;
_bonescript.on = {};
_bonescript.on.connect = function () {
    console.log('Server : connect');
};
_bonescript.on.connecting = function () {
    console.log('server: connecting');
};
_bonescript.on.disconnect = function () {
    // console.log('Server Disconnected: check whether server is up and the authentication details are correct');
};
_bonescript.on.connect_failed = function () {
    console.log('server : connect_failed');
};
_bonescript.on.error = function () {
    //console.log('server: error');
};
_bonescript.on.reconnect = function () {
    // console.log('server: reconnect');
};
_bonescript.on.reconnect_failed = function () {
    console.log('server: reconnect_failed');
};
_bonescript.on.reconnecting = function () {
    // console.log('server: reconnecting');
};
_bonescript.on.initialized = function (filepath) {
    console.log('initialized');

};
module.exports.runRemoteModule = function (user, pass, filepath, targetDetails) {
    var _onSocketIOLoaded = function () {
        var socket;
        var address;
        var options = {}
        if (targetDetails.isHTTPS) {
            address = 'https://' + targetDetails.address + ':' + targetDetails.port;
            options.secure = true;
            options.reconnect = true;
            options.rejectUnauthorized = false;
            socket = io.connect(address, options);
        } else {
            address = 'http://' + targetDetails.address + ':' + targetDetails.port;
            socket = io.connect(address);
        }
        socket.on('require', getRequireData);
        socket.on('bonescript', _seqcall);
        socket.on('connect', function () {
            socket.emit('authentication', {
                username: user,
                password: pass
            });
        });
        socket.on('connecting', _bonescript.on.connecting);
        socket.on('disconnect', _bonescript.on.disconnect);
        socket.on('connect_failed', _bonescript.on.connect_failed);
        socket.on('error', _bonescript.on.error);
        socket.on('reconnect', _bonescript.on.reconnect);
        socket.on('reconnect_failed', _bonescript.on.reconnect_failed);
        socket.on('reconnecting', _bonescript.on.reconnecting);
        socket.on('initialized', _bonescript.on.initialized);

        function getRequireData(m) {
            if (!m.module || !m.data)
                throw ('Invalid "require" message sent for "' + m.module + '"');
            _bonescript.modules[m.module] = {};
            for (var x in m.data) {
                if (!m.data[x].type || !m.data[x].name || (typeof m.data[x].value == 'undefined'))
                    throw ('Invalid data in "require" message sent for "' + m.module + '.' + m.data[x] + '"');
                if (m.data[x].type == 'function') {
                    // define the function
                    if (!m.data[x].value)
                        throw ('Missing args in "require" message sent for "' + m.module + '.' + m.data[x] + '"');
                    var myargs = m.data[x].value;

                    // eval of objString builds the call data out of arguments passed in
                    var objString = '';
                    for (var y in myargs) {
                        if (isNaN(y)) continue; // Need to find the source of this bug
                        if (myargs[y] == 'callback') continue;
                        objString += ' if(typeof ' + myargs[y] + ' == "function") {\n';
                        objString += '  ' + myargs[y] + ' = ' + myargs[y] + '.toString();\n';
                        objString += ' }\n';
                        objString += ' calldata.' + myargs[y] + ' = ' + myargs[y] + ';\n';
                    }
                    var argsString = myargs.join(', ');
                    var handyfunc = '_bonescript.modules["' + m.module + '"].' + m.data[x].name +
                        ' = ' +
                        'function (' + argsString + ') {\n' +
                        ' var calldata = {};\n' +
                        objString +
                        ' if(callback) {\n' +
                        '  _bonescript._callbacks[_bonescript._seqnum] = callback;\n' +
                        '  calldata.seq = _bonescript._seqnum;\n' +
                        '  _bonescript._seqnum++;\n' +
                        ' }\n' +
                        ' socket.emit("' + m.module + '$' + m.data[x].name + '", calldata);\n' +
                        '};\n';
                    eval(handyfunc);
                } else {
                    _bonescript.modules[m.module][m.data[x].name] = m.data[x].value;
                }
            }
            _bonescript.modules[m.module].socket = socket;
            _bonescript.on.initialized(filepath);
        }
    }
    var _seqcall = function (data) {
        if ((typeof data.seq != 'number') || (typeof _bonescript._callbacks[data.seq] != 'function'))
            throw "Invalid callback message received: " + JSON.stringify(data);
        _bonescript._callbacks[data.seq](data);
        if (data.oneshot) delete _bonescript._callbacks[data.seq];
    }
    var require = function (module) {
        if (typeof _bonescript.modules[module] == 'undefined')
            throw 'Module "' + module + '" is not currently available';
        return (_bonescript.modules[module]);
    };
    var runModule = function (filepath) {
        try {
            var script = fs.readFileSync(filepath, 'ascii');
            eval(script);
        } catch (ex) {
            console.log('***FAIL*** ' + ex);
            process.exit(-2);
        }

    }

    _bonescript.on.initialized = runModule;
    _onSocketIOLoaded();
}