import { defineConfig, Plugin } from "vite";
import path from "path";
import fs from "fs/promises";
import typescriptPlugin from "@rollup/plugin-typescript";
import { OutputAsset, OutputChunk } from "rollup";
import CleanCSS from "clean-css";
import { statSync } from "fs";
const { execFileSync } = require("child_process");
import ect from "ect-bin";

const htmlMinify = require("html-minifier");
const tmp = require("tmp");
const ClosureCompiler = require("google-closure-compiler").compiler;

export default defineConfig(({ command, mode }) => {
  const config = {
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: undefined,
  };

  if (command === "build") {
    // @ts-ignore
    config.esbuild = false;
    // @ts-ignore
    config.base = "";
    // @ts-ignore
    config.build = {
      minify: false,
      target: "es2020",
      modulePreload: { polyfill: false },
      assetsInlineLimit: 800,
      assetsDir: "",
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          manualChunks: undefined,
          assetFileNames: `[name].[ext]`,
        },
      },
    };
    // @ts-ignore
    config.plugins = [
      typescriptPlugin(),
      // ectPlugin(),
    ];
  }

  return config;
});

/**
 * Transforms the given JavaScript code into a packed version.
 * @param html The original HTML.
 * @param chunk The JavaScript output chunk from Rollup/Vite.
 * @returns The transformed HTML with the JavaScript embedded.
 */
async function embedJs(html: string, chunk: OutputChunk): Promise<string> {
  const scriptTagRemoved = html.replace(
    new RegExp(`<script[^>]*?src=[\./]*${chunk.fileName}[^>]*?></script>`),
    ""
  );
  const htmlInJs = `document.write('${scriptTagRemoved}');` + chunk.code.trim();

  const inputs: Input[] = [
    {
      data: htmlInJs,
      type: "js" as InputType,
      action: "eval" as InputAction,
    },
  ];

  let options;
  if (process.env.USE_RR_CONFIG) {
    try {
      options = JSON.parse(
        await fs.readFile(`${__dirname}/roadroller-config.json`, "utf-8")
      );
    } catch (error) {
      throw new Error(
        "Roadroller config not found. Generate one or use the regular build option"
      );
    }
  } else {
    options = { allowFreeVars: true };
  }

  const packer = new Packer(inputs, options);
  await Promise.all([
    fs.writeFile(`${path.join(__dirname, "dist")}/output.js`, htmlInJs),
    packer.optimize(process.env.LEVEL_2_BUILD ? 2 : 0), // Regular builds use level 2, but rr config builds use the supplied params
  ]);
  const { firstLine, secondLine } = packer.makeDecoder();
  return `<body><script>\n${firstLine}\n${secondLine}\n</script>`;
}

/**
 * Embeds CSS into the HTML.
 * @param html The original HTML.
 * @param asset The CSS asset.
 * @returns The transformed HTML with the CSS embedded.
 */
function embedCss(html: string, asset: OutputAsset): string {
  const reCSS = new RegExp(
    `<link rel="stylesheet"[^>]*?href="[\./]*${asset.fileName}"[^>]*?>`
  );
  const code = `<style>${new CleanCSS({ level: 2 }).minify(asset.source as string).styles}</style>`;
  return html.replace(reCSS, code);
}

/**
 * Creates the ECT plugin that uses Efficient-Compression-Tool to build a zip file.
 * @returns The ECT plugin.
 */
function ectPlugin(): Plugin {
  return {
    name: "vite:ect",
    writeBundle: async (): Promise<void> => {
      try {
        const files = await fs.readdir("dist/");
        const assetFiles = files
          .filter((file) => {
            return (
              !file.includes(".js") &&
              !file.includes(".css") &&
              !file.includes(".html") &&
              !file.includes(".zip") &&
              file !== "assets"
            );
          })
          .map((file) => "dist/" + file);
        const args = [
          "-strip",
          "-zip",
          "-10009",
          "dist/index.html",
          ...assetFiles,
        ];
        const result = execFileSync(ect, args);
        console.log("ECT result", result.toString().trim());
        const stats = statSync("dist/index.zip");
        console.log("ZIP size", stats.size);
      } catch (err) {
        console.log("ECT error", err);
      }
    },
  };
}
