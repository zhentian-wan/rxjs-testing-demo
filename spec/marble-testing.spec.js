const { TestScheduler } = require("rxjs/testing");
const { map, take, delay, mapTo, catchError } = require("rxjs/operators");
const { concat, from, of, interval } = require("rxjs");

describe("Marble testing in Rxjs", () => {
  let testScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it("should convert ASCII diagrams into observables", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const source$ = cold("--a-b---c");
      const expected = "--a-b---c";
      expectObservable(source$).toBe(expected);
    });
  });

  it("should allow configuration of emitted values", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable } = helpers;
      const source$ = cold("--a-b---c", { a: 1, b: 2, c: 3 });
      const final$ = source$.pipe(map((val) => val * 10));
      const expected = "--a-b---c";
      expectObservable(final$).toBe(expected, { a: 10, b: 20, c: 30 });
    });
  });

  it("should let you identify subscription points", () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      const source$ = cold("-a---b-|");
      const second$ = cold("-c---d-|");
      const final$ = concat(source$, second$);
      const expected = "-a---b--c---d-|";

      const sourceExpectedSub = "^-- -- --!";
      const secondExpectedSub = "-- -- -- -^-- -- --!";

      expectObservable(final$).toBe(expected);
      expectSubscriptions(source$.subscriptions).toBe(sourceExpectedSub);
      expectSubscriptions(second$.subscriptions).toBe(secondExpectedSub);
    });
  });

  it("should let you test hot observables", () => {
    testScheduler.run((helpers) => {
      const { hot, expectObservable } = helpers;
      // in this case, hot == cold
      const source$ = hot("-a-b--c");
      const expected = "-a-b--c";
      expectObservable(source$).toBe(expected);

      // ^: means there is an subsrcitpion comes in
      const source2$ = hot("-a-b-^-c");
      const expected2 = "--c";
      expectObservable(source2$).toBe(expected2);

      // take completed case
      const final$ = source2$.pipe(take(1));
      const expected3 = "--(c|)";
      expectObservable(final$).toBe(expected3);
    });
  });

  it("should let you test asychronous operations", () => {
    testScheduler.run((helpers) => {
      const { expectObservable } = helpers;
      const source$ = from([1, 2, 3]);
      const expected = "(abc|)";
      expectObservable(source$).toBe(expected, { a: 1, b: 2, c: 3 });
    });
  });

  it("should let you test asynchronous operations", () => {
    testScheduler.run((helpers) => {
      const { expectObservable } = helpers;
      const source$ = from([1, 2, 3]);
      const final$ = source$.pipe(delay(5));
      const expected = "-- -- -(abc|)";
      expectObservable(final$).toBe(expected, { a: 1, b: 2, c: 3 });

      const final2$ = source$.pipe(delay(2001));
      // 2s: 2 seconds
      const expected2 = "2s -(abc|)";
      expectObservable(final2$).toBe(expected2, { a: 1, b: 2, c: 3 });
    });
  });

  it("should let you test erros and error message", () => {
    testScheduler.run((helpers) => {
      const { expectObservable } = helpers;
      const source$ = of(
        { firstName: "Joe", lastName: "Smith" },
        undefined // trigger error as an invalid user
      ).pipe(
        map(({ firstName, lastName }) => `${firstName} ${lastName}`),
        catchError(() => {
          throw new Error("Invalid user!");
        })
      );
      const expected = "(a#)";
      expectObservable(source$).toBe(
        expected,
        { a: "Joe Smith" },
        new Error("Invalid user!")
      );
    });
  });

  it("should let you test snapshots of streams that do not complete", () => {
    testScheduler.run((helpers) => {
      const { expectObservable } = helpers;
      const source$ = interval(1000).pipe(map((val) => `${val + 1}sec`));
      const expected = "1s a 999ms b 999ms c";
      const unsubscribe = "3999ms !";

      expectObservable(source$, unsubscribe).toBe(expected, {
        a: "1sec",
        b: "2sec",
        c: "3sec",
      });
    });
  });
});
