const fs = require("fs/promises");
const path = require("path");

async function writeJsonToFile(dir, filename, data) {
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, filename),
      JSON.stringify(data, null, 2),
      "utf8"
    );
    console.log(`File written to: ${path.join(dir, filename)}`);
  } catch (error) {
    console.error(`Error writing to ${path.join(dir, filename)}:`, error);
  }
}

async function main() {
  await writeJsonToFile("./dist/esm", "package.json", { type: "module" });
  await writeJsonToFile("./dist/cjs", "package.json", { type: "commonjs" });
}

main();
