import { applyHeaders, getOctokit } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { components } from "@octokit/openapi-types/types";

const octokit = getOctokit({ token_type: 'pat-fine-grained' });

type ListTeamsParameters = RestEndpointMethodTypes["teams"]["list"]["parameters"];
type TeamDetails = components["schemas"]["team-simple"];

export async function* listTeams(params: ListTeamsParameters): AsyncGenerator<TeamDetails, void, unknown> {
  const parameters = applyHeaders(params);  

  const iterator = await octokit.paginate.iterator(octokit.rest.teams.list, parameters);

  for await (const { data: teams } of iterator) {
    for (const team of teams) {
      yield team;
    }
  } 
}

