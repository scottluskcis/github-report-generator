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

  const seats: EnterpriseCopilotSeat[] = [];
  for await (const seat of copilot_seats_iterator) {
    const assignee = seat.assignee;
    const assignee_login = `${assignee.login}`;
    
    const obj = seat as any;
    const org = obj.organization.login;
    
    seats.push({ 
        assignee: assignee_login, 
        last_activity_at: seat.last_activity_at,
        organization: org 
    });
  }
  return {
    enterprise,
    seats,
  };
}
