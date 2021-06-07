import { checkQuery, tester } from "../classes/Functions";
import { Test } from "./Test";

// TODO: add more tests?
export default () => {
  const testElNoId = document.createElement("h1");
  testElNoId.classList.add("first");
  testElNoId.classList.add("second");
  testElNoId.classList.add("third");

  const testElId = document.createElement("h1");
  testElId.id = "testId";
  testElId.classList.add("first");
  testElId.classList.add("second");
  testElId.classList.add("third");

  tester("checkQuery", [
    new Test(() => checkQuery("h1", testElNoId), true),
    new Test(() => checkQuery("h1#testId", testElNoId), false),
    new Test(() => checkQuery("h1#testId.first", testElNoId), false),
    new Test(() => checkQuery("h1.first#testId", testElNoId), false),
    new Test(() => checkQuery("h1.first#testId.second", testElNoId), false),
    new Test(() => checkQuery("h1.first", testElNoId), true),
    new Test(() => checkQuery("h1.first.second", testElNoId), true),

    new Test(() => checkQuery("#testId", testElNoId), false),
    new Test(() => checkQuery("#testId.first", testElNoId), false),
    new Test(() => checkQuery(".first#testId", testElNoId), false),
    new Test(() => checkQuery(".first#testId.second", testElNoId), false),
    new Test(() => checkQuery(".first", testElNoId), true),
    new Test(() => checkQuery(".first.second", testElNoId), true),

    new Test(() => checkQuery("h2.first", testElNoId), false),
    new Test(() => checkQuery("h2.", testElNoId), false),
    new Test(() => checkQuery("h2.", testElNoId), false),
    new Test(() => checkQuery("h2.firs", testElNoId), false),
    new Test(() => checkQuery(".first.secon", testElNoId), false),

    new Test(() => checkQuery("", testElNoId, true), true),
    new Test(() => checkQuery("", testElNoId), true),

    new Test(() => checkQuery(".", testElNoId, true), false),
    new Test(() => checkQuery(".", testElNoId), false),
    new Test(() => checkQuery("#", testElNoId, true), false),
    new Test(() => checkQuery("#", testElNoId), false),

    new Test(() => checkQuery("h2.first.no", testElNoId, true), false),
    new Test(() => checkQuery("h2.no", testElNoId, true), false),
    new Test(() => checkQuery("h2", testElNoId, true), false),

    new Test(() => checkQuery("h1.first.no", testElNoId, true), true),
    new Test(() => checkQuery("h1.no", testElNoId, true), true),
    new Test(() => checkQuery("h1", testElNoId, true), true),

    new Test(() => checkQuery(".no.first", testElNoId, true), true),
    new Test(() => checkQuery(".first", testElNoId, true), true),

    new Test(() => checkQuery("h1", testElId), true),
    new Test(() => checkQuery("h1#testId", testElId), true),
    new Test(() => checkQuery("h1#testId.first", testElId), true),
    new Test(() => checkQuery("h1.first#testId", testElId), true),
    new Test(() => checkQuery("h1.first#testId.second", testElId), true),
    new Test(() => checkQuery("h1.first", testElId), true),
    new Test(() => checkQuery("h1.first.second", testElId), true),

    new Test(() => checkQuery("#testId", testElId), true),
    new Test(() => checkQuery("#testId.first", testElId), true),
    new Test(() => checkQuery(".first#testId", testElId), true),
    new Test(() => checkQuery(".first#testId.second", testElId), true),
    new Test(() => checkQuery(".first", testElId), true),
    new Test(() => checkQuery(".first.second", testElId), true),

    new Test(() => checkQuery("h2.first", testElId), false),
    new Test(() => checkQuery("h2.", testElId), false),
    new Test(() => checkQuery("h2.", testElId), false),
    new Test(() => checkQuery("h2.firs", testElId), false),
    new Test(() => checkQuery(".first.secon", testElId), false),

    new Test(() => checkQuery("", testElId, true), true),
    new Test(() => checkQuery("", testElId), true),

    new Test(() => checkQuery(".", testElId, true), false),
    new Test(() => checkQuery(".", testElId), false),
    new Test(() => checkQuery("#", testElId, true), false),
    new Test(() => checkQuery("#", testElId), false),

    new Test(() => checkQuery("h2.first.no", testElId, true), false),
    new Test(() => checkQuery("h2.no", testElId, true), false),
    new Test(() => checkQuery("h2", testElId, true), false),

    new Test(() => checkQuery("h1.first.no", testElId, true), true),
    new Test(() => checkQuery("h1.no", testElId, true), true),
    new Test(() => checkQuery("h1", testElId, true), true),

    new Test(() => checkQuery(".no.first", testElId, true), true),
    new Test(() => checkQuery(".first", testElId, true), true),
  ]);
};
