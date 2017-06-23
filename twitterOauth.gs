// https://dev.twitter.com/oauth/overview/creating-signatures
function tweet(message) {
  
  var method = "POST";
  var baseUrl = "https://api.twitter.com/1.1/statuses/update.json";
  var props = PropertiesService.getScriptProperties();
  
  var oauthParameters = {
    oauth_consumer_key: props.getProperty('CONSUMER_KEY'),
    oauth_token: props.getProperty('ACCESS_TOKEN'),
    oauth_timestamp: (Math.floor((new Date()).getTime() / 1000)).toString(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0"
  };
  
  oauthParameters.oauth_nonce = oauthParameters.oauth_timestamp + Math.floor( Math.random() * 100000000);
  
  var payload = {
    status: message
  };
  
  var queryKeys = Object.keys(oauthParameters).concat(Object.keys(payload)).sort();
  
  var baseString = queryKeys.reduce(function(acc, key, idx) {
    if(idx) acc += encodeURIComponent("&");
    if(oauthParameters.hasOwnProperty(key))
      acc += encode(key+"="+oauthParameters[key]);
    else if(payload.hasOwnProperty(key))
      acc += encode(key+"="+encode(payload[key]));
    return acc;
  }, method.toUpperCase()+'&'+encode(baseUrl)+'&');
  
  oauthParameters.oauth_signature = Utilities.base64Encode(
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_1,
      baseString,
      props.getProperty('CONSUMER_SECRET')+'&'+props.getProperty('ACCESS_SECRET')
    )
  );
  
  var options = {
    method: method,
    headers: {
      authorization: "OAuth " + Object.keys(oauthParameters).sort().reduce(function(acc, key){
        acc.push(key+'="'+encode(oauthParameters[key])+'"');
        return acc;
      },[]).join(', ')
    },
    payload: Object.keys(payload).reduce(function(acc, key){
      acc.push(key+'='+encode(payload[key]));
      return acc;
    },[]).join('&'),
    muteHttpExceptions: true
  }
  
  var response = UrlFetchApp.fetch(baseUrl, options);
  var responseHeader = response.getHeaders();
  var responseText = response.getContentText();
  Logger.log(responseText);
}

function encode(string){
  return encodeURIComponent(string)
    .replace('!','%21')
    .replace('*','%2A')
    .replace('(','%28')
    .replace(')','%29')
    .replace("'",'%27');
}
