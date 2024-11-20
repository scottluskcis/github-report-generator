import { addDays, isBefore, formatISO } from "date-fns";
import { AppConfig } from "./app-config";

const maxDays = 28;
const maxRecordsPerPage = 28;

export interface RequestParameters {
  since?: Date;
  until?: Date;
  page?: number;
  per_page?: number;
}

export function getRequestOptions({
  since,
  until,
  page,
  per_page,
}: RequestParameters): any {
  // validate the parameters before creating the request options
  validateParameters({ since, until, page, per_page });

  // create the request options object with the enterprise and headers properties
  const requestOptions: any = {
    enterprise: AppConfig.ENTERPRISE,
    headers: {
      'accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': AppConfig.API_VERSION,
    },
  };

  // add the since parameter formatted as an ISO date string if specified
  if (since) {
    requestOptions.since = formatISO(since);
  }

  // add the until parameter formatted as an ISO date string if specified
  if (until) {
    requestOptions.until = formatISO(until);
  }

  // add the page parameter if specified
  if (page) {
    requestOptions.page = page;
  }

  // add the per_page parameter if specified
  if (per_page) {
    requestOptions.per_page = per_page;
  }

  return requestOptions;
}

export function validateParameters({
  since,
  until,
  page,
  per_page,
}: RequestParameters): void {
  const today = new Date();

  // enterprise is required
  if (!AppConfig.ENTERPRISE) {
    throw new Error("No enterprise provided");
  }

  // api version is required
  if (!AppConfig.API_VERSION) {
    throw new Error("No API version provided");
  }

  // ensure if until is provided that it is not before the since date
  if (since && until && isBefore(until, since)) {
    throw new Error("The 'since' date must be before the 'until' date");
  }

  // the api supports max value of 28 days, confirm since isn't before that
  if (since && isBefore(since, addDays(today, maxDays * -1))) {
    throw new Error(`The maximum time range is ${maxDays} days`);
  }

  // max per record is 28 in the api
  if (per_page && per_page > 28) {
    throw new Error(`The maximum number of records per page is ${maxRecordsPerPage}`);
  }

  // page can't be less than 1
  if (page && page < 1) {
    throw new Error("The page number must be at least 1");
  }
}
