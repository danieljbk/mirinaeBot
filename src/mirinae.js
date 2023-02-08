const puppeteer = require('puppeteer')
const Jimp = require('jimp')

const scrapeMirinae = async (sentence) => {
  console.log('Scraping Mirinae...')
  const browser = await puppeteer.launch({
    devtools: false,
    defaultViewport: null,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
    ],
  })

  const page = await browser.newPage()
  await page.goto('https://mirinae.io')

  // click on textarea, type, and press enter.
  await page.click('#editable-source')
  await page.type('#editable-source', sentence + String.fromCharCode(13))

  await page.waitForSelector('#svg-layout-template > g')
  const element = await page.$('#svg-layout-template > g')

  // take a screenshot of the screen
  const imageBuffer = await element.screenshot({
    omitBackground: true,
  })

  // crop the screenshot
  const croppedImageBuffer = await autoCropImage(imageBuffer)

  await browser.close()

  return croppedImageBuffer
}

const autoCropImage = async (imageBuffer) => {
  console.log('Cropping image...')
  try {
    // read buffer and convert to PNG
    let image = await Jimp.read(imageBuffer)

    // automatically crop the empty space from the image
    image = await image.autocrop() // a JIMP function

    // convert back to buffer
    image = await image.getBufferAsync(Jimp.MIME_PNG)

    return image
  } catch (err) {
    console.log(err)
  }
}

module.exports = scrapeMirinae
