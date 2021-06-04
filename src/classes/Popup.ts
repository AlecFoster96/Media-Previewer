import {
  MediaData,
  MediaEnterData,
  Position,
  WebExtensionsAPI,
} from "../config/interfaces";
import { checkTagName, clamp, getMediaOrientation } from "./Functions";
import { CacheManager } from "./CacheManager";
import { Fetcher } from "./Fetcher";
import { MouseAction, Settings } from "./Settings";
import classNames from "../config/classNames";
import { ELP } from "../config/main";
import { pauseIcon, playIcon } from "../config/icons";

export class Popup {
  public element: HTMLElement;
  public currentMediaId: string | null = null;
  public mediaEnterData: MediaEnterData = {
    boundingClientRect: null,
    media: null,
  };
  public cacheManager: CacheManager;
  public contextmenuOpen: boolean = false;
  public preventContextmenu: boolean = false;
  public preventPopup: boolean = false;
  public videoLooping: boolean;

  private _videoVolume: number = 1;
  private _hideCursor: boolean = true;
  private _videoMuted: boolean = false;
  //public fillMode: boolean = false; // TODO:

  private browser: WebExtensionsAPI;
  private settings: Settings;
  private volumeChangePopupTimeout: any = null;
  private playPausePopupTimeout: any = null;
  private currentMouseCenterPos: Position = {
    x: 0,
    y: 0,
  };

  constructor(
    browser: WebExtensionsAPI,
    containerQuery: string,
    settings: Settings
  ) {
    this.browser = browser;
    this.settings = settings;
    this.cacheManager = new CacheManager();
    this.element = document.createElement("div");
    this.element.classList.add(classNames.popup);
    if (this.settings.darkMode) {
      this.element.classList.add("darkMode");
    }

    let container = document.querySelector(containerQuery);
    if (container && !this.existsInDOM()) {
      let loadingElement = document.createElement("div");
      loadingElement.innerHTML = `<spinner></spinner><p>Loading...</p>`;
      loadingElement.classList.add(classNames.loadingContainer);

      let previewElement = document.createElement("div");
      previewElement.classList.add(classNames.preview);

      let titleElement = document.createElement("p");
      titleElement.textContent =
        "Media title goes here test really long title test to see if it works as expected or if it messes up when it shouldn't mess up, I really hope this works a intended, but man I really need to add a massive title, since the font size is so small, probably should have thought about that... huh...";
      titleElement.classList.add(classNames.previewTitle);

      this.element.append(loadingElement);
      this.element.append(previewElement);
      this.element.append(titleElement);
      container.append(this.element);
    }

    this.videoVolume = this.settings.videoVolume;
    this.videoLooping = this.settings.loopVideos;
    this.videoMuted = this.settings.videoMuted;
    this.hideCursor = this.settings.hideCursor;
  }

  public existsInDOM(): boolean {
    return document.querySelector(`.${classNames.popup}`) !== null
      ? true
      : false;
  }

  public get(): HTMLElement | null {
    return document.querySelector(`.${classNames.popup}`);
  }
  public getPreview(): HTMLElement | null {
    return document.querySelector(`.${classNames.preview}`);
  }
  public getPreviewImg(): HTMLImageElement | null {
    return document.querySelector(`.${classNames.preview} img`);
  }
  public getPreviewVideo(): HTMLVideoElement | null {
    return document.querySelector(`.${classNames.preview} video`);
  }
  public getPreviewTitle(): HTMLElement | null {
    return document.querySelector(`.${classNames.previewTitle}`);
  }

  public get videoMuted(): boolean {
    return this._videoMuted;
  }
  public set videoMuted(newValue: boolean) {
    this._videoMuted = newValue;
    const videoElement = this.getPreviewVideo();

    if (videoElement) {
      videoElement.muted = this._videoMuted;
    }
  }
  public get videoVolume(): number {
    return this._videoVolume;
  }
  public set videoVolume(newValue: number) {
    this._videoVolume = clamp(newValue, 0, 100);
    this.videoMuted = false;
    const videoElement = this.getPreviewVideo();

    if (videoElement) {
      videoElement.volume = clamp(this.videoVolume / 100, 0, 1);
    }
  }

