"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JiraApi = require("jira-client");
const ramda_1 = require("ramda");
const ERROR_NOT_CONNECTED = 'Not connected to JIRA yet';
class Jira {
    constructor() {
        /** Find users in the system */
        this.searchUsers = ramda_1.memoize(async (options) => {
            if (!this.jira)
                throw new Error(ERROR_NOT_CONNECTED);
            return this.jira.searchUsers(options);
        });
    }
    /**
     * Connect to a JIRA instance
     */
    async connect(options) {
        this.jira = new JiraApi(Object.assign({ protocol: 'https', apiVersion: '2', strictSSL: false }, options));
    }
    addComment(issueId, comment) {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.addComment(issueId, comment);
    }
    findIssue(issueNumber) {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.findIssue(issueNumber);
    }
    /**
     * Get all the available projects in JIRA
     */
    listProjects() {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.listProjects();
    }
    /** List all the statuses on the server */
    listStatus() {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.listStatus();
    }
    /** List the available transitions for an issue */
    listTransitions(issueId) {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.listTransitions(issueId);
    }
    /** List all versions for a project */
    listVersions(project) {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.getVersions(project);
    }
    /** Execute a JQL search */
    searchJira(searchString) {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.searchJira(searchString);
    }
    /** Perform the specified transition on an issue */
    transitionIssue(issueId, transition) {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        this.jira.transitionIssue(issueId, transition);
    }
    /** Persist issue changes to JIRA */
    async updateIssue(issueId, update) {
        if (!this.jira)
            throw new Error(ERROR_NOT_CONNECTED);
        return this.jira.updateIssue(issueId, update);
    }
}
exports.jira = new Jira();
//# sourceMappingURL=jira.js.map