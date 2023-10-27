const puppeteer = require("puppeteer");
require("dotenv").config();

// Define your array of dates to exclude for each month
const DATES_MAY = [20, 21];
const DATES_JUNE = [10, 11, 17, 18, 25];
const DATES_JULY = [2, 8, 9, 15, 16, 23, 29, 30];
const DATES_OCTOBER = [28,29];
const DATES_NOVEMBER = [5, 11,12,18, 19, 26,27];
const DATES_DECEMBER = [3, 9, 10, 16, 17, 24, 31];

// Define a mapping from months to dates to exclude
const DATES_TO_EXCLUDE = {
  5: DATES_MAY,
  6: DATES_JUNE,
  7: DATES_JULY,
  10: DATES_OCTOBER,
  11: DATES_NOVEMBER,
  12: DATES_DECEMBER,
};

const hrPunch = async (res) => {
  try {
    main();
  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  }
};

async function markAttendance() {
  let browser = null;
  try {
    // Get the current date in India
    const now = new Date();
    const indiaTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(now);
    console.log("Current date and time in India:", indiaTime ,"----------------------------------->");
    
    const [month, date, year] = indiaTime.split("/").map(Number);
    // If the date is one of the dates to exclude, stop the function
    if (DATES_TO_EXCLUDE[month].includes(date)) {
      console.log("Skipping function on excluded date.");
      return;
    }
    // Launch a new browser instance
    console.log("Launching browser...")
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        puppeteer.executablePath(),
    });
    console.log("Browser launched.");

    // Open a new page
    const page = await browser.newPage();
    console.log("New page opened.");

    // Navigate to the website
    await page.goto("https://app.hrone.cloud/login");
    console.log("Website opened successfully.");

    // Wait for the page to load
    await page.waitForSelector('input[id="hrone-username"]', { visible: true },
    { timeout: 240000 });
    console.log("Page loaded.");
      // Wait for the Next button to appear
      await page.waitForSelector('.loginform.btn.btn-success.btn-h-40', { visible: true },
      { timeout: 240000 });
      console.log("Next button loaded.");
    // Enter phone number and click "Next"
    await page.type('input[id="hrone-username"]', "6302257117");
    console.log("Phone number entered.");
    await page.click(".loginform.btn.btn-success.btn-h-40");
    console.log("Next button clicked.");

    // Wait for the password input to become visible
    await page.waitForSelector('input[id="hrone-password"]', { visible: true },
    { timeout: 240000 });
    console.log("Password input visible.");

    // Enter password
    await page.type('input[id="hrone-password"]', "*****");
    console.log("Password entered.");

    // Wait for the login button to appear
    await page.waitForFunction(
      (text) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const targetButton = buttons.find(
          (button) => button.textContent.trim() === text
        );
        return targetButton !== undefined;
      },
      {},
      "LOG IN"
    );
    console.log("Login button visible.");

    // Click "Login"
    await page.evaluate((text) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const targetButton = buttons.find(
        (button) => button.textContent.trim() === text
      );
      targetButton.click();
    }, "LOG IN");
    console.log("Login button clicked.");

    console.log("Waiting for the button to appear in the DOM...");
    await page.waitForXPath("//button[contains(., ' Mark attendance ')]", {
      timeout: 240000,
    });
    console.log("Button appeared in the DOM.");

    console.log("Selecting the button...");
    const [button] = await page.$x("//button[contains(., ' Mark attendance ')]");
    if (button) {
      const buttonHTML = await page.evaluate((el) => el.outerHTML, button);
      console.log("Button HTML:", buttonHTML);
      console.log("Button selected, clicking the button...");
      await page.evaluate((button) => button.click(), button);
      console.log("Button clicked.");
    } else {
      console.log("Could not find the button.");
    }

    // Wait for the remarks textarea to appear and enter remarks
    await page.waitForSelector('textarea[id="mat-input-18"]', {
      timeout: 240000,
    });
    
    console.log("Remarks textarea visible.");
    await page.type('textarea[id="mat-input-18"]', "Punch");
    console.log("Remarks entered.");

    // Wait for the final mark button to appear
    console.log("Waiting for the final mark button to appear in the DOM...");
    await page.waitForXPath(
      "//button/span[contains(normalize-space(), 'Mark attendance')]",
      { timeout: 240000 }
    );
  
    console.log("final mark Button appeared in the DOM.");

    console.log("Selecting the button...");
    const [finalMarkButton] = await page.$x(
      "//button/span[contains(normalize-space(), 'Mark attendance')]/.."
    );
    if (finalMarkButton) {
      const finalMarkButtonHTML = await page.evaluate(
        (el) => el.outerHTML,
        finalMarkButton
      );
      console.log("Button HTML:", finalMarkButtonHTML);
      console.log("Button selected, clicking the button...");
      await page.evaluate((button) => button.click(), finalMarkButton);
      console.log("Button clicked.");
    } else {
      console.log("Could not find the button.");
    }

    // Wait for the attendance to be marked
    // Wait for the remarks textarea to disappear
    await page.waitForSelector('textarea[id="mat-input-18"]', {
      hidden: true,
      timeout: 240000,
    });
    console.log("Remarks textarea disappeared.");
    console.log("Attendance marked successfully on", indiaTime, "----------------------------------->");

    // Close the browser
  } catch (e) {
    console.log(e);
    throw e;
  } finally {
    if (browser !== null) {
      await browser.close();
      console.log("Browser closed.");
    }
  }
}

async function main(retryCount = 0) {
  try {
    await markAttendance(retryCount);
  } catch (error) {
    console.error("An error occurred:", error);
    if (retryCount < 5) {
      retryCount++;
      console.log(`Retrying (${retryCount} of 5)...`);
      await main(retryCount);
    } else {
      console.log("Maximum retry attempts reached. Exiting...");
      // Handle the failure or perform any necessary cleanup
    }
  }
}

module.exports = { hrPunch };
