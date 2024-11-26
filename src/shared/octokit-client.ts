import { Octokit } from "octokit";
import { AppConfig } from "./app-config";

// see: https://github.com/octokit/octokit.js/?tab=readme-ov-file#octokit-api-client
export function getOctokit({
    token_type = 'pat-fine-grained',
}: {
    token_type?: 'pat-classic' | 'pat-fine-grained'
}): Octokit {
  const token = token_type == 'pat-classic' ? AppConfig.GITHUB_TOKEN_CLASSIC : AppConfig.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GitHub token not found");
  }

  return new Octokit({ auth: token });
}

export function getRestApiHeaders(): { [key: string]: string } {
  return {
    accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": AppConfig.API_VERSION,
  };
}

export function applyHeaders<Parameters>(params: Parameters): Parameters {
    const headers = getRestApiHeaders();
    const combinedParams = { ...params, headers };
    return combinedParams;
}
