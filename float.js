let dragItem = null;
let active = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

chrome.storage.sync.get(['floatEnabled'], function(result) {
  if (result.floatEnabled) {
    createFloatingIcon();
  }
});

function createFloatingIcon() {
  const floatDiv = document.createElement('div');
  floatDiv.id = 'pomodoro-float';
  floatDiv.innerHTML = '🍅<span id="float-timer"></span>';
  document.body.appendChild(floatDiv);

  const infoDiv = document.createElement('div');
  infoDiv.id = 'pomodoro-float-info';
  document.body.appendChild(infoDiv);

  dragItem = floatDiv;
  dragItem.addEventListener("mousedown", dragStart, false);
  document.addEventListener("mousemove", drag, false);
  document.addEventListener("mouseup", dragEnd, false);

  floatDiv.addEventListener('click', toggleInfo);
}

function updateFloatTimer(timeLeft) {
  const floatTimer = document.getElementById('float-timer');
  if (floatTimer) {
    const minutes = Math.floor(timeLeft / 60);
    floatTimer.textContent = minutes.toString();
  }
}

function dragStart(e) {
  if (e.target === dragItem) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    active = true;
  }
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;
  active = false;
}

function drag(e) {
  if (active) {
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    setTranslate(currentX, currentY, dragItem);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function toggleInfo() {
  const infoDiv = document.getElementById('pomodoro-float-info');
  if (infoDiv.style.display === 'none') {
    chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
      if (response.isRunning) {
        infoDiv.textContent = `剩余时间：${formatTime(response.timeLeft)}`;
        updateFloatTimer(response.timeLeft);
      } else {
        infoDiv.textContent = '番茄钟未启动';
        updateFloatTimer(0);
      }
      infoDiv.style.display = 'block';
    });
  } else {
    infoDiv.style.display = 'none';
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleFloat") {
    if (request.enabled) {
      createFloatingIcon();
    } else {
      removeFloatingIcon();
    }
    sendResponse({success: true});
  } else if (request.action === "updateTimer") {
    updateFloatTimer(request.timeLeft);
  }
  return true;
});

function removeFloatingIcon() {
  const floatDiv = document.getElementById('pomodoro-float');
  const infoDiv = document.getElementById('pomodoro-float-info');
  if (floatDiv) floatDiv.remove();
  if (infoDiv) infoDiv.remove();
}