import { getBrowser } from "./Functions";

const browser = getBrowser();

export type MouseAction =
  | "open_media_href_in_new_tab"
  | "open_media_url_in_new_tab"
  | "open_media_href_in_same_tab"
  | "open_media_url_in_same_tab"
  | "toggle_fill_mode"
  | "play_pause_video"
  | "toggle_mute"
  | "default"
  | "none";

export type ScrollAction =
  | "change_video_volume"
  | "change_video_time"
  | "default"
  | "none";

export interface Settings {
  popupDelay: number;
  videoVolume: number;
  darkMode: boolean;
  loopVideos: boolean;
  videoMuted: boolean;
  hideCursor: boolean;

  leftClickAction_images: MouseAction;
  leftClickAction_videos: MouseAction;

  middleClickAction_images: MouseAction;
  middleClickAction_videos: MouseAction;

  rightClickAction_images: MouseAction;
  rightClickAction_videos: MouseAction;

  scrollAction: ScrollAction;

  [key: string]: string | number | boolean;
}

export const defaultSettings: Settings = {
  popupDelay: 500,
  darkMode: false,
  videoVolume: 100,
  loopVideos: true,
  videoMuted: false,
  hideCursor: true,

  leftClickAction_images: "toggle_fill_mode",
  leftClickAction_videos: "play_pause_video",
  middleClickAction_images: "open_media_href_in_new_tab",
  middleClickAction_videos: "open_media_href_in_new_tab",
  rightClickAction_images: "default",
  rightClickAction_videos: "default",
  scrollAction: "change_video_volume",
};

export function getSettings(callback: (items: Settings) => void) {
  browser.storage.local.get(defaultSettings, callback);
}
export function setSettings(settingsToSave: Settings, callback: () => void) {
  browser.storage.local.set(settingsToSave, callback);
}
