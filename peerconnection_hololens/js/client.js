'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnConn = document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

var localStream;

var roomid = '111111';
var socket = null;
var pc = null;
var state = 'init';

function sendMessage (roomid, data) {
    console.log('send p2p message', roomid, data);
    if (socket) {
        socket.emit('message', roomid, data);
    }
}

function conn () {
    socket = io.connect();

    socket.on('joined', (roomid, id) => {
        console.log('receive joined message:', roomid, id);
        state = 'joined';

        btnConn.disabled = true;
        btnLeave.disabled = false;

        console.log('receive joined message: state=', state);
    });

    socket.on('otherjoin', (roomid, id) => {
        console.log('receive otherjoin message:', roomid, id);
        state = 'joined_conn';
        console.log('receive otherjoin message: state=', state);

        // 媒体协商
        !pc && createPeerConnection();
        sendMessage(roomid, state);
    });

    socket.on('full', (roomid, id) => {
        console.log('receive full message:', roomid, id);
        state = 'leaved';
        console.log('receive full message: state=', state);
        socket.disconnect();
        alert('the room is full!');

        btnConn.disabled = false;
        btnLeave.disabled = true;
    });

    socket.on('leaved', (roomid, id) => {
        console.log('receive leaved message:', roomid, id);
        state = 'leaved';
        console.log('receive leaved message: state=', state);
        socket.disconnect();

        btnConn.disabled = false;
        btnLeave.disabled = true;
    });

    socket.on('bye', (roomid, id) => {
        console.log('receive bye message:', roomid, id);
        state = 'joined_unbind';
        closePeerConnection();
        console.log('receive bye message: state', state);
    });

    socket.on('message', (roomid, data) => {
        console.log('receive client message:', roomid, data);
        // 媒体协商
        if (data) {
            if (data === 'joined_conn' && !pc) {
                createPeerConnection();
            } else {
                // simple-peer封装了offer, answer和candidate
                pc.signal(data);
            }
        }
    });

    socket.emit('join', roomid);
    return;
}

function start () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('the getUserMedia is not supported!');
        return;
    } else {
        var constraints = {
            video: true,
            audio: false
        }
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                localStream = stream;
                localVideo.srcObject = stream;
                conn();
            })
            .catch(err => console.error('Failed to get Media Stream!', err));
    }
}

function closeLocalMedia () {
    if (localStream && localStream.getTracks()) {
        localStream.getTracks().forEach((track) => {
            track.stop();
        })
    }
    localStream = null;
}

function leave () {
    if (socket) {
        socket.emit('leave', roomid);
    }
    closePeerConnection();
    closeLocalMedia();
}

function createPeerConnection () {
    console.log('create simple peer!');
    if (!pc) {
        var pcConfig = {
            'iceServers': [{
                'urls': 'turn:yaindream.com:3478',
                'credential': '123456',
                'username': 'wy'
            }, {
                'urls': 'stun:yaindream.com:3478',
                'credential': '123456',
                'username': 'wy'
            }]
        }

        var offerOptions = {
            offerToRecieveAudio: 0,
            offerToRecieveVideo: 1
        }

        pc = new SimplePeer({
            initiator: location.hash === '#1',
            config: pcConfig,
            offerOptions: offerOptions,
            stream: localStream,
            trickle: true
        });

        // 发起者自动调的
        pc.on('signal', data => {
            // console.log(data);
            sendMessage(roomid, data);
        })

        pc.on('stream', stream => {
            console.log(stream);
            remoteVideo.srcObject = stream;
        })
    }
}

function closePeerConnection () {
    console.log('close simple peer!');
    if (pc) {
        pc.destroy();
        pc = null;
    }
}

btnConn.onclick = start;
btnLeave.onclick = leave;
