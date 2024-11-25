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

/*
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

  const yieldItems = function* (data: any) {
    if (property) {
      for (const item of data[property] as TItem[]) {
        yield item;
      }
    } else {
      for (const item of data as TItem[]) {
        yield item;
      }
    }
  };

  if (page_results) {
    const iterator = octokit.paginate.iterator(endpoint, combinedParams);
    for await (const { data } of iterator) {
      yield* yieldItems(data);
    }
  } else {
    const { data } = await octokit.request(endpoint, combinedParams);
    yield* yieldItems(data);
  }
}
*/

// export async function invokeRequest<TParameters, TResponse, TItem>({
//     endpoint,
//     property,
//     params,
//     page_results,
//   }: {
//     endpoint: string;
//     property?: string;
//     params: TParameters;
//     page_results?: boolean;
//   }): Promise<TItem[]> {
//     const octokit = getOctokit();
//     const headers = getRestApiHeaders();
//     const combinedParams = { ...params, headers };
  
//     if (page_results) {
//       return await octokit.paginate(endpoint, combinedParams, (response: TResponse) => property ? response.data[property] : response.data);
//     } else {
//       const { data } = await octokit.request(endpoint, combinedParams);
//       return property ? data[property] : data;
//     }
//   }