import { CopilotSeatDetails, listCopilotEnterpriseSeats } from "../restapi/copilot";

export async function getEnterpriseInfo({
    enterprise,
    per_page
}: {
    enterprise: string;
    per_page: number;
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
        console.log(seat);
    }
}