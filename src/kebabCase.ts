const separated = "$1\0$2";
const sep = "\0";
const surroundingSeparators = new RegExp(`^${sep}+|${sep}+$`, "g");

const replacements: [RegExp, string][] = [
  [/([\p{Ll}\d])(\p{Lu})/gu, separated], // split lower to upper
  [/(\p{Lu})([\p{Lu}][\p{Ll}])/gu, separated], // split consecutive uppers
  [/[^\p{L}\d]+/giu, sep], // replace non-word/numbers with separator
  [surroundingSeparators, ""], // replace consecutive separators with empty string
];

export const splitCamelCase = (input: string): string[] =>
  input.length === 0
    ? []
    : replacements
        .reduce((acc, [re, str]) => acc.replace(re, str), input)
        .split(sep);

export const kebabCase = (input: string): string =>
  splitCamelCase(input)
    .map((s) => s.toLowerCase())
    .join("-");
