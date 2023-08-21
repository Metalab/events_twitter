// Add OAuth2 library to the project: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF

/**
 * Authorizes and makes a request to the Twitter API.
 */
/**
 * Authorizes and makes a request to the Twitter API v2
 * OAuth 2.0 Making requests on behalf of users
 * https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
 */
function tweet(text) {
  var service = getService_();
  if (service.hasAccess()) {
    var response = UrlFetchApp.fetch('https://api.twitter.com/2/tweets', {
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      method: 'POST',
      muteHttpExceptions: true,
      payload: JSON.stringify({ text })
    });
    Logger.log('Result: %j', response);
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  getService_().reset();
}

/**
 * Configures the service.
 */
function getService_() {
  var scriptProps = PropertiesService.getScriptProperties();
  var userProps = PropertiesService.getUserProperties();
  var clientId = scriptProps.getProperty('CLIENT_ID');
  var clientSecret = scriptProps.getProperty('CLIENT_SECRET');
  return OAuth2.createService('Twitter')
  // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
      .setTokenUrl('https://api.twitter.com/2/oauth2/token')

  // Set the client ID and secret.
      .setClientId(clientId)
      .setClientSecret(clientSecret)

  // Set the name of the callback function that should be invoked to
  // complete the OAuth flow.
      .setCallbackFunction('authCallback')
      .generateCodeVerifier()

  // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(userProps)

  // Set the scopes to request (space-separated for Twitter services).
      .setScope(['offline.access', 'users.read', 'tweet.read', 'tweet.write'].join(' '))

      .setTokenHeaders({
        'Authorization': 'Basic ' + Utilities.base64Encode(`${clientId}:${clientSecret}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      });
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService_();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}