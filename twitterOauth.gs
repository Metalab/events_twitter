// https://dev.twitter.com/oauth/overview/creating-signatures
function twitter(method, endpoint, payload) {
  
  var method = method.toUpperCase() || 'POST';
  var url = 'https://api.twitter.com/1.1/' + (endpoint || 'statuses/update.json');
  var props = PropertiesService.getScriptProperties();
  
  var oauthParameters = {
    oauth_consumer_key: props.getProperty('CONSUMER_KEY'),
    oauth_token: props.getProperty('ACCESS_TOKEN'),
    oauth_nonce: Math.random().toString(36).replace(/[^a-z]/, '').substr(2),
    oauth_timestamp: (Math.floor((new Date()).getTime() / 1000)).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0'
  };
  
  var queryKeys = Object.keys(oauthParameters).concat(Object.keys(payload)).sort();
  
  var baseString = queryKeys.reduce(function(acc, key, idx) {
    if(idx) acc += encodeURIComponent('&');
    if(oauthParameters.hasOwnProperty(key))
      acc += encode(key + '=' + oauthParameters[key]);
    else if(payload.hasOwnProperty(key))
      acc += encode(key + '=' + encode(payload[key]));
    return acc;
  }, method + '&' + encode(url) + '&');
  
  oauthParameters.oauth_signature = Utilities.base64Encode(
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_1,
      baseString,
      props.getProperty('CONSUMER_SECRET') + '&' + props.getProperty('ACCESS_SECRET')
    )
  );
  
  var options = {
    method,
    contentType: 'application/json',
    headers: {
      authorization: 'OAuth ' + queryString(oauthParameters, ', ')
    },
    muteHttpExceptions: true
  }
  var query = queryString(payload);

  if(method == 'GET') {
    url += '?' + query;
  }
  else {
    options.payload = query;
  }

  Logger.log('URL: ' + url);
  Logger.log('Fetch options: ' + JSON.stringify(options));
  
  var response = UrlFetchApp.fetch(url, options);
  var responseHeaders = response.getHeaders();
  var responseText = response.getContentText() //JSON.parse(response.getContentText());

  Logger.log('Response headers: %j', responseHeaders);
  Logger.log('Response text: %j', responseText);

  if (responseText.errors) {
    throw new Error(responseText.errors[0]?.message);
  }
}

function queryString(object, separator) {
  return Object.keys(object).map(function(key){
    return key + '=' + encode(object[key]);
  }).join(separator || '&');
}

function encode(string){
  return encodeURIComponent(string)
    .replace(/[('*!)]/g, function(m) {
      return '%' + m.charCodeAt(0).toString(16).toUpperCase()
    });
    /*.replace('!','%21')
    .replace('*','%2A')
    .replace('(','%28')
    .replace(')','%29')
    .replace("'",'%27');*/
}

function replies() {
  twitter('GET', 'search/tweets.json', {to: 'metalab_events'});
}