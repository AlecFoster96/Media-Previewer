import { WebExtensionsAPI } from "../config/interfaces";
import { ELP } from "../config/main";
import { Popup } from "./Popup";

export class KeyHandler {
  private browser: WebExtensionsAPI;
  private popup: Popup;
  public ctrlKeyPressed: boolean = false;

  constructor(browser: WebExtensionsAPI, popup: Popup) {
    this.browser = browser;
    this.popup = popup;
  }

  handle(keyEvent: KeyboardEvent) {
    if (keyEvent.ctrlKey && keyEvent.type === "keydown") {
      this.ctrlKeyPressed = true;
    } else if (!keyEvent.ctrlKey && keyEvent.type === "keyup") {
      this.ctrlKeyPressed = false;
    }
    //console.log(ELP, "CTRL pressed:", this.ctrlKeyPressed, keyEvent.type);
    if (keyEvent.type === "keyup") return; // we don't handle keyup (except for ctrlKeyPressed)

    if (!this.popup.mediaEnterData.media) {
      return;
    }

    if (!keyEvent || !keyEvent.code) {
      console.warn(ELP, "Missing elements or key event data!");
      return;
    }

    const mediaEnterDataMedia = this.popup.mediaEnterData.media;
    if (!mediaEnterDataMedia) {
      console.log(ELP, "No media enter data found!");
      return;
    }

    // if target is an input field, stop handling of key events
    const target = keyEvent.target as HTMLElement | null;
    if (
      target &&
      (target.getAttribute("contenteditable") === "true" ||
        ["input", "textarea", "select", "range", "checkbox", "radio"].includes(
          target.nodeName.toLowerCase()
        ))
    ) {
      console.log(ELP, "Input field focused, stopping handling of key events!");
      return;
    }

    // if any text is selected, stop handling of key events
    if (window.getSelection()?.type.toLowerCase() === "range") {
      console.log(ELP, "Text selected, stopping handling of key events!");
      return;
    }

    //if (mediaEnterDataMedia?.type === "video")
    if (
      [
        "KeyO", // open mediaUrl in new or same (when CTRL is pressed) tab
        "KeyL", // open mediaHref in new or same (when CTRL is pressed) tab
        "KeyF", // toggle media fill mode
        "KeyC", // hide/unhide cursor
      ].includes(keyEvent.code) ||
      ([
        "KeyM", // mute / unmute video
        "KeyR", // loop / un-loop video
        "Space", // play / pause video
        "ArrowUp", // video volume up
        "ArrowDown", // video volume down
        "ArrowLeft", // video time -5 seconds
        "ArrowRight", // video time +5 seconds
      ].includes(keyEvent.code) &&
        mediaEnterDataMedia?.type === "video")
    ) {
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      console.log(ELP, "Default key event prevented!");
    }

    // stop repeat events unless the keys are in the array below
    if (
      keyEvent.repeat === true &&
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        keyEvent.code
      )
    ) {
      console.log(ELP, "Stopped key repeat!");
      return;
    }

    switch (keyEvent.code) {
      case "KeyO":
        if (mediaEnterDataMedia?.url) {
          if (keyEvent.ctrlKey) {
            location.href = mediaEnterDataMedia?.url;
          } else {
            this.browser.runtime.sendMessage({
              newTabUrl: mediaEnterDataMedia?.url,
              active: keyEvent.shiftKey,
            });
          }
        }
        break;

      case "KeyL":
        if (mediaEnterDataMedia?.href) {
          if (keyEvent.ctrlKey) {
            location.href = mediaEnterDataMedia?.href;
          } else {
            this.browser.runtime.sendMessage({
              newTabUrl: mediaEnterDataMedia?.href,
              active: keyEvent.shiftKey,
            });
          }
        }
        break;

      case "KeyF":
        this.popup.toggleFillMode();
        break;

      case "KeyC":
        this.popup.hideCursor = !this.popup.hideCursor;
        break;

      case "KeyM":
        if (mediaEnterDataMedia?.type === "video") {
          let mediaPreview = this.popup.getPreviewVideo();
          if (mediaPreview) {
            mediaPreview.muted = mediaPreview.muted ? false : true;
            this.popup.videoMuted = mediaPreview.muted;
          }
        }
        break;

      case "KeyR":
        if (mediaEnterDataMedia?.type === "video") {
          let mediaPreview = this.popup.getPreviewVideo();
          if (mediaPreview) {
            mediaPreview.loop = mediaPreview.loop ? false : true;
            this.popup.videoLooping = mediaPreview.loop;
          }
        }
        break;

      case "Space":
        if (mediaEnterDataMedia?.type === "video") {
          let mediaPreview = this.popup.getPreviewVideo();
          if (mediaPreview) {
            if (mediaPreview.paused) mediaPreview.play();
            else mediaPreview.pause();
          }
        }
        break;

      case "ArrowUp":
        if (mediaEnterDataMedia?.type === "video") {
          this.popup.videoVolume += 5;
        }
        break;

      case "ArrowDown":
        if (mediaEnterDataMedia?.type === "video") {
          this.popup.videoVolume -= 5;
        }
        break;

      case "ArrowLeft":
        if (mediaEnterDataMedia?.type === "video") {
          let mediaPreview = this.popup.getPreviewVideo();
          if (mediaPreview) {
            mediaPreview.currentTime -= 5;
          }
        }
        break;

      case "ArrowRight":
        if (mediaEnterDataMedia?.type === "video") {
          let mediaPreview = this.popup.getPreviewVideo();
          if (mediaPreview) {
            mediaPreview.currentTime += 5;
          }
        }
        break;
    }
  }
}
