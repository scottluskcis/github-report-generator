import { applyHeaders, getOctokit } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { components } from "@octokit/openapi-types/types";

const octokit = getOctokit({ token_type: 'pat-fine-grained' });

// --------------------------------------------------
// listCopilotSeats 
// reference: https://docs.github.com/en/rest/copilot/copilot-user-management?apiVersion=2022-11-28#list-all-copilot-seat-assignments-for-an-organization
// --------------------------------------------------

type ListCopilotSeatsParams = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["parameters"];
type ListCopilotSeatResponseData = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["response"]["data"];
type CopilotSeatDetails = components["schemas"]["copilot-seat-details"];

export async function listCopilotSeats(params: ListCopilotSeatsParams): Promise<CopilotSeatDetails[]> {
  const parameters = applyHeaders(params);  
  const response = await octokit.paginate(octokit.rest.copilot.listCopilotSeats, parameters);

  const seats: CopilotSeatDetails[] = response.flatMap((page: ListCopilotSeatResponseData) => page.seats);
  return seats;
}

