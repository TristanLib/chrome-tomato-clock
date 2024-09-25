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
  floatDiv.addEventListener('contextmenu', showContextMenu, false);
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
    updateInfoPosition();
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function updateInfoPosition() {
  const infoDiv = document.getElementById('pomodoro-float-info');
  const floatDiv = document.getElementById('pomodoro-float');
  const rect = floatDiv.getBoundingClientRect();
  infoDiv.style.top = `${rect.bottom + 10}px`;
  infoDiv.style.left = `${rect.left}px`;
}

function toggleInfo() {
  const infoDiv = document.getElementById('pomodoro-float-info');
  if (infoDiv.style.display === 'none') {
    updateInfoContent();
    updateInfoPosition();
    infoDiv.style.display = 'block';
  } else {
    infoDiv.style.display = 'none';
  }
}

function updateInfoContent() {
  const infoDiv = document.getElementById('pomodoro-float-info');
  chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
    if (response.isRunning) {
      infoDiv.textContent = `剩余时间：${formatTime(response.timeLeft)}`;
      updateFloatTimer(response.timeLeft);
    } else {
      infoDiv.textContent = '番茄钟未启动';
      updateFloatTimer(0);
    }
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showContextMenu(e) {
  e.preventDefault();
  const contextMenu = document.createElement('div');
  contextMenu.id = 'pomodoro-context-menu';
  contextMenu.style.position = 'fixed';
  contextMenu.style.zIndex = '10000';
  contextMenu.style.backgroundColor = '#fff';
  contextMenu.style.border = '1px solid #ccc';
  contextMenu.style.padding = '5px';
  contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  const hideOption = document.createElement('div');
  hideOption.textContent = '隐藏图标';
  hideOption.style.cursor = 'pointer';
  hideOption.style.padding = '5px';
  
  hideOption.addEventListener('click', () => {
    removeFloatingIcon();
    chrome.storage.sync.set({floatEnabled: false});
  });
  
  contextMenu.appendChild(hideOption);
  document.body.appendChild(contextMenu);
  
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;
  
  document.addEventListener('click', removeContextMenu, {once: true});
}

function removeContextMenu() {
  const contextMenu = document.getElementById('pomodoro-context-menu');
  if (contextMenu) {
    contextMenu.remove();
  }
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
    if (document.getElementById('pomodoro-float-info').style.display !== 'none') {
      updateInfoContent();
    }
  } else if (request.action === "showAlert") {
    alert(request.message);
  }
  return true;
});

function removeFloatingIcon() {
  const floatDiv = document.getElementById('pomodoro-float');
  const infoDiv = document.getElementById('pomodoro-float-info');
  if (floatDiv) floatDiv.remove();
  if (infoDiv) infoDiv.remove();
  removeContextMenu();
}

// 定期更新信息内容
setInterval(() => {
  if (document.getElementById('pomodoro-float-info').style.display !== 'none') {
    updateInfoContent();
  }
}, 1000);