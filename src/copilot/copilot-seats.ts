import { invokeRequest } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { subDays, parseISO, isAfter } from "date-fns";

import { components } from "@octokit/openapi-types/types";

type ListCopilotSeatsParams = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["parameters"];
type CopilotSeatDetails = components["schemas"]["copilot-seat-details"];

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

// //import { Octokit } from "octokit";
// import { invokeRequest } from "../shared/octokit-client";
// //import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
// import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
// import { subDays, parseISO, isAfter } from "date-fns";

// import { components } from "@octokit/openapi-types/types";

// type ListCopilotSeatsParams = RestEndpointMethodTypes["copilot"]["listCopilotSeats"]["parameters"];
// type CopilotSeatDetails = components["schemas"]["copilot-seat-details"]

// export class CopilotSeats {
//   //constructor(private readonly client: OctokitClient) {}

//     constructor() {}

//   public async listCopilotSeats(
//     params: ListCopilotSeatsParams
//   ): Promise<void> {
//     Promise.resolve();
//     // const endpoint = 'GET /orgs/{org}/copilot/billing/seats';

//     // for await (const items of invokeRequest<ListCopilotSeatsParams, CopilotSeatDetails>({
//     //   endpoint: endpoint,
//     //   params: params,
//     //   page_results: true,
//     // })) {
//     //   console.log(items);
//     // }

//     // const endpoint = this.client.octokit.rest.copilot.listCopilotSeats;
//     // const iterator = this.client.octokit.paginate.iterator(endpoint, params);

//     // const thirtyDaysAgo = subDays(new Date(), 30);
//     // const assigneeLogins: string[] = [];

//     // for await (const { data } of iterator) {
//     //   const recentSeats = data.seats.filter((seat: CopilotSeatDetails) => {
//     //     if (seat.last_activity_at) {
//     //       return isAfter(parseISO(seat.last_activity_at), thirtyDaysAgo);
//     //     }
//     //     return false;
//     //   });
//     //   const logins = recentSeats.map((seat: CopilotSeatDetails) => seat.assignee.login);
//     //   assigneeLogins.push(...logins);
//     // }

//     // return assigneeLogins;
//   }
// /*
//   public async listEnterpriseSeats({
//     enterprise,
//     page = 1,
//     per_page = 100,
//   }: {
//     enterprise: string;
//     page?: number;
//     per_page?: number;
//   }): Promise<void> {
//     const endpoint_path = "GET /enterprises/{enterprise}/copilot/billing/seats";

//     const response = await this.client.octokit.request(endpoint_path, {
//       enterprise: enterprise,
//       headers: this.client.headers,
//       page: page,
//       per_page: per_page,
//     });

//     // console.log(response);

//     let dict: { [key: string]: any } = {};

//     //   let count = 0;
//     for (const seat of response.data.seats) {
//       const org = seat.organization.login;
//       if (!dict[org]) {
//         dict[org] = 1;
//       } else {
//         dict[org]++;
//       }

//       // count++;
//       //console.log(`Seat ${count}:`);
//       // console.log(seat);
//     }

//     console.log(dict);

//     /*
//         const iterator = this.client.octokit.paginate.iterator(endpoint_path, {
//             enterprise: enterprise,
//             headers: this.client.headers,
//             page: page,
//             per_page: per_page
//         });

//         let pageCount = 0;
//         for await (const response of iterator) {
//             pageCount++;
//             console.log(`Page ${pageCount}:`);
//             // const data = response.data;
//             // if (Array.isArray(data.seats)) {
//             //     for (const seat of data.seats) {
//             //         console.log(seat);
//             //     }
//             // } else {
//             //     console.error('Expected seats to be an array, but got:', data.seats);
//             // }
//         }
//         */
//  // }

//   // public async listCopilotSeats(params: listCopilotSeatsParams): Promise<void> {
//   //     try {

//   //         const endpoint = this.octokit.rest.copilot.listCopilotSeats;
//   //         const iterator = this.octokit.paginate.iterator(endpoint, params);
//   //         for await (const { data: seats } of iterator) {
//   //             //console.log(data);
//   //             for (const seat of seats) {
//   //                 const typedSeat = seat as listCopilotSeat;
//   //                 console.log(JSON.stringify(typedSeat, null, 2));
//   //             }
//   //         }
//   //     } catch (error) {
//   //         console.error(`Error listing copilot seats: ${error}`);
//   //     }
//   // }
// }
