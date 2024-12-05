import { isAfter, parseISO } from "date-fns";
import { listCopilotSeats } from "../restapi/copilot";
import { listRepoActivities, listReposForOrg } from "../restapi/repositories";
import {
  listTeamMembers,
  listTeamReposInOrg,
  listTeams,
} from "../restapi/teams";
import { UserSummary, ActivityData, RepoSummary, TeamSummary, TimePeriodType } from "../shared/shared-types";
import logger from "../shared/app-logger";

export async function getOrgActivity({
  org,
  time_period,
  per_page,
}: {
  org: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<ActivityData> {
  logger.trace("getOrgActivity", org);

  logger.trace("listCopilotSeats", org);    
  const org_copilot_seats: { assignee: string; last_activity_at: string }[] = [];
  for await(const seat of listCopilotSeats({ org, per_page })) {
    org_copilot_seats.push({
      assignee: `${seat.assignee.login}`,
      last_activity_at: `${seat.last_activity_at}`,
    }); 
  }
  logger.info(`Found ${org_copilot_seats.length} copilot seats in org ${org}`);
 
  const teams = await getAllReposActivity({
    org,
    time_period,
    per_page,
  });

  return { 
    org,
    time_period,
    teams, 
    copilot_seats: org_copilot_seats 
  };
}

async function getAllReposActivity({
  org,
  time_period,
  per_page,
}: {
  org: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<TeamSummary[]> {
  // all teams within the org
  const teams = await getTeamsActivity({
    org,
    time_period,
    per_page,
  });

  // now get repos not assigned to a team
  const repos_with_teams = teams.flatMap((team) =>
    team.repos.map((repo) => repo.repo_name)
  );
  const repos_no_team = await getOrgReposWithoutTeam({
    org,
    per_page,
    time_period,
    team_repos: repos_with_teams,
  });
  teams.push(repos_no_team);

  return teams;
}

async function getTeamsActivity({
  org,
  time_period,
  per_page,
}: {
  org: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<TeamSummary[]> {
  const teams: TeamSummary[] = [];

  // teams within the org 
  logger.trace("listTeams for org", org);
  for await (const team of listTeams({ org, per_page })) {
    const team_slug = team.slug;

    // repos within the team
    const team_repos: RepoSummary[] = []; 
    logger.trace("listTeamReposInOrg", org, team_slug);
    for await (const repo of listTeamReposInOrg({ org, team_slug, per_page })) {
      // get the active users for the repo for this org
      const activeUsers = await getActiveUsers({
        repo_name: repo.name,
        repo_owner: org,
        time_period,
        per_page,
      });

      team_repos.push({
        repo_name: repo.name,
        repo_full_name: repo.full_name,
        active_users: activeUsers,
      });
    }

    // members of the team
    const team_members: string[] = []; 
    logger.trace("listTeamMembers", org, team_slug);
    for await (const member of listTeamMembers({ org, team_slug, per_page })) {
      team_members.push(member.login);
    }
    logger.info(`Team ${team_slug} has ${team_members.length} members`);

    teams.push({
      team_slug: team_slug,
      team_name: team.name,
      team_description: team.description ?? "",
      repos: team_repos,
      members: team_members,
    });
  }

  return teams;
}

async function getOrgReposWithoutTeam({
  org,
  per_page,
  time_period,
  team_repos,
}: {
  org: string;
  per_page: number;
  time_period: TimePeriodType;
  team_repos: string[];
}): Promise<TeamSummary> {
  const reposListIterator = listReposForOrg({
    org,
    type: "all",
    per_page,
  });

  const repos: RepoSummary[] = [];
  logger.trace("listReposForOrg", org, "all");
  for await (const repo of reposListIterator) {
    // ignore for teams we have already pulled repos for
    if (team_repos.includes(repo.name)) {
      continue;
    }

    const activeUsers = await getActiveUsers({
      repo_name: repo.name,
      repo_owner: repo.owner.login,
      time_period,
      per_page,
    });

    repos.push({
      repo_name: repo.name,
      repo_full_name: repo.full_name,
      active_users: activeUsers,
    });
  }
  logger.info(`${repos.length} repos without a team in org ${org}`);

  const team_summary: TeamSummary = {
    team_name: "repos-no-team",
    team_description: "Repos not assigned to a team",
    repos: repos,
  };

  return team_summary;
}

async function getActiveUsers({
  repo_name,
  repo_owner,
  time_period,
  per_page,
}: {
  repo_name: string;
  repo_owner: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<UserSummary[]> {
  // get activities for the repo for a given time period
  const iterator = listRepoActivities({
    owner: repo_owner,
    repo: repo_name,
    time_period: time_period,
    per_page: per_page,
  });

  const activity_lookup: { [key: string]: string } = {};

  logger.trace("getActiveUsers", repo_owner, repo_name);
  for await (const activity of iterator) {
    const user = activity.actor?.login ?? "unknown";

    // only store the latest activity for each user
    if (!activity_lookup[user]) {
      activity_lookup[user] = activity.timestamp;
    } else {
      if (
        isAfter(parseISO(activity.timestamp), parseISO(activity_lookup[user]))
      ) {
        activity_lookup[user] = activity.timestamp;
      }
    }
  }

  const activeUsers: UserSummary[] = Object.keys(activity_lookup).map((user) => {
    return { user, last_active: activity_lookup[user] };
  });

  logger.info(`${activeUsers.length} active users found for repo`, repo_name, repo_owner);

  return activeUsers;
}
