import { MediaData } from "../config/interfaces";

export type MouseMoveFunc = (mouseEvent: MouseEvent) => MediaData[] | void;

export class Site {
  public readonly host: string;
  public readonly mouseMoveFunction: MouseMoveFunc;

  constructor(host: string, mouseMoveFunction: MouseMoveFunc) {
    this.host = host;
    this.mouseMoveFunction = mouseMoveFunction;
  }
}
