import { Octokit } from "octokit";
import { AppConfig } from "./app-config";

// see: https://github.com/octokit/octokit.js/?tab=readme-ov-file#octokit-api-client
export function getOctokit(
  token_type?: "pat-classic" | "pat-fine-grained" | "pat-by-org",
  params?: any
): Octokit {
  // lookup by org 
  if (token_type == "pat-by-org") {
    if (!params || !params.org) {
      throw new Error("GitHub org not provided");
    }

    const token = AppConfig.GITHUB_TOKENS_BY_ORG[params.org];
    if (!token) {
      throw new Error("GitHub token not found");
    }
    return new Octokit({ auth: token });
  } 
  // lookup by token type
  else {
    const token =
      token_type == "pat-classic"
        ? AppConfig.GITHUB_TOKEN_CLASSIC
        : AppConfig.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GitHub token not found");
    }

    return new Octokit({ auth: token });
  }
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
