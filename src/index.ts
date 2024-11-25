import { getCopilotSeats } from "./reports/users";
 
console.log("\n------------------");
console.log("RESULTS");
console.log("------------------\n");
 
getCopilotSeats({
  type: "organization",
  last_activity_since: "2024-11-01T00:00:00Z",
})
.then((filteredData) => {
  console.log(
    "FILTERED: Found %d copilot seats for the %s \n",
    filteredData.length,
    "organization"
  ); 
  return filteredData;
})
.then((filteredData) => {
  const assignees = filteredData.map(seat => seat.assignee.login);    
  console.log("ASSIGNEES:\n%s\n", assignees.join(", \n")); 
})
.catch(console.error);

/*

NOTES:

- For any requests, only orgs, enterprises, and teams where the authenticated user has admin access are returned.
- Some endpoints are not documented in the octokit api such as list enterprise copilot seats and return a 404 if using an iterator
- Just being a member of an enterprise didn't give access to the org until I added self to org

*/