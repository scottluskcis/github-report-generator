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
}: { 
  should_generate_data: boolean 
}): Promise<string | undefined> { 
  const input_file_name = 'copilot-associations.json';
  const output_file_name = 'copilot_associations.csv';

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
  const team_associations = getTeamAssociations(data);
  const repository_associations = getRepositoryAssociations(data);

  // Create a map for quick lookup of repository associations by member
  const repo_associations_map = new Map(repository_associations.map(repo => [repo.member, repo]));

  // Create a new array that combines the associations for each member
  const associations_by_member = team_associations.map((team_association) => {
    const repo_association = repo_associations_map.get(team_association.member);
    return {
      member_name: team_association.member,
      //teams: team_association.teams,
      count_teams: team_association.count_teams,
      //repos: repo_association ? repo_association.repos : [],
      count_repos: repo_association ? repo_association.count_repos : 0,
    };
  });

  return associations_by_member; 
}

function getTeamAssociations(data: CopilotAssociationsData): { member: string, teams: string[], count_teams: number }[] {
  const member_teams: { [member: string]: Set<string> } = {};

  for (const team_name in data.teams) {
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

      if (!member_teams[member]) {
        member_teams[member] = new Set();
      }

      member_teams[member].add(team.team_name);
    }
  }

  return Object.keys(member_teams).map((member) => ({
    member,
    teams: Array.from(member_teams[member]),
    count_teams: member_teams[member].size,
  }));
}

function getRepositoryAssociations(data: CopilotAssociationsData): { member: string, repos: string[], count_repos: number }[] {
  const member_repos: { [member: string]: Set<string> } = {};

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

      if (!member_repos[contributor]) {
        member_repos[contributor] = new Set();
      }

      member_repos[contributor].add(repo.repo_name);
    }
  }

  return Object.keys(member_repos).map((member) => ({
    member,
    repos: Array.from(member_repos[member]),
    count_repos: member_repos[member].size,
  }));
}
