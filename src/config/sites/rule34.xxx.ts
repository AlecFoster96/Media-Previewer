import { MediaData, MediaType } from "../interfaces";
import { checkTagName, normalizeString } from "../../classes/Functions";
import { Site } from "../../classes/Site";

const mediaUrlBase = `https://img.rule34.xxx//images`;
const mediaExtensions = ["mp4", "webm", "jpeg", "jpg", "png", "gif"];
const matcher = new RegExp(
  "[/]thumbnails[/]([0-9]+)[/]thumbnail_([a-z0-9]+)[.]",
  "i"
);

export default new Site("rule34.xxx", (mouseEvent) => {
  const target = mouseEvent.target as HTMLElement | null;
  const parent = target ? target.parentElement : null;

  if (!target) return;

  if (checkTagName("img", target) && target.classList.contains("preview")) {
    const match = matcher.exec((target as HTMLImageElement).src);
    if (match && match.length > 0) {
      const serveId = encodeURIComponent(match[1]);
      const mediaId = encodeURIComponent(match[2]);
      const mediaUrl = `${mediaUrlBase}/${serveId}/${mediaId}`;
      const mediaImgTitle = target.getAttribute("title");
      const mediaTags = mediaImgTitle
        ? normalizeString(mediaImgTitle)
            .replace(/[ ]{2,}/gi, " ")
            .split(" ")
        : [];
      let mediaHref = "";

      if (parent && checkTagName("a", parent)) {
        mediaHref = (parent as HTMLAnchorElement).href;
      }

      return mediaExtensions.map((extension) => {
        const mediaType: MediaType = ["mp4", "webm"].includes(extension)
          ? "video"
          : "img";
        let mediaTitle = `<tag color="${
          mediaType === "img" ? "orange" : "blue"
        }" bold uppercase>${extension}</tag><spacer></spacer>`;

        mediaTags.find((tag) => {
          const match = new RegExp("score:([-]?[0-9]+)", "i").exec(
            normalizeString(tag)
          );
          if (match && match.length >= 2) {
            mediaTitle += `<tag color="green"><strong>Score:</strong> ${match[1]}</tag>`;
            return true;
          }
          return false;
        });

        switch (mediaType) {
          case "img":
            if (mediaTags.includes("animated"))
              mediaTitle += `<tag color="teal">animated</tag>`;
            //if (mediaTags.includes("sound")) mediaTitle += ", sound";
            break;

          case "video":
            if (mediaTags.includes("sound"))
              mediaTitle += `<tag color="blue">sound</tag>`;
            if (mediaTags.includes("long_video"))
              mediaTitle += `<tag color="teal">long video</tag>`;
            break;
        }

        /* mediaTitle += `<tag color="red">test</tag>`;
          mediaTitle += `<tag color="orange">test</tag>`;
          mediaTitle += `<tag color="yellow">test</tag>`;
          mediaTitle += `<tag color="green">test</tag>`;
          mediaTitle += `<tag color="blue">test</tag>`;
          mediaTitle += `<tag color="teal">test</tag>`;
          mediaTitle += `<tag color="purple">test</tag>`;
          mediaTitle += `<tag color="pink">test</tag>`; */

        /* mediaTags.map((tag) => {
            mediaTitle += `<tag>${tag}</tag>`;
          }); */

        const output: MediaData = {
          id: mediaId,
          url: `${mediaUrl}.${extension}`,
          href: mediaHref,
          title: mediaTitle,
          type: mediaType,
        };

        return output;
      });
    }
  }
  return;
});