  public get hideCursor(): boolean {
    return this._hideCursor;
  }
  public set hideCursor(newValue: boolean) {
    //console.log(ELP, "hideCursor set:", newValue);
    this._hideCursor = newValue;
    const popupElement = this.get();

    if (popupElement) {
      if (this._hideCursor) {
        popupElement.classList.add("hideCursor");
      } else {
        popupElement.classList.remove("hideCursor");
      }
    }
  }

  public centerToCursor(cursorPos?: Position): void {
    const popup = this.get();
    const htmlElement = document.querySelector("html");

    if (popup && htmlElement) {
      if (cursorPos) {
        this.currentMouseCenterPos = Object.assign({}, cursorPos);
      } else {
        cursorPos = Object.assign({}, this.currentMouseCenterPos);
      }

      let scrollbarWidth = window.innerWidth - htmlElement.clientWidth;
      if (scrollbarWidth < 0) scrollbarWidth = 0;
      if (scrollbarWidth > 100) scrollbarWidth = 0;

      const boundingClientRect = popup.getBoundingClientRect();
      const top = clamp(
        cursorPos.y - boundingClientRect.height / 2,
        0,
        window.innerHeight - boundingClientRect.height
      );
      const left = clamp(
        cursorPos.x - boundingClientRect.width / 2,
        0,
        window.innerWidth - boundingClientRect.width - scrollbarWidth
      );
      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
    }
  }

  public close(): void {
    this.currentMediaId = null;
    this.mediaEnterData = {
      boundingClientRect: null,
      media: null,
    };

    let popup = this.get();
    if (popup) {
      popup.classList.remove("show");
      popup.removeAttribute("data-id");
      popup.style.top = ``;
      popup.style.left = ``;

      let mediaPreview = this.getPreview();
      let mediaPreviewTitle = this.getPreviewTitle();
      if (mediaPreview) mediaPreview.innerHTML = "";
      if (mediaPreviewTitle) mediaPreviewTitle.innerHTML = "";
    }
  }

  public handleMouseAction(
    action: MouseAction,
    mouseEvent: MouseEvent,
    media: MediaData
  ) {
    const hrefToOpen = media.href || media.url;
    const urlToOpen = media.url;

    let mediaElement: HTMLImageElement | HTMLVideoElement | null = null;
    if (media.type === "video") {
      mediaElement = this.getPreviewVideo();
    } else {
      mediaElement = this.getPreviewImg();
    }

    if (!mediaElement) return;

    if (action !== "default") {
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      this.preventContextmenu = true;
      //console.log(ELP, action);
    } else {
      return;
    }

    switch (action) {
      case "toggle_fill_mode":
        this.toggleFillMode();
        break;

      case "open_media_href_in_new_tab":
        this.browser.runtime.sendMessage({
          newTabUrl: hrefToOpen,
          active: mouseEvent.shiftKey,
        });
        break;

      case "open_media_href_in_same_tab":
        location.href = hrefToOpen;
        break;

      case "open_media_url_in_new_tab":
        this.browser.runtime.sendMessage({
          newTabUrl: urlToOpen,
          active: mouseEvent.shiftKey,
        });
        break;

      case "open_media_url_in_same_tab":
        location.href = urlToOpen;
        break;

      case "play_pause_video":
        if (media.type === "video" && checkTagName("video", mediaElement)) {
          if ((mediaElement as HTMLVideoElement).paused) {
            (mediaElement as HTMLVideoElement).play();
          } else {
            (mediaElement as HTMLVideoElement).pause();
          }
        }
        break;

      case "toggle_mute":
        if (media.type === "video" && checkTagName("video", mediaElement)) {
          this.videoMuted = !this.videoMuted;
        }
        break;
    }
  }

