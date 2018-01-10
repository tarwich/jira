"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = require("ramda");
const jira_1 = require("./jira");
class Transition {
}
Transition.loadForIssue = ramda_1.memoize(async (issue) => jira_1.jira.listTransitions(issue.key));
exports.Transition = Transition;
//# sourceMappingURL=transition.js.map