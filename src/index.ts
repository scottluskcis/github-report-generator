import { getOrgActivity } from "./data/org-activity-data";
import { AppConfig } from "./shared/app-config";

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { getEnterpriseInfo } from "./data/enterprise-activity-data";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// function for setting up the data to be used in report
async function generateData(): Promise<string | undefined> {
  const dataFolderPath = path.resolve(__dirname, ".output");
  const filePath = path.resolve(dataFolderPath, "activity_data.json");

  // file exists and generate is disabled then ignore 
  if (fs.existsSync(filePath) && !AppConfig.GENERATE_DATA) {
    console.log("Data generation is disabled and the file already exists. Exiting...");
    return filePath;
  } 

  console.log("Generating data...");

  const data = await getOrgActivity({
    org: AppConfig.ORGANIZATION,
    time_period: AppConfig.TIME_PERIOD,
    per_page: 50,
  });

  // create output folder if it doesn't exist
  if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath);
  }

  // save data to a JSON file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`Data saved to ${filePath}`);

  return filePath;
}

// function to orchestrate the process
async function run() {
  console.log("----------------------------------------------");
  console.log(`Process started at: ${new Date().toISOString()}`);

  // data 
  const json_data_path = await generateData();

  const enterprise = AppConfig.ENTERPRISE;
  const copilot_seats = await getEnterpriseInfo({ 
    enterprise, 
    per_page: 100
  });
  console.log(copilot_seats);

  console.log(`Process ended at: ${new Date().toISOString()}`);
  console.log("----------------------------------------------");
}

// run the process
run().catch(console.error);


/*

NOTES:

- For any requests, only orgs, enterprises, and teams where the authenticated user has admin access are returned.
- Some endpoints are not documented in the octokit api such as list enterprise copilot seats and return a 404 if using an iterator
- Just being a member of an enterprise didn't give access to the org until I added self to org
- I ran into some issues trying to get repo info for orgs, a fine grained token seemed to fix this

*/
