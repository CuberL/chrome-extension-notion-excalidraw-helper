// 保存选项到 Chrome storage
function saveOptions() {
  const scale = document.getElementById('scale').value;
  const embedFormat = document.getElementById('embedFormat').value;
  chrome.storage.sync.set(
    { 
      scale: parseInt(scale),
      embedFormat: embedFormat 
    },
    () => {
      const status = document.getElementById('status');
      status.classList.add('show');
      setTimeout(() => {
        status.classList.remove('show');
      }, 1500);
    }
  );
}

// 从 Chrome storage 恢复选项
function restoreOptions() {
  chrome.storage.sync.get(
    { 
      scale: 3,
      embedFormat: 'png' // 默认使用 PNG 格式
    },
    (items) => {
      document.getElementById('scale').value = items.scale;
      document.getElementById('embedFormat').value = items.embedFormat;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('scale').addEventListener('change', saveOptions);
document.getElementById('embedFormat').addEventListener('change', saveOptions);