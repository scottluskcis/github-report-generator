import { CopilotSeatDetails, listCopilotEnterpriseSeats } from "../restapi/copilot";
import { TimePeriodType } from "../shared/shared-types";

export async function getEnterpriseInfo({
    enterprise,
    per_page,
    time_period
}: {
    enterprise: string;
    per_page: number;
    time_period: TimePeriodType;
}) {
    const copilot_seats_iterator = listCopilotEnterpriseSeats({
        enterprise,
        per_page
    });

    // for each seat we have the following details:
    // assignee 
    // organization
    // for each org we could get the details to determine what teams user part of

    for await (const seat of copilot_seats_iterator) {
        const assignee = seat.assignee.login;
        console.log("Assignee: %s", assignee);

        const obj = seat as any;
        const org = obj.organization.login;
        console.log("Org: %s", org);

        // get org info if not already retrieved
        // store in a dict 
        
        //console.log(seat);
    }
}