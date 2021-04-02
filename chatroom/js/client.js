'use strict'

var username = document.querySelector('input#username');
var inputRoom = document.querySelector('input#room');
var btnConnect = document.querySelector('button#connect');
var outputArea = document.querySelector('textarea#output');
var inputArea = document.querySelector('textarea#input');
var btnSend = document.querySelector('button#send');

var socket;
var room;

btnConnect.onclick = () => {
    // connect
    socket = io.connect();

    // recieve message
    socket.on('joined', (room, id) => {
        btnConnect.disabled = true;
        inputArea.disabled = false;
        btnSend.disabled = false;
    });

    socket.on('leaved', (room, id) => {
        btnConnect.disabled = false;
        inputArea.disabled = true;
        btnSend.disabled = true;
    });

    socket.on('message', (message) => {
        outputArea.value = outputArea.value + message + '\r';
    });

    // send message
    room = inputRoom.value;
    socket.emit('join', room);
}

btnSend.onclick = () => {
    var data = inputArea.value;
    data = username.value + ':' + data;
    socket.emit('message', data);
    inputArea.value = '';
}
