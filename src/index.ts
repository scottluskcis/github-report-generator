import { readOrgInfo } from "./data/organization";
import { AppConfig } from "./shared/app-config";
 
console.log("\n------------------");
console.log("RESULTS");
console.log("------------------\n");
 
readOrgInfo({ org: AppConfig.ORGANIZATION, time_period: "year" }) 
.then((data) => console.log("\n%s\n", JSON.stringify(data, null, 2)))
.catch(console.error);

/*

NOTES:

- For any requests, only orgs, enterprises, and teams where the authenticated user has admin access are returned.
- Some endpoints are not documented in the octokit api such as list enterprise copilot seats and return a 404 if using an iterator
- Just being a member of an enterprise didn't give access to the org until I added self to org
- I ran into some issues trying to get repo info for orgs, a fine grained token seemed to fix this

*/