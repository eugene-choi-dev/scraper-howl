# Web Scraper

## Project Description

This project contains a Node.js script for web scraping. It uses Puppeteer for scraping dynamic content and Express for setting up a simple server to trigger the scraping process.

## Prerequisites

- Node.js
- npm (Node Package Manager)

## Installing Node.js & npm

### For Windows and macOS Users:

1. Visit the official [Node.js website](https://nodejs.org/) to download the installer for your operating system.
2. Run the downloaded installer and follow the prompts to install both Node.js and npm.

### Verify the installation by checking the version of Node.js and npm:

`node -v`
`npm -v`

### SCRAPER INSTALLATION

1. Clone the Repository
    `git clone https://github.com/eugene-choi-dev/scraper-howl.git`
    `cd scraper-howl`

2. Install Dependencies
    `npm install`

### RUNNING THE APPLICATION

1. Start the Server
    `npm run start`
`
2. Set the range of pages to scrape by adjusting the values of `START_PAGE` and `END_PAGE` in the `index.js` file. Optionally, you can adjust the maximum number of retries for a page that fails to scrape by changing the value of `MAX_RETRIES`. Save the file.

3. Trigger Scraping:
    Open your web browser and navigate to http://localhost:8000/scrape. Refreshing the browser page will reinitialize the application.


### NOTES

You can monitor the scraping progress in the console/terminal. If any pages fail to scrape, those page numbers will be listed after the application has completed running. Running the application again will automatically skip over any pages that have already been successfully scraped.

Data from successfully scraped pages will be incrementally saved into `temp_scraped_data.json`. This is a fallback measure to retain scraped data in case the application fails or is canceled before completion. The same data will be moved into `scraped_data.json` once the application has completed processing all pages.

Data in `scraped_data.json` is organized by pages. To compile this data into a singular JSON format, you can use the `compileData()` function by running the `node compileData.js` command in the terminal. The compiled data can be found in `compiled_data.json`.