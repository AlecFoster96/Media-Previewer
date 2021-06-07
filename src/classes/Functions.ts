import { MouseEventPath, WebExtensionsAPI } from "../config/interfaces";
import { ELP } from "../config/main";
import { Test } from "../tests/Test";

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
export function toTitleCase(value: string): string {
  return value.replace(/\w\S*/g, (text) => {
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
  });
}

const tagRegEx = new RegExp("^([^#.]+)", "i");
const idRegEx = new RegExp("^[#]([^#.]+)", "i");
const classRegEx = new RegExp("^[.]([^#.]+)", "i");

// works similar to .querySelector, except it is used to check if the provided element matches (e.g. classes exists, tag name matches)
// currently doesn't support attributes like .querySelector does, might add in the future, so support for: `h1[data-id="test"][disabled]`
export function checkQuery(
  query: string,
  element: HTMLElement,
  acceptNonExact: boolean = false
): boolean {
  if (!element) return false;
  const elementIdStr = (element?.id || "").trim();
  const elementClasses = element?.classList
    ? Array.from(element.classList)
    : [];

  let runs = 0;
  const orgQuery = query.slice();
  query = query.trim().replaceAll(" ", "");

  let foundTagName = "";
  const tagNameMatch = tagRegEx.exec(query);
  if (tagNameMatch && tagNameMatch.length > 1) {
    foundTagName = tagNameMatch[1];
    query = query.replace(tagRegEx, "");
  }

  let foundId: string = "";
  let foundClasses: string[] = [];

  while (query.length > 0 && runs <= 1000) {
    const idMatch = idRegEx.exec(query);
    if (idMatch && idMatch.length > 1) {
      if (foundId.length <= 0) foundId = idMatch[1];
      query = query.replace(idRegEx, "");
    } else {
      const classMatch = classRegEx.exec(query);
      if (classMatch && classMatch.length > 1) {
        foundClasses.push(classMatch[1]);
        query = query.replace(classRegEx, "");
      } else {
        // nothing valid left to find
        query = "";
      }
    }
    runs++;

    if (runs > 1000) {
      console.warn(ELP, "checkQuery hit match limit!", query);
    }
  }

  let tagMatches = false;
  let idFoundOnElement = foundId.length <= 0 ? true : false;
  if (!idFoundOnElement) {
    idFoundOnElement = foundId === elementIdStr;
  }
  let classesFoundOnElement = 0;

  if (foundTagName.length <= 0) {
    tagMatches = true;
  }

  if (
    !tagMatches &&
    normalizeString(element.tagName) === normalizeString(foundTagName)
  ) {
    tagMatches = true;
  }

  foundClasses.forEach((classToCheck) => {
    if (elementClasses.includes(classToCheck)) {
      classesFoundOnElement++;
    }
  });

  /* console.log(ELP, {
    tagMatches: tagMatches,
    foundId: foundId,
    foundIdOnElement: idFoundOnElement,
    foundClasses: foundClasses,
    foundClassesOnElement: classesFoundOnElement,
    runs: runs,
    orgQuery: orgQuery,
    remainingQuery: query,
    exactMatch:
      foundClasses.length === classesFoundOnElement &&
      idFoundOnElement &&
      tagMatches,
  }); */

  if (
    orgQuery.length > 0 &&
    classesFoundOnElement <= 0 &&
    foundId.length <= 0 &&
    foundTagName.length <= 0
  ) {
    return false;
  } else if (
    classesFoundOnElement === foundClasses.length &&
    idFoundOnElement &&
    tagMatches
  ) {
    return true;
  } else if (
    acceptNonExact &&
    (classesFoundOnElement > 0 || idFoundOnElement) &&
    tagMatches
  ) {
    return true;
  } else {
    return false;
  }
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

export function videoHasAudio(videoElement: HTMLVideoElement): boolean {
  return (
    (videoElement as any).mozHasAudio ||
    Boolean((videoElement as any).webkitAudioDecodedByteCount) ||
    Boolean(
      (videoElement as any).audioTracks &&
        (videoElement as any).audioTracks.length
    )
  );
}

export function tester(name: string, tests: Test[]) {
  let fails: Test[] = [];
  let successes: Test[] = [];

  tests.forEach((test) => {
    const result = test.run();
    if (result) {
      successes.push(test);
    } else {
      fails.push(test);
    }
  });

  if (fails.length > 0) {
    console.log(
      ELP,
      `Some tests for: "${name}", returned incorrect results (${fails.length}/${tests.length})!`,
      fails
    );
  } else if (successes.length > 0) {
    console.log(
      ELP,
      `All tests for: "${name}", returned expected results (${successes.length}/${tests.length})!`
    );
  } else {
    console.log(ELP, `No tests for: "${name}", ran (0/${tests.length})!`);
  }
}
