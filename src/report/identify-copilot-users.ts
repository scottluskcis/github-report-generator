/*
  user 
    teams - what teams is this user a part of
    repos - what repos has this user been active in
    copilot - do they have a copilot seat

    other_copilot_members 
    non_copilot_members


Copilot user ->
  Teams the user is a member of -> other users in those teams
  Repositories they are active in ->
  Details on copilot usage, e.g. are they using copilot in this repository and how?
  Teams with access to the repository -> other users in those teams
  Other users with access to or activity in the repository
*/

import { ActivityData, EnterpriseCopilotSeats, TeamSummary, RepoSummary } from "../shared/shared-types";
import { readJsonFile, writeToFileSync } from "../shared/file-utils";

export interface ActivitySummary {
  teams: TeamSummary[];
  repos: RepoSummary[];
}

export interface AssigneeSummaryData {
  assignee_name: string;
  org_name: string;
  activity: ActivitySummary;
}

export function run_summary_report(): string | undefined {
  const org_data = readJsonFile<{[key: string]: ActivityData}>("activity_data.json");
  const copilot_seats = readJsonFile<EnterpriseCopilotSeats>("enterprise_data.json");  

  if (!org_data || !copilot_seats) {
    console.error("Data not found, exiting...");
    return undefined;
  }

  const summary_by_user = summarize_by_user({ org_data, copilot_seats });

  // write out to file
  const file_path = writeToFileSync(summary_by_user, "summary_by_user.json");
  return file_path;
}

export function summarize_by_user({
  org_data,
  copilot_seats,
}: { 
  org_data: { [key: string]: ActivityData }; 
  copilot_seats: EnterpriseCopilotSeats;
}) {
  const breakdown_by_user: { [key: string]: AssigneeSummaryData } = {};

  // TOOD: too many nested for loops here, clean  this up
  for(const org in org_data) {
    const copilot_seats_for_org = copilot_seats.seats.filter((s) => s.organization == org);

    const data = org_data[org];
    for(const team of data.teams) { 
      const team_members = team.members;

      // members on the team that do have a copilot seat
      const team_members_with_copilot = team_members ? team_members.filter((member_name) => { 
        const seat = copilot_seats.seats.find((seat) => seat.assignee == member_name);
        return seat != null;
      }) : [];

      // members on the team that do not have a copilot seat
      const team_members_without_copilot = team_members ? team_members.filter((member_name) => {
        const seat = copilot_seats.seats.find((seat) => seat.assignee == member_name);
        return seat == null;
      }) : [];

      for(const member_with_copilot of team_members_with_copilot) {
        const assignee_summary: AssigneeSummaryData = breakdown_by_user.hasOwnProperty(member_with_copilot) 
          ? breakdown_by_user[member_with_copilot] 
          : { assignee_name: member_with_copilot, org_name: org, activity: { teams: [], repos: [] } };

        const update_team = { ...team };
        update_team.members_without_copilot = team_members_without_copilot;
        update_team.repos.forEach((r) => {
          r.active_users.forEach((u) => {
            u.has_copilot_seat = copilot_seats.seats.some((s) => s.assignee == u.user);
            u.has_copilot_seat_in_org = copilot_seats_for_org.some((s) => s.assignee == u.user);
          });
        });

        assignee_summary.activity.teams.push(update_team);

        breakdown_by_user[member_with_copilot] = assignee_summary;
      }
    }
  }

  return breakdown_by_user;
}