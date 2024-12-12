import { readJsonFile, writeToCsv } from "../shared/file-utils";
import { CopilotAssociation } from "../shared/shared-types";

interface CopilotAssociationsData {
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
      collaborators: string[];
      collaborator_affiliation: string;
      contributors: string[];
      associated_copilot_users: string[];
    };
  };
}

export function run_copilot_associations_report_new(): string | undefined {
  const data = readJsonFile<CopilotAssociationsData>("copilot-associations.json");

  if (!data) {
    console.error("Data not found, exiting...");
    return undefined;
  }

  const associations = get_copilot_associations(data);
  const csv_file = writeToCsv(associations, "copilot_associations_new.csv");

  return csv_file;
}

function get_copilot_associations(data: CopilotAssociationsData): CopilotAssociation[] {
  const team_associations = get_team_associations(data);
  const repository_associations = get_repository_associations(data);
  return team_associations.concat(repository_associations);
}

function get_team_associations(data: CopilotAssociationsData): CopilotAssociation[] {
  const results: CopilotAssociation[] = [];

  for (const team_name in data.teams) {
    const team = data.teams[team_name];
    const copilot_users = team.copilot_users;

    for (const member of team.members) {
      if (!copilot_users.includes(member)) {
        for (const copilot_user of copilot_users) {
          results.push(create_association(member, team.team_name, false, copilot_user, "team"));
        }
        if (copilot_users.length === 0) {
          results.push(create_association(member, team.team_name, false, "Unknown", "team"));
        }
      } else {
        results.push(create_association(member, team.team_name, true, "Self", "team"));
      }
    }
  }

  return results;
}

function get_repository_associations(data: CopilotAssociationsData): CopilotAssociation[] {
  const results: CopilotAssociation[] = [];

  for (const repo_name in data.repositories) {
    const repo = data.repositories[repo_name];
    const copilot_users = repo.associated_copilot_users;

    for (const collaborator of repo.collaborators) {
      if (!copilot_users.includes(collaborator)) {
        for (const copilot_user of copilot_users) {
          results.push(create_association(collaborator, repo.repo_name, false, copilot_user, "repository"));
        }
        if (copilot_users.length === 0) {
          results.push(create_association(collaborator, repo.repo_name, false, "Unknown", "repository"));
        }
      } else {
        results.push(create_association(collaborator, repo.repo_name, true, "Self", "repository"));
      }
    }

    for (const contributor of repo.contributors) {
      if (!copilot_users.includes(contributor)) {
        for (const copilot_user of copilot_users) {
          results.push(create_association(contributor, repo.repo_name, false, copilot_user, "repository"));
        }
        if (copilot_users.length === 0) {
          results.push(create_association(contributor, repo.repo_name, false, "Unknown", "repository"));
        }
      } else {
        results.push(create_association(contributor, repo.repo_name, true, "Self", "repository"));
      }
    }
  }

  return results;
}

function create_association(user_name: string, association: string, has_copilot_seat: boolean, related_copilot_user_name: string, association_type: "team" | "repository"): CopilotAssociation {
  return {
    org_name: "org_name_placeholder", // Replace with actual org name if available
    user_name,
    user_has_org_copilot_seat: has_copilot_seat,
    association,
    association_type,
    related_copilot_user_name
  };
}