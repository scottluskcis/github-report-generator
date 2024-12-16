import { RequestError } from "octokit";
import { generateCopilotAssociationsData } from "../data/copilot-associations-data";
import { AppConfig } from "../shared/app-config";
import logger from "../shared/app-logger";
import { readJsonFile, writeToCsv, writeToFileSync } from "../shared/file-utils"; 

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

export async function runCopilotAssociationsReport({
  should_generate_data = true,
  input_file_name = 'copilot-associations.json',
  output_file_name = 'copilot_associations.csv',
}: { 
  should_generate_data?: boolean;
  input_file_name?: string;
  output_file_name?: string;
}): Promise<string | undefined> {  
  try {
    if (should_generate_data) {
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

function getCopilotAssociations(data: CopilotAssociationsData) {
  const member_associations = processAssociations(data);

  return Object.keys(member_associations).map((member) => {
    const associations = member_associations[member];
    const count_teams = associations.teams.size;
    const count_repos = associations.repos.size;
    const count_copilot_users = associations.copilot_users.size;
    const total_sum = count_teams + count_repos + count_copilot_users;

    return {
      member_name: member,
      count_teams,
      count_repos,
      count_copilot_users,
      total_sum,
    };
  });
}

function processAssociations(data: CopilotAssociationsData) {
  const member_associations: { [member: string]: { teams: Set<string>, repos: Set<string>, copilot_users: Set<string> } } = {};

  processTeamAssociations(data, member_associations);
  processRepositoryAssociations(data, member_associations);

  return member_associations;
}

function processTeamAssociations(data: CopilotAssociationsData, member_associations: { [member: string]: { teams: Set<string>, repos: Set<string>, copilot_users: Set<string> } }) {
  for (const team_name in data.teams) {
    if (AppConfig.EXCLUDE_TEAMS.includes(team_name.toLowerCase())) {
      continue;
    }

    const team = data.teams[team_name];
    const copilot_users = new Set(team.copilot_users);

    if (copilot_users.size === 0) {
      logger.debug(`No copilot users found for team ${team.team_name}, ignoring for report...`);
      continue;
    }

    for (const member of team.members) {
      if (copilot_users.has(member)) {
        logger.debug(`Found copilot user ${member} in team ${team.team_name}, ignoring for report...`);
        continue;
      }

      if (!member_associations[member]) {
        member_associations[member] = { teams: new Set(), repos: new Set(), copilot_users: new Set() };
      }

      member_associations[member].teams.add(team.team_name);
      copilot_users.forEach(user => member_associations[member].copilot_users.add(user));
    }
  }
}

function processRepositoryAssociations(data: CopilotAssociationsData, member_associations: { [member: string]: { teams: Set<string>, repos: Set<string>, copilot_users: Set<string> } }) {
  for (const repo_name in data.repositories) {
    const repo = data.repositories[repo_name];
    const copilot_users = new Set(repo.associated_copilot_users);

    if (copilot_users.size === 0) {
      logger.debug(`No copilot users found for repo ${repo.repo_name}, ignoring for report...`);
      continue;
    }

    for (const contributor of repo.contributors) {
      if (copilot_users.has(contributor)) {
        logger.debug(`Found copilot user ${contributor} in repo ${repo.repo_name}, ignoring for report...`);
        continue;
      }

      if (!member_associations[contributor]) {
        member_associations[contributor] = { teams: new Set(), repos: new Set(), copilot_users: new Set() };
      }

      member_associations[contributor].repos.add(repo.repo_name);
      copilot_users.forEach(user => member_associations[contributor].copilot_users.add(user));
    }
  }
}