const { of, throwError } = require("rxjs");
const { delay } = require("rxjs/operators");
const { TestScheduler } = require("rxjs/testing");
const { typeahead } = require("..");

describe("THe typehead", () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it("should debounce input by 200ms", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const searchTerm = "testing";
      const source$ = cold("a", { a: { target: { value: searchTerm } } });
      const final$ = source$.pipe(
        typeahead({
          getJSON: () => of(searchTerm).pipe(delay(300)),
        })
      );
      const expected = "500ms a";
      expectObservable(final$).toBe(expected, { a: searchTerm });
    });
  });

  it("should cancel active requests if another value is emitted", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const searchTerm = "testing";
      const source$ = cold("a 250ms b", {
        a: { target: { value: "first" } },
        b: { target: { value: "second" } },
      });
      const final$ = source$.pipe(
        typeahead({
          getJSON: () => of(searchTerm).pipe(delay(300)),
        })
      );
      const expected = "751ms b"; // 200 (debounce) + 250 (wait time) + 300 (network) + 1 (b)
      expectObservable(final$).toBe(expected, { b: searchTerm });
    });
  });

  it("should not emit duplciate values in a row", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const searchTerm = "testing";
      const source$ = cold("a 250ms b", {
        a: { target: { value: "same" } },
        b: { target: { value: "same" } },
      });
      const final$ = source$.pipe(
        typeahead({
          getJSON: () => of(searchTerm).pipe(delay(300)),
        })
      );
      const expected = "500ms b"; // 200 (debounce) + 300 (network)
      expectObservable(final$).toBe(expected, { b: searchTerm });
    });
  });

  it("should ingore ajax errors", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const searchTerm = "testing";
      const source$ = cold("a 250ms b", {
        a: { target: { value: "same" } },
        b: { target: { value: "same" } },
      });
      const final$ = source$.pipe(
        typeahead({
          getJSON: () => throwError("error"),
        })
      );
      const expected = ""; // in case of error, emit empty
      expectObservable(final$).toBe(expected);
    });
  });
});
