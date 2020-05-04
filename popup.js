var roomId = '';
var isHost;

document.getElementById("createParty").addEventListener("click", createParty);
document.getElementById("joinParty").addEventListener("click", joinParty);
document.getElementById("syncVideo").addEventListener("click", //sendContent);
    () => chrome.runtime.sendMessage({txt: "bgsync", id: roomId}));
document.getElementById("leavePartyJ").addEventListener("click", leaveParty);
document.getElementById("leavePartyC").addEventListener("click", leaveParty);
document.getElementById("roomId").addEventListener("click", 
    function () { 
        document.getElementById("roomId").style.color = "gray";
        document.getElementById("roomId").style.borderColor = "gray";
    });
document.getElementById("copyButtonJ").addEventListener("click", copyText);
document.getElementById("copyButtonC").addEventListener("click", copyText);

reqData();
function reqData() {
    chrome.runtime.sendMessage({txt: "datarequest"}, function(response) {
        roomId = response.id
        isHost = response.host;
        if ((response.id != '') && response.host) {
            loadCreateParty(response.id);
        }
        else if ((response.id != '') && !response.host) {
            loadJoinParty(response.id);
        }
        else {
            loadHome();
        }
    });
}

function leaveParty() {
    chrome.runtime.sendMessage({txt: "datarequest"}, function(response) {
        roomId = response.id
        isHost = response.host;
        if (isHost) {
            chrome.runtime.sendMessage({txt: "partydelete"});
        }
        else {
            chrome.runtime.sendMessage({txt: "partyleave"});
        }
        reqData();
    });
}

function loadHome() {
    pageContent = document.getElementsByClassName("pageContent");
    for (i = 0; i < pageContent.length; i++) {
        pageContent[i].style.display = "none";
    }
    document.getElementById("homePage").style.display = "block";
}

function loadJoinParty() {
    pageContent = document.getElementsByClassName("pageContent");
    for (i = 0; i < pageContent.length; i++) {
        pageContent[i].style.display = "none";
    }
    document.getElementById("joinPage").style.display = "block";
    document.getElementById("roomIdLabelJ").innerHTML = roomId;
}

function joinParty() {
    roomId = (document.getElementById("roomId").value).toUpperCase()
    chrome.runtime.sendMessage({txt: "validroom", id: roomId})

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.txt === "success") {
            reqData();
            loadJoinParty();
        }
        else if (request.txt === "error") {
            loadHome();
            document.getElementById("roomId").style.borderColor = "red";
            document.getElementById("roomId").style.color = "red";
        }
    })
}

function loadCreateParty(roomId) {
    pageContent = document.getElementsByClassName("pageContent");
    for (i = 0; i < pageContent.length; i++) {
        pageContent[i].style.display = "none";
    }
    document.getElementById("createPage").style.display = "block";
    document.getElementById("roomIdLabelC").innerHTML = roomId;
}

function createParty() {
    chrome.runtime.sendMessage({txt: "bgcreate"});

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        roomId = request.id;
        loadCreateParty(roomId)
    })
}

function copyText() {
    window.prompt("Copy to clipboard: Ctrl+C, Enter", roomId);
}