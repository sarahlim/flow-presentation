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

// IF
{
  let x = 12;     // x: (tau, alpha), C: { number <= alpha }

  if (false) {    // in if statements, we accumulate constraints from all cases, even if
                  // they never execute
    x = '';       // x: (tau, alpha), C: { string, number <= alpha }
  }

  // begin-error
  (x: number);    // throws an error because it doesn't satisfy our constraints!
                  // the C we've accumulated so far tells us that whatever type x is, it
                  // must be usable as a string and as a number
  x * x;          // thus, we can't use it anywhere we would expect a number
  // end-error

  x + x;          // note that this *will* work, because the + operator works on both
                  // strings and numbers

  // this will work because flow can refine the type of x within the cases
  switch (typeof x) {
    case 'number':
      x * x;
      break;
    case 'string':
      x.substr(0);
      break;
  }
}

// OR
{
  let x = 12;               // x: (tau_x, alpha_x), C_x: { number <= alpha }
  let y = true;             // y: (tau_y, alpha_y), C_y: { boolean <= alpha }

  let z = (y || (x = ''));  // x: (tau_x, alpha_x), C_x: { number, string } <= alpha

  (z: bool);
  console.log(z);           // prints "true"
  console.log(x);           // prints "12"
  (x: number);              // this throws an error, for a similar reason as above! the constraints
                            // we've picked up so far tell us that the type of x need to be usable as
                            // a string and a number
}
