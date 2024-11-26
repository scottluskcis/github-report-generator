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

type ListTeamReposInOrgParameters = RestEndpointMethodTypes["teams"]["listReposInOrg"]["parameters"];
type TeamRepoDetails = components["schemas"]["repository"];

export async function* listTeamReposInOrg(params: ListTeamReposInOrgParameters): AsyncGenerator<TeamRepoDetails, void, unknown> {
  const parameters = applyHeaders(params);
  
  const iterator = await octokit.paginate.iterator(octokit.rest.teams.listReposInOrg, parameters);

  for await (const { data: repos } of iterator) {
    for (const repo of repos) {
      yield repo;
    }
  }
}

type ListTeamMembersParameters = RestEndpointMethodTypes["teams"]["listMembersInOrg"]["parameters"];
type TeamMemberDetails = components["schemas"]["simple-user"];

export async function* listTeamMembers(params: ListTeamMembersParameters): AsyncGenerator<TeamMemberDetails, void, unknown> {
  const parameters = applyHeaders(params);
  
  const iterator = await octokit.paginate.iterator(octokit.rest.teams.listMembersInOrg, parameters);

  for await (const { data: members } of iterator) {
    for (const member of members) {
      yield member;
    }
  }
}