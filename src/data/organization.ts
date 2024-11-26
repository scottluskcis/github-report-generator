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

interface OrgActivity {
  org_name: string;
  repo_name: string;
  active_users: ActiveUser[];
}

interface RepoSummary {
  repo_name: string;
  active_users: ActiveUser[];
}

interface TeamSummary {
  team_slug: string;
  team_name: string;
  members: string[];  
  repos: RepoSummary[];
}

const items_per_page = 50;

export async function readOrgInfo({
  org,
  time_period,
}: {
  org: string;
  time_period: TimePeriodType;
}): Promise<any> { 
  // const seatsList = await getCopilotSeatsByOrg(org);
  // const copilot_seats = seatsList.map((seat) => seat.assignee.login);
  // const repo_activity = await getOrgUserActivity({ org, time_period });

  // return { org, copilot_seats, repo_activity };
  
  const teams = await getTeamSummary({ org, time_period, per_page: items_per_page });
 
  return { teams };
}

async function getCopilotSeatsByOrg(
  org: string,
  lastActivitySince?: string
): Promise<CopilotSeatDetails[]> {
  const orgCopilotSeats = await listCopilotSeats({
    org,
    page: 1,
    per_page: items_per_page,
  });

  if (!lastActivitySince) {
    return orgCopilotSeats;
  }

  const filteredSeats = await filterCopilotSeats({
    seats: orgCopilotSeats,
    last_activity_since: lastActivitySince,
  });

  return filteredSeats;
}

async function getOrgUserActivity({
  org,
  time_period,
}: {
  org: string;
  time_period: TimePeriodType;
}): Promise<OrgActivity[]> {
  const reposListIterator = listReposForOrg({
    org: org,
    type: "all",
    page: 1,
    per_page: items_per_page,
  });

  const orgActivity: OrgActivity[] = [];
  for await (const repo of reposListIterator) {
    const activeUsers = await getActiveUsers({
      repo_name: repo.name,
      repo_owner: repo.owner.login,
      time_period: time_period,
    });
 
    orgActivity.push({
      org_name: org,
      repo_name: repo.name,
      active_users: activeUsers,
    }); 
  }

  return orgActivity;
}

async function getTeamSummary({
  org,
  time_period,
  per_page
}: {
  org: string;
  time_period: TimePeriodType;
  per_page: number;
}): Promise<TeamSummary[]> { 
  const teams: TeamSummary[] = [];
 
  const teamsIterator = listTeams({ org, per_page });
  for await (const team of teamsIterator) {
    const team_slug = team.slug;

    const team_repos: RepoSummary[] = [];
    const teamReposIterator = listTeamReposInOrg({ org, team_slug, per_page });
    for await (const repo of teamReposIterator) {
      const activeUsers = await getActiveUsers({
        repo_name: repo.name,
        repo_owner: org,
        time_period: time_period,
      });

      team_repos.push({ repo_name: repo.name, active_users: activeUsers }); 
    }

    const team_members: string[] = [];
    const teamMembersIterator = listTeamMembers({ org, team_slug, per_page });
    for await (const member of teamMembersIterator) {
      team_members.push(member.login);
    }

    teams.push({
      team_slug: team_slug,
      team_name: team.name,
      repos: team_repos,
      members: team_members,
    });
  }

  return teams;
}

async function getActiveUsers({
  repo_name,
  repo_owner,
  time_period,
}: {
  repo_name: string;
  repo_owner: string;
  time_period: TimePeriodType;
}): Promise<ActiveUser[]> {
  const iterator = listRepoActivities({
    owner: repo_owner,
    repo: repo_name,
    time_period: time_period,
    per_page: items_per_page,
  });

  const activity_lookup: { [key: string]: string } = {};

  for await (const activity of iterator) {
    const user = activity.actor?.login ?? "unknown";

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
