// import { Octokit } from "octokit";
// import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

// import { AppConfig } from "../shared/app-config";
// import { getOctokitClient } from "../shared/octokit-client";
// import {
//   getRequestOptions,
//   RequestParameters,
// } from "../shared/request-options";

// type usageMetricsForEnterpriseParameters =
//   RestEndpointMethodTypes["copilot"]["usageMetricsForEnterprise"]["parameters"];
// type usageMetricsForEnterpriseResponse =
//   RestEndpointMethodTypes["copilot"]["usageMetricsForEnterprise"]["response"]; 
// type EnterpriseMetric = usageMetricsForEnterpriseResponse["data"][number];
// type EnterpriseMetricBreakdown = EnterpriseMetric["breakdown"];

// type usageMetricsForOrgParameters =
//   RestEndpointMethodTypes["copilot"]["usageMetricsForOrg"]["parameters"];
// type usageMetricsForOrgResponse =
//   RestEndpointMethodTypes["copilot"]["usageMetricsForOrg"]["response"];

// type usageMetricsForTeamParameters =
//   RestEndpointMethodTypes["copilot"]["usageMetricsForTeam"]["parameters"];
// type usageMetricsForTeamResponse =
//   RestEndpointMethodTypes["copilot"]["usageMetricsForTeam"]["response"];

// export class CopilotMetrics {
//   private readonly octokit: Octokit = getOctokitClient();

//   public async getEnterpriseMetrics(
//     parameters: usageMetricsForEnterpriseParameters
//   ): Promise<void> { 
//     const endpoint = this.octokit.rest.copilot.usageMetricsForEnterprise;
//     await this.getMetrics(endpoint, parameters, this.processEnterpriseMetric);  
//   }

//   private async getMetrics<TParameters, TResponse>(
//     endpoint: string, 
//     parameters: TParameters,
//     processMetric: (metric: any) => void
// ): Promise<void> { 
//     const iterator = this.octokit.paginate.iterator<TResponse>(endpoint, parameters);
//     for await (const { data: metrics } of iterator) {
//       for (const metric of metrics) {
//         processMetric(metric);
//       }
//     }  
//   }

// private async processEnterpriseMetric(metric: EnterpriseMetric) {
//   console.log("Enterprise Metric: %s", JSON.stringify(metric, (key, value) => {
//     if (key === 'breakdown') {
//       return value;
//     }
//     return value;
//   }, 2));
// }
// }
