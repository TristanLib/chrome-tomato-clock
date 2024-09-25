document.addEventListener('DOMContentLoaded', function() {
  const timerDisplay = document.getElementById('timer');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const durationSelect = document.getElementById('durationSelect');
  const floatToggle = document.getElementById('floatToggle');
  const statusDisplay = document.getElementById('status');

  function updateTimerDisplay(timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function getStatus() {
    chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
      if (response.isRunning) {
        updateTimerDisplay(response.timeLeft);
        startBtn.textContent = "暂停";
        statusDisplay.textContent = "专注中...";
      } else {
        updateTimerDisplay(durationSelect.value * 60);
        startBtn.textContent = "开始";
        statusDisplay.textContent = response.timeLeft === 0 ? "时间到！" : "";
      }
    });
  }

  startBtn.addEventListener('click', () => {
    if (startBtn.textContent === "开始") {
      chrome.runtime.sendMessage({ action: "startTimer", duration: parseInt(durationSelect.value) });
    } else {
      chrome.runtime.sendMessage({ action: "pauseTimer" });
    }
    getStatus();
  });

  resetBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "resetTimer" });
    getStatus();
  });

  durationSelect.addEventListener('change', getStatus);

  floatToggle.addEventListener('change', function() {
    chrome.storage.sync.set({floatEnabled: this.checked}, function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "toggleFloat",
          enabled: floatToggle.checked
        });
      });
    });
  });

  chrome.storage.sync.get(['floatEnabled'], function(result) {
    floatToggle.checked = result.floatEnabled || false;
  });

  getStatus();
  setInterval(getStatus, 1000);
});