import { getBrowser, normalizeString, checkTagName } from "./classes/Functions";
import sites from "./config/sites/_loader";
import { Popup } from "./classes/Popup";
import { KeyHandler } from "./classes/KeyHandler";
import { MediaEnterData } from "./config/interfaces";
import "./css/style.scss";
import { getSettings } from "./classes/Settings";
import classNames from "./config/classNames";
import { ELP } from "./config/main";

// TODO: [v0.1.?] Try and remove the scrollbar spacing if image is scaled vertically [cosmetic]
// TODO: Finish sites/ifp_wpi.ts (try to bypass their secure token system) [requested site support]
// TODO: Show if "fill-mode"/"hide cursor"/"loop video"/"mute video" is active in popup title bar
// TODO: Listen for storage changes and update loaded settings (browser.storage.onChanged || https://developer.chrome.com/docs/extensions/reference/storage/#event-onChanged)
// FIXME: Fill-mode for video seems to give to add to much width, it still works but adds white borders
// TODO: Update fill-mode to use a setter and getter similar to videoVolume and the others

/*
  TODO: Settings to implement
    - Ignore hosts list (with ability to remove hosts from ignore list. Hosts cannot be added through the settings page, at least not at first)
    - Use fill-mode by default [default false]
    - Keep fill-mode on next images as well [default false]
    - Keep settings for current page load (volume changes, hide cursor, etc) [default true]
    - Customize key binds [v0.1.1]
*/

/*
  TODO: Make a base parser that can be used to resolve simple custom things using RegEx (similar to Imagus' Sieve thing)
  The getMouseEventPath function can be used to find mediaHref for the base parser. Maybe allow for options like "extensions", anchor class/id.
  e.g. Twitter: https://pbs.twimg.com/media/__MEDIA_ID__?format=jpg&name=small => https://pbs.twimg.com/media/__MEDIA_ID__?format=jpg&name=orig
*/

const browser = getBrowser();
const manifestData = browser.runtime.getManifest();

let popup: Popup | null = null;
let keyHandler: KeyHandler | null = null;
let viewerTimeout: any = null;

