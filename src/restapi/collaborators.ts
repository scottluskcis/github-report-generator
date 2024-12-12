import { applyHeaders, getOctokit } from "../shared/octokit-client";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { components } from "@octokit/openapi-types/types";
import logger from "../shared/app-logger";

const octokit = getOctokit();

// --------------------------------------------------
// listRepoCollaborators 
// reference: https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#list-repository-collaborators
// --------------------------------------------------

type ListRepoCollaboratorsParams = RestEndpointMethodTypes["repos"]["listCollaborators"]["parameters"];
export type CollaboratorDetails = components["schemas"]["collaborator"];

export async function* listRepoCollaborators(params: ListRepoCollaboratorsParams): AsyncGenerator<CollaboratorDetails, void, unknown> {
  const parameters = applyHeaders(params);
  
  const iterator = await octokit.paginate.iterator(octokit.rest.repos.listCollaborators, parameters); 

  for await (const { data } of iterator) { 
    for (const collaborator of data) {    
      yield collaborator;
    }
  } 
}