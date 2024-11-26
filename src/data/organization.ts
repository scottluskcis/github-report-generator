import { isAfter, parseISO } from "date-fns";
import {
  listCopilotSeats,
  filterCopilotSeats,
  CopilotSeatDetails,
} from "../restapi/copilot";
import { listRepoActivities, listReposForOrg } from "../restapi/repositories";
import { listTeamMembers, listTeamReposInOrg, listTeams } from "../restapi/teams";

type TimePeriodType = "day" | "week" | "month" | "quarter" | "year";

interface ActiveUser {
  user: string;
  last_active: string;
}

interface RepoSummary {
  repo_name: string;
  repo_full_name: string;
  active_users: ActiveUser[];
}

interface TeamSummary {
  team_slug?: string;
  team_name: string;
  team_description?: string;
  members?: string[];  
  repos: RepoSummary[];
}

export async function readOrgInfo({
  org,
  time_period,
  per_page
}: {
  org: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<any> { 
  // const seatsList = await getCopilotSeatsByOrg(org);
  // const copilot_seats = seatsList.map((seat) => seat.assignee.login);
  // const repo_activity = await getOrgUserActivity({ org, time_period });

  // return { org, copilot_seats, repo_activity };
  
  const teams = await getAllReposActivity({ 
    org,
    time_period,
    per_page
  });

  return { teams };
}

async function getCopilotSeatsByOrg({
  org,
  last_activity_since,
  per_page
}: {
  org: string,
  last_activity_since?: string,
  per_page: number
}): Promise<CopilotSeatDetails[]> {
  const orgCopilotSeats = await listCopilotSeats({
    org,
    page: 1,
    per_page,
  });

  if (!last_activity_since) {
    return orgCopilotSeats;
  }

  const filteredSeats = await filterCopilotSeats({
    seats: orgCopilotSeats,
    last_activity_since: last_activity_since,
  });

  return filteredSeats;
}

async function getAllReposActivity({
  org,
  time_period,
  per_page
}: {
  org: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<TeamSummary[]> {
  // all teams within the org 
  const teams = await getTeamsActivity({ 
    org, 
    time_period, 
    per_page 
  });
 
  // now get repos not assigned to a team
  const repos_with_teams = teams.flatMap((team) => team.repos.map((repo) => repo.repo_name));
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
  per_page
}: {
  org: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<TeamSummary[]> { 
  const teams: TeamSummary[] = [];
 
  // teams within the org
  const teamsIterator = listTeams({ org, per_page });
  for await (const team of teamsIterator) {
    const team_slug = team.slug;

    // repos within the team
    const team_repos: RepoSummary[] = [];
    const teamReposIterator = listTeamReposInOrg({ org, team_slug, per_page });
    for await (const repo of teamReposIterator) {
      // get the active users for the repo for this org
      const activeUsers = await getActiveUsers({
        repo_name: repo.name,
        repo_owner: org,
        time_period,
        per_page
      });

      team_repos.push({ 
        repo_name: repo.name, 
        repo_full_name: repo.full_name,
        active_users: activeUsers 
      }); 
    }

    // members of the team
    const team_members: string[] = [];
    const teamMembersIterator = listTeamMembers({ org, team_slug, per_page });
    for await (const member of teamMembersIterator) {
      team_members.push(member.login);
    }

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
    per_page 
  });

  const repos: RepoSummary[] = [];
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
      active_users: activeUsers 
    });
  }

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
}): Promise<ActiveUser[]> {
  // get activities for the repo for a given time period
  const iterator = listRepoActivities({
    owner: repo_owner,
    repo: repo_name,
    time_period: time_period,
    per_page: per_page,
  });

  const activity_lookup: { [key: string]: string } = {};

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

  const activeUsers: ActiveUser[] = Object.keys(activity_lookup).map((user) => {
    return { user, last_active: activity_lookup[user] };
  });

  return activeUsers;
}
