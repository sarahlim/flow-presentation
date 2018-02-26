---
title: Invalidating refinements with effects in Flow
author: Josh Shi and Sarah Lim
date: Type Systems, Winter 2018
numbersections: true
toc: true
whitespace: medium
---

# Introduction

[Flow](http://flow.org) is a static type system for JavaScript, created and maintained by Facebook. In this presentation, we focus specifically on how Flow manages **type refinements** and invalidations thereof, particularly in the context of *mutable local variables* captured by reference in closures.

# Example code

Consider the following JavaScript code, which typechecks just fine in Flow (you can [try it here](https://flow.org/try/#0G4QwTgBGD2BGsE8IF4IG8IDsQFsCmAXBAOQBKcixAvgNwBQdAZgK6YDGALgJbSYQDmeDgDlceABQAPAJTo6ECJJSKIAH1VQKCegrBDmYPpIB02fPSpA)):

```js
var robby = { name: 'Robby'};

function getName(x) {
  x = x || robby;
  return x.name;
}
```

In the function `getName`, the line `x = x || robby;` is a common JavaScript idiom, and assigns `x` a default value of `robby`. It's equivalent to `x = x ? x : robby`.

<!-- > NB: You may notice that we haven't provided annotations for `x`. Flow infers a compatible type of `x`. Calling `getKind` with an invalid argument would fail to typecheck.
> 
> NB2: If you try calling `getName({})` with an empty object `{}`, Flow won't throw an error. The type system behaves unsafely with empty objects. For more, see [Unknown property lookup on unsealed objects is unsafe](https://flow.org/en/docs/types/objects/#toc-unknown-property-lookup-on-unsealed-objects-is-unsafe) in the documentation. -->

However, the following function *fails* to [typecheck](https://flow.org/try/#0G4QwTgBGD2BGsE8IF4IG8IDsQFsCmAXBAOQBKcixAvgNwBQdAZgK6YDGALgJbSYQDmeDgDlceAGIguAGwAUADwCU6OhAjyU6iAB9tUCgnpqW7bryh4AzkNnKMG1JmbTpNCFVUXrHW0YsdmMD55ADpsfHoqIA):

```js
var robby = { name: 'Robby'};

function getNameFail(x) {
  x = x || robby;
  function reset() { x = null; }
  reset();
  return x.name;  // ERROR: Cannot get `x.name` because property `name` is missing in null
}
```

The added lines `function reset() { x = null; }` and `reset();` declare and invoke, respectively, a closure `reset` which captures a reference to the local argument `x`, and resets it to `null`.

Flow is unhappy with this, and gives the following error:

```
15:   return x.name;
               ^ Cannot get `x.name` because property `name` is missing in null [1].
References:
13:   function reset() { x = null; }
                             ^ [1]
```

Flow recognizes that invoking `reset()` sets `x` to type `null`, so the lookup `x.name` will fail.

This is an example of **flow-sensitive** analysis -- Flow traces the program's dataflow, generating and propagating constraints on types and variables at each step. If a contradiction is reached, Flow will give a type error.

# Typing judgments

The core typing judgment for expressions in Flow is of the form
$$\Gamma \vdash e : \tau ; \varepsilon ; \psi \dashv \Gamma' \triangleright C$$
which should be read as "Environment $\Gamma$ proves that $e$ has type $\tau$, *and* evaluating $e$ has **effects** $\varepsilon$, *and* when $e$ is truthy we know **predicates** $\psi$. This judgment produces an **output environment** $\Gamma'$, and a corresponding **constraint set** $C$."

Statements have a strictly simpler typing judgment:
$$\Gamma \vdash s : \varepsilon \dashv \Gamma' \triangleright C$$
which is identical to the judgment for expressions, except we don't prove a type (because statements can't have types) and we don't learn any predicates (because statements can't be truthy).

There are several new concepts here, and we'll illustrate them below in the inference rules. As a whirlwind tour, however:

- **Effects** (represented with $\varepsilon, \omega$) are program variables, like `x` or `y`. An effect $\varepsilon$ associated with some expression $e$ roughly describes the set of variables mutated by evaluating $e$.
- **Predicates** (represented with $\psi_1, \psi_2, \ldots$) are statements like $x \mapsto \mathrm{truthy}$. A predicate $P$ maps a variable to what we know about its type. In the typing judgment above, a predicate set $\psi$ associated with some expression $e$ is roughly the additional typing information we learn when $e$ is truthy.
- **Environments** (represented with $\Gamma_1, \Gamma_2, \ldots$) map 
- **Constraints** (represented with $C_1, C_2, \ldots$) are the trickiest concept to understand 

# Constraint generation

## Record literals: \textsc{CG-Rec}

```js
{ name: 'Robby' }  // { f: e }
```

The inference rule \textsc{CG-Rec} allows us to prove the following about an expression $\{ f: e \}$:

- It has **type** $\{ f: \alpha \}$, where $\alpha$ is a fresh type variable;
- Produces the **effects** $\varepsilon$ of evaluating $e$;
- Does not add any new **predicates**;
- Produces outputs:
    + **Environment** $\Gamma'$, the output of evaluating $e$, and
    + **Constraint** $C \cup \{ \tau \leq \alpha \}$, the union of the constraints $C$ from evaluating $e$, and a new constraint that says $e$'s type $\tau$ is a subtype of field $f$'s type $\alpha$.

By applying this rule to the record in the example code,

```js
var robby = { name: 'Robby' };
```

this is equivalent to writing, for some type variable `Alpha`, the following type assertions:

```js
(robby: { name: Alpha });
('Robby': Alpha);  // 'Robby' <: Alpha
```

## Variable assignments: \textsc{CG-Assign}

<!-- TODO(josh) -->

The previous rule actually only evaluates `{ name: 'Robby' }`. To evaluate the full assignment

```js
var robby = { name: 'Robby' };
```

we use rule \textsc{CG-Assign}.

<!-- TODO: Fill this in -->

## Function declarations: \textsc{CG-Fun}

<!-- TODO(slim) -->

```js
function getName(x) {
    // ...s
    return e;
}
```

A successful typecheck for $(x) \to \{ s; \text{return $e$}; \}$ tells us:

- The function has type $\alpha \xrightarrow{\varepsilon \setminus x, \overline{x_i}} \tau$, where
    + $\alpha$ is a fresh type variable created for the parameter,
    + $\varepsilon \setminus x, \overline{x_i}$ describes the effect had by calling the function later.
        + This is exactly the effect $\varepsilon$ of evaluating the function's body, but we remove the parameter $x$ and local variables $\overline{x_i}$, since those are local to the function and their invalidation is irrelevant to the calling context.
    + $\tau$ is the evaluated type of $e$, the return value in the function body.
- No new effects, denoted $\bot$ -- just declaring a function doesn't invalidate anything.
- No new predicates, denoted $\emptyset$. Again, just declaring a function doesn't tell us anything new about the types of our variables.

## Variable references: $\textsc{CG-Var}$

<!-- TODO(josh) -->

```js
robby
```

## Logical OR: \textsc{CG-Or}

<!-- TODO(josh) -->

```js
x || robby
```

## Record lookup: \textsc{CG-FdRd}

```js
x.names
```

## Function calls: \textsc{CG-Call}

<!-- TODO(slim) -->

# Refinements

## Applying refinements: \textsc{Ref-Single}

## Invalidating refinements: \textsc{Ref-Effect}

# Constraint propagation

<!-- Explain dataflow -->

## Variable subtyping transitivity

## Function calls: \textsc{CP-Call}

## Refinement effects: \textsc{CP-Havoc}

## Record lookup: \textsc{CP-Get}

# Putting it all together: derivation

## Consistency

## Derivation

<!-- Define consistency -->

# Citations

<!-- @article{Chaudhuri:2017:FPT:3152284.3133872,
 author = {Chaudhuri, Avik and Vekris, Panagiotis and Goldman, Sam and Roch, Marshall and Levi, Gabriel},
 title = {Fast and Precise Type Checking for JavaScript},
 journal = {Proc. ACM Program. Lang.},
 issue_date = {October 2017},
 volume = {1},
 number = {OOPSLA},
 month = oct,
 year = {2017},
 issn = {2475-1421},
 pages = {48:1--48:30},
 articleno = {48},
 numpages = {30},
 url = {http://doi.acm.org/10.1145/3133872},
 doi = {10.1145/3133872},
 acmid = {3133872},
 publisher = {ACM},
 address = {New York, NY, USA},
 keywords = {JavaScript, Type Inference, Type Systems},
} 
 -->
