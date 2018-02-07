"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jira_1 = require("./jira");
class Version {
    static createVersion(version) {
        return jira_1.jira.createVersion(version);
    }
}
exports.Version = Version;
//# sourceMappingURL=version.js.map