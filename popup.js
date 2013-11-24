function clear() {
  chrome.storage.local.clear();

  chrome.tabs.reload(function(){});
  window.close();
};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementsByTagName("button")[0].addEventListener("click", clear, false);
});
