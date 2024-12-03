import * as dotenv from "dotenv";
import { TimePeriodType } from "./shared-types";
dotenv.config({ path: ".env.local" });

export class AppConfig {
  public static readonly GITHUB_TOKEN: string =
    AppConfig.getEnvVar("GITHUB_TOKEN");
  public static readonly GITHUB_TOKEN_CLASSIC: string = AppConfig.getEnvVar(
    "GITHUB_TOKEN_CLASSIC"
  );
  public static readonly ENTERPRISE: string = AppConfig.getEnvVar("ENTERPRISE");
  public static readonly API_VERSION: string =
    AppConfig.getEnvVar("GITHUB_API_VERSION");
  public static readonly ORGANIZATION: string =
    AppConfig.getEnvVar("ORGANIZATION");
  public static readonly TIME_PERIOD: TimePeriodType = AppConfig.getEnvVar("TIME_PERIOD", "month") as TimePeriodType;
  public static readonly GENERATE_DATA: boolean =
    AppConfig.getEnvVar("GENERATE_DATA", "true").toLowerCase() === "true";
  public static readonly GITHUB_TOKENS_BY_ORG: { [key: string]: string } =
    AppConfig.getTokensByOrg(AppConfig.getEnvVar("GITHUB_TOKENS_BY_ORG"));

  private static getEnvVar(name: string, default_value: string = ""): string {
    const value = process.env[name];
    if (!value) {
      return default_value;
    }
    return value;
  }

  private static parseJson(jsonString: string): { [key: string]: string } {
    if (!jsonString) {
      return {};
    }
    try {
      const sanitizedString = jsonString.replace(/\n/g, "");
      return JSON.parse(sanitizedString);
    } catch (error: any) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  private static getTokensByOrg(jsonString: string): { [key: string]: string } {
    if (!jsonString) {
      return {};
    }
    const initialDict = AppConfig.parseJson(jsonString);
    const finalDict: { [key: string]: string } = {};

    for (const [org, tokenVar] of Object.entries(initialDict)) {
      finalDict[org] = AppConfig.getEnvVar(tokenVar);
    }

    return finalDict;
  }
}
