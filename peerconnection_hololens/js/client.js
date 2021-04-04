'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnConn = document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

var localStream;

var localPeerId = 'windows'
var remotePeerId = 'hololens'
// var socket = null;
var pc = null;
var state = 'init';

var timer = null

function sendMessage (data) {
    console.log('send p2p message', data);
    $.ajax({
        url: "https://ylsislove.com/data/" + remotePeerId,
        type: "POST",
        data: JSON.stringify(data),
        error: (err) => { console.log(err) }
    })
}

function processSenderMessage(data) {
    // offer
    if (data.type === 'offer') {
       // 
    }
    // answer
    else if (data.type === 'answer') {
        var answer = {
            MessageType: 2,
            Data: data.sdp,
            IceDataSeparator: ''
        }
        sendMessage(answer) 
    }
    // ice candidate
    else if (data.type === 'candidate') {
        var content = data.candidate.candidate
        var sdpMLineIndex = data.candidate.sdpMLineIndex
        var sdpMid = data.candidate.sdpMid
        var iceCandidate = {
            MessageType: 3,
            Data: content + '|' + sdpMLineIndex + '|' + sdpMid,
            IceDataSeparator: '|'
        }
        sendMessage(iceCandidate)
    
    } else {
        console.log('invalid message')
    }

}

function getMessage () {
    $.ajax({
        url: "https://ylsislove.com/data/" + localPeerId,
        type: "GET",
        success: (data) => {
            if (data) {
                data = JSON.parse(data)
                console.log(data)
                processReceiverMessage(data)
            }
        },
        error: (err) => { console.log(err) }
    })
}

function processReceiverMessage (data) {
    // offer
    if (data.MessageType === 1) {
        pc.signal({
            type: 'offer',
            sdp: data.Data
        }) 
    }
    // answer, 实际上在这个客户端不会收到answer
    // 因为HoloLens是发起方, 所以客户端只会收到offer
    else if (data.MessageType === 2) {
        //
    }
    // ice candidate
    else if (data.MessageType === 3) {
        var parts = data.Data.split(data.IceDataSeparator)
        var iceCandidate = {
            type: 'candidate',
            candidate: {
                candidate: parts[0],
                sdpMLineIndex: Number(parts[1]),
                sdpMid: parts[2]
            }
        }
        pc.signal(iceCandidate)
    
    } else {
        console.log('invalid message')
    }
}

function conn () {

    !pc && createPeerConnection();
    btnConn.disabled = true;
    btnLeave.disabled = false;

    timer = setInterval(getMessage, 500)
}

function start () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('the getUserMedia is not supported!');
        return;
    } else {
        var constraints = {
            video: true,
            audio: true
        }
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                localStream = stream;
                localVideo.srcObject = stream;
                conn()
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
    closePeerConnection();
    closeLocalMedia();
}

function createPeerConnection (isInitiator=false) {
    console.log('create simple peer!');
    if (!pc) {

        var pcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }] }

        var offerOptions = {
            offerToRecieveAudio: 1,
            offerToRecieveVideo: 1
        }

        pc = new SimplePeer({
            initiator: isInitiator,
            config: pcConfig,
            offerOptions: offerOptions,
            stream: localStream,
            trickle: true
        });

        // 发起者自动调的
        pc.on('signal', data => {
            // console.log(data);
            processSenderMessage(data)
        });

        pc.on('stream', stream => {
            console.log(stream)
            remoteVideo.srcObject = stream;
        });

        pc.on('error', err => {
            console.log(err);
            closePeerConnection();
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
