var AWS = require("aws-sdk");
const fs = require('fs');

const crypto = require('crypto');

const chromium = require('@sparticuz/chrome-aws-lambda');
const { addExtra } = require('puppeteer-extra')
const puppeteerExtra = addExtra(chromium.puppeteer)
//const { enchantPuppeteer } = require('enchant-puppeteer')
//enchantPuppeteer()


const { WebClient } = require('@slack/web-api');
//const tslack = new WebClient(process.env.slack_token);


const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const BlockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const ChromeAppPlugin = require('puppeteer-extra-plugin-stealth/evasions/chrome.app')
const ChromeCsiPlugin = require('puppeteer-extra-plugin-stealth/evasions/chrome.csi')
const ChromeLoadTimes = require('puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes')
const ChromeRuntimePlugin = require('puppeteer-extra-plugin-stealth/evasions/chrome.runtime')
const IFrameContentWindowPlugin = require('puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow')
const MediaCodecsPlugin = require('puppeteer-extra-plugin-stealth/evasions/media.codecs')
const NavigatorLanguagesPlugin = require('puppeteer-extra-plugin-stealth/evasions/navigator.languages')
const NavigatorPermissionsPlugin = require('puppeteer-extra-plugin-stealth/evasions/navigator.permissions')
const NavigatorPlugins = require('puppeteer-extra-plugin-stealth/evasions/navigator.plugins')
const NavigatorVendor = require('puppeteer-extra-plugin-stealth/evasions/navigator.vendor')
const NavigatorWebdriver = require('puppeteer-extra-plugin-stealth/evasions/navigator.webdriver')
const SourceUrlPlugin = require('puppeteer-extra-plugin-stealth/evasions/sourceurl')
const UserAgentOverridePlugin = require('puppeteer-extra-plugin-stealth/evasions/user-agent-override')
const WebglVendorPlugin = require('puppeteer-extra-plugin-stealth/evasions/webgl.vendor')
const WindowOuterDimensionsPlugin = require('puppeteer-extra-plugin-stealth/evasions/window.outerdimensions')


const plugins = [
  StealthPlugin(),
  ChromeAppPlugin(),
  ChromeCsiPlugin(),
  ChromeLoadTimes(),
  ChromeRuntimePlugin(),
  IFrameContentWindowPlugin(),
  MediaCodecsPlugin(),
  NavigatorLanguagesPlugin(),
  NavigatorPermissionsPlugin(),
  NavigatorPlugins(),
  NavigatorVendor(),
  NavigatorWebdriver(),
  SourceUrlPlugin(),
  UserAgentOverridePlugin(),
  WebglVendorPlugin(),
  WindowOuterDimensionsPlugin(),
  AdblockerPlugin(),
  BlockResourcesPlugin({blockedTypes: new Set(['image','media'])})//*/
];


for (const plugin of plugins) {
  //console.log(`Use ${plugin.name} loading`);
  puppeteerExtra.use(plugin);
  //console.log(`Use ${plugin.name} loaded`);
}

//const { IncomingWebhook } = require('@slack/webhook');
//const tslack = new IncomingWebhook("https://hooks.slack.com/services/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");

