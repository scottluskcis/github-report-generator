import { listRepoCollaborators } from "../restapi/collaborators";
import { listCopilotSeats } from "../restapi/copilot";
import { getAuditLogForActor } from "../restapi/organizations";
import { listRepoContributors } from "../restapi/repositories";
import { listTeamMembers, listTeams } from "../restapi/teams";
import logger from "../shared/app-logger";
import { CopilotSeatAssignee, Repository, TeamInfo, TimePeriodType } from "../shared/shared-types";
import { timestampToDate } from "../shared/time-util";

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

  const copilot_seats = await fetchCopilotSeats(org, per_page);
  const teams: { [team: string]: TeamInfo } = {};
  const repositories: { [repo: string]: Repository } = {};

  for (const seat of copilot_seats) {
    await processActiveAreas(org, seat.assignee, time_period, per_page, teams, repositories);
  }

  await fetchOrgTeamsMembers(org, per_page, teams, copilot_seats);

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

async function processActiveAreas(org: string, seat_assignee: string, time_period: TimePeriodType, per_page: number, teams: { [team: string]: TeamInfo }, repositories: { [repo: string]: Repository }) {
  const active_areas_iterator = getUserActiveAreas({
    org,
    actor: seat_assignee,
    include: "all",
    time_period: time_period,
    per_page: per_page,
  });

  for await (const active_area of active_areas_iterator) {
    if (active_area.team) {
      await processTeams(org, active_area.team, seat_assignee, per_page, teams);
    }
    if (active_area.repository) {
      await processRepositories(active_area.repository, seat_assignee, per_page, repositories);
    }
  }
}

async function processTeams(org: string, team_name: string, seat_assignee: string, per_page: number, teams: { [team: string]: TeamInfo }) {
  if (teams[team_name]) {
    if (!teams[team_name].copilot_users.includes(seat_assignee)) {
      logger.debug(`Found team ${team_name} for user ${seat_assignee}`);
      teams[team_name].copilot_users.push(seat_assignee);
    }
  } else {
    teams[team_name] = { team_name: team_name, members: [], copilot_users: [seat_assignee] };
    for await (const team of getOrgTeamsMembers({ org, per_page })) {
      const member_name = team.member_name;
      teams[team_name].members.push(member_name);
    }
  }
}

async function processRepositories(repository_owner_name: string, seat_assignee: string, per_page: number, repositories: { [repo: string]: Repository }) {
  const collaborator_affiliation = 'direct';
  if (repositories[repository_owner_name]) {
    if (!repositories[repository_owner_name].associated_copilot_users.includes(seat_assignee)) {
      logger.trace(`Found repo ${repository_owner_name} for user ${seat_assignee}`);
      repositories[repository_owner_name].associated_copilot_users.push(seat_assignee);
    }
  } else {
    const [owner, repo_name] = repository_owner_name.split("/");
    repositories[repository_owner_name] = { repo_owner: owner, repo_name: repo_name, collaborators: [], collaborator_affiliation: collaborator_affiliation, contributors: [], associated_copilot_users: [seat_assignee] };
    logger.trace(`Found repo ${owner}/${repo_name} for user ${seat_assignee}`);

    for await (const collaborator of listRepoCollaborators({ owner, repo: repo_name, per_page, affiliation: collaborator_affiliation })) {
      const collaborator_name = collaborator.login;
      logger.trace(`Found collaborator ${collaborator_name} for repo ${repo_name}`);
      repositories[repository_owner_name].collaborators.push(collaborator_name);
    }

    for await (const contributor of listRepoContributors({ owner, repo: repo_name, per_page })) {
      const contributor_name = contributor.login || contributor.name;
      if (contributor_name) {
        logger.trace(`Found contributor ${contributor_name} for repo ${repo_name}`);
        repositories[repository_owner_name].contributors.push(contributor_name);
      }
    }
  }
}

async function fetchOrgTeamsMembers(org: string, per_page: number, teams: { [team: string]: TeamInfo }, copilot_seats: CopilotSeatAssignee[]) {
  const org_team_members_iterator = getOrgTeamsMembers({ org, per_page });
  for await (const team of org_team_members_iterator) {
    const team_name = team.team_name;
    logger.trace("Found team", team_name);

    if (!teams[team_name]) {
      teams[team_name] = { team_name: team_name, members: [], copilot_users: [] };
    }

    const member_name = team.member_name;
    logger.warn(`Found team member ${member_name} for team ${team_name}`);
    teams[team_name].members.push(member_name);

    if (copilot_seats.some(s => s.assignee == member_name) && !(teams[team_name].copilot_users.includes(member_name))) {
      teams[team_name].copilot_users.push(member_name);
    }
  }
}

// 1. Get all copilot users
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

