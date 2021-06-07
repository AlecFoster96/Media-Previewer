import { checkQuery } from "./classes/Functions";
import {
  defaultSettings,
  getSettings,
  setSettings,
  Settings,
} from "./classes/Settings";
import { undoIcon } from "./config/icons";
import { ELP } from "./config/main";
import checkQueryTest from "./tests/checkQuery";
import "./css/settings.scss";

function runTests() {
  checkQueryTest();
}

document.addEventListener(
  "keydown",
  (keyEvent) => {
    if (!keyEvent || !keyEvent.code) return;

    if (keyEvent.code === "F9") {
      keyEvent.preventDefault();
      keyEvent.stopPropagation();

      runTests();
    }
  },
  true
);

let unsavedSettings: boolean = false;
function saveSettings() {
  const saveStatus =
    (document.querySelector("#save_status") as HTMLElement) || null;
  if (!saveStatus) return;

  let settingsToSave = Object.assign({}, defaultSettings);
  document
    .querySelectorAll(`input[data-setting], select[data-setting]`)
    .forEach((input) => {
      const inputElement = input as HTMLInputElement;
      const setting = input.getAttribute("data-setting")?.trim() || "";
      const type = input.getAttribute("type")?.trim() || "text";
      let newValue: string | number | boolean = inputElement.value;

      if (type === "checkbox") newValue = inputElement.checked;
      else if (["number", "range"].includes(type)) {
        newValue = Number(inputElement.value);
        if (isNaN(newValue)) return;
      }

      if (!setting || setting.length <= 0) return;

      if (Object.hasOwnProperty.call(settingsToSave, setting)) {
        if (settingsToSave[setting] !== newValue) {
          settingsToSave[setting] = newValue;
        }
      }
    });

  //console.log(ELP, "Saving settings!", settingsToSave);
  unsavedSettings = true;
  saveStatus.classList.value = "blue";

  setSettings(settingsToSave, () => {
    console.log(ELP, "Settings saved!");
    unsavedSettings = false;
    saveStatus.classList.value = "green";
    checkDefaults(settingsToSave);
  });
}

function formatter() {
  const darkModeCheckbox = document.querySelector(
    "#input_dark_mode"
  ) as HTMLInputElement | null;

  if (darkModeCheckbox) {
    let html = document.querySelector("html");
    if (html) {
      if (darkModeCheckbox.checked === true) {
        html.classList.add("darkMode");
        html.classList.remove("lightMode");
      } else {
        html.classList.add("lightMode");
        html.classList.remove("darkMode");
      }
    }
  }
}

function checkDefaults(settings: Settings) {
  for (const key in settings) {
    if (
      Object.hasOwnProperty.call(settings, key) &&
      Object.hasOwnProperty.call(defaultSettings, key)
    ) {
      const settingValue = settings[key];
      const defaultSettingValue = defaultSettings[key];
      //console.log(ELP, key, settingValue, defaultSettingValue);

      document
        .querySelectorAll(
          `label[data-setting="${key}"], p[data-setting="${key}"]`
        )
        .forEach((label) => {
          const labelElement = label as HTMLElement;
          const currentResetBtn =
            labelElement.querySelector(".resetSettingBtn");

          if (settingValue !== defaultSettingValue && !currentResetBtn) {
            let setToDefaultElement = document.createElement("span");
            setToDefaultElement.classList.add("resetSettingBtn");
            setToDefaultElement.setAttribute("title", "Reset to default");
            setToDefaultElement.innerHTML = undoIcon;

            setToDefaultElement.addEventListener("click", (event) => {
              event.preventDefault();
              setToDefault(key);
              setToDefaultElement.remove();
            });

            labelElement.append(setToDefaultElement);
          } else if (settingValue === defaultSettingValue && currentResetBtn) {
            currentResetBtn.remove();
          }
        });
    }
  }
}
function setToDefault(settingKey: string) {
  if (Object.hasOwnProperty.call(defaultSettings, settingKey)) {
    const defaultSettingValue = defaultSettings[settingKey];
    document
      .querySelectorAll(
        `input[data-setting="${settingKey}"], select[data-setting="${settingKey}"]`
      )
      .forEach((input) => {
        const inputElement = input as HTMLInputElement;
        const type = input.getAttribute("type")?.trim() || "text";
        const formatAttr = input.getAttribute("data-format");
        if (type === "checkbox") {
          inputElement.checked = Boolean(defaultSettingValue);
        } else {
          inputElement.value = String(defaultSettingValue);
        }
        if (formatAttr === "true") {
          formatter();
        }

        if (type === "checkbox") {
          const parent = inputElement.parentElement;

          if (parent) {
            if (checkQuery("label.switch", parent)) {
              let smearClass = "smear-left";
              if (Boolean(defaultSettingValue) === true) {
                smearClass = "smear-right";
              }
              parent.classList.add(smearClass);

              clearTimeout(smearTimeout);
              smearTimeout = setTimeout(() => {
                parent.classList.remove(smearClass);
              }, 400);
            }
          }
        }
      });

    saveSettings();
  }
}

