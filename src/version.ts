import { jira } from "./jira";
import { JiraVersion } from "jira-client";

export class Version {
  static createVersion(version: JiraVersion) {
    return jira.createVersion(version);
  }
}