import { listCopilotSeats } from "../restapi/copilot";
import { getAuditLogForActor } from "../restapi/organizations";
import { listRepoContributors } from "../restapi/repositories";
import { listTeamMembers, listTeams } from "../restapi/teams";
import logger from "../shared/app-logger";
import { CopilotSeatAssignee, Repository, TeamInfo, TimePeriodType } from "../shared/shared-types";
import { timestampToDate } from "../shared/time-util";

  
  // 1. Get all copilot users
  // 2. Get the teams that those users are in (even if that means getting all teams and their members and filtering client side)
  // 3. For the teams that have copilot users, report those teams and the other users in those teams that do not have copilot licenses
  // 4. Get the repos that the copilot users are active in
  // 5. Report those repos and the other users that are active in those repos that do not have copilot licenses

export async function generateCopilotAssociationsData({
  org,
  per_page,
  time_period,
}: {
  org: string;
  per_page: number;
  time_period: TimePeriodType;
}) {
  logger.trace("getOrgCopilotUsers", org);

  const teams: { [team: string]: TeamInfo } = {};
  const repositories: { [repo: string]: Repository } = {};

  // first get the users with copilot seats in the org (NOTE: does not include users with copilot seats in enterprise orgs outside of this org
  const copilot_seats = await fetchCopilotSeats(org, per_page);

  // because the audit may not reflect that a copilot user is in a team, we need to get all teams and their members
  await fetchOrgTeamsMembers(org, per_page, teams, copilot_seats);

  // for every copilot user, get their active areas (repos and teams) by looking at the audit log
  // NOTE: there is rate limiting with audit log and its not intended to be used in this way constantly
  // may need to reconsider other otpions for future 
  for (const seat of copilot_seats) {
    await processActiveAreas(org, seat.assignee, time_period, per_page, repositories);
  }

  return { copilot_seats, teams, repositories };
}

async function fetchCopilotSeats(org: string, per_page: number): Promise<CopilotSeatAssignee[]> {
  const copilot_seats: CopilotSeatAssignee[] = [];
  const copilot_seats_iterator = getOrgCopilotUsers({ org, per_page });
  for await (const seat of copilot_seats_iterator) {
    const seat_assignee = seat.assignee;
    logger.debug(`Found seat_assignee`, seat_assignee);
    if (!copilot_seats.some(s => s.assignee === seat_assignee)) {
      copilot_seats.push(seat);
    }
  }
  return copilot_seats;
}

async function processActiveAreas(org: string, seat_assignee: string, time_period: TimePeriodType, per_page: number, repositories: { [repo: string]: Repository }) {
  const active_areas_iterator = getUserActiveAreas({
    org,
    actor: seat_assignee,
    include: "git", // for now only include git activity
    time_period: time_period,
    per_page: per_page,
  }); 

  for await (const active_area of active_areas_iterator) {  
    if (active_area.repository) {
      await processRepositories(active_area.repository, seat_assignee, per_page, repositories);
    }
  }
}

async function processTeams(org: string, team_name: string, per_page: number, teams: { [team: string]: TeamInfo }, org_copilot_seats: CopilotSeatAssignee[]) {
  let has_loaded_members = false;
  if(!teams[team_name]) {
    teams[team_name] = { team_name: team_name, members: [], copilot_users: [] }; 
  } else {
    has_loaded_members = teams[team_name].members.length > 0;
  }

  if (!has_loaded_members) {  
    const team_slug = teams[team_name].team_name;
    for await (const member of listTeamMembers({ org, team_slug, per_page })) { 
      const member_name = member.login;
      teams[team_name].members.push(member_name);
      logger.debug(`Found team member ${member_name} for team ${team_name}`);
      
      if (org_copilot_seats.some(seat => seat.assignee === member_name) && !teams[team_name].copilot_users.includes(member_name)) {
        teams[team_name].copilot_users.push(member_name);
        logger.debug(`Added copilot user ${member_name} to team ${team_name}`);
      }
    }
  }
}

