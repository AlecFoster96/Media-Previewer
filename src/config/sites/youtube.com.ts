import { MediaData } from "../interfaces";
import {
  checkTagName,
  checkTagNames,
  getMouseEventPath,
  isMouseOnElement,
} from "../../classes/Functions";
import { Site } from "../../classes/Site";

const mediaUrlBase = `https://i.ytimg.com/vi`;
const matcher = new RegExp("watch.*?v=(.*?)(?:&|$)", "i");

export default new Site("youtube.com", (mouseEvent) => {
  const composedPath = getMouseEventPath(mouseEvent);

  let titleElement: HTMLElement | null = null;
  let thumbnailElement: HTMLElement | null = null;
  let hrefElement: HTMLElement | null = null;
  let mediaTitle = "";
  let mediaHref = "";
  let onButton = false;

  const foundThumbnail = composedPath.find((path) => {
    const pathElement = path as HTMLElement;
    const classList = Array.from(pathElement?.classList || []);

    if (
      checkTagName(
        "ytd-thumbnail-overlay-toggle-button-renderer",
        pathElement
      ) &&
      (composedPath[0] as HTMLElement | null)?.id !== "label-container"
    ) {
      onButton = true;
    }
    if (onButton) return false;

    if (checkTagName("ytd-rich-grid-media", pathElement)) {
      // Home page
      hrefElement = pathElement.querySelector("a#thumbnail");
      titleElement = pathElement.querySelector(
        "yt-formatted-string#video-title"
      );
    } else if (checkTagName("ytd-notification-renderer", pathElement)) {
      // Notifications
      hrefElement = pathElement.querySelector("a.yt-simple-endpoint");
      thumbnailElement = pathElement.querySelector(".thumbnail-container img");
      titleElement = pathElement.querySelector("yt-formatted-string.message");
    } else if (
      checkTagNames(
        [
          "ytd-video-renderer",
          "ytd-playlist-renderer",
          "ytd-radio-renderer",
          "ytd-compact-video-renderer",
          "ytd-compact-playlist-renderer",
          "ytd-compact-radio-renderer",
          "ytd-grid-video-renderer",
          "ytd-grid-playlist-renderer",
          "ytd-grid-radio-renderer",
          "ytd-playlist-video-renderer",
          "ytd-playlist-playlist-renderer",
          "ytd-playlist-radio-renderer",
          "ytd-playlist-panel-video-renderer",
        ],
        pathElement
      )
    ) {
      // Related videos (watch page)
      hrefElement = pathElement.querySelector("a#thumbnail");
      titleElement = pathElement.querySelector("#video-title");
    } else if (classList.includes("ytp-videowall-still")) {
      // Videos at the end of the current video
      hrefElement = pathElement;
      titleElement = pathElement.querySelector(
        ".ytp-videowall-still-info-title"
      );
    } else if (classList.includes("ytp-ce-covering-overlay")) {
      // Video end cards
      hrefElement = pathElement;
      titleElement = pathElement.querySelector(".ytp-ce-video-title");
    } else if (
      checkTagName("a", pathElement) &&
      classList.includes("iv-click-target")
    ) {
      // Card menu
      hrefElement = pathElement;
      thumbnailElement = pathElement.querySelector(".iv-card-image");
      titleElement = pathElement.querySelector("h2.iv-card-primary-link");
    }

    if (hrefElement && titleElement) {
      if (
        !isMouseOnElement(
          mouseEvent,
          thumbnailElement ? thumbnailElement : hrefElement
        )
      ) {
        return false;
      }

      mediaHref = (hrefElement as HTMLAnchorElement).href;
      mediaTitle = titleElement.textContent?.trim() || "";
    }

    if (mediaTitle && mediaHref) {
      return true;
    } else {
      return false;
    }
  });

  if (foundThumbnail) {
    const match = matcher.exec(mediaHref);
    if (match && match.length >= 2) {
      const mediaId = match[1];
      const mediaUrl = `${mediaUrlBase}/${mediaId}`;

      const output: MediaData[] = [
        {
          id: mediaId,
          url: `${mediaUrl}/maxresdefault.jpg`,
          href: mediaHref,
          minWidth: 200,
          title: mediaTitle,
          type: "img",
        },
        {
          id: mediaId,
          url: `${mediaUrl}/hqdefault.jpg`,
          href: mediaHref,
          minWidth: 200,
          title: mediaTitle,
          type: "img",
        },
      ];

      return output;
    }
  }

  return;
});
