const puppeteer = require("puppeteer");
const { urls } = require("./example_urls");

async function retry(promiseFactory, retryCount) {
  try {
    return await promiseFactory();
  } catch (error) {
    if (retryCount <= 0) {
      throw error;
    } else {
      console.log(`Retrying... (${retryCount} remaining)`);
    }
    return await retry(promiseFactory, retryCount - 1);
  }
}

(async () => {
  try {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    const page = await browser.newPage();
    page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (resourceType === "image") {
        req.abort();
      } else {
        req.continue();
      }
    });

    for (const url of urls) {
      const { hostname } = new URL(url);
      var erroredOut = false;
      var startDate = new Date();
      try {
        await retry(
          () => page.goto(url, { timeout: 60000 }),
          3 // retry this 3 times
        );
      } catch (error) {
        erroredOut = true;
        console.error("Error while loading url", hostname, error);
      }
      var endDate = new Date();
      var timeDiff = endDate.getTime() - startDate.getTime();
      var timeDiffSeconds = timeDiff / 1000;
      console.log(`${url} "loaded" in ${timeDiffSeconds} seconds`);
  
      var startDate = new Date();
      await waitTillHTMLRendered(page)
      var endDate = new Date();
      var timeDiff = endDate.getTime() - startDate.getTime();
      var timeDiffSeconds = timeDiff / 1000;
      console.log(`${url} fully loaded in ${timeDiffSeconds} seconds additional`);

      await page.setViewport({
        width: 1920,
        height: 1080,
      });
      await page.screenshot({
        path: `./screenshots/${hostname}.jpeg`,
        fullPage: true,
        quality: 90,
      });
      if (erroredOut) {
        console.log(`${url} errored out, but still saved screenshot???`);
      }
    }

    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();

const waitTillHTMLRendered = async (page, timeout = 45000) => {
  const checkDurationMsecs = 500;
  const maxChecks = timeout / (checkDurationMsecs * 2);
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length; 

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
      countStableSizeIterations++;
    else 
      countStableSizeIterations = 0; //reset the counter

    if(countStableSizeIterations >= minStableSizeIterations) {
      console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }  
};
