import { ActivityData, EnterpriseCopilotSeats, TeamSummary, RepoSummary, CopilotAssociation } from "../shared/shared-types";
import { readJsonFile, writeToCsv, writeToFileSync } from "../shared/file-utils";

export function run_copilot_associations_report(): string | undefined {
  const org_data = readJsonFile<{[key: string]: ActivityData}>("activity_data.json");

  if (!org_data) {
    console.error("Data not found, exiting...");
    return undefined;
  }

  const json_data = get_all_org_copilot_associations({ orgs: org_data });
  const csv_file = writeToCsv(json_data, "copilot_associations.csv");
  
  return csv_file;
}

function get_all_org_copilot_associations({
  orgs,
}: {
  orgs: { [key: string]: ActivityData };
}) {
  const results: CopilotAssociation[] = [];
  for(const org_name in orgs) {
    const org_data = orgs[org_name];
    const associations = get_copilot_associations({ org_data });
    results.push(...associations);
  }
  return results;
}

function get_copilot_associations({
  org_data,
}: { 
  org_data: ActivityData; 
}): CopilotAssociation[] { 
  const team_associations = get_team_associations({ org_data });
  const repository_associations = get_repository_associations({ org_data }); 
  return team_associations.concat(repository_associations);
}

function get_team_associations({
  org_data,
}: { 
  org_data: ActivityData; 
}): CopilotAssociation[] {
  const copilot_seats = org_data.copilot_seats; 

  const create_association = (user_name: string, association: string, has_copilot_seat: boolean, related_copilot_user_name: string): CopilotAssociation => {
    return {
      org_name: org_data.org, 
      user_name,
      user_has_org_copilot_seat: has_copilot_seat,
      association: association,
      association_type: 'team',
      related_copilot_user_name
    };
  }

  const results: CopilotAssociation[] = [];
  for(const team of org_data.teams) { 
    const team_members = team.members; 
    if(!team_members) {
      continue;
    }
 
    // members on the team that do have a copilot seat
    const team_members_with_copilot = team_members.filter((member_name) => { 
      const seat = copilot_seats.find((seat) => seat.assignee == member_name);
      return seat != null;
    });
 
    // members on the team that do not have a copilot seat
    const team_members_without_copilot = team_members.filter((member_name) => {
      const seat = copilot_seats.find((seat) => seat.assignee == member_name);
      return seat == null;
    });

    const members_paired_with_related: string[] = [];
    for(const member_name of team_members_without_copilot) { 
      // pair any copilot users with this team member
      for(const member_with_copilot of team_members_with_copilot) {
        results.push(create_association(member_name, team.team_name, false, member_with_copilot)); 
        members_paired_with_related.push(member_name);
      }
      // include in report this team member but indicate no relation to a copilot user directly in team
      if(!members_paired_with_related.includes(member_name)) { 
        results.push(create_association(member_name, team.team_name, false, "Unknown"));
      }
    }

    // track users that do have copilot seats
    for(const member_name of team_members_with_copilot) {  
      results.push(create_association(member_name, team.team_name, true, "Self")); 
    }
  }
  return results;
}

function get_repository_associations({
  org_data,
}: { 
  org_data: ActivityData; 
}) {
  const copilot_seats = org_data.copilot_seats;

  const create_association = (user_name: string, association: string, has_copilot_seat: boolean, related_copilot_user_name: string): CopilotAssociation => {
    return {
      org_name: org_data.org, 
      user_name,
      user_has_org_copilot_seat: has_copilot_seat,
      association: association,
      association_type: 'repository',
      related_copilot_user_name
    };
  }

  const results: CopilotAssociation[] = [];
  for(const team of org_data.teams) {
    const team_members = team.members ?? [];

    // members on the team that do have a copilot seat
    const team_members_with_copilot = team_members.filter((member_name) => { 
      const seat = copilot_seats.find((seat) => seat.assignee == member_name);
      return seat != null;
    });
 
    for(const repo of team.repos) {
      const repo_active_users = repo.active_users;
      if(!repo_active_users) {
        continue;
      }

      // members on the repo that do have a copilot seat
      const repo_members_with_copilot = repo_active_users.filter((u) => { 
        const seat = copilot_seats.find((seat) => seat.assignee == u.user);
        return seat != null;
      });

      // members on the repo that do not have a copilot seat
      const repo_members_without_copilot = repo_active_users.filter((u) => {
        const seat = copilot_seats.find((seat) => seat.assignee == u.user);
        return seat == null;
      });

      for(const active_repo_member of repo_members_without_copilot) { 
        // check other active contributors in repo
        for(const member_with_copilot of repo_members_with_copilot) {
          results.push(create_association(active_repo_member.user, repo.repo_full_name, false, member_with_copilot.user));
        }
        // there could be a a copilot member in the team association to connect with
        for(const team_member_name of team_members_with_copilot) {
          results.push(create_association(active_repo_member.user, repo.repo_full_name, false, team_member_name));
        }
      }

      // active users that do have copilot seats 
      for(const active_repo_member of repo_members_with_copilot) { 
        results.push(create_association(active_repo_member.user, repo.repo_full_name, true, "Self"));
      }
    }
  }
  return results;
}