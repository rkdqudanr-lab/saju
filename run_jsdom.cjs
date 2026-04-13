const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const html = `
<!DOCTYPE html>
<html>
<body><div id="root"></div></body>
</html>
`;

const dom = new JSDOM(html, {
  url: "http://localhost/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: new (require("jsdom").VirtualConsole)(),
});

dom.window.console.error = (e) => console.log('CAUGHT ERR:', e);
dom.window.console.log = () => {};

dom.window.addEventListener("error", (event) => {
  console.log("uncaught exception", event.error.message);
  console.log(event.error.stack);
});
dom.window.addEventListener("unhandledrejection", (event) => {
  console.log("unhandled rejection", event.reason);
});

// Polyfills
dom.window.matchMedia = () => ({ matches: false });
dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 0);

const code = fs.readFileSync(path.join(__dirname, "dist/assets/index-DNLOJiNc.js"), "utf8");

try {
  dom.window.eval(code);
} catch(e) {
  console.log("EVAL ERROR:", e.message);
  console.log(e.stack);
}
