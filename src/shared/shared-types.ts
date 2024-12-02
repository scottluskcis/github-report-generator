export type TimePeriodType = "day" | "week" | "month" | "quarter" | "year";

export interface ActivityData {
  org: string;
  time_period: TimePeriodType;
  teams: TeamSummary[];
  copilot_seats: CopilotSeatAssignee[];
}

export interface CopilotSeatAssignee {
  assignee: string;
  last_activity_at: string;
}

export interface EnterpriseCopilotUser {
  user: CopilotSeatAssignee;
  repos: string[];
  org_data: ActivityData;
}

export interface ActiveUser {
  user: string;
  last_active: string;
}

export interface RepoSummary {
  repo_name: string;
  repo_full_name: string;
  active_users: ActiveUser[];
}

export interface TeamSummary {
  team_slug?: string;
  team_name: string;
  team_description?: string;
  members?: string[];
  repos: RepoSummary[];
}

export interface EnterpriseCopilotSeats {
  seats: EnterpriseCopilotSeat[];
  enterprise: string;
}

export interface EnterpriseCopilotSeat {
  assignee: string;
  organization: string;
}