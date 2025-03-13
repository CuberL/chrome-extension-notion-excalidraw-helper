// 保存选项到 Chrome storage
function saveOptions() {
  const scale = document.getElementById('scale').value;
  chrome.storage.sync.set(
    { scale: parseInt(scale) },
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
    { scale: 3 }, // 默认值为 3x
    (items) => {
      document.getElementById('scale').value = items.scale;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('scale').addEventListener('change', saveOptions);