// 2. Get the teams that those users are in (even if that means getting all teams and their members and filtering client side)
// 3. For the teams that have copilot users, report those teams and the other users in those teams that do not have copilot licenses
async function getCopilotUsersTeams({
  org,
  per_page,
}: {
  org: string;
  per_page: number;
}) {
  // get the copilot users
  logger.trace("getOrgCopilotUsers", org);
  const copilot_seats: { assignee: string; last_activity_at: string }[] = [];
  for await (const user of getOrgCopilotUsers({ org, per_page })) {
    copilot_seats.push(user);
    logger.debug(
      `Found user ${user.assignee} with last activity at ${user.last_activity_at} for org ${org}`
    );
  }
  logger.debug("Copilot users", copilot_seats);

  const copilot_user_teams: {
    [key: string]: {
      user: { assignee: string; last_activity_at: string };
      teams: string[];
    };
  } = {};

  // get the teams and identify which the copilot user is a part of
  logger.trace("getOrgTeamsMembers", org);
  const all_teams_members: {
    org: string;
    team_name: string;
    team_slug: string;
    member_name: string;
    has_copilot_seat: boolean;
  }[] = [];
  for await (const team of getOrgTeamsMembers({ org, per_page })) {
    const team_slug = team.team_slug;
    const team_name = team.team_name;
    const member_name = team.member_name;

    // check if the member is a copilot user
    const copilot_seat = copilot_seats.find(
      (user) => user.assignee === member_name
    );
    const has_copilot_seat = copilot_seat !== undefined;
    logger.debug(
      `Found user ${member_name} in team ${team_name} with slug ${team_slug}, ${
        has_copilot_seat ? "has" : "does NOT have"
      } a copilot seat in the org`
    );

    // track if this is a copilot user
    if (has_copilot_seat) {
      if (copilot_user_teams.hasOwnProperty(member_name)) {
        copilot_user_teams[member_name].teams.push(team_slug);
      } else {
        copilot_user_teams[member_name] = {
          user: copilot_seat,
          teams: [team_slug],
        };
      }
    }

    all_teams_members.push({
      org,
      team_name,
      team_slug,
      member_name,
      has_copilot_seat,
    });
  }

  logger.debug(
    `Found ${
      Object.keys(copilot_user_teams).length
    } copilot users in org ${org}`
  );

  return { copilot_user_teams, all_teams_members };
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
    logger.info(`Team ${team_slug} has ${team_member_count} members`);
  }
  logger.info(`Found ${team_count} total teams in org ${org}`);
}

// 4. Get the repos that the copilot users are active in

/*
export async function getUsersInAuditLog({
  org,
  per_page,
}: {
  org: string;
  per_page: number;
}): Promise<{
  [key: string]: {
    user: string;
    action: string | undefined;
    team: string | undefined;
    created_at: string | undefined;
  }[];
}> {
  const iterator = getOrgAuditLog({
    org: org,
    per_page: per_page,
    phrase: undefined,
    include: "all",
    after: undefined,
    before: undefined,
    order: "desc",
  });

  const audit_log_by_user: {
    [key: string]: {
      user: string;
      action: string | undefined;
      team: string | undefined;
      created_at: string | undefined;
    }[];
  } = {};
  for await (const entry of iterator) {
    if (entry.actor) {
      if (audit_log_by_user.hasOwnProperty(entry.actor)) {
        audit_log_by_user[entry.actor].push({
          user: entry.actor,
          team: entry.team,
          action: entry.action,
          created_at: entry.created_at,
        });
      } else {
        audit_log_by_user[entry.actor] = [
          {
            user: entry.actor,
            team: entry.team,
            action: entry.action,
            created_at: entry.created_at,
          },
        ];
      }
    }
  }
  logger.debug("audit_log_by_user", audit_log_by_user);
  return audit_log_by_user;
}
  */

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

/*
export async function getActiveAreasByUser({
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
}): Promise<{
  org: string;
  users: {
    [key: string]: {
      repositories: { name: string; last_activity_at: string }[];
      teams: { name: string; last_activity_at: string }[];
    };
  };
  teams: string[];
  repositories: string[];
}> {
  const iterator = getAuditLogForActor({
    org: org,
    actor: actor,
    include: include,
    time_period: time_period,
    per_page: per_page,
    order: "desc",
  });

  const teams = [];
  const repositories = [];

  const users: {
    [key: string]: {
      repositories: { name: string; last_activity_at: string }[];
      teams: { name: string; last_activity_at: string }[];
    };
  } = {};

  for await (const entry of iterator) {
    const actor = entry.actor;
    if (!actor) {
      continue;
    }

    const team = entry.team;
    const repository = entry.repository || entry.repo;
    const lastActivityAt = timestampToDate(entry["@timestamp"]);

    if (!users[actor]) {
      users[actor] = { repositories: [], teams: [] };
    }

    if (team && !users[actor].teams.some((t) => t.name === team)) {
      teams.push(team);
      users[actor].teams.push({
        name: team,
        last_activity_at: lastActivityAt,
      });
    }

    if (
      repository &&
      !users[actor].repositories.some((r) => r.name === repository)
    ) {
      repositories.push(repository);
      users[actor].repositories.push({
        name: repository,
        last_activity_at: lastActivityAt,
      });
    }
  }

  return { org, users, teams, repositories };
}
*/

// MAYBE - list orgs for a user, can we determine copilot license from that?
// https://docs.github.com/en/rest/orgs/orgs?apiVersion=2022-11-28#list-organizations-for-a-user

// Maybe get collaborators
// https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#list-repository-collaborators
// https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#check-if-a-user-is-a-repository-collaborator
// Collaborator is someone added to the repo but not necessarily a Contributor

// 5. Report those repos and the other users that are active in those repos that do not have copilot licenses

// GOAL: By Friday, something tos end to them even with the caveats
// wanting to fan out for candidate users
// if not all users thats ok

// once we know the repos for copilot (i.e. filter by actor)
// then use api requests with repos to find all users active over same time period
// what about cases where the user has only been added to the repo?

// search the audit log by user and time -
// https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization#search-based-on-time-of-action

// search the GitHub repo witha a few users to generate data from there
