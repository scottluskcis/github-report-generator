import {
  listCopilotSeats,
  listEnterpriseCopilotSeats,
  filterCopilotSeats,
  CopilotSeatDetails,
  EnterpriseCopilotSeatDetails,
} from "../copilot/user-management";

import { AppConfig } from "../shared/app-config";

const items_per_page = 50;

async function getSeatsByOrg(
  org: string,
  last_activity_since: string
): Promise<CopilotSeatDetails[]> {
  const orgCopilotSeats = await listCopilotSeats({
    org: org,
    page: 1,
    per_page: items_per_page,
  });

  const filteredSeats = await filterCopilotSeats({
    seats: orgCopilotSeats,
    last_activity_since: last_activity_since,
  });

  return filteredSeats;
}

// async function getSeatsByEnterprise(
//   enterprise: string,
//   last_activity_since: string
// ): Promise<EnterpriseCopilotSeatDetails[]> {
//   const enterpriseCopilotSeats = await listEnterpriseCopilotSeats({
//     enterprise: enterprise,
//     page: 1,
//     per_page: items_per_page,
//   });

//   const filteredSeats = await filterCopilotSeats({
//     seats: enterpriseCopilotSeats,
//     last_activity_since: last_activity_since,
//   }) as EnterpriseCopilotSeatDetails[];

//   return filteredSeats;
// }

export async function getCopilotSeats({
    type,
    last_activity_since,
}: {
  type: "organization", // | "enterprise",
  last_activity_since: string
}): Promise<CopilotSeatDetails[]> {
    //if (type === "organization") {
    return getSeatsByOrg(AppConfig.ORGANIZATION, last_activity_since);
    //}  
    // else {
    //     return getSeatsByEnterprise(AppConfig.ENTERPRISE, last_activity_since);
    // }
}
