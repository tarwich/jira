"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const util_1 = require("util");
const issue_1 = require("./issue");
const jira_1 = require("./jira");
const config_1 = require("./lib/config");
const project_1 = require("./project");
const transition_1 = require("./transition");
const user_1 = require("./user");
const logger_1 = require("./logger");
const punycode_1 = require("punycode");
const version_1 = require("./version");
const log = new logger_1.Logger('index');
const writeFileP = util_1.promisify(fs_1.writeFile);
const isRegex = (text) => /^\/.*\/$/.test(text);
const toRegex = (text, options = 'i') => new RegExp(text.replace(/(^\/|\/$)/g, ''), options);
const parseArguments = () => {
    const result = {
        /** Fields to show when listing issues */
        fields: {
            assignee: true,
            key: true,
            labels: true,
            priority: true,
            status: true,
            summary: true,
            typeIcon: true,
        },
    };
    for (let i = 2; i < process.argv.length; ++i) {
        const arg = process.argv[i];
        switch (arg) {
            case '--add-comment':
                result.comment = process.argv[++i];
                break;
            case '--add-fields':
                result.fields = process.argv[++i].split(',')
                    .reduce((fields, field) => (Object.assign({}, fields, { [field]: true })), result.fields);
                break;
            case '--add-label':
                result.addLabel = process.argv[++i].split(',');
                break;
            case '--assign':
            case '--assign-to':
                result.assign = process.argv[++i];
                break;
            case '--create-version':
                result.createVersion = process.argv[++i];
                break;
            case '--username':
            case '--user':
            case '-u':
                result.username = process.argv[++i];
                break;
            case '--password':
            case '--pass':
            case '-p':
                result.password = process.argv[++i];
                break;
            case '--host':
                result.host = process.argv[++i];
                break;
            case '--fields':
                result.fields = process.argv[++i].split(',')
                    .reduce((result, field) => (Object.assign({}, result, { [field]: true })), {
                    assignee: false,
                    fix: false,
                    key: false,
                    labels: false,
                    priority: false,
                    status: false,
                    summary: false,
                    type: false,
                    typeIcon: false,
                });
                break;
            case '--filter':
                result.filter = toRegex(process.argv[++i]);
                break;
            case '--issue':
                result.issue = process.argv[++i];
                break;
            case '--query':
            case '--search':
                result.search = process.argv[++i];
                break;
            case '--list-projects':
                result.listProjects = true;
                break;
            case '--list-status':
                result.listStatus = true;
                break;
            case '--list-versions':
                result.listVersions = process.argv[++i];
                break;
            case '--list-transitions':
                result.listTransitions = true;
                break;
            case '--list-users':
                result.listUsers = process.argv[++i];
                break;
            case '--remove-label':
                result.removeLabel = process.argv[++i];
                break;
            case '--set-fix':
                result.fixVersion = process.argv[++i];
                break;
            case '--set-labels':
                result.setLabels = process.argv[++i].split(',');
                break;
            case '--set-release-version':
                result.setReleaseVersion = process.argv[++i];
                break;
            case '--transition-to':
                result.transitionTo = process.argv[++i];
                break;
            case '--export':
                result.export = true;
                break;
            case '--help':
                console.log(`usage: ${process.argv.slice(0, 2).join(' ')}`);
                console.log('options:');
                console.log('  --host <host> The server to connect to');
                console.log('  --user <user> The user you use to access JIRA');
                console.log('  --pass <password> The password you use to access JIRA');
                console.log('  --search <query> JQL query');
                console.log('  --export Save results to disk');
                console.log('  --list-projects List the projects');
                console.log('  --list-transitions List the transitions');
                console.log('  --list-status List the statuses');
                console.log('  --issue <key> Find one issue');
                console.log('  --comment <message> Add a comment to an issue');
                break;
            default:
                console.error(`Argument ${arg} not recognized`);
        }
    }
    // If there is a host entry and a host provided on the cli, then we're going to
    // load the details from that
    if (result.host && result.host in config_1.config.hosts) {
        Object.assign(result, config_1.config.hosts[result.host]);
    }
    log.debug('options %o', result);
    return result;
};
const options = parseArguments();
/** Main entry point */
class Application {
    async connect() {
        const { host, username, password, } = options;
        if (!host || !username || !password) {
            console.error(`Unable to connect`);
            process.exit(1);
            return;
        }
        return jira_1.jira.connect({
            host: host,
            username, password,
        });
    }
    /**
     * Display a single JIRA issue
     *
     * @param issue JIRA data for an issue
     */
    async handleIssue(issue) {
        if (options.comment)
            issue.addComment(options.comment);
        console.log(issue.toString(options.fields));
        // Add label
        if (options.addLabel)
            issue.addLabel(options.addLabel);
        // Set labels
        if (options.setLabels)
            issue.labels = options.setLabels;
        // Remove label
        if (options.removeLabel) {
            if (isRegex(options.removeLabel)) {
                issue.removeLabel(toRegex(options.removeLabel));
            }
            else
                issue.removeLabel(options.removeLabel);
        }
        // Set fix version
        if (options.fixVersion)
            await issue.setFixVersion(options.fixVersion);
        // List transitions
        if (options.listTransitions) {
            const results = await transition_1.Transition.loadForIssue(issue);
            console.log('Transitions:');
            for (const transition of results.transitions) {
                const { name, to: { name: toName } } = transition;
                console.log(`  ${name} (--> ${toName})`);
            }
        }
        // Perform transition
        if (options.transitionTo)
            await issue.transitionTo(options.transitionTo);
        // Assign issue
        if (options.assign)
            await issue.assignTo(options.assign);
        // Update issue
        if (issue.dirty) {
            await issue.save();
            console.log(issue.toString(options.fields));
        }
    }
    /**
     * Handle a project response
     *
     * @param project The project to handle
     */
    async handleProject(project) {
        console.log(`${project.key} - ${project.name}`);
    }
    /**
     * Display the results on the screen
     *
     * @param {*} response Response from the JIRA request
     */
    async handleResponse(response) {
        if (options.export) {
            await writeFileP('export.json', JSON.stringify(response, null, '  '));
        }
        if (Array.isArray(response)) {
            for (const item of response) {
                if (project_1.Project.isJiraProject(item))
                    this.handleProject(new project_1.Project(item));
                else
                    this.handleVersion(item);
            }
        }
        else if (project_1.Project.isJiraProject(response)) {
            this.handleProject(new project_1.Project(response));
        }
        else if (issue_1.Issue.isIssueSearchResults(response)) {
            let issues = response.issues.map(issue => new issue_1.Issue(issue));
            if (options.filter) {
                const re = options.filter;
                issues = issues.filter(issue => re.test(issue.toString(options.fields)));
            }
            if (response.total === 0)
                console.log('0 issues found');
            for (const issue of issues) {
                await this.handleIssue(issue);
            }
        }
        else if (issue_1.Issue.isIssue(response)) {
            if (options.filter) {
                if (options.filter.test(new issue_1.Issue(response).toString(options.fields))) {
                    await this.handleIssue(new issue_1.Issue(response));
                }
            }
            else
                await this.handleIssue(new issue_1.Issue(response));
        }
        else {
            console.log(response);
        }
    }
    /** Performe specified actions on a user result */
    async handleUser(user) {
        console.log(user.toString(['name', 'displayName', 'emailAddress']));
    }
    /** Print out a version */
    async handleVersion(version) {
        const { archived: isArchived, name, released: isReleased } = version;
        const archived = isArchived ? 'archived' : '';
        const released = isReleased ? 'released' : '';
        console.log(`${name} (${[released, archived].filter(Boolean).join(' ')})`
            .replace(/\(\)/, ''));
    }
    /** Main entry point for the program */
    async run() {
        await this.connect();
        if (options.createVersion) {
            await version_1.Version.createVersion({
                name: options.createVersion,
            });
            console.log('Created version: %o', punycode_1.version);
        }
        if (options.listProjects) {
            await this.handleResponse(await jira_1.jira.listProjects());
        }
        if (options.search) {
            await this.handleResponse(await jira_1.jira.searchJira(options.search));
        }
        if (options.issue) {
            await this.handleResponse(await jira_1.jira.findIssue(options.issue));
        }
        if (options.listVersions) {
            await this.handleResponse(await jira_1.jira.listVersions(options.listVersions));
        }
        if (options.listStatus) {
            const results = await jira_1.jira.listStatus();
            for (const result of results)
                console.log(result.name);
        }
        if (options.listUsers !== undefined) {
            const result = await user_1.User.find(options.listUsers);
            if (result.length === 0)
                console.log('0 users found');
            else
                result.forEach(user => this.handleUser(new user_1.User(user)));
        }
    }
}
new Application().run()
    .catch(error => {
    if (error && error.error && error.error.errorMessages) {
        console.log(error.error.errorMessages.join('\n\n'));
    }
    else
        console.error(error.stack || error);
});
//# sourceMappingURL=index.js.map