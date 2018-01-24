declare module 'jira-client' {
  import * as request from 'request';
  import { ReadStream } from 'fs';

  namespace JiraApi {
    interface JiraApiOptions {
      /** What protocol to use to connect to jira? Ex: http|https (default: http) */
      protocol?: string; // optional
      /** What host is this tool connecting to for the jira instance? Ex: jira.somehost.com () */
      host?: string; //
      /** What port is this tool connecting to jira with? Only needed for none standard ports. Ex: 8080, 3000, etc () */
      port?: string; // optional
      /** Specify a username for this tool to authenticate all requests with. () */
      username?: string; // optional
      /** Specify a password for this tool to authenticate all requests with. () */
      password?: string; // optional
      /** What version of the jira rest api is the instance the tool is connecting to? (default: 2) */
      apiVersion?: string; // optional
      /** What other url parts exist, if any, before the rest/api/ section? () */
      base?: string; // optional
      /** If specified, overwrites the default rest/api/version section of the uri () */
      intermediatePath?: string; // optional
      /** Does this tool require each request to be authenticated? Defaults to true. (default: true) */
      strictSSL?: boolean; // optional
      /** What method does this tool use to make its requests? Defaults to request from request-promise () */
      request?: Function; // optional
      /** Integer containing the number of milliseconds to wait for a server to send response headers (and start the response body) before aborting the request. Note that if the underlying TCP connection cannot be established, the OS-wide TCP connection timeout will overrule the timeout option (the default in Linux can be anywhere from 20-120 * seconds). () */
      timeout?: number; // optional
      /** What webhook version does this api wrapper need to hit? (default: 1.0) */
      webhookVersion?: string; // optional
      /** What webhook version does this api wrapper need to hit? (default: 1.0) */
      greenhopperVersion?: string; // optional

      bearer?: string;
      oauth?: OAuth;
    }

    interface OAuth {
      consumer_key: string;
      consumer_secret: string;
      access_token: string;
      access_token_secret: string;
      signature_method?: string;
    }

    interface LinkObject {
      [name: string]: any
    }

    interface Query {
      [name: string]: any
    }

    interface JsonResponse {
      [name: string]: any
    }

    interface JiraProject {
      /** A list of fields */
      "expand": string;
      /** URL to the project */
      "self": string;
      /** UID of the project */
      "id": string;
      /** The project key */
      "key": string;
      /** Name of the project */
      "name": string;
      /** List of urls to the icon for the project */
      "avatarUrls": {
        "48x48": string;
        "24x24": string;
        "16x16": string;
        "32x32": string;
      },
      /** The type of the project */
      "projectTypeKey": "software";
      /** True if this project should use the simplified flow */
      "simplified": boolean;
    }

    /** The kind of JIRA issue this is */
    interface JiraIssueType {
      /** URL to the Type of issue */
      "self": string;
      /** ID of the type (numeric string) */
      "id": string;
      /** Description of the issue type */
      "description": string;
      /** URL to the icon for this type of issue */
      "iconUrl": string;
      /** Short name for this type of issue */
      "name": string;
      /** True if this is a subtask */
      "subtask":boolean;
      /** ? Don't really know what this is */
      "avatarId": number;
    }

    interface JiraResolution {
      /** URL to the resolution */
      "self": string;
      /** ID of the resolution (numeric string) */
      "id": string;
      /** Description of the resolution */
      "description": string;
      /** Short name of the resolution */
      "name": string;
    }

    interface JiraPriority {
      /** URL to the priority */
      "self": string;
      /** URL to an icon for this priority */
      "iconUrl": string;
      /** Name of this priority */
      "name": string;
      /** ID of this priority (numeric string) */
      "id": string;
    }

    interface JiraVersion {
      /** URL to this version */
      "self": string;
      /** ID of this version (numeric string) */
      "id": string;
      /** The name of this version */
      "name": string;
      /** True if this version is archived */
      "archived": boolean;
      /** True if this version is released */
      "released": boolean;
    }

    interface JiraIssueLink {
      /** ID of the link (numeric string) */
      "id": string,
      /** URL to the link */
      "self": string,
      "type": {
        /** ID of the type of link */
        "id": string;
        /** Name of the issue */
        "name": string;
        /** Description for the incoming relationship */
        "inward": string;
        /** Description for the outgoing relationship */
        "outward": string;
        /** URL to the issue type */
        "self": string;
      },
      "inwardIssue": JiraIssue
    }

    interface JiraUser {
      /** URL to the user */
      "self": string;
      /** Username */
      "name": string;
      /** Type of user??? */
      "key": "admin";
      /** GUID */
      "accountId": string;
      /** Email for the user */
      "emailAddress": string;
      /** URLS for different sized avatars */
      "avatarUrls": {
        "48x48": string;
        "24x24": string;
        "16x16": string;
        "32x32": string;
      };
      /** How the user should be presented as text */
      "displayName": string;
      /** Set to false to disable a user */
      "active": true;
      /** Timezone code for this user (ie. America/Chicago) */
      "timeZone": string;
      // "groups": {
      //   "size": 3,
      //   "items": []
      // };
    }

    interface JiraIssueStatusCategory {
      /** URL to the issue status category */
      "self": string;
      "id": number;
      /** JIRA key for this status category */
      "key": string;
      /** A color for this status category */
      "colorName": string;
      "name": string
    }

    interface JiraIssueStatus {
      /** URL to the issue status */
      "self": string;
      "description": string;
      /** URL to the icon for this issue status */
      "iconUrl": string;
      "name": "Backlog";
      /** ID of the issue status (numeric string) */
      "id": string;
      "statusCategory": JiraIssueStatusCategory
    }

    interface JiraComponent {
      /** URL to the component */
      "self": string,
      /** ID of the component (numeric string) */
      "id": string,
      "name": string
    }


    interface JiraIssue {
      /** Some list of fields */
      "expand": string;
      /** The id of the issue (numeric string) */
      "id": string;
      /** URL to the issue */
      "self": string;
      /** The JIRA key for the issue */
      "key": string;
      /** Set of fields for the issue */
      "fields": {
        /** The type of issue this is */
        "issuetype": JiraIssueType;
        /** Human readable amount of time spent on this issue */
        "timespent": string;
        /** The project for this issue */
        "project": JiraProject;
        /** List of fix version ids */
        "fixVersions": JiraVersion[];
        "aggregatetimespent": null;
        "resolution": JiraResolution;
        /** ISO datestamp for the date of the resolution */
        "resolutiondate": string;
        // "workratio": -1;
        // "lastViewed": null;
        // "watches": {
        //   "self": "https://voidray.atlassian.net/rest/api/2/issue/CAT-232/watchers";
        //   "watchCount": 1;
        //   "isWatching": false
        // };
        /** ISO date the issue was created */
        "created": string;
        /** Priority of the issue */
        "priority"?: JiraPriority;
        /** List of labels for the issue */
        "labels": string[];
        // "aggregatetimeoriginalestimate": null;
        /** The time estimate for this issue in seconds */
        "timeestimate": number;
        /** Versions affected by this issue */
        "versions": JiraVersion[];
        "issuelinks": JiraIssueLink[];
        "assignee": Partial<JiraUser>;
        /** ISO datestamp for the late updated date of this issue */
        "updated": string;
        "status": JiraIssueStatus;
        "components": JiraComponent[];
        // "timeoriginalestimate": null;
        /** Long description of this issue */
        "description": string;
        // "security": null;
        // "aggregatetimeestimate": null;
        /** Short description of this issue */
        "summary": string;
        "creator": JiraUser;
        // "subtasks": [];
        "reporter": JiraUser;
        // "aggregateprogress": {
        //   "progress": 0;
        //   "total": 0;
        // };
        /** Information about the environment in which this issue occurred */
        "environment": string;
        /** Short YYYY-MM-DD date when this issue is due */
        "duedate": string;
        // "progress": {
        //   "progress": 0;
        //   "total": 0;
        // };
        // "votes": {
        //   "self": "https://voidray.atlassian.net/rest/api/2/issue/CAT-232/votes";
        //   "votes": 0;
        //   "hasVoted": false
        // }
      }
    }

    interface JiraIssueSearchResults {
      /** Some sort of field list */
      "expand": string;
      /** Where the search started */
      "startAt": number;
      /** The limit specified for this search */
      "maxResults": number;
      /** How many results are there including results not in this response */
      "total": number;
      /** The list of issues */
      "issues": JiraIssue[];
    }

    interface JiraIssueUpdate {
      fields?: {
        // You can send any of the key/value pairs of any of the fields
        [key in keyof JiraIssue['fields']]?: Partial<JiraIssue['fields'][key]>
      };
      transition?: {
        /** The ID (numeric string) of the transition to execute */
        id: string
      };
      update?: {
        comment: [{
          add: { body: string };
        }];
      };
    }

    interface JiraTransition {
      /** The transition id (numeric string) */
      id: string;
      /** The name of this transition */
      name: string;
      /** The new status post-transition */
      to: JiraIssueStatus;
      /** True if the transition should show a screen when performed in the UI */
      hasScreen: boolean;
      /** I haven't figured out what this is */
      fields: any;
    }

    interface JiraTransitionsResponse {
      /** Not sure what this is for */
      expand: 'transitions';
      /** The list of transitions in the response */
      transitions: JiraTransition[];
    }

    interface UserObject {
      [name: string]: any
    }

    interface IssueObject extends Partial<JiraIssue> {
    }

    interface ComponentObject {
      [name: string]: any
    }

    interface FieldObject {
      [name: string]: any
    }

    interface FieldOptionObject {
      [name: string]: any
    }

    interface TransitionObject {
      [name: string]: any
    }

    interface WorklogObject {
      [name: string]: any
    }

    interface EstimateObject {
      [name: string]: any
    }

    interface WebhookObject {
      [name: string]: any
    }

    interface NotificationObject {
      [name: string]: any
    }

    interface BoardObject {
      [name: string]: any
    }

    interface SearchUserOptions {
      /** A query string used to search username, name or e-mail address */
      username: string;
      /** The index of the first user to return (0-based) (default: 0) */
      startAt?: number;
      /** The maximum number of users to return (default: 50) */
      maxResults?: number;
      /** If true, then active users are included in the results (default: true) */
      includeActive?: boolean;
      /** If true, then inactive users are included in the results (default: false) */
      includeInactive?: boolean;
    }

    interface SearchQuery {
      startAt?: number;
      maxResults?: number;
      fields?: string[];
    }

    interface SearchQuery {
      startAt?: number;
      maxResults?: number;
      fields?: string[];
    }

    interface UriOptions {
      pathname: string;
      query?: Query;
      intermediatePath?: string;
    }
  }

  class JiraApi {
    private protocol: string;
    private host: string;
    private port: string | null;
    private apiVersion: string;
    private base: string;
    private intermediatePath?: string;
    private strictSSL: boolean;
    private webhookVersion: string;
    private greenhopperVersion: string;

    constructor (options: JiraApi.JiraApiOptions);

    findIssue (issueNumber: string, expand?: string, fields?: string, properties?: string, fieldsByKeys?: boolean): Promise<JiraApi.JiraIssue>;

    getUnresolvedIssueCount (version: string): Promise<number>;

    getProject (project: string): Promise<JiraApi.JsonResponse>;

    createProject (project: string): Promise<JiraApi.JsonResponse>;

    findRapidView (projectName: string): Promise<JiraApi.JsonResponse[]>;

    getLastSprintForRapidView (rapidViewId: string): Promise<JiraApi.JsonResponse>;

    getSprintIssues (rapidViewId: string, sprintId: string): Promise<JiraApi.JsonResponse>;

    listSprints (rapidViewId: string): Promise<JiraApi.JsonResponse>;

    addIssueToSprint (issueId: string, sprintId: string): Promise<JiraApi.JsonResponse>;

    issueLink (link: JiraApi.LinkObject): Promise<JiraApi.JsonResponse>;

    getRemoteLinks (issueNumber: string): Promise<JiraApi.JsonResponse>;

    createRemoteLink (issueNumber: string, remoteLink: JiraApi.LinkObject): Promise<JiraApi.JsonResponse>;

    getVersions (project: string): Promise<JiraApi.JiraVersion[]>;

    createVersion (version: Partial<JiraApi.JiraVersion>): Promise<JiraApi.JsonResponse>;

    updateVersion (version: string): Promise<JiraApi.JsonResponse>;

    deleteVersion (versionId: string, moveFixIssuesToId: string, moveAffectedIssuesToId: string): Promise<JiraApi.JsonResponse>;

    searchJira (searchString: string, optional?: JiraApi.SearchQuery): Promise<JiraApi.JiraIssueSearchResults>;

    createUser (user: JiraApi.UserObject): Promise<JiraApi.JsonResponse>;

    searchUsers (options: JiraApi.SearchUserOptions): Promise<JiraApi.JiraUser[]>;

    getUsersInGroup (groupname: string, startAt?: number, maxResults?: number): Promise<JiraApi.JsonResponse>;

    addNewIssue (issue: JiraApi.IssueObject): Promise<JiraApi.JsonResponse>;

    addWatcher (issueKey: string, username: string): Promise<JiraApi.JsonResponse>;

    deleteIssue (issueId: string): Promise<JiraApi.JsonResponse>;

    updateIssue (issueId: string, issueUpdate: JiraApi.JiraIssueUpdate): Promise<JiraApi.JsonResponse>;

    listComponents (project: string): Promise<JiraApi.JsonResponse>;

    addNewComponent (component: JiraApi.ComponentObject): Promise<JiraApi.JsonResponse>;

    deleteComponent (componentId: string): Promise<JiraApi.JsonResponse>;

    createCustomField (field: JiraApi.FieldObject): Promise<JiraApi.JsonResponse>;

    listFields (): Promise<JiraApi.JsonResponse>;

    createFieldOption (fieldKey: string, option: JiraApi.FieldOptionObject): Promise<JiraApi.JsonResponse>;

    listFieldOptions (fieldKey: string): Promise<JiraApi.JsonResponse>;

    upsertFieldOption (fieldKey: string, optionId: string, option: JiraApi.FieldOptionObject): Promise<JiraApi.JsonResponse>;

    getFieldOption (fieldKey: string, optionId: string): Promise<JiraApi.JsonResponse>;

    deleteFieldOption (fieldKey: string, optionId: string): Promise<JiraApi.JsonResponse>;

    getIssueProperty (issueNumber: string, property: string): Promise<JiraApi.JsonResponse>;

    listPriorities (): Promise<JiraApi.JsonResponse>;

    listTransitions (issueId: string): Promise<JiraApi.JiraTransitionsResponse>;

    transitionIssue (issueId: string, issueTransition: JiraApi.TransitionObject): Promise<JiraApi.JsonResponse>;

    listProjects (): Promise<JiraApi.JiraProject[]>;

    addComment (issueId: string, comment: string): Promise<JiraApi.JsonResponse>;

    updateComment (issueId: string, commentId: string, comment: string, options?: any): Promise<JiraApi.JsonResponse>;

    addWorklog (issueId: string, worklog: JiraApi.WorklogObject, newEstimate: JiraApi.EstimateObject): Promise<JiraApi.JsonResponse>;

    deleteWorklog (issueId: string, worklogId: string): Promise<JiraApi.JsonResponse>;

    listIssueTypes (): Promise<JiraApi.JsonResponse>;

    registerWebhook (webhook: JiraApi.WebhookObject): Promise<JiraApi.JsonResponse>;

    listWebhooks (): Promise<JiraApi.JsonResponse>;

    getWebhook (webhookID: string): Promise<JiraApi.JsonResponse>;

    deleteWebhook (webhookID: string): Promise<JiraApi.JsonResponse>;

    getCurrentUser (): Promise<JiraApi.JsonResponse>;

    getBacklogForRapidView (rapidViewId: string): Promise<JiraApi.JsonResponse>;

    addAttachmentOnIssue (issueId: string, readStream: ReadStream): Promise<JiraApi.JsonResponse>;

    issueNotify (issueId: string, notificationBody: JiraApi.NotificationObject): Promise<JiraApi.JsonResponse>;

    listStatus (): Promise<JiraApi.JiraIssueStatus[]>;

    getDevStatusSummary (issueId: string): Promise<JiraApi.JsonResponse>;

    getDevStatusDetail (issueId: string, applicationType: string, dataType: string): Promise<JiraApi.JsonResponse>;

    moveToBacklog (issues: string[]): Promise<JiraApi.JsonResponse>;

    getAllBoards (startAt?: number, maxResults?: number, type?: string, name?: string, projectKeyOrId?: string): Promise<JiraApi.JsonResponse>;

    createBoard (boardBody: JiraApi.BoardObject): Promise<JiraApi.JsonResponse>;

    getBoard (boardId: string): Promise<JiraApi.JsonResponse>;

    deleteBoard (boardId: string): Promise<JiraApi.JsonResponse>;

    getIssuesForBacklog (boardId: string, startAt?: number, maxResults?: number, jql?: string, validateQuery?: boolean, fields?: string): Promise<JiraApi.JsonResponse>;

    getConfiguration (boardId: string): Promise<JiraApi.JsonResponse>;

    getIssuesForBoard (boardId: string, startAt?: number, maxResults?: number, jql?: string, validateQuery?: boolean, fields?: string): Promise<JiraApi.JsonResponse>;

    getEpics (boardId: string, startAt?: number, maxResults?: number, done?: 'true' | 'false'): Promise<JiraApi.JsonResponse>;

    getBoardIssuesForEpic (boardId: string, epicId: string, startAt?: number, maxResults?: number, jql?: string, validateQuery?: boolean, fields?: string): Promise<JiraApi.JsonResponse>;

    getProjects (boardId: string, startAt?: number, maxResults?: number): Promise<JiraApi.JsonResponse>;

    getProjectsFull (boardId: string): Promise<JiraApi.JsonResponse>;

    getBoardPropertiesKeys (boardId: string): Promise<JiraApi.JsonResponse>;

    deleteBoardProperty (boardId: string, propertyKey: string): Promise<JiraApi.JsonResponse>;

    setBoardProperty (boardId: string, propertyKey: string, body: string): Promise<JiraApi.JsonResponse>;

    getBoardProperty (boardId: string, propertyKey: string): Promise<JiraApi.JsonResponse>;

    getAllSprints (boardId: string, startAt?: number, maxResults?: number, state?: 'future' | 'active' | 'closed'): Promise<JiraApi.JsonResponse>;

    getBoardIssuesForSprint (boardId: string, sprintId: string, startAt?: number, maxResults?: number, jql?: string, validateQuery?: boolean, fields?: string): Promise<JiraApi.JsonResponse>;

    getAllVersions (boardId: string, startAt?: number, maxResults?: number, released?: 'true' | 'false'): Promise<JiraApi.JsonResponse>;

    private makeRequestHeader (uri: string, options?: JiraApi.UriOptions);

    private makeUri (options: JiraApi.UriOptions): string;

    private makeWebhookUri (options: JiraApi.UriOptions): string;

    private makeSprintQueryUri (options: JiraApi.UriOptions): string;

    private makeDevStatusUri (options: JiraApi.UriOptions): string;

    private makeAgileUri (options: JiraApi.UriOptions): string;

    private doRequest (requestOptions: request.CoreOptions): Promise<request.RequestResponse>;
  }

  export = JiraApi;
}
