import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { components } from "@octokit/openapi-types/types";
import { applyHeaders, getOctokit } from "../shared/octokit-client"; 
import { TimePeriodType } from "../shared/shared-types";
import { getDateForTimePeriod } from "../shared/time-util";

const octokit = getOctokit();

// --------------------------------------------------
// getOrgAuditLog
// reference: https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs?apiVersion=2022-11-28#get-the-audit-log-for-an-organization
// --------------------------------------------------

type OrgParametersType = RestEndpointMethodTypes["orgs"]["get"]["parameters"];
type OrgAuditLogParametersType = OrgParametersType & {
  phrase: string | undefined;
  include: "web" | "git" | "all";
  after: string | undefined;
  before: string | undefined;
  order: "desc" | "asc";
  per_page: number;
};
type OrgAuditLogResponseType = {
    "@timestamp": string | undefined;
    "action": string | undefined;
    "actor": string | undefined;
    "created_at": string | undefined;
    "_document_id": string | undefined;
    "org": string | undefined;
    "team": string | undefined;
    "user": string | undefined;
    "business": string | undefined;
    "user_agent": string | undefined;
    "permission": string | undefined;
    "operation_type": string | undefined;
    "repository": string | undefined;
    "repo": string | undefined;
    "repository_public": boolean | undefined;
};

export async function* getOrgAuditLog(
  params: OrgAuditLogParametersType
): AsyncGenerator<OrgAuditLogResponseType, void, unknown> {
  const parameters = applyHeaders(params);
  const endpoint = "GET /orgs/{org}/audit-log";

  const iterator = await octokit.paginate.iterator(endpoint, parameters);

  for await (const { data: auditLog } of iterator) {
    for (const entry of auditLog) {
      yield entry;
    }
  }
}
export async function* getAuditLogForActor({
  org,
  actor,
  include,
  time_period,
  per_page, 
  order,
}: {
  org: string;
  actor: string | string[];
  include: 'all' | 'web' | 'git';
  time_period: TimePeriodType;  
  per_page: number;
  order: "desc" | "asc";
}): AsyncGenerator<OrgAuditLogResponseType, void, unknown> {
  const created = getDateForTimePeriod(time_period);

  const actorPhrase = Array.isArray(actor)
    ? actor.map(value => `actor:${value}`).join(' ')
    : `actor:${actor}`;

  const iterator = getOrgAuditLog({
    org: org,
    per_page: per_page,
    phrase: `${actorPhrase} created:>=${created}`,
    include: include,
    after: undefined,
    before: undefined,
    order: order,
  });

  for await (const entry of iterator) {
    yield entry;
  }
}