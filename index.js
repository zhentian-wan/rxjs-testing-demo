const {
  fromEvent,
  of,
  debounceTime,
  EMPTY,
  switchMap,
  distinctUntilChanged,
  pluck,
} = require("rxjs");

/*
 * Any code samples you want to play with can go in this file.
 * Updates will trigger a live reload on http://localhost:1234/
 * after running npm start.
 */
of("Hello", "RxJS").subscribe(console.log);

const input$ = fromEvent(document.getElementById("#input"), "input");

const typeahead =
  (ajaxHelper = ajax) =>
  (sourceObservable) => {
    return sourceObservable.pipe(
      debounceTime(200),
      pluck("target", "value"),
      distinctUntilChanged(),
      switchMap((searchTerm) => {
        ajaxHelper
          .getJSON(`${BASE_URL}?by_name=${searchTerm}`)
          .pipe(catchError(() => EMPTY));
      })
    );
  };

input$.pipe(typeahead()).subscribe();

module.exports = typeahead;
