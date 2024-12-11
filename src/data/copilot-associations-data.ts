import { listCopilotSeats } from "../restapi/copilot";
import { getAuditLogForActor, getOrgAuditLog } from "../restapi/organizations";
import { listTeamMembers, listTeams } from "../restapi/teams";
import logger from "../shared/app-logger";
import { TimePeriodType } from "../shared/shared-types";
import { timestampToDate, getDateForTimePeriod } from "../shared/time-util";

export async function generate_copilot_associations_data({
  org,
  per_page,
}: {
  org: string;
  per_page: number;
}) {
  const { copilot_user_teams, all_teams_members } = await getCopilotUsersTeams({
    org,
    per_page,
  });
  logger.debug("copilot_user_teams", copilot_user_teams);
  logger.debug("all_teams_members", all_teams_members);
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
}) {
  const iterator = getAuditLogForActor({
    org: org,
    actor: actor,
    include: include,
    time_period: time_period,
    per_page: per_page,
    order: "desc",
  });

  const result: {
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

    if (!result[actor]) {
      result[actor] = { repositories: [], teams: [] };
    }

    if (team && !result[actor].teams.some((t) => t.name === team)) {
      result[actor].teams.push({
        name: team,
        last_activity_at: lastActivityAt,
      });
    }

    if (
      repository &&
      !result[actor].repositories.some((r) => r.name === repository)
    ) {
      result[actor].repositories.push({
        name: repository,
        last_activity_at: lastActivityAt,
      });
    }
  }

  return result;
}

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
