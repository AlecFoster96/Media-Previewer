# Site loading

Any TypeScript files in this folder with the following format: `[host].ts`, will be autoloaded into the extension when it is built. Files beginning with any other characters than `a-z` or `0-9` will be ignored. Only lowercase letters are allowed, so a file named `YouTube.com.ts` will be ignored, while `youtube.com.ts` will be autoloaded, a file named `_youtube.com.ts` will be ignored due to the underscore att the start.

---

## Filename examples

- `youtube.com.ts` _(host: `youtube.com`, extension: `.ts`)_
- `dribbble.com.ts` _(host: `dribbble.com`, extension: `.ts`)_

---

## Site example

```typescript
import { MediaData } from "../interfaces";
import { checkTagName } from "../../classes/Functions";
import { Site } from "../../classes/Site";

// variables (usually constant) that you want to use multiple times inside the function below
const mediaUrlBase = `http://127.0.0.1/extension_tester/media`;
const matcher = new RegExp("/media[/](.+)", "i");

export default new Site("127.0.0.1", (mouseEvent) => {
  const target = mouseEvent.target as HTMLElement | null;
  if (!target) return;

  if (checkTagName("img", target)) {
    const match = matcher.exec((target as HTMLImageElement).src);
    if (match && match.length >= 2) {
      const mediaId = match[1];
      const mediaUrl = `${mediaUrlBase}/${encodeURIComponent(mediaId)}`;

      const output: MediaData[] = [
        {
          id: mediaId, // used for caching URLs (e.g. YouTube video ID)
          url: mediaUrl, // URL to media (e.g. link to YouTube thumbnail)
          href: "", // URL to page with media (e.g. link to YouTube video)
          title: "", // Title to be displayed under preview media
          type: "img", // Media type (img / video)
        },
      ];

      return output;
    }
  }
  return;
});
```

---

## MediaData explained

`MediaData` is what is used to fetch media from the site, it includes an `id` to allow for caching the provided `url` if the media is deemed to be valid.

An array of `MediaData` can be returned from the function provided to `Site`, the fetcher will then use the first valid media and cache the provided `url` for future use. This can be useful if you don't know the extension and need to try different ones, or if media can have different levels of quality and you don't have a way of figuring out which media has which.

When providing an array try to include the best possible version first.

```typescript
interface MediaData {
  id: string;
  url: string;
  href: string;
  minWidth?: number;
  minHeight?: number;
  title: string;
  type: MediaType; // "img" / "video"
}
```
