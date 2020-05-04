chrome.runtime.onMessage.addListener(handleMsg);

function handleMsg(request, sender, sendResponse) {
  if (request.subject === "getSync") {
    var htmlVideoPlayer = document.getElementsByTagName('video')[0];
    sendResponse({ syncTime: (htmlVideoPlayer.currentTime).toString() });
  }
  else if (request.subject === "setSync") {
    var htmlVideoPlayer = document.getElementsByTagName('video')[0];
    htmlVideoPlayer.currentTime = parseFloat(request.time);
  }
}