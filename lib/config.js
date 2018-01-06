const { resolve } = require('path');
const { assocPath, keys, mergeDeepRight, reduce } = require('ramda');

/**
 * Attempts to require a path, and doesn't crash if an error occurs
 *
 * @param {string} path The path to require

 * @return {object} Always an object, regardless of whether the require failed
 */
function softRequire(path) {
  try {
    return require(resolve(path));
  }
  catch (error) {
    return {};
  }
}

module.exports = reduce(mergeDeepRight, {}, [
  softRequire('config'),
  softRequire('config.local'),
  reduce(
    (data, key) => assocPath(key.split('.'), process.env[key], data),
    {},
    keys(process.env),
  ),
]);
