/* @flow */

{
  // simple example: adding type annotations
  // Q: how do you get this program to throw errors when it's used in a way you don't
  // want it to be used?
  // A: add annotations
  function successor(x) {
    return x + 1;
  }

  successor(23); // -> should return 24
  // successor({}); // -> should error, and does
  successor("aa"); // -> should error, but doesn't!
}

{
  // where type inference breaks:
  let foo = 42;
  function mutate() {
    foo = true;
    foo = "hello";
  }

  mutate();

  // $ExpectError
  // let isString: string = foo; // Error!
  // let isNumber: number = foo; // Error!
  // let isBoolean: boolean = foo; // Error!

  let isStringNumberBoolean: string | number | boolean = foo; // works!

  // explanation: when a variable gets reassigned, by default it gets the type of all
  // possible values (anything it has been, is, or could be). not sure why the effects of calling mutate
  // are not preserved though

  // foo = {}; // even this line causes L31 to error!
}

{

}

