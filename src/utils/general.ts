/**
 * @file utils/general.ts
 * @description Utility functions for general purposes.
 * @note This code is taken from a boiler-plate created by Monde Sineke.
 * @author Your Name
 */

/**
 * Extracts the value of the 'id' parameter from the current page's URL query string.
 *
 * @returns {string | null} The value of the 'id' parameter if present; otherwise, null.
 *
 * @example
 * // If the URL is: https://example.com/page?foo=bar&id=123
 * const id = getIdFromUrl();
 * // id === "123"
 */
export function getIdFromUrl() {
  /**
   * Extracts the 'id' parameter from the URL's query string.
   * @url https://mollify.noroff.dev/content/feu1/javascript-1/module-5/api-advanced/url-parameters?nav=
   */
  const parameterString = window.location.search;

  /**
   * Creates a URLSearchParams object to work with the query parameters.
   */
  const searchParameters = new URLSearchParams(parameterString);

  /**
   * Retrieves the value of the 'id' parameter from the query string above.
   * @type {string | null}
   */
  const id = searchParameters.get('id');

  return id;
}