window.addEventListener("beforeunload", (event) => {
  if (unsavedSettings) {
    // Cancel the event
    event.preventDefault(); // If you prevent default behavior in Firefox prompt will always be shown
    event.returnValue = ""; // Chromium requires returnValue to be set
  }
});

let saveTimeout: any = null;
let smearTimeout: any = null;
const saveStatus =
  (document.querySelector("#save_status") as HTMLElement) || null;

// Restores input and checkbox state using the stored settings
getSettings((settings) => {
  let html = document.querySelector("html");
  if (html) {
    if (settings.darkMode === true) {
      html.classList.add("darkMode");
      html.classList.remove("lightMode");
    } else {
      html.classList.add("lightMode");
      html.classList.remove("darkMode");
    }
  }

  for (const key in settings) {
    if (Object.hasOwnProperty.call(settings, key)) {
      const settingValue = settings[key];
      document
        .querySelectorAll(
          `input[data-setting="${key}"], select[data-setting="${key}"]`
        )
        .forEach((input) => {
          const inputElement = input as HTMLInputElement;
          const type = input.getAttribute("type")?.trim() || "text";
          const formatAttr = input.getAttribute("data-format");
          if (type === "checkbox") {
            inputElement.checked = Boolean(settingValue);
          } else {
            inputElement.value = String(settingValue);
          }
          if (formatAttr === "true") {
            formatter();
          }
        });
    }
  }
  checkDefaults(settings);
});

document
  .querySelectorAll("input[data-setting], select[data-setting]")
  .forEach((input) => {
    const inputElement = input as HTMLInputElement;
    const type = input.getAttribute("type")?.trim() || "text";
    const syncAttr = input.getAttribute("data-sync");
    const formatAttr = input.getAttribute("data-format");
    let syncInput = syncAttr
      ? (document.querySelector(`#${syncAttr}`) as HTMLInputElement | null)
      : null;

    input.addEventListener("input", () => {
      const newValue =
        type === "checkbox" ? inputElement.checked : inputElement.value;

      if (syncInput) {
        if (type === "checkbox") {
          syncInput.checked = Boolean(newValue);
        } else {
          syncInput.value = String(newValue);
        }
      }
      if (formatAttr === "true") {
        formatter();
      }

      if (type === "checkbox") {
        const parent = inputElement.parentElement;

        if (parent) {
          if (checkQuery("label.switch", parent)) {
            let smearClass = "smear-left";
            if (Boolean(newValue) === true) {
              smearClass = "smear-right";
            }
            parent.classList.add(smearClass);

            clearTimeout(smearTimeout);
            smearTimeout = setTimeout(() => {
              parent.classList.remove(smearClass);
            }, 400);
          }
        }
      }

      unsavedSettings = true;
      saveStatus.classList.value = "orange";

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveSettings();
      }, 750);

      console.log(ELP, "input changed!", newValue, inputElement?.checked);
    });
  });

//document.addEventListener("DOMContentLoaded", () => {});
