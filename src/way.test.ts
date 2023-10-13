import { describe, it, expect } from "vitest";
import * as way from "./way.js";
import * as zod from "zod";

describe("way", () => {
  const schema = {
    [way.path]: RootQuery,
    faq: { [way.path]: way.NoQuery },
    products: {
      [way.param]: {
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
    const path = root.products["1234"].edit({ dirty: true });
    const query = way.parseQuery(root.products["id"].edit, getSearch(path));
    query satisfies ProductEditQuery;

    expect(path).toBe("/products/1234/edit?dirty=true");
    expect(query).toEqual({ dirty: true });
  });

  it("builds path with query ending in parameter segment", () => {
    const path = root.products["1234"]({
      modal: true,
    });
    const query = way.parseQuery(root.products["product-id"], getSearch(path));
    query satisfies ProductQuery;

    expect(path).toBe("/products/1234?modal=true");
    expect(query).toEqual({ modal: true });
  });

  it("builds path without query ending in named segment", () => {
    const path = root.faq();
    expect(path).toBe("/faq");
  });

  it("builds path in a mixed named and parameter segment", () => {
    expect(root.products.edit({ dirty: true })).toBe(
      "/products/edit?dirty=true"
    );
    expect(root.products["1234"]({ modal: true })).toBe(
      "/products/1234?modal=true"
    );
  });

  describe("relative paths", () => {
    it("builds empty relative root path", () => {
      const productPath = root.products["1234"](way.rel);

      expect(productPath({ modal: true })).toBe("?modal=true");
      expect(productPath({})).toBe("");
    });

    it("builds relative path", () => {
      const productPath = root.products(way.rel);

      expect(productPath["1234"].edit({ dirty: true })).toEqual(
        "1234/edit?dirty=true"
      );
    });

    it("throws an error if given an invalid path", () => {
      expect(() => {
        const anyRoot = root as any;
        anyRoot.foo.bar(way.rel);
      }).toThrowError("Tried to build path that doesn't match the schema");

      expect(() => {
        const anyRoot = root as any;
        anyRoot.products["123"].foo(way.rel);
      }).toThrowError("Tried to build path that doesn't match the schema");
    });
  });

  describe("routes", () => {
    it("builds absolute path", () => {
      expect(root(way.route)).toEqual("/");
      expect(root.products(way.route)).toEqual("/products");
      expect(root.products["1234"](way.route)).toEqual("/products/1234");
      expect(root.products["1234"].details(way.route)).toEqual(
        "/products/1234/details"
      );
    });

    it("builds relative route", () => {
      const productPath = root.products(way.rel);

      expect(productPath(way.route)).toEqual("");
      expect(productPath["1234"](way.route)).toEqual("1234");
      expect(productPath["1234"].edit(way.route)).toEqual("1234/edit");
    });
  });
});

const QueryBool = zod
  .enum(["true", "false"])
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

const getSearch = (path: string): string =>
  new URL(path, "http://example.com").search.slice(1);
