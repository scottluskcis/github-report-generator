import { Octokit } from "octokit";
import { AppConfig } from "./app-config";

// see: https://github.com/octokit/octokit.js/?tab=readme-ov-file#octokit-api-client
function getOctokit(): Octokit {
  const token = AppConfig.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GitHub token not found");
  }

  return new Octokit({ auth: token });
}

function getRestApiHeaders(): { [key: string]: string } {
  return {
    accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": AppConfig.API_VERSION,
  };
}

export async function* invokeRequest<TParameters, TItem>({
    endpoint,
    property,
    params,
    page_results,
}: {
  endpoint: string;
  property: string;
  params: TParameters;
  page_results?: boolean;
}): AsyncGenerator<TItem, void, unknown> {
  const octokit = getOctokit();
  const headers = getRestApiHeaders();
  const combinedParams = { ...params, headers };
 
  if (page_results) {
    const iterator = octokit.paginate.iterator(endpoint, combinedParams);
    for await (const { data } of iterator) {
      for (const item of data[property] as TItem[]) {
        yield item;
      }
    }
  } else {
    const { data } = await octokit.request(endpoint, combinedParams);
    for (const item of data[property] as TItem[]) {
      yield item;
    }
  }
}
