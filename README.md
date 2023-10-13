# `way` - Type Safe Path Builder

## Introduction

`way` is a TypeScript library that makes it possible to define and create URL paths in a type safe manner.
It also supports handling query parameters in a type-safe way.

You can customize both query serialization and query validation (parsing).
`way` supports [Zod](https://zod.dev/) out of the box.

## Installation

```bash
npm install @katis/way
```

## Features

- Define URL path schemas with both named and parameter segments.
- Create URL paths with optional query parameters.
- Parse URL paths to retrieve query parameters.
- Create partial paths for router libraries etc.

## Basic Usage

### Defining Schema

A schema defines the shape of your paths and their associated queries. It can consist of named segments, parameter segments, and associated queries.

Here's an example of the features of the library:

```typescript
import { way } from "@katis/way";
import { zod } from "zod";

// Query parameters can be parsed into a type safe object by implementing a QueryParser.
// way can use Zod types out of the box as a QueryParser.
const RootQuery = zod.object({
  search: zod.string().optional(),
});

// By default, way decodes query strings using URLSearchParameters, which doesn't
// automatically convert booleans and numbers.
const ProductQuery = zod.object({
  modal: zod.enum(["true", "false"]).transform((b) => b === "true"),
});

// Define a schema for your app's path hierarchy.
const schema = {
  // way.path defines the root route as a path builder that takes a RootQuery query parameter
  [way.path]: RootQuery,
  // routes can be nested to create your apps path hierarchy
  products: {
    // way.param defines a path segment that can take arbitrary strings, here it's a product ID
    [way.param]: {
      [way.path]: ProductQuery,
      // details defined as a single path that takes no query parameters
      details: { [way.path]: way.NoQuery },
    },
    // parameter segments can coexist on the same level with named segments
    edit: { [way.path]: ProductEditQuery },
  },
} satisfies way.Schema;

// Create a path builder from the schema.
const root = way.root(schema);

const index = root({ search: "socks" });
// index = "/?search=socks"

const productA = root.products["prod-a"]({ modal: true });
// productA = /products/prod-a?modal=true

const detailsB = root.products["prod-b"].details();
// detailsB = /products/prod-b/details

// Decode and parse a query string into a type safe object.
const query = way.parseQuery(root.products["productId"], "modal=true");
// query = { modal: "true" }
```

### Relative paths

`way.rel` can be used to create relative path builders:

```ts
const productsRel = root.products(way.rel);

const path = productsRel["prod-a"].details();
// path = prod-a/details
```

### Routes

`way.route` can be used to build a path from any segment without query parameters.
This is useful for configuring routing libraries.

```tsx
const productsRel = root.products(way.rel);

function Routes() {
  return (
    <Routes>
      {/* path = "/products" */}
      <Route path={root.products(way.route)}>
        { /* path = ":productId/details" */ }
        <Route path={productsRel[":productId"].details(way.route)}>
        { /* path = ":productId" */ }
        <Route path={productsRel[":productId"](way.route)}>
      </Route>
    </Routes>
  )
}
```

### Custom query codec

A query codec is an object that converts a query string to an object and back.
It doesn't validate types, you can use a library like Zod for that.

```ts
import queryString from "query-string";

const codec: way.QueryCodec = {
  decode: (encoded) => queryString.parse(encoded, { parseBooleans: true }),
  encode: (query) => queryString.stringify(query),
};

const RootQuery = zod.object({
  modal: zod.boolean().default(false),
});

const root = way.root(schema, { codec });

const search = "?modal=true";
const query = way.parseQuery(root.products["1234"], search);
// query = { modal: true }
```
