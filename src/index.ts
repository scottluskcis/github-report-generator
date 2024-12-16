import logger from "./shared/app-logger";
import { runCopilotAssociationsReport } from "./report/copilot-associations-report";
import { AppConfig } from "./shared/app-config";
import { App } from "octokit";

// for now one report, more to come
logger.info("START - Running copilot associations report...");
runCopilotAssociationsReport({ 
    should_generate_data: AppConfig.GENERATE_DATA,
    input_file_name: AppConfig.INPUT_FILE_NAME,
    output_file_name: AppConfig.OUTPUT_FILE_NAME,
    detailed_output_file_name: AppConfig.DETAILED_OUTPUT_FILE_NAME,
}).then((output_file) => {
    logger.info(`END - Generated copilot associations report ${output_file}`);
});


/*

NOTES:

- For any requests, only orgs, enterprises, and teams where the authenticated user has admin access are returned.
- Some endpoints are not documented in the octokit api such as list enterprise copilot seats and return a 404 if using an iterator
- Just being a member of an enterprise didn't give access to the org until I added self to org
- I ran into some issues trying to get repo info for orgs, a fine grained token seemed to fix this
- I had to generate a fine grained pat for each org to get the data I needed

*/