---
title: "Example: mutating variables through function effects"
date: Type Systems, Winter 2018
codeBlockCaptions: True
listingTitle: Listing
lstPrefix: listing
linkReferences: True
urlcolor: cyan
numbersections: True
---

# Example program 

[@Lst:wrong] gives an example program. Line 1 declares a new variable `x`, initialized to `42`. Lines 3-5 declare a function `mut`, which closes over `x`. Its body sets `x` to the string `"hello"`. Line 7 represents arbitrary additional program code. Line 9 finally invokes `mut()`, with the effect of assigning `x = "hello"`.

```{#lst:wrong .js .numberLines}
var x = 42;

function mut() {
    x = "hello";
}

// ...other program code here

mut();

(x: string);  // ERROR
```

: Program with a failing type cast

In Line 11, the programmer attempts to cast `x` to type `string`. This is equivalent to asserting that the type of `x` is a subtype of `string`.

This type cast gives the following error:

```
9: (x: string);
    ^ Cannot cast `x` to string because number [1] is incompatible with string [2].
References:
1: var x = 42;
           ^ [1]
9: (x: string);
```

This error states that `x` cannot be cast to `string`, because it may be a `number`. In the following section, we step through the derivation at a high level.

# Derivation at a glance

+------------------+------------------------------------------------------+--------------------------------------------------------------------+
|       Code       |                       $\Gamma$                       |                            Constraints                             |
+==================+======================================================+====================================================================+
| ```js            | $$\fbox{$ x : (\text{number}, \tau_0) $}$$           | $$\fbox{$\text{number} <: \tau_0 $}$$                              |
| let x = 42;      |                                                      |                                                                    |
| ```              |                                                      |                                                                    |
+------------------+------------------------------------------------------+--------------------------------------------------------------------+
| ```js            | $$x : (\text{number}, \tau_0)$$                      | $$\text{number} <: \tau_0$$                                        |
| function mut() { | $$\fbox{$mut :                                       | $$\fbox{string $<: \tau_0$}$$                                      |
|   x = "hello";   |  (\text{void $\xrightarrow{x}$ void}, \sigma_0) $}$$ | $$\fbox{$\text{void} \xrightarrow{x} \text{void} <: \sigma_0 $} $$ |
| }                |                                                      |                                                                    |
| ```              |                                                      |                                                                    |
+------------------+------------------------------------------------------+--------------------------------------------------------------------+
| ```js            | $$x : (\fbox{$ \alpha $}, \tau_0)$$                  | $$\text{number} <: \tau_0, \quad \fbox{$\alpha <: \tau_0$}$$       |
| mut()            | $$mut : ...$$                                        | $$\text{string} <: \tau_0$$                                        |
| ```              |                                                      | $$\text{void} \xrightarrow{x} ...$$                                |
+------------------+------------------------------------------------------+--------------------------------------------------------------------+
|                  | $$x : (\alpha, \tau_0)$$                             | $$\text{number} <: \tau_0, \quad \alpha <:                         |
|                  | $$mut : ...$$                                        |  \tau_0, \quad \fbox{$\tau_0 <: \alpha$}$$                         |
|                  |                                                      | $$\text{string} <: \tau_0$$                                        |
|                  |                                                      | $$\text{void} \xrightarrow{x} ...$$                                |
+------------------+------------------------------------------------------+--------------------------------------------------------------------+

: Simplified derivation for the program in [@Lst:wrong]

Casting `(x: string)` in the final line adds a constraint of the form $$\frac{\Gamma \vdash x : (\alpha, \tau_0)}{\alpha <: \text{string}}$$ saying that whatever type $\alpha$ is currently assigned to $x$ in $\Gamma$, must be a subtype of `string`. 

Following the derivation in the above table, our environment at this point in the program will prove that
$$\Gamma(x) = (\alpha, \tau_0) \qquad\qquad \text{number} <: \tau_0 = \alpha$$

However, adding in $\alpha <: \text{string}$ triggers a contradiction:
$$
\begin{aligned}
\text{number} &<: \tau_0 = \alpha \\
              &<: \text{string} \\
\end{aligned}
$$

By transitivity, this implies that `number <: string`, which is clearly impossible.

Another way to interpret this error is to read the constraints 
$$
\begin{aligned}
\text{number} &<: \tau_0 = \alpha \\
\text{string} &<: \tau_0 = \alpha \\
\end{aligned}
$$
as a statement that $\alpha$ is a union of `number | string`. As such, we cannot possibly assert that $\alpha = \text{string}$, since $\alpha$ might well be `number`.
