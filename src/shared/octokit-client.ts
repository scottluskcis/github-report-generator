import { Octokit } from "octokit";
import { AppConfig } from "./app-config";

export function getOctokitClient(): Octokit {
    const token = AppConfig.GITHUB_TOKEN;
    if (!token) {
        console.error("Unable to find a token to use for authentication.");
        return undefined;
    }

    return new Octokit({ auth: token });
}

export function invokeRequest(url: string, options: any): Promise<any> {
    const octokit = getOctokitClient();
    return octokit.request(url, options);
}