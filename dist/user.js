"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = require("ramda");
const jira_1 = require("./jira");
class User {
    constructor(data) {
        this.data = data;
    }
    // region: Getters and setters
    //
    get displayName() { return this.data.displayName; }
    get emailAddress() { return this.data.emailAddress; }
    get id() { return this.data.accountId; }
    get name() { return this.data.name; }
    toString(fields) {
        const values = ramda_1.pick(fields, this);
        const value = (field) => values[field] || '';
        return `${value('id')} ${value('name')} ${value('emailAddress')} ${value('displayName')}`
            .replace(/( (?= )|^ +| +$)/g, '');
    }
}
//
// endregion
// region: Methods
//
/** Find a user that matches the substring */
User.find = ramda_1.memoize((substring) => jira_1.jira.searchUsers({ username: substring }));
exports.User = User;
//# sourceMappingURL=user.js.map