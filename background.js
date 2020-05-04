var firebaseConfig = {
    apiKey: "*",
    databaseURL: "*",
    storageBucket: "*"
};

// Initialize Firebases
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

var globalRoomId = '';
var isHost;
var activeRequest = false;

chrome.runtime.onMessage.addListener(receiveMsg);

function receiveMsg(message, sender, sendResponse) {
    if (message.txt === "bgcreate") {
        createParty();
    }
    else if (message.txt === "bgjoin") {
        joinParty(message.id);
    }
    else if (message.txt === "bgsync") {
        requestSync(message.id);
    }
    else if (message.txt === "datarequest") {
        sendResponse({id: globalRoomId, host: isHost});
    }
    else if (message.txt === "validroom") {
        db.ref(`rooms/${message.id}`).once("value", function(snapshot) {
            if (snapshot.exists() && message.id) {
                chrome.runtime.sendMessage({txt: "success"});
                joinParty(message.id)
            }
            else {
                chrome.runtime.sendMessage({txt: "error"});
            }
        })
    }
    else if (message.txt === "partyleave") {
        partyLeave();
    }
    else if (message.txt === "partydelete") {
        partyDelete();
    }
}

function createParty() {
    var charBank = 'ABCDEFGHIJKLMNOPQRSTUVXYZ0123456789';
    for (i=0; i<6; i++) {
        var index = Math.floor(Math.random()*35)
        globalRoomId += charBank.charAt(index);
    };

    writeFBData(globalRoomId, {syncTime: '', videoUrl: ''}, 0);

    var path = `rooms/${globalRoomId}/syncReq`;

    db.ref(path).on("value", function(snapshot) {
        if (snapshot.val() === 1) { 
            sendSyncTime(globalRoomId) 
        }
        else if (snapshot.val() === null) { 
            globalRoomId = '';
            db.ref(path).off("value");
        };
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    isHost = true;
    chrome.runtime.sendMessage({id: globalRoomId});
}

function joinParty(roomId) {
    var path = `rooms/${roomId}/syncData`;
    isHost = false;
    globalRoomId = roomId;

    db.ref(path).on("value", function(snapshot) {
        if (snapshot.val() === null) {
            globalRoomId = '';
            db.ref(path).off("value");
        }
        else if (activeRequest) {
            syncVideo(snapshot.val())
        };
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function syncVideo(syncData) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var urlElements = (syncData.videoUrl).split(/[&?]/);
        for (var i=0; i<urlElements.length; i++) {
            if (urlElements[i].includes('v=')) {
                var videoId = urlElements[i];
            }
        }
        var localUrlElements = (tabs[0].url).split(/[&?]/);
        for (var i=0; i<localUrlElements.length; i++) {
            if (localUrlElements[i].includes('v=')) {
                var localVideoId = localUrlElements[i];
            }
        }
        if (localVideoId === videoId) {
            chrome.tabs.sendMessage(tabs[0].id, {subject: "setSync", time: syncData.syncTime});
        }
        else {
            var url = `https://youtube.com/watch?${videoId}&feature=youtu.be&t=${Math.round(syncData.syncTime)}`; 
            chrome.tabs.update(
                tabs[0].id,
                {url: url}
            );
        }
        activeRequest = false;
    });
}

function requestSync(roomId) {
    activeRequest = true;
    updateFBData(roomId, '', 1);
}

function sendSyncTime(roomId) {

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if ((tabs[0].url).includes("youtube.com/watch")) {
            chrome.tabs.sendMessage(tabs[0].id, {subject: "getSync"}, function(response) {
                try {
                    updateFBData(roomId, {syncTime: response.syncTime, videoUrl: tabs[0].url}, 0);
                }
                catch (error) {
                    console.log(error);
                    updateFBData(roomId, '', 0);
                }
            });
        }
        else {
            updateFBData(roomId, '', 0);
        }
    });
}

function partyLeave() {
    var path = `rooms/${globalRoomId}/syncData`;
    db.ref(path).off("value");
    globalRoomId = '';
    isHost = null;
    activeRequest = false;
}

function partyDelete() {
    var path = `rooms/${globalRoomId}`;
    db.ref(path).remove();
    globalRoomId = '';
    isHost = null;
}

function writeFBData(roomId, syncData, syncReq) {
    db.ref('rooms/' + roomId).set({
        syncData: {syncTime: syncData.syncTime, videoUrl: syncData.videoUrl},
        syncReq: syncReq
    });
}

function updateFBData(roomId, syncData, syncReq) {
    var roomData = {};
    if (syncData) {roomData.syncData = {syncTime: syncData.syncTime, videoUrl: syncData.videoUrl}}
    if (syncReq || syncReq === 0) {roomData.syncReq = syncReq};
    db.ref('rooms/' + roomId).update(roomData);
}