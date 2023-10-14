import { describe, it, expect } from "vitest";
import { kebabCase, splitCamelCase } from "./kebabCase.js";

describe("splitCamelCase", () => {
  it("returns correctly for empty or singular words", () => {
    expect(splitCamelCase("")).toEqual([]);
    expect(splitCamelCase("foo")).toEqual(["foo"]);
    expect(splitCamelCase("123")).toEqual(["123"]);
  });

  it("handles basic camelCasing", () => {
    expect(splitCamelCase("FooBar")).toEqual(["Foo", "Bar"]);
    expect(splitCamelCase("fooBar")).toEqual(["foo", "Bar"]);
  });

  it("handles camelCasing with numbers", () => {
    expect(splitCamelCase("FOO1BAR")).toEqual(["FOO1", "BAR"]);
    expect(splitCamelCase("FOO1Bar")).toEqual(["FOO1", "Bar"]);
    expect(splitCamelCase("Foo1Bar")).toEqual(["Foo1", "Bar"]);
  });

  it("handles full uppercase words", () => {
    expect(splitCamelCase("FOOBAR")).toEqual(["FOOBAR"]);
  });

  it("splits longer camelCased words", () => {
    expect(splitCamelCase("parseHTMLDocument")).toEqual([
      "parse",
      "HTML",
      "Document",
    ]);
  });

  it("handles abbreviations correctly", () => {
    expect(splitCamelCase("getID")).toEqual(["get", "ID"]);
    expect(splitCamelCase("GETId")).toEqual(["GET", "Id"]);
  });
});

describe("kebabCase", () => {
  it("should convert camelCase to kebab-case", () => {
    expect(kebabCase("camelCase")).toBe("camel-case");
  });

  it("should handle single words without change", () => {
    expect(kebabCase("word")).toBe("word");
  });

  it("should convert PascalCase to kebab-case", () => {
    expect(kebabCase("PascalCase")).toBe("pascal-case");
  });

  it("should handle an empty string", () => {
    expect(kebabCase("")).toBe("");
  });

  it("should convert string with multiple consecutive capital letters correctly", () => {
    expect(kebabCase("HTMLParser")).toBe("html-parser");
  });

  it("should handle string with numbers", () => {
    expect(kebabCase("parseHTML5")).toBe("parse-html5");
  });
});
