import { getOrgActivity } from "./data/org-activity-data";
import { AppConfig } from "./shared/app-config";
import { getEnterpriseInfo } from "./data/enterprise-activity-data";
import { getFilePath, writeToFileSync } from "./shared/file-utils";
import { ActivityData } from "./shared/shared-types"; 
import { run_copilot_associations_report } from "./report/copilot-associations-report"; 
import logger from "./shared/app-logger";

// function for setting up the data to be used in report
async function generateOrgData(): Promise<string | undefined> {  
  const file_name = "activity_data.json";
  const { file_exists, file_path } = getFilePath(file_name);

  // file exists and generate is disabled then ignore 
  if (file_exists && !AppConfig.GENERATE_DATA) {
    console.log("Data generation is disabled and the file already exists. Exiting...");
    return file_path;
  } 

  const orgs = AppConfig.ORGANIZATION.split(",");
  const data: { [key: string]: ActivityData } = {};
  for (const org of orgs) {
    const org_data = await getOrgActivity({
      org,
      time_period: AppConfig.TIME_PERIOD,
      per_page: 50,
    });
    data[org] = org_data;
  }

  writeToFileSync(data, file_name);
   
  return file_path;
}

// calling this requires classic PAT, the copilot seats data can come from org instead of enterprise
async function generateEnterpriseData(): Promise<string | undefined> {
  const file_name = "enterprise_data.json";
  const { file_exists, file_path } = getFilePath(file_name);

  // file exists and generate is disabled then ignore 
  if (file_exists && !AppConfig.GENERATE_DATA) {
    console.log("Data generation is disabled and the file already exists. Exiting...");
    return file_path;
  } 

  const data = await getEnterpriseInfo({ 
    enterprise: AppConfig.ENTERPRISE, 
    per_page: 100,
    time_period: "year"
  });

  writeToFileSync(data, file_name);
   
  return file_path;
}

// function to orchestrate the process
async function run() {
  console.log("--------------------------------------------------------------------------------------------");
  logger.trace(`Process started at: ${new Date().toISOString()}`); 

  // data 
  logger.debug("Generating org data...");
  const org_data_path = await generateOrgData();
  logger.info(`Org Data saved to ${org_data_path}`);

  logger.debug("Generating summary report for users...");
  const summary_report_path = run_copilot_associations_report();
  logger.info(`Summary report saved to: ${summary_report_path}`);

  logger.trace(`Process ended at: ${new Date().toISOString()}`);
  console.log("--------------------------------------------------------------------------------------------");
}

// run the process
run();
 
/*

NOTES:

- For any requests, only orgs, enterprises, and teams where the authenticated user has admin access are returned.
- Some endpoints are not documented in the octokit api such as list enterprise copilot seats and return a 404 if using an iterator
- Just being a member of an enterprise didn't give access to the org until I added self to org
- I ran into some issues trying to get repo info for orgs, a fine grained token seemed to fix this
- I had to generate a fine grained pat for each org to get the data I needed

*/
