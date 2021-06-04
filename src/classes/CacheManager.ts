import { MediaData } from "../config/interfaces";

export class CacheManager {
  cache: MediaData[];

  constructor() {
    this.cache = [];
  }

  public getIndex(mediaId: string): number {
    return this.cache.findIndex((mediaData) => mediaData.id === mediaId);
  }
  public get(mediaId: string): MediaData | null {
    return this.cache.find(
      (mediaData) => mediaData.id === mediaId
    ) as MediaData | null;
  }
  public contains(mediaId: string): boolean {
    return this.getIndex(mediaId) >= 0 ? true : false;
  }

  public add(media: MediaData): void {
    const cacheIndex = this.getIndex(media.id);
    if (cacheIndex >= 0) {
      this.cache[cacheIndex] = media;
    } else {
      this.cache.push(media);
    }
  }

  public remove(mediaId: string): void {
    const cacheIndex = this.getIndex(mediaId);
    if (cacheIndex >= 0) {
      this.cache.splice(cacheIndex, 1);
    }
  }
}