  public show(mediaList: MediaData[], mousePos: Position, firstRun = true) {
    if (this.preventPopup) {
      this.close();
      return;
    }

    if (mediaList && mediaList.length > 0) {
      const foundCacheData = this.cacheManager.get(mediaList[0].id);
      const currentMedia = foundCacheData ? foundCacheData : mediaList[0];
      let mediaViewerPopup: HTMLElement | null = null;

      if (firstRun) {
        mediaViewerPopup = this.get();
        this.currentMediaId = currentMedia.id;
        console.log(ELP, "show popup for media:", currentMedia.id);
      } else {
        mediaViewerPopup = this.get();
      }

      if (this.currentMediaId !== currentMedia.id) {
        console.log(
          ELP,
          "stop current popup showing!",
          this.currentMediaId,
          currentMedia.id
        );
        return;
      }

      if (mediaViewerPopup) {
        if (
          this.contextmenuOpen &&
          firstRun &&
          !mediaViewerPopup.classList.contains("loading")
        ) {
          console.log(
            ELP,
            `stop popup for media: ${currentMedia.id}, due to contextmenu!`
          );
          this.close();
          return;
        }

        mediaViewerPopup.classList.add("show");
        mediaViewerPopup.classList.add("loading");
        this.centerToCursor(mousePos);
      }

      if (!foundCacheData) {
        // remove first element from media array (if not using cached data)
        mediaList.shift();
      }

      Fetcher.fetch(currentMedia.url, currentMedia.type)
        .then((mediaElement) => {
          if (this.currentMediaId !== currentMedia.id) {
            return;
          }
          if (this.preventPopup) {
            this.close();
            return;
          }

          let mediaWidth = mediaElement.width;
          let mediaHeight = mediaElement.height;

          if (currentMedia.type === "video") {
            mediaWidth = (mediaElement as HTMLVideoElement).videoWidth;
            mediaHeight = (mediaElement as HTMLVideoElement).videoHeight;
            //mediaElement.setAttribute("controls", "");
            if (this.videoLooping) {
              mediaElement.setAttribute("loop", "");
            }
          }

          if (
            currentMedia.minWidth !== undefined &&
            mediaWidth < currentMedia.minWidth
          ) {
            throw new Error("Found media width is too small!");
          }
          if (
            currentMedia.minHeight !== undefined &&
            mediaHeight < currentMedia.minHeight
          ) {
            throw new Error("Found media height is too small!");
          }

          if (!foundCacheData) {
            this.cacheManager.add(currentMedia);
          }

          console.log(
            ELP,
            "found",
            foundCacheData ? "cached" : "",
            "media info!",
            currentMedia.url,
            "|| remaining:",
            mediaList.length,
            mediaWidth,
            mediaHeight
          );
          this.mediaEnterData.media = Object.assign({}, currentMedia);

          if (mediaViewerPopup) {
            mediaViewerPopup.classList.remove("loading");

            let mediaPreview = this.getPreview();
            let mediaPreviewTitle = this.getPreviewTitle();
            if (mediaPreview) {
              mediaPreview.innerHTML = "";
              mediaPreview.append(mediaElement);

              if (mediaPreviewTitle) {
                if (currentMedia.title) {
                  mediaPreviewTitle.innerHTML = `<strong>${mediaWidth}</strong><span style="padding: 0 1px;">x</span><strong>${mediaHeight}</strong><spacer></spacer>${currentMedia.title}`;
                } else {
                  mediaPreviewTitle.innerHTML = `<strong>${mediaWidth}</strong><span style="padding: 0 1px;">x</span><strong>${mediaHeight}</strong>`;
                }
              }

              if (currentMedia.type === "video") {
                const progressBar = document.createElement("div");
                const progress = document.createElement("div");
                progressBar.classList.add("progressBar");
                progress.classList.add("progress");
                progressBar.append(progress);
                mediaPreview.append(progressBar);

                (mediaElement as HTMLVideoElement).addEventListener(
                  "timeupdate",
                  () => {
                    const currentTime = (mediaElement as HTMLVideoElement)
                      .currentTime;
                    const currentDuration = (mediaElement as HTMLVideoElement)
                      .duration;
                    const currentProgress = clamp(
                      (currentTime / currentDuration) * 100,
                      0,
                      100
                    );
                    progress.style.width = `${String(currentProgress)}%`;
                  }
                );
                (mediaElement as HTMLVideoElement).addEventListener(
                  "volumechange",
                  () => {
                    let volumePopup =
                      mediaPreview?.querySelector(".volumePopup");
                    if (!volumePopup) {
                      volumePopup = document.createElement("div");
                      volumePopup.classList.add("volumePopup");
                      volumePopup.classList.remove("fadeOut");
                      volumePopup.classList.add("fadeIn");
                      mediaPreview?.append(volumePopup);
                    }

                    if (this.videoMuted) {
                      volumePopup.innerHTML = `<strong>Muted</strong>`;
                    } else {
                      volumePopup.innerHTML = `<strong>Volume:</strong> ${String(
                        this.videoVolume
                      )}%`;
                    }

                    clearTimeout(this.volumeChangePopupTimeout);
                    this.volumeChangePopupTimeout = setTimeout(() => {
                      volumePopup?.classList.remove("fadeIn");
                      volumePopup?.classList.add("fadeOut");

                      setTimeout(() => {
                        volumePopup?.remove();
                      }, 350);
                    }, 1500);
                  }
                );

                (mediaElement as HTMLVideoElement).addEventListener(
                  "play",
                  () => {
                    let playPausePopup =
                      mediaPreview?.querySelector(".playPausePopup");
                    if (!playPausePopup) {
                      playPausePopup = document.createElement("div");
                      playPausePopup.classList.add("playPausePopup");
                      playPausePopup.classList.remove("fadeOut");
                      playPausePopup.classList.add("fadeIn");
                      mediaPreview?.append(playPausePopup);
                    }

                    playPausePopup.innerHTML = playIcon;
                    if (playPausePopup) {
                      let svg = playPausePopup.querySelector("svg");
                      if (svg) svg.style.left = "5px";
                    }

                    clearTimeout(this.playPausePopupTimeout);
                    this.playPausePopupTimeout = setTimeout(() => {
                      playPausePopup?.classList.remove("fadeIn");
                      playPausePopup?.classList.add("fadeOut");

                      setTimeout(() => {
                        playPausePopup?.remove();
                      }, 350);
                    }, 1000);
                  }
                );

                // add pause icon if paused
                if ((mediaElement as HTMLVideoElement).paused) {
                  let playPausePopup =
                    mediaPreview?.querySelector(".playPausePopup");
                  if (!playPausePopup) {
                    playPausePopup = document.createElement("div");
                    playPausePopup.classList.add("playPausePopup");
                    playPausePopup.classList.remove("fadeOut");
                    playPausePopup.classList.add("fadeIn");
                    mediaPreview?.append(playPausePopup);
                  }

                  playPausePopup.innerHTML = pauseIcon;
                  clearTimeout(this.playPausePopupTimeout);
                }

                (mediaElement as HTMLVideoElement).addEventListener(
                  "pause",
                  () => {
                    let playPausePopup =
                      mediaPreview?.querySelector(".playPausePopup");
                    if (!playPausePopup) {
                      playPausePopup = document.createElement("div");
                      playPausePopup.classList.add("playPausePopup");
                      playPausePopup.classList.remove("fadeOut");
                      playPausePopup.classList.add("fadeIn");
                      mediaPreview?.append(playPausePopup);
                    }

                    playPausePopup.innerHTML = pauseIcon;
                    clearTimeout(this.playPausePopupTimeout);

                    /* clearTimeout(this.playPausePopupTimeout);
                    this.playPausePopupTimeout = setTimeout(() => {
                      playPausePopup?.classList.remove("fadeIn");
                      playPausePopup?.classList.add("fadeOut");

                      setTimeout(() => {
                        playPausePopup?.remove();
                      }, 350);
                    }, 1000); */
                  }
                );

                const currentVideo = this.getPreviewVideo();
                if (currentVideo) {
                  currentVideo.volume = clamp(this.videoVolume / 100, 0, 1);
                  currentVideo.muted = this.videoMuted;
                  currentVideo.play().catch(() => {
                    console.log(ELP, "Cannot autoplay!");
                  });
                }
              }

              this.centerToCursor(mousePos);
            }
          }

          //currentMediaId = null;
        })
        .catch(() => {
          if (this.preventPopup) {
            this.close();
            return;
          }

          if (foundCacheData) {
            console.log(ELP, "Removing bad cache data and starting fresh");
            this.cacheManager.remove(currentMedia.id);
          }
          //console.log(ELP, error);
          if (mediaList.length > 0) {
            this.show(mediaList, mousePos, false);
          } else {
            this.close();
          }
        });
    } else {
      this.close();
    }
  }

