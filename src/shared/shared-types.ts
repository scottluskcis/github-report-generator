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

export interface UserSummary {
  user: string;
  last_active: string;
  has_copilot_seat?: boolean;
  has_copilot_seat_in_org?: boolean; 
}

export interface RepoSummary {
  repo_name: string;
  repo_full_name: string;
  active_users: UserSummary[];
  members_without_copilot?: string[];
}

export interface TeamSummary {
  team_slug?: string;
  team_name: string;
  team_description?: string;
  members?: string[];
  members_without_copilot?: string[];
  repos: RepoSummary[];
}

export interface EnterpriseCopilotSeats {
  seats: EnterpriseCopilotSeat[];
  enterprise: string;
}

export interface EnterpriseCopilotSeat {
  assignee: string;
  last_activity_at: string | null | undefined;
  organization: string;
}

export interface CopilotAssociation {
  org_name: string; 
  user_name: string;
  user_has_org_copilot_seat: boolean;
  association_type: 'team' | 'repository';
  association: string;
  related_copilot_user_name: string;
}
