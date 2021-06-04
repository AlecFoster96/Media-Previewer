import { MediaData } from "../interfaces";
import { checkTagName, getMouseEventPath } from "../../classes/Functions";
import { Site } from "../../classes/Site";

// TODO: add tags to title for "collection" & "video"?

const matcher = new RegExp("[/]shots[/](.+)", "i");

export default new Site("dribbble.com", (mouseEvent) => {
  const composedPath = getMouseEventPath(mouseEvent);

  const foundThumbnail = composedPath.find((path) => {
    const pathElement = path as HTMLElement;
    const classList = Array.from(pathElement?.classList || []);

    if (
      checkTagName("li", pathElement) &&
      classList.includes("shot-thumbnail-container")
    ) {
      return true;
    } else {
      return false;
    }
  });

  if (foundThumbnail) {
    const thumbnailBase = (foundThumbnail as HTMLElement)?.querySelector(
      ".shot-thumbnail-base"
    ) as HTMLElement | null;
    const imgTarget = thumbnailBase?.querySelector(
      "img"
    ) as HTMLImageElement | null;
    const linkTarget = (foundThumbnail as HTMLElement)?.querySelector(
      "a.shot-thumbnail-link"
    ) as HTMLAnchorElement | null;

    if (!thumbnailBase) return;
    if (!imgTarget || !imgTarget?.srcset) return;
    if (!linkTarget || !linkTarget?.href) return;

    let videoSrc = thumbnailBase.getAttribute("data-video-teaser-xlarge") || "";
    if (!videoSrc)
      videoSrc = thumbnailBase.getAttribute("data-video-teaser-large") || "";
    if (!videoSrc)
      videoSrc = thumbnailBase.getAttribute("data-video-teaser-medium") || "";
    if (!videoSrc)
      videoSrc = thumbnailBase.getAttribute("data-video-teaser-small") || "";

    const fullVideoSrc = videoSrc.replace(/(_[a-z]+)?_preview[.]/, ".");
    if (fullVideoSrc && videoSrc) videoSrc = fullVideoSrc;

    let imgSrc = "";
    if (!videoSrc) {
      const srcsetStrSplit = imgTarget.srcset.trim().split(", ");
      const splitSrc = srcsetStrSplit[0].split(" ");
      if (splitSrc.length < 2) return;

      imgSrc = splitSrc[0].replace(/[?].+/i, "");
    }

    if (imgSrc || videoSrc) {
      const match = matcher.exec(linkTarget.href);
      //console.log(ELP, "Test #1", match, linkTarget.href);
      if (match && match.length >= 2) {
        //console.log(ELP, "Test #2");
        const mediaId = match[1];
        const mediaTitle = String(imgTarget.getAttribute("alt") || "").trim();

        const output: MediaData = {
          id: mediaId,
          url: videoSrc ? videoSrc : imgSrc,
          href: linkTarget.href,
          title: mediaTitle,
          type: videoSrc ? "video" : "img",
        };
        return [output];
      }
    }
  }
  return;
});