async function processRepositories(repository_owner_name: string, seat_assignee: string, per_page: number, repositories: { [repo: string]: Repository }) {
  if (repositories[repository_owner_name]) {
    if (!repositories[repository_owner_name].associated_copilot_users.includes(seat_assignee)) {
      logger.trace(`Found repo ${repository_owner_name} for user ${seat_assignee}`);
      repositories[repository_owner_name].associated_copilot_users.push(seat_assignee);
    }
  } else {
    const [owner, repo_name] = repository_owner_name.split("/");
    repositories[repository_owner_name] = { repo_owner: owner, repo_name: repo_name, contributors: [], associated_copilot_users: [seat_assignee] };
    logger.trace(`Found repo ${owner}/${repo_name} for user ${seat_assignee}`);

    // contributors 
    let contributor_count: number = 0;
    for await (const contributor of listRepoContributors({ owner, repo: repo_name, per_page })) {
      const contributor_name = contributor.login || contributor.name;
      if (contributor_name) {
        logger.trace(`Found contributor ${contributor_name} for repo ${repo_name}`);
        repositories[repository_owner_name].contributors.push(contributor_name); 
        contributor_count++;
      } 
    } 
    logger.info(`Found ${contributor_count} contributors for repo ${repo_name}`);
  }
}

async function fetchOrgTeamsMembers(org: string, per_page: number, teams: { [team: string]: TeamInfo }, org_copilot_seats: CopilotSeatAssignee[]) { 
  let team_count: number = 0; 
  for await (const team of listTeams({ org, per_page })) { 
    processTeams(org, team.slug, per_page, teams, org_copilot_seats); 
    team_count++;
  }
  logger.info(`Found ${team_count} total teams in org ${org}`);
}

async function* getOrgCopilotUsers({
  org,
  per_page,
}: {
  org: string;
  per_page: number;
}): AsyncGenerator<
  { assignee: string; last_activity_at: string },
  void,
  unknown
> {
  logger.trace("listCopilotSeats", org);
  let seat_count: number = 0;
  for await (const seat of listCopilotSeats({ org, per_page })) {
    seat_count++;
    const item = {
      assignee: `${seat.assignee.login}`,
      last_activity_at: `${seat.last_activity_at}`,
    };
    yield item;
  }
  logger.info(`Found ${seat_count} copilot seats in org ${org}`);
}

async function* getOrgTeamsMembers({
  org,
  per_page,
}: {
  org: string;
  per_page: number;
}): AsyncGenerator<
  { team_name: string; team_slug: string; member_name: string },
  void,
  unknown
> {
  logger.trace("listTeams for org", org);
  let team_count: number = 0;
  for await (const team of listTeams({ org, per_page })) {
    team_count++;

    let team_member_count: number = 0;
    const team_slug = team.slug;

    logger.trace("listTeamMembers", org, team_slug);
    for await (const member of listTeamMembers({ org, team_slug, per_page })) {
      team_member_count++;

      const item = {
        team_name: team.name,
        team_slug: team.slug,
        member_name: member.login,
      };
      yield item;
    }
    logger.debug(`Team ${team_slug} has ${team_member_count} members`);
  }
  logger.info(`Found ${team_count} total teams in org ${org}`);
}

async function* getUserActiveAreas({
  org,
  actor,
  include,
  time_period,
  per_page,
}: {
  org: string;
  actor: string | string[];
  include: "all" | "web" | "git";
  time_period: TimePeriodType;
  per_page: number;
}): AsyncGenerator<{ team: string | undefined; repository: string | undefined; activity_at: string; actor: string }> {
  const audit_log_iterator = getAuditLogForActor({
    org: org,
    actor: actor,
    include: include,
    time_period: time_period,
    per_page: per_page,
    order: "desc",
  });

  for await (const audit_log_entry of audit_log_iterator) { 
    const actor = audit_log_entry.actor;
    if (!actor) {
      continue;
    }
    
    const team = audit_log_entry.team;
    const repository = audit_log_entry.repository || audit_log_entry.repo;
    const timestamp = timestampToDate(audit_log_entry["@timestamp"]);

    yield { team, repository, activity_at: timestamp, actor };
  }
}
