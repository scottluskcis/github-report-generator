import {
  listCopilotEnterpriseSeats,
} from "../restapi/copilot";
import { EnterpriseCopilotSeat, EnterpriseCopilotSeats, TimePeriodType } from "../shared/shared-types";

export async function getEnterpriseInfo({
  enterprise,
  per_page,
  time_period,
}: {
  enterprise: string;
  per_page: number;
  time_period: TimePeriodType;
}): Promise<EnterpriseCopilotSeats> {
  const copilot_seats_iterator = listCopilotEnterpriseSeats({
    enterprise,
    per_page,
  });

  // for each seat we have the following details:
  // assignee
  // organization
  // for each org we could get the details to determine what teams user part of

  //const org_activity: { [key: string]: any } = {};
  const seats: EnterpriseCopilotSeat[] = [];
  for await (const seat of copilot_seats_iterator) {
    const assignee = `${seat.assignee.login}`;
    //console.log("Assignee: %s", assignee);

    const obj = seat as any;
    const org = obj.organization.login;
    //console.log("Organization: %s", org);

    seats.push({ 
        assignee: assignee, 
        organization: org 
    });

    // the org that assigned the seat
    // if (!org_activity[org]) {
    //   const org_data = await getOrgActivity({ org, time_period, per_page });
    //   org_activity[org] = org_data;
    // }
    //console.log(seat);
  }
  return {
    enterprise,
    seats,
  };
}
