import { writeFile } from 'fs';
import { JiraIssue, JiraIssueSearchResults, JiraProject, JiraVersion } from 'jira-client';
import { promisify } from 'util';
import { Issue } from './issue';
import { jira } from './jira';
import { config } from './lib/config';
import { Project } from './project';
import { Transition } from './transition';
import { User } from './user';
import { Logger } from './logger';
import { version } from 'punycode';
import { Version } from './version';

const log = new Logger('index');
const writeFileP = promisify(writeFile);
const isRegex = (text: string) => /^\/.*\/$/.test(text);
const toRegex = (text: string, options = 'i') =>
  new RegExp(text.replace(/(^\/|\/$)/g, ''), options);

interface IOptions {
  // Connection information
  //

  /** The username for logging into JIRA */
  username?: string;
  /** The password for logging into JIRA */
  password?: string;
  /** The JIRA url */
  host?: string;

  // Actions
  //

  /** The version to create */
  createVersion?: string;
  /** The JQL query to send to JIRA */
  search?: string;
  /** Specific issue key to work with */
  issue?: string;
  /** List the projects on the server */
  listProjects?: boolean;
  /** List all available statuses */
  listStatus?: boolean;
  /** List the versions on the server */
  listVersions?: string;
  /** List all available transitions for each  */
  listTransitions?: boolean;
  /** Search for users */
  listUsers?: string;
  /** True if we should export the found items */
  export?: boolean;

  // Issue modifications
  //

  /** The label to add to the results */
  addLabel?: string[];
  /** Assign the issue to this user */
  assign?: string;
  /** The comment to add to the results */
  comment?: string;
  /** A filter to filter issue results from the server */
  filter?: RegExp;
  /** Set the fix version for this issue */
  fixVersion?: string;
  /** Label to remove from the issue labels */
  removeLabel?: string;
  /** Set the labels for an issue */
  setLabels?: string[];
  /** Set the release version for this issue */
  setReleaseVersion?: string;
  /** Transition to a particular status */
  transitionTo?: string;

  /** Fields to show when listing issues */
  fields: {[key: string]: boolean};
}

const parseArguments = () => {
  const result: IOptions = {
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
      case '--add-field':
      case '--add-fields':
        result.fields = process.argv[++i].split(',')
        .reduce((fields, field) => ({...fields, [field]: true}), result.fields);
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
        .reduce((result, field) => ({ ...result, [field]: true }), {
          assignee: false,
          fix: false,
          key: false,
          labels: false,
          priority: false,
          status: false,
          summary: false,
          type: false,
          typeIcon: false,
        } as IOptions['fields']);
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
      case '--unassign':
        result.assign = '';
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
  if (result.host && result.host in config.hosts) {
    Object.assign(result, config.hosts[result.host]);
  }

  log.debug('options %o', result);

  return result;
};

const options = parseArguments();

/** Main entry point */
class Application {
  async connect() {
    const {
      host,
      username,
      password,
    } = options;

    if (!host || !username || !password) {
      console.error(`Unable to connect`);
      process.exit(1);
      return;
    }

    return jira.connect({
      host: host,
      username, password,
    });
  }

  /**
   * Display a single JIRA issue
   *
   * @param issue JIRA data for an issue
   */
  async handleIssue(issue: Issue) {
    if (options.comment) issue.addComment(options.comment);

    console.log(issue.toString(options.fields));

    // Add label
    if (options.addLabel) issue.addLabel(options.addLabel);

    // Set labels
    if (options.setLabels) issue.labels = options.setLabels;

    // Remove label
    if (options.removeLabel) {
      if (isRegex(options.removeLabel)) {
        issue.removeLabel(toRegex(options.removeLabel));
      }
      else issue.removeLabel(options.removeLabel);
    }

    // Set fix version
    if (options.fixVersion) await issue.setFixVersion(options.fixVersion);

    // List transitions
    if (options.listTransitions) {
      const results = await Transition.loadForIssue(issue);
      console.log('Transitions:');

      for (const transition of results.transitions) {
        const { name, to: { name: toName }, id } = transition;
        console.log(`  ${name} --> ${toName} (#${id})`);
      }
    }

    // Perform transition
    if (options.transitionTo) await issue.transitionTo(options.transitionTo);

    // Assign issue
    if (options.assign !== undefined) await issue.assignTo(options.assign);

    // Update issue
    if (issue.dirty) {
      await issue.save();
      console.log('💾', issue.toString(options.fields));
    }
  }

  /**
   * Handle a project response
   *
   * @param project The project to handle
   */
  async handleProject(project: Project) {
    console.log(`${project.key} - ${project.name}`);
  }

  /**
   * Display the results on the screen
   *
   * @param {*} response Response from the JIRA request
   */
  async handleResponse(response: JiraProject[] | JiraVersion[] | JiraIssueSearchResults | JiraIssue) {
    if (options.export) {
      await writeFileP('export.json', JSON.stringify(response, null, '  '));
    }

    if (Array.isArray(response)) {
      for (const item of response) {
        if (Project.isJiraProject(item)) this.handleProject(new Project(item));
        else this.handleVersion(item);
      }
    }

    else if (Project.isJiraProject(response)) {
      this.handleProject(new Project(response));
    }

    else if (Issue.isIssueSearchResults(response)) {
      let issues = response.issues.map(issue => new Issue(issue));

      if (options.filter) {
        const re = options.filter;
        issues = issues.filter(issue => re.test(issue.toString(options.fields)));
      }

      if (response.total === 0) console.log('0 issues found');

      for (const issue of issues) {
        await this.handleIssue(issue);
      }
    }

    else if (Issue.isIssue(response)) {
      if (options.filter) {
        if (options.filter.test(new Issue(response).toString(options.fields))) {
          await this.handleIssue(new Issue(response));
        }

      } else await this.handleIssue(new Issue(response));
    }

    else {
      console.log(response);
    }
  }

  /** Performe specified actions on a user result */
  async handleUser(user: User) {
    console.log(user.toString(['name', 'displayName', 'emailAddress']));
  }

  /** Print out a version */
  async handleVersion(version: JiraVersion) {
    const {archived: isArchived, name, released: isReleased} = version;

    const archived = isArchived ? 'archived' : '';
    const released = isReleased ? 'released' : '';

    console.log(
      `${name} (${[released, archived].filter(Boolean).join(' ')})`
      .replace(/\(\)/, ''),
    );
  }

  /** Main entry point for the program */
  async run() {
    await this.connect();

    if (options.createVersion) {
      await Version.createVersion({
        name: options.createVersion,
      });
      console.log('Created version: %o', version);
    }

    if (options.listProjects) {
      await this.handleResponse(await jira.listProjects());
    }

    if (options.search) {
      await this.handleResponse(await jira.searchJira(options.search));
    }

    if (options.issue) {
      await this.handleResponse(await jira.findIssue(options.issue));
    }

    if (options.listVersions) {
      await this.handleResponse(await jira.listVersions(options.listVersions));
    }

    if (options.listStatus) {
      const results = await jira.listStatus();
      for (const result of results) console.log(result.name);
    }

    if (options.listUsers !== undefined) {
      const result = await User.find(options.listUsers);

      if (result.length === 0) console.log('0 users found');
      else result.forEach(user => this.handleUser(new User(user)));
    }
  }
}

new Application().run()
.catch(error => {
  if (error && error.error && error.error.errorMessages) {
    console.log(error.error.errorMessages.join('\n\n'));
  }
  else console.error(error.stack || error);
});
