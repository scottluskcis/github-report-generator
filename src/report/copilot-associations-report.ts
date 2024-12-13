import { RequestError } from "octokit";
import { generateCopilotAssociationsData } from "../data/copilot-associations-data";
import { AppConfig } from "../shared/app-config";
import logger from "../shared/app-logger";
import { readJsonFile, writeToCsv, writeToFileSync } from "../shared/file-utils";
import { CopilotAssociation } from "../shared/shared-types";

export interface CopilotAssociationsData {
  copilot_seats: { assignee: string; last_activity_at: string }[];
  teams: {
    [team_name: string]: {
      team_name: string;
      members: string[];
      copilot_users: string[];
    };
  };
  repositories: {
    [repo_name: string]: {
      repo_owner: string;
      repo_name: string; 
      contributors: string[];
      associated_copilot_users: string[];
    };
  };
}

export async function runCopilotAssociationsReport(): Promise<string | undefined> { 
  const input_file_name = 'copilot-associations.json';
  const output_file_name = 'copilot_associations.csv';

  try {
    if (AppConfig.GENERATE_DATA) {
      logger.debug("Generating copilot associations data...");
      await generateData(input_file_name);
    }
 
    logger.debug("Running copilot associations report...");
    const output_file = runReport(input_file_name, output_file_name); 
    logger.info(`Generated copilot associations report ${output_file}`);

    return output_file; 
  } catch(error) {
    // octokit RequestError, log details for debugging
    if(error instanceof RequestError) { 
      logger.error('RequestError - message:', error.message);
      logger.debug('RequestError - status:', error.status);
      logger.debug('RequestError - request:', error.request);
      logger.debug('RequestError - response:', error.response);
    } 
    // log 
    logger.fatal(error);

    return undefined;
  }
}

async function generateData(file_name: string): Promise<string> { 
  logger.debug("Generating copilot associations data...");
  const data: CopilotAssociationsData = await generateCopilotAssociationsData({ 
    org: AppConfig.ORGANIZATION, 
    per_page: AppConfig.PER_PAGE, 
    time_period: AppConfig.TIME_PERIOD 
  });
  logger.info("Generated copilot associations data");
 
  logger.debug("Writing copilot associations data to file...");
  const file = writeToFileSync(data, file_name);
  logger.info(`Wrote copilot associations data to file ${file}`);

  return file;
}

function runReport(input_file_name: string, output_file_name: string): string | undefined {
  const data = readJsonFile<CopilotAssociationsData>(input_file_name);

  if (!data) {
    console.error("Data not found, exiting...");
    return undefined;
  }

  const associations = getCopilotAssociations(data);
  const csv_file = writeToCsv(associations, output_file_name);

  return csv_file;
}

function getCopilotAssociations(data: CopilotAssociationsData): CopilotAssociation[] {
  const team_associations = getTeamAssociations(data);
  const repository_associations = getRepositoryAssociations(data);
  return team_associations.concat(repository_associations);
}

function getTeamAssociations(data: CopilotAssociationsData): CopilotAssociation[] {
  const results: CopilotAssociation[] = [];

  for (const team_name in data.teams) {
    const team = data.teams[team_name];
    const copilot_users = team.copilot_users;

    for (const member of team.members) {
      if (!copilot_users.includes(member)) {
        for (const copilot_user of copilot_users) {
          results.push(createAssociation(member, team.team_name, false, copilot_user, "team"));
        }
        if (copilot_users.length === 0) {
          results.push(createAssociation(member, team.team_name, false, "Unknown", "team"));
        }
      } else { 
        logger.warn(`Found copilot user ${member} in team ${team.team_name}, ignoring for report...`);
        //results.push(createAssociation(member, team.team_name, true, "Self", "team"));
      }
    }
  }

  return results;
}

function getRepositoryAssociations(data: CopilotAssociationsData): CopilotAssociation[] {
  const results: CopilotAssociation[] = [];

  for (const repo_name in data.repositories) {
    const repo = data.repositories[repo_name];
    const copilot_users = repo.associated_copilot_users;

    for (const contributor of repo.contributors) {
      if (!copilot_users.includes(contributor)) {
        for (const copilot_user of copilot_users) {
          results.push(createAssociation(contributor, repo.repo_name, false, copilot_user, "repository"));
        }
        if (copilot_users.length === 0) {
          results.push(createAssociation(contributor, repo.repo_name, false, "Unknown", "repository"));
        }
      } else {
        logger.warn(`Found copilot user ${contributor} in repo ${repo.repo_name}, ignoring for report...`);
        //results.push(createAssociation(contributor, repo.repo_name, true, "Self", "repository"));
      }
    }
  }

  return results;
}

function createAssociation(user_name: string, association: string, has_copilot_seat: boolean, related_copilot_user_name: string, association_type: "team" | "repository"): CopilotAssociation {
  return {
    org_name: "org_name_placeholder", // Replace with actual org name if available
    user_name,
    user_has_org_copilot_seat: has_copilot_seat,
    association,
    association_type,
    related_copilot_user_name
  };
}