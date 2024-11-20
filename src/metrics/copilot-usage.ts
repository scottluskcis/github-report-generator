import { invokeRequest } from "../shared/octokit-client";
import { AppConfig } from "../shared/app-config";
import { getRequestOptions, RequestParameters } from "../shared/request-options";

export class CopilotMetrics { 
    public async getMetrics({
        since, 
        until,
        page,
        per_page
    }: RequestParameters): Promise<any> {
        const options = getRequestOptions({ since, until, page, per_page });
        const url = `GET /enterprises/${AppConfig.ENTERPRISE}/copilot/metrics`;
        
        const response = await invokeRequest(url, options);
        return response;
    }
}