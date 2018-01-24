import * as debug from 'debug';
import { IDebugger } from 'debug';
import { format } from 'util';

/** Need to find a way to store this in the config that also works on the client */
interface IWritable {
  write(data: string): void;
}

/**
 * Class to help with the logging to debug and optionally other streams
 */
export class Logger {
  /** All the individual loggers for this instance */
  private _logger: {
    debug: debug.IDebugger;
    error: debug.IDebugger;
    info: debug.IDebugger;
    log: debug.IDebugger;
    warn: debug.IDebugger;
  };

  static prefix: string = '';

  /** The streams that loggers ALSO append to */
  private static _writeStreams: IWritable[] = [];

  constructor(public namespace: string) {
    this._logger = {
      debug: debug(`${Logger.prefix}${namespace}:debug`),
      error: debug(`${Logger.prefix}${namespace}:error`),
      info: debug(`${Logger.prefix}${namespace}:info`),
      log: debug(`${Logger.prefix}${namespace}:log`),
      warn: debug(`${Logger.prefix}${namespace}:warn`),
    };
  }

  /** Add a write stream that logs should be written to */
  static addStream(stream: IWritable) {
    this._writeStreams.push(stream);
  }

  /** Log debugging information
   *
   * @param message The message to log
   * @param ...rest The arguments to append
   */
  debug(message: any, ...rest: any[]) {
    this._log(this._logger.debug, message, ...rest);
  }

  /** Log an error message
   *
   * @param message The message to log
   * @param ...rest The arguments to append
   */
  error(message: any, ...rest: any[]) {
    this._log(this._logger.error, message, ...rest);
  }

  /** Log a verbose message
   *
   * @param message The message to log
   * @param ...rest The arguments to append
   */
  info(message: any, ...rest: any[]) {
    this._log(this._logger.info, message, ...rest);
  }

  /** Actually log the message
   *
   * @param message The message to log
   * @param ...rest The arguments to append
   */
  private _log(logger: IDebugger, message: any, ...rest: any[]) {
    logger(message, ...rest);

    if (logger.enabled) {
      const formatted = `${new Date()} [${this.namespace}] ${format(
        message,
        ...rest,
      )}`;
      for (const stream of Logger._writeStreams) stream.write(formatted);
    }
  }

  /** Log a message with the default log type
   *
   * @param message The message to log
   * @param ...rest The arguments to append
   */
  log(message: any, ...rest: any[]) {
    this._log(this._logger.log, message, ...rest);
  }

  /** Set prexfix
   *
   * @param value The prefix string
   */
  static setNamespacePrefix(value: string) {
    Logger.prefix = value;
  }

  /** Log a warning message
   *
   * @param message The message to log
   * @param ...rest The arguments to append
   */
  warn(message: any, ...rest: any[]) {
    this._log(this._logger.warn, message, ...rest);
  }
}
