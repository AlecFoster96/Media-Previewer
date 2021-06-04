import { MediaData } from "../interfaces";
import { checkTagName } from "../../classes/Functions";
import { Site } from "../../classes/Site";

const mediaUrlBase = `http://127.0.0.1/extension_tester/media`;
const matcher = new RegExp("/media[/](.+)", "i");

export default new Site("127.0.0.1", (mouseEvent) => {
  const target = mouseEvent.target as HTMLElement | null;

  if (!target) return;

  if (checkTagName("img", target)) {
    const match = matcher.exec((target as HTMLImageElement).src);
    if (match && match.length >= 2) {
      const mediaId = encodeURIComponent(match[1]);
      const splitId = mediaId.split(".");
      const ext = target.getAttribute("data-video") || "";

      let baseId = splitId.slice();
      baseId.pop();

      const mediaUrlImg = `${mediaUrlBase}/${mediaId}`;
      const mediaUrlVideo = `${mediaUrlBase}/${baseId}.${ext}`;

      const output: MediaData[] = [
        {
          id: mediaId,
          url: ["mp4", "webm"].includes(ext) ? mediaUrlVideo : mediaUrlImg,
          href: "",
          title: "",
          type: ["mp4", "webm"].includes(ext) ? "video" : "img",
        },
      ];

      return output;
    }
  }
  return;
});
