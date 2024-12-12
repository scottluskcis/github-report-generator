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

The purpose of [this report](./src/report/copilot-associations-report.ts) is to show what users exist in an organizations teams that do not have a copilot seat in the org but may have a relation to someone else on the team that does have a copilot seat.

A CSV file named `copilot_associations.csv` is generated for this report containing the data. You will see the following values in the report:

* **org_name**: Name of the organization the report was run for
* **user_name**: Name of a user found in the org as either a Team Member in one of the orgs teams or an active user in one of the repositories found in the org
* **user_has_org_copilot_seat**: whether or not the user has been assigned a copilot seat directly by the org. This does not indicate if the user may have been assigned a copilot seat by another org
* **association**: The association the user has noted in this report. This will either be the name of a Team in the org or the name of a Repository in the org
* **association_type**: The type of association the user has 

> [!NOTE]
> This will either be **team** indicating the user is a member of a team within the org or **repository** indicating the user is an active user in one of the repositories

> [!IMPORTANT]
> The TIME_PERIOD configuration value noted in the setup section above determines what time period a user is considered to be an active user

* **related_copilot_user_name**: If any other users found within the team or repository have a copilot license they are indicated here as an association to the user that doesn't have a copilot license
  
> [!NOTE]
> If the value is "Unknown" then this indicates no other active users in the repository or team members were found with a copilot seat for the org

> [!NOTE]
> IF the value is "Self" then this indicates this is a user that has a copilot seat assigned from the org any they exist in the repostiory or team. You can filter the report to see what teams and repositories a user with a copilot seat in the org may be currently active in

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

Optional settings and their defaut values if not specified

```
# the version of the GitHub API to use
GITHUB_API_VERSION=2022-11-28

# the time period to retrieve data for 
# valid values are day, week, month, quarter, or year 
TIME_PERIOD=month

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