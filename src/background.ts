import { getBrowser } from "./classes/Functions";

const browser = getBrowser();
const manifestData = browser.runtime.getManifest();
let tabsCreated = 0;

browser.tabs.onActivated.addListener(() => {
  tabsCreated = 0;
});

browser.runtime.onMessage.addListener((message) => {
  const newTabUrl = message?.newTabUrl;
  const active = [true, false].includes(message?.active)
    ? message?.active
    : false;

  if (newTabUrl) {
    browser.tabs.query({ active: true, currentWindow: true }, (foundTabs) => {
      const currentTab = foundTabs.length > 0 ? foundTabs[0] : null;
      if (currentTab) {
        tabsCreated++;
        browser.tabs.create({
          url: newTabUrl,
          active: active,
          openerTabId: currentTab.id,
          windowId: currentTab.windowId,
          index: currentTab.index + tabsCreated,
        });
      }
    });
  }
});

(manifestData.manifest_version === 3
  ? browser.action
  : browser.browserAction
).onClicked.addListener(() => {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL("settings.html"));
  }
});
