export class Test {
  public test: () => boolean;
  public shouldReturn: boolean;

  constructor(test: () => boolean, shouldReturn: boolean) {
    this.test = test;
    this.shouldReturn = shouldReturn;
  }

  run(): boolean {
    const result = this.test();
    return this.shouldReturn === result;
  }
}