sites.filter((site) => {
  if (
    normalizeString(site.host) ===
    normalizeString(location.host.replace(/www[.]/i, ""))
  ) {
    getSettings((settings) => {
      console.log(
        ELP,
        `Loaded ${manifestData.name} (v${manifestData.version})`
      );
      popup = new Popup(browser, "body", settings);
      keyHandler = new KeyHandler(browser, popup);

      document.addEventListener(
        "keydown",
        (keyEvent) => {
          //console.log(ELP, `New event: keydown`);
          keyHandler?.handle(keyEvent);
        },
        true
      );
      document.addEventListener(
        "keyup",
        (keyEvent) => {
          //console.log(ELP, `New event: keyup`);
          keyHandler?.handle(keyEvent);
        },
        true
      );

      document.addEventListener("mousemove", (mouseEvent) => {
        if (popup && (popup.contextmenuOpen || popup.preventPopup)) {
          popup.contextmenuOpen = false;
          popup.preventPopup = false;
        }

        /* console.log(
          ELP,
          `New event: mousemove`,
          mouseEvent.clientX,
          mouseEvent.clientY
        ); */
        const mediaEnterData = Object.assign(
          {},
          popup ? popup.mediaEnterData : {}
        ) as MediaEnterData;

        if (popup?.mediaEnterData.boundingClientRect) {
          // popup is active, check if cursor is outside hovered media
          const mousePos = {
            x: mouseEvent.x,
            y: mouseEvent.y,
          };
          const targetX = mediaEnterData.boundingClientRect?.x || 0;
          const targetY = mediaEnterData.boundingClientRect?.y || 0;
          const targetWidth = mediaEnterData.boundingClientRect?.width || 0;
          const targetHeight = mediaEnterData.boundingClientRect?.height || 0;

          if (
            mousePos.x < targetX ||
            mousePos.x > targetX + targetWidth ||
            mousePos.y < targetY ||
            mousePos.y > targetY + targetHeight
          ) {
            popup?.close();
          } else {
            popup?.centerToCursor(mousePos);
          }
        } else {
          if (keyHandler?.ctrlKeyPressed === true) return;

          clearTimeout(viewerTimeout);
          viewerTimeout = setTimeout(() => {
            if (keyHandler?.ctrlKeyPressed === true) return;

            // popup is not active, check if it should be activated
            const path = mouseEvent.composedPath() as HTMLElement[];
            const overMediaViewer = path.find((currentPath) => {
              const classList = Array.from(currentPath?.classList || []);
              return classList.includes(classNames.popup);
            });
            if (!overMediaViewer && mouseEvent.target && popup) {
              const boundingClientRect = (
                mouseEvent.target as HTMLElement
              ).getBoundingClientRect();

              popup.mediaEnterData = {
                boundingClientRect: boundingClientRect,
                media: null,
              };
              const result = site.mouseMoveFunction(mouseEvent);
              if (result) {
                //console.log(ELP, Object.assign({}, result));
                popup?.show(
                  result,
                  {
                    x: mouseEvent.x,
                    y: mouseEvent.y,
                  },
                  true
                );
              } else {
                popup?.close();
              }
            }
          }, settings.popupDelay);
        }
      });

      document.addEventListener(
        "mousedown",
        (event) => {
          if (!popup) return;
          if (!popup.mediaEnterData.media) return;

          const mouseEvent = event as MouseEvent;
          const currentMedia = popup.mediaEnterData.media;
          //console.log(ELP, mouseEvent);

          switch (mouseEvent.button) {
            case 0:
              popup.handleMouseAction(
                currentMedia.type === "video"
                  ? settings.leftClickAction_videos
                  : settings.leftClickAction_images,
                mouseEvent,
                currentMedia
              );
              break;

            case 1:
              popup.handleMouseAction(
                currentMedia.type === "video"
                  ? settings.middleClickAction_videos
                  : settings.middleClickAction_images,
                mouseEvent,
                currentMedia
              );
              break;

            case 2:
              popup.handleMouseAction(
                currentMedia.type === "video"
                  ? settings.rightClickAction_videos
                  : settings.rightClickAction_images,
                mouseEvent,
                currentMedia
              );
              break;
          }
        },
        true
      );

      document.addEventListener(
        "mouseup",
        () => {
          if (popup) popup.preventContextmenu = false;
        },
        true
      );

      window.addEventListener(
        "wheel",
        (event) => {
          if (!popup) return;

          //console.log(ELP, `New event: wheel`, event.deltaY);
          if (
            settings.scrollAction !== "default" &&
            popup.mediaEnterData.media?.type === "video"
          ) {
            event.preventDefault();
            const videoElement = popup.getPreviewVideo();

            if (!videoElement || settings.scrollAction === "none") return;

            switch (settings.scrollAction) {
              case "change_video_time":
                if (event.deltaY < 0) videoElement.currentTime += 5;
                else if (event.deltaY > 0) videoElement.currentTime -= 5;
                break;

              case "change_video_volume":
                if (videoElement.muted) videoElement.muted = false;

                let newVolume = popup.videoVolume;
                if (event.deltaY < 0) newVolume += 5;
                else if (event.deltaY > 0) newVolume -= 5;
                popup.videoVolume = newVolume;
                break;
            }
          } else {
            popup.close();
          }
        },
        { passive: false }
      );

      /* window.addEventListener("scroll", () => {
        //console.log(ELP, `New event: scroll`);
        //popup?.close();
      }); */

      window.addEventListener("focus", () => {
        //console.log(ELP, `New event: focus`);
        if (popup) popup.preventPopup = false;
      });
      window.addEventListener("blur", () => {
        //console.log(ELP, `New event: blur`);
        if (popup) {
          popup.preventPopup = true;
          popup.close();
        }
      });

      document.addEventListener("mouseenter", () => {
        //console.log(ELP, `New event: mouseenter`);
        if (popup) popup.preventPopup = false;
      });
      document.addEventListener("mouseleave", () => {
        //console.log(ELP, `New event: mouseleave`);
        console.log(ELP, "ran close popup, due to mouseleave");
        if (popup) {
          popup.preventPopup = true;
          popup.close();
        }
      });
      /* window.addEventListener("mouseout", (mouseEvent) => {
        //console.log(ELP, `New event: mouseout`);
        if (!mouseEvent.relatedTarget) {
          console.log(ELP, "ran close popup, due to mouseout");
          popup?.close();
        }
      }); */

      document.addEventListener("contextmenu", (event) => {
        if (popup && popup.preventContextmenu) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }

        if (event && event.target) {
          const targetElement = event.target as HTMLElement;
          const parent = targetElement.parentElement;

          if (parent) {
            const targetClassList = Array.from(targetElement?.classList || []);
            const parentClassList = Array.from(parent?.classList || []);

            const isSpinner = checkTagName("spinner", targetElement);
            const parentIsContainer = parentClassList.includes(
              classNames.loadingContainer
            );
            const targetIsContainer = targetClassList.includes(
              classNames.loadingContainer
            );

            if ((isSpinner && parentIsContainer) || targetIsContainer) {
              console.log(ELP, "Prevented default contextmenu from opening!");
              event.preventDefault();
            }
          }
        }
        if (popup) popup.contextmenuOpen = true;
        return;
      });

      document.addEventListener("visibilitychange", () => {
        //console.log(ELP, `New event: visibilitychange`);
        if (document.visibilityState !== "visible") {
          popup?.close();
        }
      });
    });

    return true;
  } else {
    return false;
  }
});
