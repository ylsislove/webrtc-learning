'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnConn = document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

// var offer = document.querySelector('textarea#offer');
// var answer = document.querySelector('textarea#answer');

var localStream;

var roomid = '111111';
var socket = null;
var pc = null;
var state = 'init';

function sendMessage(roomid, data) {
    console.log('send p2p message', roomid, data);
    if (socket) {
        socket.emit('message', roomid, data);
    }
}

function getAnswer(desc) {
    pc.setLocalDescription(desc);
    // send desc to signal
    sendMessage(roomid, desc);
}

function handleAnswerError(err) {
    console.error('Failed to create answer:', err);
}

function getOffer(desc) {
    pc.setLocalDescription(desc);
    // send desc to signal
    sendMessage(roomid, desc);
}

function handleOfferError(err) {
    console.error('Failed to create offer:', err);
}

// function call() {
//     if (state === 'joined_conn' && pc) {
        
//     //     pc.createOffer(offerOptions)
//     //         .then(getOffer)
//     //         .catch(handleOfferError);
//     }
// }

function conn() {
    socket = io.connect();

    socket.on('joined', (roomid, id) => {
        console.log('receive joined message:', roomid, id);
        state = 'joined';

        // createPeerConnection();

        btnConn.disabled = true;
        btnLeave.disabled = false;

        console.log('receive joined message: state=', state);
    });

    socket.on('otherjoin', (roomid, id) => {
        console.log('receive otherjoin message:', roomid, id);
        if (state === 'joined_unbind') {
            // createPeerConnection();
        }
        state = 'joined_conn';
        console.log('receive otherjoin message: state=', state);

        // 媒体协商
        // call();
        createPeerConnection();
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
                
            } else if (data.type === 'offer') {
                // pc.setRemoteDescription(new RTCSessionDescription(data));
                // pc.createAnswer()
                //     .then(getAnswer)
                //     .catch(handleAnswerError);
                pc.signal(data);

            } else if (data.type === 'answer') {
                // pc.setRemoteDescription(new RTCSessionDescription(data));
                pc.signal(data);

            } else if (data.type === 'candidate') {
                // var candidate = new RTCIceCandidate({
                //     sdpMLineIndex: data.label,
                //     candidate: data.candidate
                // });
                // pc.addIceCandidate(candidate);
                pc.signal(data);
            } else {
                console.error('the message is invalid', data);
            }
        }
    });

    socket.emit('join', roomid);

    return;
}

function getMediaStream(stream) {
    localStream = stream;
    localVideo.srcObject = stream;

    conn();
}

function handleError(err) {
    console.error('Failed to get Media Stream!', err)
}

function connSignalServer() {
    // 开启本地视频
    start();

    return true;
}

function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('the getUserMedia is not supported!');
        return;
    } else {
        var constraints = {
            video: true,
            audio: false
        }
        navigator.mediaDevices.getUserMedia(constraints)
            .then(getMediaStream)
            .catch(handleError);
    }
}

function closeLocalMedia() {
    if (localStream && localStream.getTracks()) {
        localStream.getTracks().forEach((track) => {
            track.stop();
        })
    }
    localStream = null;
}

function leave() {
    if (socket) {
        socket.emit('leave', roomid);
    }

    closePeerConnection();
    closeLocalMedia();
}

function createPeerConnection() {
    console.log('create SimplePeer!');
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

        // pc = new RTCPeerConnection(pcConfig);

        // pc.onicecandidate = (e) => {
        //     if (e.candidate) {
        //         // console.log('find an new candidate', e.candidate);
        //         sendMessage(roomid, {
        //             type: 'candidate',
        //             label: e.candidate.sdpMLineIndex,
        //             id: e.candidate.sdpMid,
        //             candidate: e.candidate.candidate
        //         });
        //     }
        // }

        // pc.ontrack = (e) => {
        //     remoteVideo.srcObject = e.streams[0];
        // }
    // }

    // if (localStream) {
        // localStream.getTracks().forEach((track) => {
        //     pc.addTrack(track, localStream);
        // })
    }
}

function closePeerConnection() {
    console.log('close RTCPeerConnection!');
    if (pc) {
        pc.close();
        pc = null;
    }
}

btnConn.onclick = connSignalServer;
btnLeave.onclick = leave;
