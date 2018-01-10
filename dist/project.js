"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Project {
    constructor(data) {
        this.data = data;
    }
    get id() {
        return this.data.id;
    }
    get key() {
        return this.data.key;
    }
    get name() {
        return this.data.name;
    }
    /**
     * Check to see if a piece of data is a JIRA project
     *
     * @param data The data to check for being a project
     */
    static isJiraProject(data) {
        return data && ('projectTypeKey' in data);
    }
}
exports.Project = Project;
//# sourceMappingURL=project.js.map