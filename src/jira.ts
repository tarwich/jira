import * as JiraApi from 'jira-client';
import { JiraApiOptions, JiraIssueUpdate, SearchUserOptions, JiraVersion, TransitionObject } from 'jira-client';
import { memoize } from 'ramda';
import { Required } from './required';

type ConnectionOptions = Pick<Required<JiraApiOptions>, 'host' | 'username' | 'password'>;

const ERROR_NOT_CONNECTED = 'Not connected to JIRA yet';

class Jira {
  /** The current connection to JIRA */
  private jira?: JiraApi;

  /**
   * Connect to a JIRA instance
   */
  async connect(options: ConnectionOptions) {
    this.jira = new JiraApi({
      protocol: 'https',
      apiVersion: '2',
      strictSSL: false,

      ...options,
    });
  }

  addComment(issueId: string, comment: string) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.addComment(issueId, comment);
  }

  createVersion(version: Partial<JiraVersion>) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.createVersion(version);
  }

  findIssue(issueNumber: string) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.findIssue(issueNumber);
  }

  /**
   * Get all the available projects in JIRA
   */
  listProjects() {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.listProjects();
  }

  /** List all the statuses on the server */
  listStatus() {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.listStatus();
  }

  /** List the available transitions for an issue */
  listTransitions(issueId: string) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.listTransitions(issueId);
  }

  /** List all versions for a project */
  listVersions(project: string) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.getVersions(project);
  }

  /** Execute a JQL search */
  searchJira(searchString: string) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.searchJira(searchString);
  }

  /** Find users in the system */
  searchUsers = memoize(async (options: SearchUserOptions) => {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.searchUsers(options);
  });

  /** Perform the specified transition on an issue */
  transitionIssue(issueId: string, transition: TransitionObject) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    this.jira.transitionIssue(issueId, transition);
  }

  /** Persist issue changes to JIRA */
  async updateIssue(issueId: string, update: JiraIssueUpdate) {
    if (!this.jira) throw new Error(ERROR_NOT_CONNECTED);
    return this.jira.updateIssue(issueId, update);
  }
}

export const jira = new Jira();
