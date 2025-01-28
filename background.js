chrome.action.onClicked.addListener(() => {
  const url = "https://chat.deepseek.com/";
  chrome.tabs.create({ url });
});
