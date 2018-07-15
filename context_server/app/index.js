'use strict';
process.title = 'dashboard';
var WebSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');
var request = require('request');

var webSocketsServerPort = 1337;
var fileCounter = 0;
var recordUserData = false;
var debug = true;
var history = [ ]; // message history
var clients = [ ]; // list of currently connected clients(users)

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
});
server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + ' Server is listening on port ' +
        webSocketsServerPort)
});
/**
 * WebSocket server
 */
var wsServer = new WebSocketServer({
    // http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});
var download = function (uri, filename, callback) {
    var string = uri;// "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
    var regex = /^data:.+\/(.+);base64,(.*)$/;

    var matches = string.match(regex);
    var ext = matches[1];
    var data = matches[2];
    var buffer = new Buffer(data, 'base64');
    fs.writeFileSync('screenshot' + (fileCounter++) + '.' + ext, buffer)
    /*
      request.head(uri, function(err, res, body){
        //console.log('content-type:', res.headers['content-type']);
        //console.log('content-length:', res.headers['content-length']);
          if(err) console.log("Error:",err);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
      });
      */
};

var AppendFile = function (name, content) {
    fs.appendFile(name, content, function (err) {
        if (err) throw err;
        if (debug) console.log('Saved!')
    })
};
var StoreHeatMap = function (m, name) {
    if (debug) console.log('Store Heatmap', m, name);
    var obj = {
        time: (new Date()).getTime(),
        img_url: m
    };
    // var l = JSON.parse(m);
    // console.log(l);
    // fs.appendFileSync('ScreenshotHistory.txt',obj.toString());
    var line = m + ' \r\n';
    AppendFile('heatMap' + name + '.json', line)
};

var StoreScreenShot = function (m) {
    var obj = {
        time: (new Date()).getTime(),
        img_url: m
    };

    // fs.appendFileSync('ScreenshotHistory.txt',obj.toString());
    var line = obj.time.toString() + ';' + '\r\n' + '\r\n' + obj.img_url + '\r\n' + '\r\n' + '\r\n';
    AppendFile('ScreenshotHistory.csv', line);
    download(obj.img_url, obj.time + '.png', function () {
        console.log('png save done')
    })
};
// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' +
        request.origin + '.');
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = 'username';
    if (debug) console.log((new Date()) + ' Connection accepted.');
    if (history.length > 0) {
        connection.sendUTF(
            JSON.stringify({type: 'history', data: history}))
    }
    // user sent some message
    connection.on('message', function (message) {
        // var id = id || "";
        // var userName = userName || "";
        console.log('raw Message: ', message);
        if (message.type === 'binary') {
            message = String.fromCharCode.apply(null, new Uint16Array(message.binaryData))
        } else {
            var userName_ = '';
            userName = 'unknown';
            if (message.utf8Data.split('@').length > 2) {
                userName_ = message.utf8Data.split('@')[2];
                userName = message.utf8Data.split('@')[2]
            }
            var type = message.utf8Data.split('@')[0];
            message = message.utf8Data.split('@')[1];

            if (type === 'screenshot') {
                if (recordUserData) StoreScreenShot(message);
                return
            } else if (type === 'heatmap') {
                if (recordUserData) StoreHeatMap(message, userName_);
                return
            }
        }
        console.log('message from', userName);
        var obj = {
            time: (new Date()).getTime(),
            text: htmlEntities(message),
            author: userName
        };
        // fs.appendFileSync('History.txt',obj.toString());
        var line = obj.time.toString() + ';' + obj.author.toString() + ';' + obj.text.toString() + ';\r\n';
        if (recordUserData) {
            fs.appendFile('AppEventHistory.csv', line, function (err) {
                if (err) throw err;
                if (debug) console.log('Saved!')
            })
        }
        history.push(obj);
        var json2 = JSON.stringify({type: 'message', data: message, author: userName});
        for (var i = 0; i < clients.length; i++) {
            // if (clients[i] != message.origin)
            clients[i].sendUTF(json2)
        }
        // }
    });
    // user disconnected
    connection.on('close', function (connection) {
        if (userName !== false) {
            console.log((new Date()) + ' Peer ' +
                connection.remoteAddress + ' disconnected.')
            // clients.splice(index, 1);
        }
    })
});
