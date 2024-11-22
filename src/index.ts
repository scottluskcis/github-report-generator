import { listCopilotSeats } from "./copilot/copilot-seats";
//import { CopilotMetrics } from "./metrics/copilot-usage";
import { AppConfig } from "./shared/app-config";
//import { getOctokitClient } from "./shared/octokit-client";

export function getMessage(): string {
  return 'Hello world!';
}

const message: string = getMessage();
console.log(message);

// export function getMetrics() {
//   const metrics = new CopilotMetrics();
//   return metrics.getEnterpriseMetrics({ enterprise: AppConfig.ENTERPRISE }); 
// }

// export function getSeats() {
//   return listCopilotSeats({
//     org: AppConfig.ORGANIZATION,
//     page: 1,
//     per_page: 100,
//   });
// }

listCopilotSeats({
  org: AppConfig.ORGANIZATION,
  page: 1,
  per_page: 100,
})
.then(console.log)
.catch(console.error);