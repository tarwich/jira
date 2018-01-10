import { JiraProject } from 'jira-client';

export class Project {
  /** The actual jira project data */
  private data: JiraProject;

  constructor(data: JiraProject) {
    this.data = data;
  }

  get id() {
    return this.data.id;
  }

  get key() {
    return this.data.key;
  }

  get name() {
    return this.data.name;
  }

  /**
   * Check to see if a piece of data is a JIRA project
   *
   * @param data The data to check for being a project
   */
  static isJiraProject(data: any): data is JiraProject {
    return data && ('projectTypeKey' in data);
  }
}
