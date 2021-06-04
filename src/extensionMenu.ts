import { getBrowser } from "./classes/Functions";
import "./css/extension_menu.scss";

const browser = getBrowser();
//const manifestData = browser.runtime.getManifest();

document.querySelectorAll(`[data-action]`).forEach((button) => {
  const action = button.getAttribute("data-action") || "";
  button.addEventListener("click", (event) => {
    event.preventDefault();

    switch (action) {
      case "goto_settings":
        if (browser.runtime.openOptionsPage) {
          browser.runtime.openOptionsPage();
        } else {
          window.open(browser.runtime.getURL("settings.html"));
        }
        break;
    }
  });
});
