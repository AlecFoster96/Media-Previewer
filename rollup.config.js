import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";
import scss from "rollup-plugin-scss";
import replace from "@rollup/plugin-replace";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import {
  writeFile,
  writeFileSync,
  ensureDir,
  ensureDirSync,
  readdirSync,
  statSync,
} from "fs-extra";
import pkg from "./package.json";

function toTitleCase(value) {
  return value.replace(/\w\S*/g, (text) => {
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
  });
}

const tsExtRegex = new RegExp("[.]ts$", "i");

const name = toTitleCase(pkg.name.trim().replace(/[-_]+/g, " "));
const pathSafeName = name.replace(/[^a-z0-9 ]+/gi, "").replace(/[ ]+/g, "-");
const extensions = [".js", ".jsx", ".ts", ".tsx"];
const extensionSettings = pkg.extensionSettings;
const sitesFolder = "src/config/sites";

let sitesToAutoload = [];
let autoloadInfo = {
  ignored: 0,
  loaded: 0,
};

// TODO: get host for Site using the filename?
readdirSync(sitesFolder).forEach((item) => {
  if (/[a-z0-9]/.test(item.charAt(0))) {
    const fullPath = `${sitesFolder}/${item}`;
    const stat = statSync(fullPath);

    if (!stat.isDirectory() && tsExtRegex.test(item)) {
      const fileName = item.replace(tsExtRegex, "");
      if (!/[^a-z0-9.\-_]/.test(fileName)) {
        const importKey = fileName;
        const variableKey = importKey.replace(/[.\-]+/gi, "_");

        autoloadInfo.loaded++;
        console.log(
          `\x1b[32m✓ ${importKey} (${sitesFolder}/${item}) added to load queue by site autoloader\x1b[0m`
        );

        sitesToAutoload.push({
          importKey: importKey,
          variableKey: `site_${sitesToAutoload.length + 1}_${variableKey}`,
        });
      } else {
        autoloadInfo.ignored++;
        console.log(
          `\x1b[33m✗ ${importKey} (${sitesFolder}/${item}) ignored by site autoloader\x1b[0m`
        );
      }
    }
  } else if (tsExtRegex.test(item) && item !== "_loader.ts") {
    const importKey = item.replace(tsExtRegex, "");
    autoloadInfo.ignored++;
    console.log(
      `\x1b[33m✗ ${importKey} (${sitesFolder}/${item}) ignored by site autoloader\x1b[0m`
    );
  }
});

console.log(
  `\n\x1b[34m> ${autoloadInfo.loaded} site${
    autoloadInfo.loaded !== 1 ? "s" : ""
  } autoloaded, ${autoloadInfo.ignored} site${
    autoloadInfo.ignored !== 1 ? "s" : ""
  } ignored\x1b[0m`
);

let inputPlugins = [
  // Allows node_modules resolution
  resolve({ extensions }),

  // Allow bundling cjs modules. Rollup doesn't understand cjs
  commonjs(),

  // Compile TypeScript/JavaScript files
  babel({
    // https://github.com/rollup/plugins/tree/master/packages/babel
    extensions,
    babelHelpers: "bundled",
    include: ["src/**/*"],
  }),
];

let outputPlugins = [];
if (process.env.BUILD === "production") {
  outputPlugins.push(terser());
}

const distPaths = {
  chromium: `dist/chromium/${pathSafeName}`,
  firefox: `dist/firefox/${pathSafeName}`,
};

let modifiedAction = Object.assign({}, extensionSettings.action);
modifiedAction.default_title = modifiedAction.default_title.replace(
  /__NAME__/g,
  name
);

const chromiumManifest = {
  manifest_version: 3,
  name: name,
  description: pkg.description,
  version: pkg.version,
  options_ui: {
    page: extensionSettings.settings_page,
    open_in_tab: true,
    browser_style: false,
  },
  background: {
    service_worker: extensionSettings.background,
  },
  permissions: extensionSettings.permissions,
  action: modifiedAction,
  content_scripts: extensionSettings.content_scripts,
};

let firefoxManifest = Object.assign({}, chromiumManifest);
firefoxManifest.manifest_version = 2;
delete firefoxManifest.action;
firefoxManifest.browser_action = modifiedAction;
firefoxManifest.background = {
  scripts: [extensionSettings.background],
};

function writeManifestFiles() {
  return {
    name: "rollup-plugin-write-manifest-files",
    async writeBundle(options, bundle) {
      await ensureDir(distPaths.chromium);
      await ensureDir(distPaths.firefox);
      await writeFile(
        `${distPaths.chromium}/manifest.json`,
        JSON.stringify(chromiumManifest, null, 2)
      );
      await writeFile(
        `${distPaths.firefox}/manifest.json`,
        JSON.stringify(firefoxManifest, null, 2)
      );
    },
  };
}

