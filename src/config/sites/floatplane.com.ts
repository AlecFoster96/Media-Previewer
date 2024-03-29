import { MediaData } from "../interfaces";
import {
  checkQuery,
  getMouseEventPath,
  isMouseOnElement,
} from "../../classes/Functions";
import { Site } from "../../classes/Site";

// OLD "[.]com[/]([a-z_]+)[/](.*?)[/](.*?)(?:_[0-9]+x[0-9]+)?[.](jpg|jpeg|png|gif|webp)",
const idMatcher = new RegExp("post[/](.+)", "i");
const sizeReplacer = new RegExp("_[0-9]+x[0-9]+[.]", "i");

export default new Site("floatplane.com", (mouseEvent) => {
  const composedPath = getMouseEventPath(mouseEvent);

  let titleElement: HTMLElement | null = null;
  let thumbnailElement: HTMLElement | null = null;
  let hrefElement: HTMLElement | null = null;
  let mediaSrc = "";
  let mediaTitle = "";
  let mediaHref = "";

  const foundThumbnail = composedPath.find((path) => {
    const pathElement = path as HTMLElement;
    const classList = Array.from(pathElement?.classList || []);

    if (checkQuery("a.video", pathElement)) {
      // Home page
      const thumbnailElements = pathElement.querySelectorAll(
        "post-tile-thumbnail img, .ReactPostTileThumbnailContainer img"
      );
      thumbnailElement =
        thumbnailElements.length > 0
          ? (thumbnailElements[0] as HTMLElement)
          : null;
      hrefElement = pathElement;
      titleElement = pathElement.querySelector(".info-box .title");
    } else if (classList.includes("post-list-item")) {
      // Related videos
      thumbnailElement = pathElement.querySelector(
        ".post-item-image-wrapper img"
      );
      hrefElement = pathElement;
      titleElement = pathElement.querySelector(".post-item-title");
    }

    if (thumbnailElement && hrefElement && titleElement) {
      if (
        !isMouseOnElement(
          mouseEvent,
          thumbnailElement ? thumbnailElement : hrefElement
        )
      ) {
        return false;
      }

      mediaSrc = (thumbnailElement as HTMLImageElement).src;
      mediaHref = (hrefElement as HTMLAnchorElement).href;
      mediaTitle = titleElement.textContent?.trim() || "";
    }

    if (mediaTitle && mediaSrc && mediaHref) {
      return true;
    } else {
      return false;
    }
  });

  if (foundThumbnail) {
    const match = idMatcher.exec(mediaHref);
    if (match && match.length >= 2) {
      const output: MediaData[] = [
        {
          id: match[1],
          url: mediaSrc.replace(sizeReplacer, "."),
          href: mediaHref,
          title: mediaTitle,
          type: "img",
        },
      ];

      return output;
    }
  }

  return;
});
