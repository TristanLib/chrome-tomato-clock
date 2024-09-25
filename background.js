let timer = null;
let timeLeft = 25 * 60;
let isRunning = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startTimer") {
    startTimer(request.duration);
    sendResponse({ isRunning, timeLeft });
  } else if (request.action === "pauseTimer") {
    pauseTimer();
    sendResponse({ isRunning, timeLeft });
  } else if (request.action === "resetTimer") {
    resetTimer();
    sendResponse({ isRunning, timeLeft });
  } else if (request.action === "getStatus") {
    sendResponse({ isRunning, timeLeft });
  }
  return true;
});

function startTimer(duration) {
  if (!isRunning) {
    isRunning = true;
    timeLeft = duration * 60;
    updateBadge();
    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateBadge();
      } else {
        clearInterval(timer);
        isRunning = false;
        // 使用 alert 提醒用户
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "showAlert", message: "番茄钟时间到！休息一下吧。"});
        });
        // 创建通知
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "番茄钟",
          message: "时间到！休息一下吧。",
          buttons: [{ title: "再来一轮" }]
        });
        updateBadge();
      }
    }, 1000);
  }
}

// Add a listener for notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {  // "再来一轮" button
    startTimer(25);  // Start a new 25-minute timer
  }
});

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  updateBadge();
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  timeLeft = 25 * 60;
  updateBadge();
}

function updateBadge() {
  chrome.action.setBadgeText({ text: Math.floor(timeLeft / 60).toString() });
  
  // Add this new code to send a message to content scripts
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: "updateTimer", timeLeft: timeLeft });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});