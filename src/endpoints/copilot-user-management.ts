import { applyHeaders, getOctokit } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { components } from "@octokit/openapi-types/types";
import { parseISO, isAfter, startOfDay } from "date-fns";

type ListCopilotSeatsParams = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["parameters"];
type ListCopilotSeatResponseData = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["response"]["data"];

export type CopilotSeatDetails = components["schemas"]["copilot-seat-details"];

const octokit = getOctokit({ token_type: 'pat-fine-grained' });

export async function listCopilotSeats(params: ListCopilotSeatsParams): Promise<CopilotSeatDetails[]> {
  const parameters = applyHeaders(params);  
  const response = await octokit.paginate(octokit.rest.copilot.listCopilotSeats, parameters);

  const seats: CopilotSeatDetails[] = response.flatMap((page: ListCopilotSeatResponseData) => page.seats);
  return seats;
}

type FilterCopilotSeatsParams =  {
  seats: CopilotSeatDetails[];
  last_activity_since: string;
};

export async function filterCopilotSeats(params: FilterCopilotSeatsParams): Promise<CopilotSeatDetails[]> { 
  return params.seats.filter(seat => {
    const lastActivityDate = seat.last_activity_at ? parseISO(seat.last_activity_at) : null;
    const filterDate = startOfDay(parseISO(params.last_activity_since));
    return lastActivityDate && isAfter(lastActivityDate, filterDate);
  });
}

