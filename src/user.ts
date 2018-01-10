import { JiraUser } from 'jira-client';
import { memoize, pick } from 'ramda';
import { jira } from './jira';

export class User {
  constructor(private data: JiraUser) {
  }

  // region: Getters and setters
  //

  get displayName() { return this.data.displayName; }

  get emailAddress() { return this.data.emailAddress; }

  get id() { return this.data.accountId; }

  get name() { return this.data.name; }

  //
  // endregion

  // region: Methods
  //

  /** Find a user that matches the substring */
  static find = memoize((substring: string) => jira.searchUsers({username: substring}));

  toString(fields: (keyof User)[]) {
    const values: {[key: string]: string} = pick(fields, this);
    const value = (field: string) => values[field] || '';

    return `${value('id')} ${value('name')} ${value('emailAddress')} ${value('displayName')}`
    .replace(/( (?= )|^ +| +$)/g, '')
    ;
  }

  //
  // endregion
}
