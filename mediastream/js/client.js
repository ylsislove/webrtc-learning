'use strict'

// device
var audioSource = document.querySelector("select#audioSource");
var audioOutput = document.querySelector("select#audioOutput");
var videoSource = document.querySelector("select#videoSource");

// filter
var filtersSelect = document.querySelector("select#filter");

// video
var videoPlayer = document.querySelector("video#player");
//var audioplayer = document.querySelector("audio#audioplayer");

// picture
var snapshot = document.querySelector("button#snapshot");
var picture = document.querySelector("canvas#picture");
picture.width = 320;
picture.height = 240;

// record
var recvideo = document.querySelector("video#recplayer");
var btnRecord = document.querySelector("button#record");
var btnPlay = document.querySelector("button#recplay");
var btnDownload = document.querySelector("button#download");
var buffer;
var mediaRecorder;

function gotMediaStream(stream) {
    window.stream = stream;
    videoPlayer.srcObject = stream;
    //audioplayer.srcObject = stream;
    return navigator.mediaDevices.enumerateDevices();
}

function handleError(err) {
    console.log(err.name + ' : ' + err.message);
}

function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log('enumerateDevices is not supported!');
        return;
    } else {
        var deviceId = videoSource.value;
        var constrants = {
            video: {
                width: 640,
                height: 480,
                frameRate: 30,
                facingMode: "environment",
                deviceId: deviceId ? deviceId : undefined
            },
            audio: {
                noiseSuppression: true,
                echoCancellation: true
            }
        } 
        
        navigator.mediaDevices.getUserMedia(constrants)
            .then(gotMediaStream)
            .then(gotDevices)
            .catch(handleError);
    }
}

function gotDevices(deviceInfos) {
    deviceInfos.forEach(deviceInfo => {

        console.log(deviceInfo.kind + ": label = "
                    + deviceInfo.label + ": id = "
                    + deviceInfo.deviceId + ": groupId = "
                    + deviceInfo.groupId);
        var option = document.createElement('option');
        option.text = deviceInfo.label;
        option.value = deviceInfo.deviceId;

        if (deviceInfo.kind === 'audioinput') {
            audioSource.appendChild(option)      
        } else if (deviceInfo.kind === 'audiooutput') {
            audioOutput.appendChild(option)
        } else if (deviceInfo.kind === 'videoinput') {
            videoSource.appendChild(option) 
        }
    });
}

start();

videoSource.onchange = start;

filtersSelect.onchange = function() {
    videoPlayer.className = filtersSelect.value;
}

snapshot.onclick = function() {
    picture.getContext('2d').drawImage(videoPlayer,
                                       0, 0,
                                       picture.width,
                                       picture.height);
}

function handleDataAvailable(e) {
    if (e && e.data && e.data.size > 0) {
        buffer.push(e.data);
    }
}

function startRecord() {
    buffer = [];
    var options = {
        mimeType: 'video/webm;codecs=vp8'
    }
    if (MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported!`);
        //return;
    }
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Failed to create MediaRecorder:', e);
        return;
    }

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);
}

function stopRecord() {
    mediaRecorder.stop();
}

btnRecord.onclick = () => {
    if (btnRecord.textContent === 'Start Record') {
        startRecord();
        btnRecord.textContent = 'Stop Record';
        btnPlay.disabled = true;
        btnDownload.disabled = true;
    } else {
        stopRecord();
        btnRecord.textContent = 'Start Record';
        btnPlay.disabled = false;
        btnDownload.disabled = false;
    }
}

btnPlay.onclick = () => {
    var blob = new Blob(buffer, {type: 'video/webm'});
    recvideo.src = window.URL.createObjectURL(blob);
    recvideo.srcObject = null;
    recvideo.controls = true;
    recvideo.play();
}

btnDownload.onclick = () => {
    var blob = new Blob(buffer, {type: 'video/webm'});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');

    a.href = url;
    a.style.display = 'none';
    a.download = 'aaa.webm';
    a.click();
}
