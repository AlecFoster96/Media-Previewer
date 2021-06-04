# Media-Previewer

This browser extension will popup media when hovering over thumbnails on supported sites.

Built using Rollup to compile TypeScript to JavaScript and then running Babel & Terser on it.

This extension is built to work in both Chromium browsers and in Firefox _(dist folder will contain two folders after build, "chromium" and "firefox")_.

The current version of this extension still needs more work, but most of the key features are implemented.

---

## Supported sites

> These are the main sites that were requested by testers, more will be added in the future and maybe a general site parse, to support even more sites.

- YouTube
- Floatplane
- Dribbble
- Rule 34 _(.xxx)_

---

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run dev
```

### Compiles and minifies for production

```
npm run build
```
