import { memoize } from 'ramda';
import { Issue } from './issue';
import { jira } from './jira';

export class Transition {
  static loadForIssue = memoize(async (issue: Issue) =>
    jira.listTransitions(issue.key));
}
