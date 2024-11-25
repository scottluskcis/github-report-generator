import { getCopilotSeats } from "./reports/users";

getCopilotSeats({
  type: "organization",
  last_activity_since: "2024-11-01T00:00:00Z",
})
.then((filteredData) => {
  console.log(
    "FILTERED: Found %d copilot seats for the organization",
    filteredData.length
  );
  return filteredData;
})
.catch(console.error);
