import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { components } from "@octokit/openapi-types/types";
import { applyHeaders, getOctokit } from "../shared/octokit-client";

const octokit = getOctokit();

// --------------------------------------------------
// listReposForOrg 
// reference: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-organization-repositories
// --------------------------------------------------

type ListReposForOrgParameters = RestEndpointMethodTypes["repos"]["listForOrg"]["parameters"];
type RepositoryDetails = components["schemas"]["repository"];

export async function* listReposForOrg(
  params: ListReposForOrgParameters
): AsyncGenerator<RepositoryDetails, void, unknown> { 
  const parameters = applyHeaders(params);

  const iterator = await octokit.paginate.iterator(
    octokit.rest.repos.listForOrg,
    parameters
  );

  for await (const { data: repos } of iterator) {
    for (const repo of repos) {
      yield repo;
    }
  } 
}

// --------------------------------------------------
// listRepoActivities
// reference: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-activities
// --------------------------------------------------

type ListRepoActivitiesParameters = RestEndpointMethodTypes["repos"]["listActivities"]["parameters"];
type ActivityDetail = components["schemas"]["activity"];

export async function* listRepoActivities(
  params: ListRepoActivitiesParameters
): AsyncGenerator<ActivityDetail, void, unknown> { 
  const parameters = applyHeaders(params);
  
  const iterator = await octokit.paginate.iterator(
    octokit.rest.repos.listActivities,
    parameters
  );

  for await (const { data: activities } of iterator) {
    for (const activity of activities) {
      yield activity as ActivityDetail;
    }
  }
}

// --------------------------------------------------
// listReposForUser
// reference: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repositories-for-a-user
// --------------------------------------------------

type ListReposForUserParameters = RestEndpointMethodTypes["repos"]["listForUser"]["parameters"];

export async function* listReposForUser(params: ListReposForUserParameters): AsyncGenerator<RepositoryDetails, void, unknown> {
  const parameters = applyHeaders(params);

  const iterator = await octokit.paginate.iterator(
    octokit.rest.repos.listForUser, 
    parameters
  );

  for await (const { data: repos } of iterator) {
    for (const repo of repos) {
      yield repo;
    }
  }
}

// --------------------------------------------------
// listRepoTeams
// reference: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-teams
// --------------------------------------------------

type ListRepoTeamsParameters = RestEndpointMethodTypes["repos"]["listTeams"]["parameters"];
type Team = components["schemas"]["team"];

export async function* listRepoTeams(
  params: ListRepoTeamsParameters
): AsyncGenerator<Team, void, unknown> {
  const parameters = applyHeaders(params);
  
  const iterator = await octokit.paginate.iterator(
    octokit.rest.repos.listTeams,
    parameters
  );

  for await (const { data: teams } of iterator) {
    for (const team of teams) {
      yield team;
    }
  }
}