# GitHub Report Generator

Tools for generating data that can be used in reports

## Setup and Execution

1. Clone this repository
2. Run `npm install` to install all dependencies
3. Create a local `.env.local` file in the root directory (same as this README.md file)
4. Add the following values to the `.env.local` file

    ```
    # access token used with octokit
    GITHUB_TOKEN=<your token here>

    # the organization to query against
    ORGANIZATION=<your org name here>
 
    # the version of the GitHub API to use
    GITHUB_API_VERSION=2022-11-28

    # the time period to retrieve data for 
    # valid values are day, week, month, quarter, or year 
    TIME_PERIOD=month
    ```

5. Most of the REST API endpoints used in this repository use a Fine-Grained Access Token. Follow the steps at [Creating a fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) to generate the value to be used for `GITHUB_TOKEN` in the settings shared in step 4 and be sure to copy the generated token as it is needed in the next step. 

    1. Repository access should be set to **All repositories**
    2. For Repository Permissions set **Read Only** access for the following areas: [Commit statuses, Contents, Discussions, Issues, Metadata, Pages, Pull requests]
    3. For Organization permissions set **Read Only** access for the following areas: [GitHub Copilot Business, Members]
    4. Click Generate Token

6. For `GITHUB_TOKEN` replace `<your token here>` with the value generated in step 5
7. For `ORGANIZATION` replace `<your org name here>` with the name of the org to query against

8. Change the `TIME_PERIOD` to the time period you want to query activity for.
9.  To execute the application run `npm run dev` for example
10. The output should exist in the `.output` folder

> [!NOTE]
> You will want to set the organization you are generating the report for as the owner of the Fine-Grained PAT

> [!IMPORTANT]
> If you do not have access to the org (i.e. are an Org Owner or a Member with Read access) then you will receive 404 or 403 errors

## Reports

The reports available in this repository are noted below

> [!NOTE]
> Currently there is only one report, expect to see more reports here in the future or feel free to add ones you think will be useful

### Copilot Associations

The purpose of [this report](./src/report/copilot-associations-report.ts) is to show what users exist in an organizations teams that do not have a copilot seat in the org but may have a relation (aka association) to someone else on the team that does have a copilot seat.

There are two reports that are generated as a result of running this report and the names of these files can be managed via [settings](#optional-settings): 

#### Summary Report 

This report is intended to summarize members that do not have copilot seats and counts to identify there association with users that do have copilot seats in the organization.

A CSV file named `copilot_associations_summary.csv` is generated for this report containing the data. You will see the following values in the report:

* **member_name**: name of the member that does not have a copilot seat
* **count_teams**: number of teams this member is a member of that has someone with a copilot seat also as a member of that same team
* **count_repos**: number of repositories this member is a contributor in that has someone with a copilot seat that is also a contributor to that repository
* **count_copilot_users**: number of distinct users with a copilot seat that the member is connected to either through a team or a repository
* **total_sum**: count_teams + count_repos + count_copilot, this could be used as a rank and sorted by to determine which members are closer to a higher number of users with copilot seats

> [!NOTE]
> Use the total_sum column to rank your members, those with a higher number are likely potential opportunities to utilize a copilot seat because of their relationship to users with copilot seats

#### Detailed Report

This report is a more detailed report that helps identify the actual associations between a member without a copilot seat and those that do have a copilot seat.

A CSV file named `copilot_associations_detailed.csv` is generated for this report containing the data. You will see the following values in the report:

* **member_name**: name of the member that does not have a copilot seat
* **association_type**: either team or repository, the association this member has with a user that has a copilot seat
* **association_name**: either the name of the team or name of the repository that links this member to a user with a copilot seat 
* **copilot_user**: the user with a copilot seat identified as being linked to a member

> [!NOTE]
> Filter the results by copilot_user to see all teams and repositories that user is a member of or is a contributor in

## Settings

When running this code you can create a local `.env.local` file as noted [here](#setup-and-execution). Here is a list of settings

### Required Settings

Required settings necessary for the app to run

```
# access token used with octokit
GITHUB_TOKEN=<your token here>

# the organization to query against
ORGANIZATION=<your org name here>
```

### Optional Settings

Optional settings and their defaut values if not specified that can be added to the `.env.local` file.

```
# the version of the GitHub API to use
GITHUB_API_VERSION=2022-11-28

# the time period to retrieve data for 
# valid values are day, week, month, quarter, or year 
TIME_PERIOD=month

# any teams to exclude from the results (comma separated list)
EXCLUDE_TEAMS=team1,team2

# true to make the call to generate data, useful to set to false if data already generated and you just want a report 
GENERATE_DATA=true

# name of the file to give to generated data file or file to use if you already have one
INPUT_FILE_NAME=copilot-associations.json

# file that will be summary of report 
OUTPUT_FILE_NAME=copilot_associations_summary.csv

# file that will contain all details for report
DETAILED_OUTPUT_FILE_NAME=copilot_associations_detailed.csv

# pretty, json, hidden
LOG_TYPE=pretty

# 0: silly, 1: trace, 2: debug, 3: info, 4: warn, 5: error, 6: fatal
MIN_LOG_LEVEL=3

# whether or not to output the log to a file called logs_yyyy-MM-dd.txt
OUTPUT_LOG_TO_FILE=false

# true to hide the log position in the console output and file output
HIDE_LOG_POSITION=true
```

### Logging

Logging has been added to this, use the `MIN_LOG_LEVEL` environment variable to indicate the level of logging you want to see and the `OUTPUT_LOG_TO_FILE` if you want to store the output in a local file.