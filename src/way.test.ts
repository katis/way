import { describe, it, expect } from "vitest";
import * as way from "./way-module.js";
import * as zod from "zod";

describe("way", () => {
  const schema = {
    [way.path]: RootQuery,
    deliveryFAQ: { [way.path]: way.NoQuery },
    productCatalog: {
      [way.param.productId]: {
        [way.path]: ProductQuery,
        details: { [way.path]: way.NoQuery },
        edit: { [way.path]: ProductEditQuery },
      },
      edit: { [way.path]: ProductEditQuery },
    },
  } satisfies way.Schema;

  const root = way.root(schema);

  it("builds root path", () => {
    expect(root({ date: "2020-01-01", search: "socks" })).toBe(
      "/?date=2020-01-01&search=socks"
    );
    expect(root({ date: "2020-01-01" })).toBe("/?date=2020-01-01");
    expect(root({})).toBe("/");
  });

  it("builds path with query ending in named segment", () => {
    const path = root.productCatalog["1234"].edit({ dirty: true });
    const query = root.productCatalog["id"].edit(way.query, search(path));
    query satisfies ProductEditQuery;

    expect(path).toBe("/product-catalog/1234/edit?dirty=true");
    expect(query).toEqual({ dirty: true });
  });

  it("builds path with query ending in parameter segment", () => {
    const path = root.productCatalog["1234"]({
      modal: true,
    });
    const query = root.productCatalog["product-id"](way.query, search(path));
    query satisfies ProductQuery;

    expect(path).toBe("/product-catalog/1234?modal=true");
    expect(query).toEqual({ modal: true });
  });

  it("handles reserved symbols in query parameters", () => {
    const path = root({ date: "2020/01/01", search: "shoes&socks" });
    expect(path).toBe("/?date=2020%2F01%2F01&search=shoes%26socks");
  });

  it("builds path without query ending in named segment", () => {
    const path = root.deliveryFAQ();
    expect(path).toBe("/delivery-faq");
  });

  it("builds path in a mixed named and parameter segment", () => {
    expect(root.productCatalog.edit({ dirty: true })).toBe(
      "/product-catalog/edit?dirty=true"
    );
    expect(root.productCatalog["1234"]({ modal: true })).toBe(
      "/product-catalog/1234?modal=true"
    );
  });

  it("formats as string", () => {
    const path = root.productCatalog["1234"];
    const rel = root(way.rel).productCatalog["1234"];
    expect(`${path}`).toEqual("/product-catalog/1234");
    expect(`${rel}`).toEqual("product-catalog/1234");
  });

  it("throws error on invalid query parameter", () => {
    expect(() =>
      console.log(root.productCatalog.edit(way.query, "dirty=asdf"))
    ).toThrow();
  });

  it("throws an error if invalid symbol is provided as argument", () => {
    expect(() => {
      const sym = Symbol("asdf");
      root.productCatalog.edit(sym as any);
    }).toThrow();
  });

  describe("relative paths", () => {
    it("builds empty relative root path", () => {
      const productPath = root.productCatalog["1234"](way.rel);

      expect(productPath({ modal: true })).toBe("?modal=true");
      expect(productPath({})).toBe("");
    });

    it("builds relative path", () => {
      const productPath = root.productCatalog(way.rel);

      expect(productPath["1234"].edit({ dirty: true })).toEqual(
        "1234/edit?dirty=true"
      );
    });

    it("throws an error if given an invalid path", () => {
      expect(() => {
        const anyRoot = root as any;
        anyRoot.foo.bar(way.rel);
      }).toThrowError("Path foo/bar has no configured schema");

      expect(() => {
        const anyRoot = root as any;
        anyRoot.products["123"].foo(way.rel);
      }).toThrowError("Path products/123/foo has no configured schema");
    });
  });

  describe("routes", () => {
    it("builds absolute path", () => {
      expect(root(way.route)).toEqual("/");
      expect(root.productCatalog(way.route)).toEqual("/product-catalog");
      expect(root.productCatalog["1234"](way.route)).toEqual(
        "/product-catalog/1234"
      );
      expect(root.productCatalog["1234"].details(way.route)).toEqual(
        "/product-catalog/1234/details"
      );
    });

    it("builds relative route", () => {
      const productPath = root.productCatalog(way.rel);

      expect(productPath(way.route)).toEqual("");
      expect(productPath["1234"](way.route)).toEqual("1234");
      expect(productPath["1234"].edit(way.route)).toEqual("1234/edit");
    });
  });

  describe("formatSegment config", () => {
    const rootUpper = way.root(schema, {
      formatSegment: (segment) => segment.toUpperCase(),
    });

    it("formats segment to uppercase", () => {
      expect(rootUpper.productCatalog["qwerq"].details()).toEqual(
        "/PRODUCTCATALOG/QWERQ/DETAILS"
      );
    });
  });

  describe("way.queryString", () => {
    it("returns empty query string", () => {
      expect(root.productCatalog["1234"](way.queryString, {})).toEqual("");
    });

    it("returns encoded query string", () => {
      expect(
        root.productCatalog["1234"](way.queryString, { modal: true })
      ).toEqual("modal=true");
    });
  });

  describe("Function methods", () => {
    it("builds with .apply", () => {
      const result = root.productCatalog["1234"].apply(null, [
        { modal: true },
      ] as any);
      expect(result).toBe("/product-catalog/1234?modal=true");
    });

    it("builds with .call", () => {
      const result = (root.productCatalog["1234"].call as any)(null, {
        modal: false,
      });
      expect(result).toBe("/product-catalog/1234?modal=false");
    });

    it("returns query with .apply", () => {
      const result = (root.productCatalog["1234"].apply as any)(null, [
        way.query,
        "modal=true",
      ]);
      expect(result).toEqual({ modal: true });
    });

    it("returns query with .call", () => {
      const result = (root.productCatalog["1234"].call as any)(
        null,
        way.query,
        "modal=true"
      );
      expect(result).toEqual({ modal: true });
    });
  });
});

const QueryBool = zod
  .enum(["true", "false"])
  .default("false")
  .transform((arg) => arg === "true");

type RootQuery = zod.infer<typeof RootQuery>;
const RootQuery = zod.object({
  date: zod.string().optional(),
  search: zod.string().default("").optional(),
});

type ProductQuery = zod.infer<typeof ProductQuery>;
const ProductQuery = zod.object({
  modal: QueryBool.optional(),
});

type ProductEditQuery = zod.infer<typeof ProductEditQuery>;
const ProductEditQuery = zod.object({
  dirty: QueryBool,
});

const search = (path: string): string =>
  new URL(path, "http://example.com").search.slice(1);
