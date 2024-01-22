const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

const PORT = 8000;
const BASE_URL = 'https://www.governmentjobs.com/careers/lacounty/classspecs?page=';
const START_PAGE = 1;
const END_PAGE = 5;
const MAX_RETRIES = 5;

async function scrapeDynamicContent(baseUrl, startPage, endPage) {
  const browser = await puppeteer.launch({ headless: true });
  let allItems = [];
  let pagesWithLessThan10Items = [];

  for (let pageIdx = startPage; pageIdx <= endPage; pageIdx++) {
    let retryCount = 0; 
    let scrapeSuccessful = false;

    while (!scrapeSuccessful && retryCount < MAX_RETRIES) {
      retryCount++;
      const page = await browser.newPage();
      const targetUrl = `${baseUrl}${pageIdx}`;
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 0 });
      let pageData = [];

      try {
        const listItems = await page.$$('#class-specs-list-container .list-item');

        for (const element of listItems) {
          const classTitle = await element.$eval('.item-details-link', el => el.innerText.trim());
          const classCode = await element.$eval('.list-meta li:first-child', el => el.innerText.trim());
          const salary = await element.$$eval('.list-meta li:nth-child(2) span', spans => spans.map(span => span.innerText.trim()).join(' '));
          let definition = await element.$eval('.list-entry span', el => el.innerText.trim());
          definition = definition
            .replace(/^DEFINITION:\s+/i, '') 
            .replace(/CLASSIFICATION STANDARDS:.*$/s, '');

          const detailsLink = await element.$('.item-details-link');
          await detailsLink.evaluate(el => el.scrollIntoView());
          try {
            await detailsLink.click();
          } catch (error) {
            await page.evaluate(el => el.click(), detailsLink);
          }

          let trainingAndExperience = '';
          try {
            await page.waitForSelector('.tab-pane.active.fr-view', { visible: true, timeout: 15000 });
            const tabPaneContent = await page.$eval('.tab-pane.active.fr-view', el => el.innerText);
          
            const trainingAndExperienceIndex = tabPaneContent.indexOf("TRAINING AND EXPERIENCE:");
            if (trainingAndExperienceIndex !== -1) {
              trainingAndExperience = tabPaneContent.substring(trainingAndExperienceIndex);
              trainingAndExperience = trainingAndExperience
                .replace(/^TRAINING AND EXPERIENCE:\s+/i, '')
                .replace(/LICENSE.*$/s, '')
                .replace(/\n/g, ' ');
            }
          
          } catch (error) {
            console.error(`Error while scraping training and experience on page ${pageIdx}:`, error);
          }

          const closeSelector = '.flyout-overlay.active .close-button';
          if (await page.$(closeSelector)) {
            await page.click(closeSelector);
            await page.waitForSelector(closeSelector, { hidden: true });
          }

          const scrapedData = { classTitle, classCode, salary, definition, trainingAndExperience };
          pageData.push(scrapedData);
        }

        if (pageData.length !== 10 && pageIdx < endPage) {
          throw new Error(`Page ${pageIdx} returned less than 10 items`);
        }

        scrapeSuccessful = true;
        allItems.push(...pageData);

        console.log(`Scraped Data from Page ${pageIdx} on Attempt ${retryCount}:`);
        console.log(pageData);

      } catch (error) {
        console.error(`Attempt ${retryCount} for Page ${pageIdx}:`, error.message);
      } finally {
        await page.close();
      }

      if (!scrapeSuccessful) {
        const randomDelay = Math.floor(Math.random() * (600 - 400 + 1)) + 400;
        await new Promise(resolve => setTimeout(resolve, randomDelay));
      }
    }

    if (retryCount > MAX_RETRIES) {
      console.error(`Max retries reached for Page ${pageIdx}. Moving to next page.`);
      pagesWithLessThan10Items.push(pageIdx);
    }
  }

  await browser.close();

  return allItems;
}

app.get('/scrape', async (req, res) => {
  try {
    const items = await scrapeDynamicContent(BASE_URL, START_PAGE, END_PAGE);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while scraping');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
