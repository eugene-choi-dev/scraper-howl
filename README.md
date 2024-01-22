*** WEB SCRAPER ***

*** PROJECT DESCRIPTION ***

This project contains a Node.js script for scraping. It uses Puppeteer for scraping dynamic content and Express for setting up a simple server to trigger the scraping process.

*** PREREQUISITES ***

Node.js

npm (Node Package Manager)

*** INSTALLING NODE.JS & NPM ***

1. For Windows and macOS Users:
    Visit the official Node.js website to download the installer for your operating system.
    Run the downloaded installer and follow the prompts to install both Node.js and npm.
2. Verify the installation by checking the version of Node.js and npm:
    `node -v`
    `npm -v`

*** SCRAPER INSTALLATION ***

1. Clone the Repository
    `git clone https://github.com/eugene-choi-dev/scraper-howl.git`
    `cd scraper-howl`

2. Install Dependencies
    `npm install`

*** RUNNING THE PROJECT ***

1. Start the Server
    `npm run start`
`
2. Set range for pages to scrape by adjusting values of `START_PAGE` and `END_PAGE` in the index.js file. Optionally, you can adjust the maximum number of retries for a page that fails to scrape but changing the value of `MAX_RETRIES`.

3. Trigger Scraping
    Open your web browser and navigate to http://localhost:8000/scrape

*** NOTES ***

The scraper will print to console the data scraped from each page as the application runs. After the application has finished processing all pages within the specified range, it will return all of the scraped data (`allItems`) in the browser window in JSON-like format.