const scrape = async  (event) => {
  
  if (!event) { return { "status": "failure", "message": "No JSON payload found" };}
  if (!event.url) { return { "status": "failure", "message": "Missing URL from JSON payload" };  }
  if (!event.id) { return { "status": "failure", "message": "Missing ID from JSON payload" };  }
  console.log("Scraping started for URL: " + event.id);

  let url = event.url;
  let id = event.id;

  const newargs = chromium.args
  if (process.env.proxy_address) {
    console.log("Using proxy: " + process.env.proxy_address)
    newargs.push('--proxy-server=' + process.env.proxy_address)
    console.log("Proxy pushed to args")
  }

  console.log("Launching browser...")
  const browser = await puppeteerExtra.launch({
    args: newargs,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless
  });
  console.log("Browser launched")

  console.log('Getting newpage...');
  const page = await browser.newPage();
  console.log('Got newpage');


  if (process.env.proxy_username) {
    console.log("Authenticating proxy..." + `\nusername: ${process.env.proxy_username}` + `\npassword: ${process.env.proxy_password}`)
    await page.authenticate({
      username: process.env.proxy_username,
      password: process.env.proxy_password
    });
    console.log("Authenticated proxy.")
  }


  page.on('console', message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
  
  console.log('Trying about:blank workaround for plugins not loading on initial page load');
  response = await page.goto('about:blank', {waitUntil: 'networkidle2', timeout: 90000});
  console.log('Go to url: |' + url + '|');
  response = await page.goto(url, {waitUntil: 'networkidle0', timeout: 90000});
  
  await page.waitForTimeout(15 * 1000)
  
  await waitTillHTMLRendered(page)
  
  try {
    var data = fs.readFileSync('jquery-3.2.1.min.js', 'utf8'); // load a local copy of jquery, mostly for other scripts not included
    await page.addScriptTag({ content: data});
  } catch(e) {
    console.log('Error:', e.stack);
  }


  const screenshot = await page.screenshot({fullPage: true});
  console.log("scraping6");
  const htmlData = await page.content();
  console.log("scraping7");
  await browser.close()

  response_status = response.status();

  if (response_status != 404) {
    scraped=true;
    sshash = crypto.createHash('sha256').update(screenshot).digest('base64');
    console.log("sshash: " + sshash);
    ssLocation = await writeFileToS3("thebucket",id + '.png', screenshot, 'image/png', 'ss');
    if (process.env.slack_debug_channel) {
      await sendMessageToSlack(`Scraped '${id}' <${ssLocation}|Click to view screenshot> Status '${response_status}'`, `#${process.env.slack_debug_channel}`);
    }
    htmlLocation = await writeFileToS3("thebucket",id + '.html', htmlData, 'text/html', 'html');
    console.log("Scraping completed for URL: " + event.url);
  } else {
    scraped=false;
    sshash = null;    
    
    if (process.env.slack_debug_channel) {
      await sendMessageToSlack(`Failed to scrape '${id}' Status '${response_status}'`, `#${process.env.slack_debug_channel}`);
    }
    
    console.log("Scraping failed for URL: " + event.url);
  }



  now_in_utc_timestamp = Math.floor((new Date()).getTime() / 1000)
  //console.log(now_in_utc_timestamp);
  mURL = null;
  cURL = null;
  headline = null;
  source_hl_specific = null;
  publishDT = null;
  source_pubdt_specific = null;
  scraped=true;

  /*
  console.log("Updating DB for URL: " + event.id);
  const dbInsResult = await prmUpdPMDB(id, scraped);
  console.log("Updated DB for URL: " + event.id);
  console.log(dbInsResult);
*/ //not needed for this example, removed DB update logic
  return {
    statusCode: response_status,
    body: { "status": "success", "screenshot_hash": sshash },
    headers: { "Content-Type" : "application/json" }
  };
}


async function sendMessageToSlack(message, channel) {
  console.log({
    unfurl_links: false,
    unfurl_media: false,
    mrkdwn: true,
    text: message,
    channel: channel,
  })
  const result = await tslack.chat.postMessage({
    unfurl_links: false,
    unfurl_media: false,
    mrkdwn: true,
    text: message,
    channel: channel,
  });
  return result
}

async function writeFileToS3(bucketName, fileName, fileData, contentType, ssOrHTML = null) {
    try
    {
     let s3 = new AWS.S3({});
     let params = 
    {
       Bucket: bucketName,
       Key: fileName,
       Body: fileData,
       ContentType: contentType,
       ACL: 'public-read'
    };

    if (ssOrHTML == "ss") {
        ssOrHTML_str = "Screenshot"
    } else if (ssOrHTML == "html") {
        ssOrHTML_str = "HTML"
    } else {
        ssOrHTML_str = "File"
    }

    console.log("ssOrHTML: " + ssOrHTML);
    console.log("ssOrHTML_str: " + ssOrHTML_str);
    
     let s3Response = await s3.upload(params).promise();
    console.log(`File uploaded to S3 at ${s3Response.Bucket} bucket. File location: ${s3Response.Location}`);
    if (ssOrHTML_str == "Screenshot") {
      //await sendMessageToSlack(`${ssOrHTML_str} uploaded ${s3Response.Bucket} S3 bucket. File location: ${s3Response.Location}`, "#testxmadison");
    }
    
     return s3Response.Location; 
    }
    // request failed
    catch (ex)
    {
     console.error(ex);
    }
  }


//borrowed from some example trying to make the screenshots work.
const waitTillHTMLRendered = async (page, timeout = 45000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
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

  module.exports = { scrape };
