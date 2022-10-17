const { of } = require("rxjs");
const { mergeMap, map, delay, catchError } = require("rxjs/operators");

describe("subscribe & assert testing in RxJS", () => {
  it("should compare each emitted value", () => {
    const source$ = of(1, 2, 3);
    const final$ = source$.pipe(map((val) => val * 10));
    const expected = [10, 20, 30];
    let index = 0;
    final$.subscribe((val) => {
      expect(val).toEqual(expected[index]);
      index++;
    });
  });

  // recommend to run this kind of test in marable testing
  // this test case only test val emitted
  // but not the time
  // would be better to test exp. after 1 second, "Set" was emitted
  it("should let you test async operations with done callback", (done) => {
    const source$ = of("Ready", "Set", "Go").pipe(
      mergeMap((message, index) => of(message).pipe(delay(index * 1000)))
    );
    const expected = ["Ready", "Set", "Go"];
    let index = 0;
    source$.subscribe(
      (val) => {
        expect(val).toEqual(expected[index]);
        index++;
      },
      null,
      done // tell jasmine, async function has completed
    );
  });

  it("should let you test erros and error message", () => {
    const source$ = of(
      { firstName: "Joe", lastName: "Smith" },
      undefined // trigger error as an invalid user
    ).pipe(
      map(({ firstName, lastName }) => `${firstName} ${lastName}`),
      catchError(() => {
        throw new Error("Invalid user!");
      })
    );
    const expected = ["Joe Smith", new Error("Invalid user!")];
    let actual = [];
    source$.subscribe({
      next: (val) => {
        actual.push(val);
      },
      error: (error) => {
        actual.push(error);
        expect(actual).toEqual(expected);
      },
    });
  });
});