export default [
  // Main injected code (content script)
  {
    input: "./src/index.ts",
    external: [],

    plugins: [
      // Handle auto import of sites
      replace({
        __AUTOLOAD_SITE_IMPORTER__: () => {
          if (sitesToAutoload.length > 0) {
            let imports = sitesToAutoload.map((site) => {
              return `import ${site.variableKey} from "./${site.importKey}";`;
            });
            return imports.join("\n");
          }
          return "";
        },
        __AUTOLOAD_SITE_PUSHER__: () => {
          if (sitesToAutoload.length > 0) {
            let imports = sitesToAutoload.map((site) => {
              return `sites.push(${site.variableKey});`;
            });
            return imports.join("\n");
          }
          return "";
        },
        delimiters: ["/* ", " */"],
        preventAssignment: true,
      }),
    ].concat(
      inputPlugins,
      scss({
        processor: (css) => postcss([autoprefixer()]),
        output: (styles, styleNodes) => {
          if (!styles) return;
          ensureDirSync(distPaths.chromium);
          ensureDirSync(distPaths.firefox);
          writeFileSync(`${distPaths.chromium}/style.css`, styles);
          writeFileSync(`${distPaths.firefox}/style.css`, styles);
        },
        failOnError: true,
        sass: require("sass"),
      })
    ),

    output: [
      {
        file: `${distPaths.chromium}/script.js`,
        format: "iife",
        globals: {},
        plugins: outputPlugins.concat([
          copy({
            hook: "writeBundle",
            targets: [
              {
                src: `${distPaths.chromium}/script.js`,
                dest: distPaths.firefox,
              },
            ],
          }),
          writeManifestFiles(),
        ]),
      },
    ],
  },

  // Background script (service worker)
  {
    input: "./src/background.ts",
    external: [],
    plugins: inputPlugins,

    output: [
      {
        file: `${distPaths.chromium}/background.js`,
        format: "iife",
        globals: {},
        plugins: outputPlugins.concat(
          copy({
            hook: "writeBundle",
            targets: [
              {
                src: `${distPaths.chromium}/background.js`,
                dest: distPaths.firefox,
              },
            ],
          })
        ),
      },
    ],
  },

  // Extension menu (popup)
  {
    input: "./src/extensionMenu.ts",
    external: [],

    plugins: inputPlugins.concat(
      scss({
        processor: (css) => postcss([autoprefixer()]),
        output: (styles, styleNodes) => {
          if (!styles) return;
          ensureDirSync(distPaths.chromium);
          ensureDirSync(distPaths.firefox);
          writeFileSync(`${distPaths.chromium}/extension_menu.css`, styles);
          writeFileSync(`${distPaths.firefox}/extension_menu.css`, styles);
        },
        failOnError: true,
        sass: require("sass"),
      })
    ),

    output: [
      {
        file: `${distPaths.chromium}/extension_menu.js`,
        format: "iife",
        globals: {},
        plugins: outputPlugins.concat(
          copy({
            hook: "writeBundle",
            targets: [
              {
                src: `${distPaths.chromium}/extension_menu.js`,
                dest: distPaths.firefox,
              },
              {
                src: "public/extension_menu.html",
                dest: [distPaths.chromium, distPaths.firefox],
                transform: (contents, filename) =>
                  contents
                    .toString()
                    .replace(/__NAME__/g, name)
                    .replace(/__VERSION__/g, pkg.version),
              },
            ],
          })
        ),
      },
    ],
  },

  // Settings page
  {
    input: "./src/settings.ts",
    external: [],

    plugins: inputPlugins.concat(
      scss({
        processor: (css) => postcss([autoprefixer()]),
        output: (styles, styleNodes) => {
          if (!styles) return;
          ensureDirSync(distPaths.chromium);
          ensureDirSync(distPaths.firefox);
          writeFileSync(`${distPaths.chromium}/settings.css`, styles);
          writeFileSync(`${distPaths.firefox}/settings.css`, styles);
        },
        failOnError: true,
        sass: require("sass"),
      })
    ),

    output: [
      {
        file: `${distPaths.chromium}/settings.js`,
        format: "iife",
        globals: {},
        plugins: outputPlugins.concat(
          copy({
            hook: "writeBundle",
            targets: [
              {
                src: `${distPaths.chromium}/settings.js`,
                dest: distPaths.firefox,
              },
              {
                src: "public/settings.html",
                dest: [distPaths.chromium, distPaths.firefox],
                transform: (contents, filename) =>
                  contents
                    .toString()
                    .replace(/__NAME__/g, name)
                    .replace(/__VERSION__/g, pkg.version),
              },
            ],
          })
        ),
      },
    ],
  },
];
