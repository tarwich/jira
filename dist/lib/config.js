"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const ramda_1 = require("ramda");
const logger_1 = require("../logger");
const log = new logger_1.Logger('config');
/**
 * Attempts to require a path, and doesn't crash if an error occurs
 *
 * @param {string} path The path to require
 *
 * @return {object} Always an object, regardless of whether the require failed
 */
function softRequire(path) {
    try {
        return require(path_1.resolve(path));
    }
    catch (error) {
        return {};
    }
}
exports.config = ramda_1.reduce(ramda_1.mergeDeepRight, {}, [
    softRequire(path_1.resolve(__dirname, '../../config')),
    softRequire(path_1.resolve(__dirname, '../../config.local')),
    ramda_1.reduce((data, key) => ramda_1.assocPath(key.split('.'), process.env[key], data), {}, ramda_1.keys(process.env)),
]);
log.debug('configuration loaded');
log.debug(exports.config);
//# sourceMappingURL=config.js.map