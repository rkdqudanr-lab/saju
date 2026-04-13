const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.stack || err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:5173', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));
  
  if (errors.length > 0) {
    fs.writeFileSync('error_dump.txt', errors.join('\n\n====\n\n'));
    console.log("Wrote errors to error_dump.txt");
  } else {
    console.log("No errors found!");
  }
  
  await browser.close();
})();
