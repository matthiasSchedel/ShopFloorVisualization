var frontend = {
    debug:false,
    connection:null,
    clientName:"graphViz",
    handleMessages:null,
    socket_url:"ws://0.0.0.0:1337"
};
"use strict";
window.WebSocket = window.WebSocket || window.MozWebSocket;
if (!window.WebSocket) {
    if(frontend.debug) { console.log("Sorry, but your browser doesn't support WebSocket."); }
}
// open connection
frontend.connection = new WebSocket(frontend.socket_url);
frontend.connection.onopen = function () {
    if(frontend.debug) { console.log("connection opened"); }
};
   
frontend.connection.onerror = function (error) {
    console.error("Error on connection", error);
};
// handle incoming messages
frontend.connection.onmessage = function (message) {
    if (frontend.debug) {console.log("recieved message:",message); }
    try {
        var json = JSON.parse(message.data);
    } catch (e) {
        if (frontend.debug) {console.log("Invalid JSON: ", message.data);}
        return;
    }
    if (frontend.debug) { console.log("json of message:", json); }
    if(frontend.handleMessages) frontend.handleMessages(json.data); 
    /*
    if (json.type === "history") { // entire message history
        for (var i=0; i < json.data.length; i++) {
            addMessage(json.data[i].author, json.data[i].text,
                new Date(json.data[i].time));
        }
        } else if (json.type === "message") { // it's a single message
            addMessage(json.data.author, json.data.text, new Date(json.data.time));
        } else {
            console.log("unknown json", json);
        }
    */
};
frontend.SendScreenShot = function(img)
{
    frontend.connection.send('screenshot@' + img +"@"+'name');
}

frontend.SendHeatMap = function(map,name)
{
    frontend.connection.send('heatmap@' + map +"@"+name);
}

frontend.doSend = function (id,name)
{
    frontend.connection.send('@' + id +"@"+name);
};
//mx interval for connecting 
setInterval(function() {
    if (frontend.connection.readyState !== 1) {
        console.error("Error: Unable to communicate with the WebSocket server.");
    }
}, 100000);

//log message 
function addMessage(author, message, dt) {
   if(frontend.debug) { console.log("message:" , message); }
}  

  