  public toggleFillMode() {
    const mediaEnterDataMedia = this.mediaEnterData.media;
    if (!mediaEnterDataMedia) {
      console.log(ELP, "No media enter data found!");
      return;
    }

    if (!mediaEnterDataMedia?.type) {
      console.log(ELP, "Media type could not be found in media enter data!");
      return;
    }

    const mediaType = mediaEnterDataMedia?.type || "img";
    //getMediaOrientation
    const popupElement = this.get();
    const mediaElement =
      mediaType === "img" ? this.getPreviewImg() : this.getPreviewVideo();
    const htmlElement = document.querySelector("html");
    const popupBoundingClientRect = popupElement?.getBoundingClientRect();

    if (popupBoundingClientRect && mediaElement && htmlElement) {
      const mediaOrientation = getMediaOrientation(mediaElement);
      //const screenOrientation = getScreenOrientation();

      let scrollbarWidth = window.innerWidth - htmlElement.clientWidth;
      if (scrollbarWidth < 0) scrollbarWidth = 0;
      if (scrollbarWidth > 100) scrollbarWidth = 0;

      let mediaWidth = mediaElement.width;
      let mediaHeight = mediaElement.height;

      if (checkTagName("video", mediaElement)) {
        mediaWidth = (mediaElement as HTMLVideoElement).videoWidth;
        mediaHeight = (mediaElement as HTMLVideoElement).videoHeight;
      }

      // accounts for padding and info bar
      const widthOffset = popupBoundingClientRect.width - mediaWidth;
      const heightOffset = popupBoundingClientRect.height - mediaHeight;

      //console.log(ELP, widthOffset, heightOffset);

      let aspectRatio = mediaHeight / mediaWidth;
      let maxWidth = mediaWidth;
      let maxHeight = mediaHeight;

      if (mediaOrientation === "landscape") {
        maxWidth = window.innerWidth - widthOffset - scrollbarWidth;
        maxHeight = maxWidth * aspectRatio;

        if (maxHeight + heightOffset > window.innerHeight) {
          aspectRatio = mediaWidth / mediaHeight;
          maxHeight = window.innerHeight - heightOffset - scrollbarWidth;
          maxWidth = maxHeight * aspectRatio;
        }
      } else {
        aspectRatio = mediaWidth / mediaHeight;
        maxHeight = window.innerHeight - heightOffset - scrollbarWidth;
        maxWidth = maxHeight * aspectRatio;

        if (maxWidth + widthOffset > window.innerWidth) {
          aspectRatio = mediaHeight / mediaWidth;
          maxWidth = window.innerWidth - widthOffset - scrollbarWidth;
          maxHeight = maxWidth * aspectRatio;
        }
      }

      if (mediaElement.style.height === "" && mediaElement.style.width === "") {
        /* console.log(ELP,
            aspectRatio,
            mediaWidth,
            mediaHeight,
            "||",
            maxWidth,
            maxHeight
          ); */

        mediaElement.style.maxHeight = `calc(100vh - var(--title-height) - var(--preview-spacing) - var(--popup-padding) * 2)`;
        mediaElement.style.maxWidth = `calc(100vw - ${scrollbarWidth}px - var(--popup-padding) * 2)`;
        mediaElement.style.height = `${maxHeight}px`;
        mediaElement.style.width = `${maxWidth}px`;
      } else {
        mediaElement.style.height = "";
        mediaElement.style.width = "";
        mediaElement.style.maxHeight = "";
        mediaElement.style.maxWidth = "";
      }
      this.centerToCursor();
    }
  }
}
