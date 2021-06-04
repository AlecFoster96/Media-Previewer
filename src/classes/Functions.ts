import { MouseEventPath, WebExtensionsAPI } from "../config/interfaces";

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function getBrowser(): WebExtensionsAPI {
  const chromium = (globalThis as any).chrome as WebExtensionsAPI;
  const firefox = (globalThis as any).browser as WebExtensionsAPI;
  return chromium || firefox;
}

export function normalizeString(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim();
}
export function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (text) => {
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
  });
}

export interface CheckOptions {
  classes?: string[];
  tagNames?: string[];
}

export function checkElement(
  options: CheckOptions,
  element: HTMLElement
): boolean {
  let results: boolean[] = [];
  let classList = element?.classList ? Array.from(element.classList) : [];

  options.classes = options?.classes || [];
  options.tagNames = options?.tagNames || [];

  if (options.classes.length > 0) {
    results.push(
      options.classes.some((classStr) =>
        classList.includes(normalizeString(classStr))
      )
    );
  }
  if (options.tagNames.length > 0) {
    results.push(
      options.tagNames.some(
        (tagName) =>
          normalizeString(element.tagName) === normalizeString(tagName)
      )
    );
  }

  return results.every((value) => value === true);
}

// returns true if the provided tag name matches the element's tag name
export function checkTagName(tagName: string, element: HTMLElement): boolean {
  return element &&
    normalizeString(element.tagName) === normalizeString(tagName)
    ? true
    : false;
}
// returns true if any of the provided tag names match the element's tag name
export function checkTagNames(
  tagNames: string[],
  element: HTMLElement
): boolean {
  if (!element) return false;
  return tagNames.some(
    (tagName) => normalizeString(element.tagName) === normalizeString(tagName)
  );
}

export function getMouseEventPath(mouseEvent: MouseEvent): MouseEventPath {
  let path: MouseEventPath = [];
  let currentElem = mouseEvent.target;

  while (currentElem) {
    path.push(currentElem as HTMLElement);
    currentElem = (currentElem as HTMLElement).parentElement;
  }

  if (path.indexOf(window) === -1 && path.indexOf(document) === -1) {
    path.push(document);
  }

  if (path.indexOf(window) === -1) {
    path.push(window);
  }

  return path;
}

export function isMouseOnElement(
  mouseEvent: MouseEvent,
  element: HTMLElement
): boolean {
  const boundingClientRect = element.getBoundingClientRect();
  let xInside = false;
  let yInside = false;

  if (
    mouseEvent.x >= boundingClientRect.x &&
    mouseEvent.x <= boundingClientRect.x + boundingClientRect.width
  ) {
    xInside = true;
  }
  if (
    mouseEvent.y >= boundingClientRect.y &&
    mouseEvent.y <= boundingClientRect.y + boundingClientRect.height
  ) {
    yInside = true;
  }

  return xInside && yInside ? true : false;
}

export function getMediaOrientation(
  mediaElement: HTMLImageElement | HTMLVideoElement
): "portrait" | "landscape" {
  let mediaWidth = mediaElement.width;
  let mediaHeight = mediaElement.height;

  if (checkTagName("video", mediaElement)) {
    mediaWidth = (mediaElement as HTMLVideoElement).videoWidth;
    mediaHeight = (mediaElement as HTMLVideoElement).videoHeight;
  }

  return mediaWidth >= mediaHeight ? "landscape" : "portrait";
}

export function getScreenOrientation(): "portrait" | "landscape" {
  return window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
}
