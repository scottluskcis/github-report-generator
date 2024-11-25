import {
  listCopilotSeats,
  listEnterpriseCopilotSeats,
  filterCopilotSeats,
  CopilotSeatDetails,
} from "../copilot/user-management";

import { AppConfig } from "../shared/app-config";

async function getSeatsByOrg(
  org: string,
  last_activity_since: string
): Promise<CopilotSeatDetails[]> {
  const orgCopilotSeats = await listCopilotSeats({
    org: org,
    page: 1,
    per_page: 10,
  });

  const filteredSeats = await filterCopilotSeats({
    seats: orgCopilotSeats,
    last_activity_since: last_activity_since,
  });

  return filteredSeats;
}

async function getSeatsByEnterprise(
  enterprise: string,
  last_activity_since: string
): Promise<CopilotSeatDetails[]> {
  const orgCopilotSeats = await listEnterpriseCopilotSeats({
    enterprise: enterprise,
    page: 1,
    per_page: 10,
  });

  const filteredSeats = await filterCopilotSeats({
    seats: orgCopilotSeats,
    last_activity_since: last_activity_since,
  });

  return filteredSeats;
}

export async function getCopilotSeats({
    type,
    last_activity_since,
}: {
  type: "organization" | "enterprise",
  last_activity_since: string
}) {
    if (type === "organization") {
        return getSeatsByOrg(AppConfig.ORGANIZATION, last_activity_since);
    } else {
        return getSeatsByEnterprise(AppConfig.ENTERPRISE, last_activity_since);
    }
}
