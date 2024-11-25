import { invokeRequest } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { parseISO, isAfter, startOfDay } from "date-fns";

import { components } from "@octokit/openapi-types/types";

type ListCopilotSeatsParams = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["parameters"];
export type CopilotSeatDetails = components["schemas"]["copilot-seat-details"];

// TODO: work around until type is officially in octokit
type ListEnterpriseCopilotSeatParams = Omit<ListCopilotSeatsParams, 'org'> & {
  enterprise: string;
};
// TODO: work around until type is officially in octokit
export type EnterpriseCopilotSeatDetails = CopilotSeatDetails & {
 organization: any;
};

export async function listCopilotSeats(
  params: ListCopilotSeatsParams
): Promise<CopilotSeatDetails[]> {
  const seats: CopilotSeatDetails[] = [];   
  for await (const item of invokeRequest<ListCopilotSeatsParams, CopilotSeatDetails>({
    endpoint: "GET /orgs/{org}/copilot/billing/seats",
    property: "seats",
    params: params,
    page_results: true,
  })) {  
    seats.push(item);
  }
  return seats;
}

export async function listEnterpriseCopilotSeats(
  params: ListEnterpriseCopilotSeatParams
): Promise<EnterpriseCopilotSeatDetails[]> {
  const seats: EnterpriseCopilotSeatDetails[] = [];   

  console.warn("WARN: page_results is turned off for listEnterpriseCopilotSeats as iterator causes a 404, TODO - fix");
  

  for await (const item of invokeRequest<ListEnterpriseCopilotSeatParams, EnterpriseCopilotSeatDetails>({
    endpoint: "GET /enterprises/{enterprise}/copilot/billing/seats",
    property: "seats",
    params: params,
    page_results: false, // TODO: turning this off temporarily throws a 404 when tries to page
  })) {  
    seats.push(item);
  }
  return seats;
}

type FilterCopilotSeatsParams =  {
  seats: CopilotSeatDetails[] | EnterpriseCopilotSeatDetails[];
  last_activity_since: string;
};

export async function filterCopilotSeats(params: FilterCopilotSeatsParams): Promise<CopilotSeatDetails[] | EnterpriseCopilotSeatDetails[]> { 
  return params.seats.filter(seat => {
    const lastActivityDate = seat.last_activity_at ? parseISO(seat.last_activity_at) : null;
    const filterDate = startOfDay(parseISO(params.last_activity_since));
    return lastActivityDate && isAfter(lastActivityDate, filterDate);
  });
}