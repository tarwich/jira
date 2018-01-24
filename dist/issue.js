"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = require("ramda");
const jira_1 = require("./jira");
const user_1 = require("./user");
const url_1 = require("url");
const TYPE_ICONS = {
    bug: '🐞',
    epic: '📚',
    improvement: '💡',
    story: '📝',
};
/**
 * Basic class to wrap a JIRA issue
 */
class Issue {
    /**
     * @param {*} data The data from JIRA from which to create an issue
     */
    constructor(data) {
        this.pendingUpdate = {};
        this.data = data;
    }
    // region: Setters and getters
    get assignee() { return this.data.fields.assignee; }
    set assignee(value) {
        this.data.fields.assignee = value;
        this.queueUpdate({ fields: { assignee: value } });
    }
    get dirty() {
        return Object.keys(this.pendingUpdate).length > 0;
    }
    get fixVersions() { return this.data.fields.fixVersions || []; }
    set fixVersions(versions) {
        this.data.fields.fixVersions = versions;
        this.queueUpdate({ fields: {
                fixVersions: versions,
            } });
    }
    get key() {
        return this.data.key;
    }
    get labels() {
        return this.data.fields.labels;
    }
    set labels(value) {
        this.data.fields.labels = value;
        this.queueUpdate({ fields: { labels: value } });
    }
    get project() {
        return this.data.fields.project;
    }
    get priority() {
        return this.data.fields.priority ? this.data.fields.priority.name : '';
    }
    get status() {
        return this.data.fields.status.name;
    }
    get summary() {
        return this.data.fields.summary;
    }
    set summary(value) {
        this.data.fields.summary = value;
        this.queueUpdate({ fields: { summary: value } });
    }
    get type() {
        return this.data.fields.issuetype.name;
    }
    get typeIcon() {
        const type = this.data.fields.issuetype.name.toLowerCase();
        if (type in TYPE_ICONS)
            return TYPE_ICONS[type];
        else
            return `❔(${this.data.fields.issuetype.name})`;
    }
    get url() {
        const base = url_1.parse(this.data.self);
        return `${base.protocol}://${base.hostname}/browse/${this.data.key}`;
    }
    // endregion
    addComment(comment) {
        this.queueUpdate({
            update: {
                comment: [{ add: { body: comment } }],
            },
        });
    }
    /**
     * Add a label to the existing labels array
     *
     * The primary reason for this method is to queue updates so that saving is
     * possible
     */
    addLabel(newLabelOrLabels) {
        this.labels = this.labels.concat(newLabelOrLabels);
    }
    /**
     * Assign this issue to the user
     *
     * Will search for a user and assign this issue to the found user. If more or
     * less than one user are found, then will not assign the issue and will
     * instead throw an error
     */
    async assignTo(query) {
        let users = await user_1.User.find(query);
        // If there is an exact match, then use that
        if (users.length > 1) {
            const directMatch = users.find(user => user.name === query);
            if (directMatch)
                users = [directMatch];
        }
        if (users.length > 1) {
            console.error('Ambiguous user:');
            for (const user of users)
                console.log(user.toString());
        }
        else if (users.length === 0) {
            console.error(`No users found for query: ${query}`);
        }
        else
            this.assignee = users[0];
    }
    /**
     * Determine if something is an issue
     *
     * @param issue The thing that might be an issue
     *
     * @return {boolean} True if it's an issue
     */
    static isIssue(issue) {
        return issue && /\w+-\d+/.test(issue.key);
    }
    /**
     * Determine if the input is JiraIssueSearchResults
     *
     * @param input The input to check
     */
    static isIssueSearchResults(input) {
        return input && Array.isArray(input.issues);
    }
    /** Queue in updates for the next save */
    queueUpdate(update) {
        this.pendingUpdate = ramda_1.merge(this.pendingUpdate, update);
    }
    /**
     * Removes one of the labels
     *
     * @param label The label or expression to remove. If you pass in a regular
     * expression, will remove all matching labels
     */
    removeLabel(labelOrRegex) {
        if (labelOrRegex instanceof RegExp) {
            this.labels = this.labels.filter(label => !labelOrRegex.test(label));
        }
        else {
            this.labels = this.labels.filter(label => label !== labelOrRegex);
        }
    }
    /**
     * Persist any changes back to JIRA
     *
     * If the no updates are queued, then this method will not save. Therefore, if
     * you have mutated any mutable properties such as arrays, you will need to
     * call their appropriate setters to enqueue updates
     */
    async save() {
        if (!this.dirty)
            return;
        await jira_1.jira.updateIssue(this.key, this.pendingUpdate);
    }
    /**
     * Set the fix version for an issue by searching for the version and assigning
     * the result to the issue
     *
     * If the version is not found, then an error will be thrown
     */
    async setFixVersion(search) {
        const versions = (await jira_1.jira.listVersions(this.project.key))
            .filter(version => version.name.indexOf(search) !== -1);
        if (versions.length === 0)
            console.error(`0 versions found for: ${search}`);
        else {
            this.fixVersions = versions;
        }
    }
    /** Output this as a string */
    toString(fields) {
        const selected = Array.isArray(fields) ?
            fields.reduce((result, field) => Object.assign(fields, { [field]: true }), {}) : fields || {};
        return `
      ${(selected.icon || selected.typeIcon) ? this.typeIcon : ''} ${selected.key ? this.key : ''} ${selected.summary ? this.summary : ''} ${(selected.status || selected.priority) ? `(${[
            selected.status && this.status,
            selected.priority && this.priority,
        ].filter(Boolean).join(', ')})` : ''} ${selected.labels ? `[${this.labels.join(', ')}]` : ''} ${(selected.assignee && this.assignee) ? `@${this.assignee.name}` : ''} ${selected.fix ? `fix: ${(this.fixVersions || []).map(v => v.name)}` : ''} ${selected.url ? this.url : ''}
    `
            .replace(/(^\s+|\s+$|\s(?=\s))/g, '');
    }
    /**
     * Transition an issue to a new status by looking up the transition that goes
     * to that status and performing said transition
     *
     * @param status Name of the new status
     */
    async transitionTo(status) {
        const results = await jira_1.jira.listTransitions(this.key);
        const re = new RegExp(status, 'i');
        const transitions = results.transitions.filter(t => re.test(t.to.name));
        if (transitions.length === 1) {
            this.data.fields.status = transitions[0].to;
            this.queueUpdate({ transition: { to: { id: transitions[0].id } } });
        }
        else if (transitions.length > 1) {
            console.log('Ambiguous transition');
            for (const transition of transitions) {
                const { name, to: { name: toName } } = transition;
                console.log(`  ${name} (--> ${toName})`);
            }
        }
        else {
            console.error(`No transition to status: ${status}`);
        }
    }
}
exports.Issue = Issue;
//# sourceMappingURL=issue.js.map