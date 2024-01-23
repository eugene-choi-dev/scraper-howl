const fs = require("fs");
const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

const PORT = 8000;
const BASE_URL =
  "https://www.governmentjobs.com/careers/lacounty/classspecs?page=";
const START_PAGE = 1; // set starting page
const END_PAGE = 10; // set last page to scrape
const MAX_RETRIES = 10; // set maximum number of retries for any page that initially fails scraping

const dataFilePath = "scraped_data.json";
const tempDataFilePath = "temp_scraped_data.json";
const userAgents = require("./userAgents");

function readExistingData() {
  if (fs.existsSync(dataFilePath)) {
    return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
  }
  return {};
}

function saveData(data, temp = false) {
  const filePath = temp ? tempDataFilePath : dataFilePath;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function retryOperation(operation, maxRetries, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

async function delayBetweenRequests(delay) {
  await new Promise((resolve) => setTimeout(resolve, delay));
}

async function scrapeDynamicContent(baseUrl, startPage, endPage) {
  const browser = await puppeteer.launch({ headless: "true" });
  const page = await browser.newPage();
  let allItems = readExistingData();
  let failedPages = [];
  let successfulPages = [];

  console.log("Scrape start...");

  for (let pageIdx = startPage; pageIdx <= endPage; pageIdx++) {
    const randomUserAgent =
      userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);
    console.log(`Using user agent for page ${pageIdx}: ${randomUserAgent}`);

    if (allItems[pageIdx]) {
      console.log(`Data for page ${pageIdx} already exists. Skipping.`);
      successfulPages.push(pageIdx);
      continue;
    }

    let scrapeSuccessful = false;
    let pageItems = [];

    try {
      const targetUrl = `${baseUrl}${pageIdx}`;
      await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const classSpecIds = await retryOperation(async () => {
        return await page.$$eval(
          ".search-results-listing-container [data-class-spec-id]",
          (elements) =>
            elements.map((el) => el.getAttribute("data-class-spec-id"))
        );
      }, MAX_RETRIES);

      for (const id of classSpecIds) {
        const detailUrl = `https://www.governmentjobs.com/careers/lacounty/classspecs/${id}`;
        await retryOperation(async () => {
          await page.goto(detailUrl, {
            waitUntil: "networkidle2",
            timeout: 60000,
          });
        }, MAX_RETRIES);

        let infoContent = await retryOperation(async () => {
          return await page.$eval(".info-content", (el) => el.innerText);
        }, MAX_RETRIES);

        const classTitle =
          infoContent.match(/Class Title\s+(.*?)\s+Class Code/)?.[1] || "";
        const classCode =
          infoContent.match(/Class Code\s+(.*?)\s+Salary/)?.[1] || "";
        const salary =
          infoContent.match(/Salary\s+([\s\S]*?)\s+DEFINITION/)?.[1].trim() ||
          "";
        let definition =
          infoContent.match(
            /DEFINITION:\s+(.*?)\s+CLASSIFICATION STANDARDS:/s
          )?.[1] || "";
        definition = definition.replace(/\n/g, "");
        let trainingAndExperience =
          infoContent.match(
            /TRAINING AND EXPERIENCE:\s+(.*?)\s+LICENSE:/s
          )?.[1] || "";
        trainingAndExperience = trainingAndExperience.replace(/\n/g, "");

        pageItems.push({
          classTitle,
          classCode,
          salary,
          definition,
          trainingAndExperience,
        });
      }

      if (pageItems.length > 0) {
        allItems[pageIdx] = pageItems;
        successfulPages.push(pageIdx);
        scrapeSuccessful = true;
        console.log(`Page ${pageIdx} successfully scraped.`);
        saveData(allItems, true);
      }
    } catch (error) {
      console.error(`Page ${pageIdx} failed to scrape: Error -`, error.message);
      failedPages.push(pageIdx);
      console.log(`Page ${pageIdx} failed to scrape.`);
    }

    await delayBetweenRequests(5000);
  }

  await page.close();
  await browser.close();

  if (fs.existsSync(tempDataFilePath)) {
    fs.renameSync(tempDataFilePath, dataFilePath);
  }

  if (
    successfulPages.length + failedPages.length === END_PAGE - START_PAGE + 1 &&
    failedPages.length === 0
  ) {
    console.log("All pages scraped successfully.");
  } else {
    console.log(
      "Failed to scrape the following page(s):",
      failedPages.join(", ")
    );
  }

  return allItems;
}

app.get("/scrape", async (req, res) => {
  try {
    const items = await scrapeDynamicContent(BASE_URL, START_PAGE, END_PAGE);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while scraping");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
