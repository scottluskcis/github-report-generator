import { invokeRequest } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { parseISO, isAfter, startOfDay } from "date-fns";

import { components } from "@octokit/openapi-types/types";

type ListCopilotSeatsParams = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["parameters"];
export type CopilotSeatDetails = components["schemas"]["copilot-seat-details"];

// work around until type is officially in octokit
type ListEnterpriseCopilotSeatParams = Omit<ListCopilotSeatsParams, 'org'> & {
  enterprise: string;
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
): Promise<CopilotSeatDetails[]> {
  const seats: CopilotSeatDetails[] = [];   
  for await (const item of invokeRequest<ListEnterpriseCopilotSeatParams, CopilotSeatDetails>({
    endpoint: "GET /enterprises/{enterprise}/copilot/billing/seats",
    property: "seats",
    params: params,
    page_results: true,
  })) {  
    seats.push(item);
  }
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