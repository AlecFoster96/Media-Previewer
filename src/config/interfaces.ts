export type MouseEventPath = Array<HTMLElement | Window | Document>;

export interface Position {
  x: number;
  y: number;
}

// add things to this as needed
export interface Manifest {
  manifest_version: number;
  name: string;
  version: string;
}

// add things to this as needed
export interface WebExtensionsAPI {
  runtime: {
    getManifest(): Manifest;
    sendMessage(data: any): void;
    openOptionsPage(): void;
    getURL(path: string): string;
    onMessage: {
      addListener(
        callback: (
          message?: any,
          sender?: any,
          sendResponse?: () => void
        ) => void
      ): void;
    };
  };
  tabs: {
    query(options: any, callback: (result: any[]) => void): void;
    create(options: any): void;
    onActivated: {
      addListener(callback: (info?: any) => void): void;
    };
  };
  storage: {
    local: {
      set(data: any, callback: () => void): void;
      get(defaults: any, callback: (items: any) => void): void;
    };
  };
  // chromium (manifest v3)
  action: {
    onClicked: {
      addListener(callback: (tab?: any) => void): void;
    };
  };
  // firefox (manifest v2)
  browserAction: {
    onClicked: {
      addListener(callback: (tab?: any) => void): void;
    };
  };
}

export type MediaType = "img" | "video";

/* export interface Site {
  host: string;
  explicitSite?: boolean;
  debugSite?: boolean;
  /*mediaUrlBase: string;
  mediaExtensions: string[];
  matcher: RegExp;* /
  mouseMoveFunction(/*self: Site,* / mouseEvent: MouseEvent): MediaData[] | void;
} */

export interface MediaData {
  id: string;
  url: string;
  href: string;
  minWidth?: number;
  minHeight?: number;
  title: string;
  type: MediaType;
}

export interface MediaEnterData {
  boundingClientRect: DOMRect | null;
  media: MediaData | null;
}
