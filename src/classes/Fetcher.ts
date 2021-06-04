import { MediaType } from "../config/interfaces";

export class Fetcher {
  public static fetch(url: string, type: MediaType) {
    return new Promise(
      (
        resolve: (media: HTMLImageElement | HTMLVideoElement) => void,
        reject
      ) => {
        let media = document.createElement(type);
        switch (type) {
          case "img":
            media.onload = () => resolve(media);
            break;

          case "video":
            media.onloadeddata = () => resolve(media);
            break;
        }
        media.onerror = () => reject(new Error("Failed to load media!"));
        //media.onload;
        media.src = url;
      }
    );
  }
}
