"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const util_1 = require("util");
/**
 * Class to help with the logging to debug and optionally other streams
 */
class Logger {
    constructor(namespace) {
        this.namespace = namespace;
        this._logger = {
            debug: debug(`${Logger.prefix}${namespace}:debug`),
            error: debug(`${Logger.prefix}${namespace}:error`),
            info: debug(`${Logger.prefix}${namespace}:info`),
            log: debug(`${Logger.prefix}${namespace}:log`),
            warn: debug(`${Logger.prefix}${namespace}:warn`),
        };
    }
    /** Add a write stream that logs should be written to */
    static addStream(stream) {
        this._writeStreams.push(stream);
    }
    /** Log debugging information
     *
     * @param message The message to log
     * @param ...rest The arguments to append
     */
    debug(message, ...rest) {
        this._log(this._logger.debug, message, ...rest);
    }
    /** Log an error message
     *
     * @param message The message to log
     * @param ...rest The arguments to append
     */
    error(message, ...rest) {
        this._log(this._logger.error, message, ...rest);
    }
    /** Log a verbose message
     *
     * @param message The message to log
     * @param ...rest The arguments to append
     */
    info(message, ...rest) {
        this._log(this._logger.info, message, ...rest);
    }
    /** Actually log the message
     *
     * @param message The message to log
     * @param ...rest The arguments to append
     */
    _log(logger, message, ...rest) {
        logger(message, ...rest);
        if (logger.enabled) {
            const formatted = `${new Date()} [${this.namespace}] ${util_1.format(message, ...rest)}`;
            for (const stream of Logger._writeStreams)
                stream.write(formatted);
        }
    }
    /** Log a message with the default log type
     *
     * @param message The message to log
     * @param ...rest The arguments to append
     */
    log(message, ...rest) {
        this._log(this._logger.log, message, ...rest);
    }
    /** Set prexfix
     *
     * @param value The prefix string
     */
    static setNamespacePrefix(value) {
        Logger.prefix = value;
    }
    /** Log a warning message
     *
     * @param message The message to log
     * @param ...rest The arguments to append
     */
    warn(message, ...rest) {
        this._log(this._logger.warn, message, ...rest);
    }
}
Logger.prefix = '';
/** The streams that loggers ALSO append to */
Logger._writeStreams = [];
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map