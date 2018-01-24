import { resolve } from 'path';
import { assocPath, keys, mergeDeepRight, reduce } from 'ramda';
import { Logger } from "../logger";

const log = new Logger('config');

/**
 * Attempts to require a path, and doesn't crash if an error occurs
 *
 * @param {string} path The path to require
 *
 * @return {object} Always an object, regardless of whether the require failed
 */
function softRequire(path: string) {
  try {
    return require(resolve(path));
  }
  catch (error) {
    return {};
  }
}

export const config = reduce(mergeDeepRight, {}, [
  softRequire(resolve(__dirname, '../../config')),
  softRequire(resolve(__dirname, '../../config.local')),
  reduce(
    (data: object, key: string) => assocPath(key.split('.'), process.env[key], data),
    {},
    keys(process.env),
  ),
]) as any;

log.debug('configuration loaded');
log.debug(config);
