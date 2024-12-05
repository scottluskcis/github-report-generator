import { applyHeaders, getOctokit } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { components } from "@octokit/openapi-types/types";

const octokit = getOctokit();

// --------------------------------------------------
// listCopilotSeats 
// reference: https://docs.github.com/en/rest/copilot/copilot-user-management?apiVersion=2022-11-28#list-all-copilot-seat-assignments-for-an-organization
// --------------------------------------------------

type ListCopilotSeatsParams = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["parameters"];
export type CopilotSeatDetails = components["schemas"]["copilot-seat-details"];

export async function* listCopilotSeats(params: ListCopilotSeatsParams): AsyncGenerator<CopilotSeatDetails, void, unknown> { 
  const parameters = applyHeaders(params);  
  const iterator = await octokit.paginate.iterator(octokit.rest.copilot.listCopilotSeats, parameters);
 
  for await (const { data } of iterator) {
    for (const seat of data.seats) {
      yield seat as CopilotSeatDetails;
    }
  } 
}

// --------------------------------------------------
// listCopilotSeatsForEnterprise
// reference: https://docs.github.com/en/rest/copilot/copilot-user-management?apiVersion=2022-11-28#list-all-copilot-seat-assignments-for-an-enterprise
// --------------------------------------------------

// TODO: this endpoint not in the generated types, work around until this is added
type ListCopilotEnterpriseSeatsParams = Omit<ListCopilotSeatsParams, 'org'> & {
  enterprise: string;
};

export async function* listCopilotEnterpriseSeats(params: ListCopilotEnterpriseSeatsParams): AsyncGenerator<CopilotSeatDetails, void, unknown> {
  // TODO: workaround - needs classic PAT to work
  const octokit = getOctokit('pat-classic');
  const parameters = applyHeaders(params);  
 
  // TODO: workaround until this endpoint is in the generated types
  const endpoint = 'GET /enterprises/{enterprise}/copilot/billing/seats';
  const iterator = await octokit.paginate.iterator(endpoint, parameters);

  for await (const { data } of iterator) {
    for (const seat of data.seats) {
      yield seat;
    }
  } 
}