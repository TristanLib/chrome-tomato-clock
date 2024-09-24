document.addEventListener('DOMContentLoaded', function() {
  const timerDisplay = document.getElementById('timer');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const durationSelect = document.getElementById('durationSelect');

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
      } else {
        updateTimerDisplay(durationSelect.value * 60);
        startBtn.textContent = "开始";
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

  getStatus();
  setInterval(getStatus, 1000);
});