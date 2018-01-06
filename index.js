const Jira = require('jira-client');
const { mergeDeepRight } = require('ramda');
const { writeFile } = require('fs');
const { promisify } = require('util');
const config = require('./lib/config');
const { inspect } = require('util');

const writeFileP = promisify(writeFile);
const isRegex = text => /^\/.*\/$/.test(text);

const parseArguments = () => {
  const result = {
    fields: {
      labels: true,
      status: true,
      priority: true,
    },
  };

  for (let i = 2; i < process.argv.length; ++i) {
    const arg = process.argv[i];

    switch (arg) {
      case '--add-comment':
        result.comment = process.argv[++i];
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
        .reduce((result, field) => ({ ...result, [field]: true }), {});
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
        if (/^-/.test(process.argv[i + 1]))
          result.listStatus = true;
        else
          result.listStatus = process.argv[++i] || true;
        break;
      case '--list-transitions':
        if (/^-/.test(process.argv[i + 1]))
          result.listTransitions = true;
        else
          result.listTransitions = process.argv[++i] || true;
        break;
      case '--remove-label':
        result.removeLabel = process.argv[++i];
        break;
      case '--set-status':
        result.setStatus = process.argv[++i];
        break;
      case '--set-label':
        result.setLabel = process.argv[++i].split(',');
        break;
      case '--set-fix-version':
        result.fixVersion = process.argv[++i].split(',');
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
  if (result.host in config.hosts)
    Object.assign(result, config.hosts[result.host]);

  return result;
};

const options = parseArguments();

const {
  host,
  username,
  password,
} = options;

const jira = new Jira({
  protocol: 'https',
  host: host,
  username, password,
  apiVersion: '2',
  strictSSL: false
});

/** Main entry point */
class Application {
  /**
   * Determine if something is an issue
   *
   * @param {*} issue The thing that might be an issue
   *
   * @return {boolean} True if it's an issue
   */
  isIssue(issue) {
    return issue.key;
  }

  /**
   * Display a single JIRA issue
   *
   * @param {*} issue A JIRA issue
   */
  async handleIssue(issue) {
    const { key } = issue;
    const {
      summary,
      priority: { name: priority },
      issuetype: { name: type },
      labels
    } = issue.fields;
    const status = issue.fields.status.name;
    const icon = {
      bug: '🐞',
      story: '📗',
      improvement: '💡',
    }[type.toLowerCase()] || `❔(${type})`;

    if (options.comment)
      await jira.addComment(issue.key, options.comment);

    let line = `${icon}  ${key} ${summary}`;
    // Show status and priority
    line += ` (${
      [options.fields.status && status, options.fields.priority && priority]
      .filter(Boolean)
      .join(', ')
    })`.replace(' ()', '');
    // Show labels
    if (options.fields.labels) line += ` [${labels.join(', ')}]`;

    // Output the issue
    console.log(line);

    let updateIssue = {};

    // Set status
    if (options.setStatus) {
      updateIssue = mergeDeepRight(
        updateIssue, { fields: { status: options.setStatus } }
      );
    }
    // Set label
    if (options.setLabel) {
      updateIssue = mergeDeepRight(updateIssue, {
        fields: {
          labels: issue.fields.labels.concat(options.setLabel).filter(Boolean)
        }
      });
    }
    // Remove label
    if (options.removeLabel) {
      let removeLabel = options.removeLabel;
      const labels = (updateIssue.fields && updateIssue.fields.labels) ||
      issue.fields.labels;

      if (isRegex(removeLabel)) {
        removeLabel = new RegExp(removeLabel.substr(1, removeLabel.length - 2));
        updateIssue = mergeDeepRight(updateIssue, { fields: {
          labels: labels.filter(label => !removeLabel.test(label))
        } });
      }
      else {
        updateIssue = mergeDeepRight(updateIssue, { fields: {
          labels: labels.filter(label => label !== removeLabel)
        } });
      }
    }
    // Set fix version
    if (options.fixVersion) {
      updateIssue = mergeDeepRight(updateIssue, { fields: {
        fixVersions: options.fixVersion
      } });
    }

    if (options.listTransitions) {
      console.log('Transitions:');
      const results = await jira.listTransitions(issue.key);

      for (const transition of results.transitions) {
        const { name, to: { name: toName } } = transition;
        console.log(`  ${name} (--> ${toName})`);
      }
    }

    if (options.transitionTo) {
      const results = await jira.listTransitions(issue.key);
      const re = new RegExp(options.transitionTo, 'i');
      const transitions = results.transitions.filter(t => re.test(t.to.name));
      if (transitions.length === 1)
        await jira.transitionIssue(issue.key, { transition: transitions[0].id });

      else {
        console.log('Ambiguous transition');
        for (const transition of transitions) {
          const { name, to: { name: toName } } = transition;
          console.log(`  ${name} (--> ${toName})`);
        }
      }
    }

    // Update issue
    if (Object.keys(updateIssue).length)
      await jira.updateIssue(issue.key, updateIssue);
  }

  /**
   * Display the results on the screen
   *
   * @param {*} response Response from the JIRA request
   */
  async handleResponse(response) {
    if (response.total === 0) {
      console.log('0 results');
      return;
    }

    if (response.issues && response.issues.length) {
      for (const issue of response.issues)
        await this.handleIssue(issue);
      return;
    }

    if (response.key) {
      await this.handleIssue(response);
      return;
    }

    console.log(response);
  }

  /** Main entry point for the program */
  async run() {
    const showResults = async results => {
      await this.handleResponse(results);
      if (options.export)
        await writeFileP('export.json', JSON.stringify(results, null, '  '));
    };

    if (options.listProjects)
      await showResults(await jira.listProjects());

    if (options.search)
      await showResults(await jira.searchJira(options.search));

    if (options.issue)
      await showResults(await jira.findIssue(options.issue));

    if (options.listStatus) {
      const results = await jira.listStatus();
      for (const result of results)
        console.log(result.name);
    }
  }
}

new Application().run()
.catch(error => console.error(error.stack || error));
