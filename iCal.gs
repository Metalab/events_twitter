function getICal() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('metalab-calendar');
  if (cached != null) {
    Logger.log('cached')
    return cached;
  }
  var result = UrlFetchApp.fetch('https://metalab.at/calendar/export/ical/', {muteHttpExceptions: true});
  var contents = result.getContentText();
  cache.put('metalab-calendar', contents, 60 * 60 * 2); // cache for 25 minutes
  return contents;
}

function getEventsForDate(date) {
  var ical = UrlFetchApp.fetch('https://metalab.at/calendar/export/ical/', {muteHttpExceptions: true}).getContentText();
  var vevents = ical.match(/(SUMMARY:[\s\S]*?)(?=END:VEVENT)/g);
  
  if(!(vevents instanceof Array) || !(date instanceof Date)) return [];
  
  var events = vevents.reduce(function(acc, vevent) {
    var event = vevent.match(/(\b[A-Z]+\b):(.+(?:\r\n\s.*)?)/g).reduce(function(cca, keyValue) {
      //Logger.log(arguments);
      var key = keyValue.split(':')[0];
      var value = keyValue.split(':').slice(1).join(':')
        .replace(/\\([,;:])/g, '$1')
        .replace(/(?:\r?\n|\r)\s/, '');
      
      if(/^DT\w+/.test(key) && /\d{8}T\d{6}/.test(value)) {
        value = new Date(value.replace(/(\d{2})(\d{2})T(\d{2})(\d{2})/, '-$1-$2T$3:$4:'));
      }
      else if(key == "URL" && value) {
        try{
          value = decodeURIComponent(value).replace(/\s/g, '_');
          if(value.split('://').length > 2) {
            var protoIndex = value.lastIndexOf('://');
            value = value.slice(0, protoIndex).split('/').slice(-1) + value.slice(protoIndex);
          }
        }
        catch(e) {
          console.log('%s: %s [%s]', e.name, e.message, value);
        }
      }
      
      cca[key.toLowerCase()] = value;
      return cca;
     
    }, {});
    
    // Filter out private events
    if(event.dtstart.toDateString() == date.toDateString() && event['class'] == 'PUBLIC') {
      acc.push(event);
    }
    
    return acc;
  
  }, []);
  
  Logger.log('Total events: ' + events.length);
  events.forEach(function(event) {
    Logger.log(event.summary + ' - ' + event.dtstart.toDateString());
  });
  
  return events;
}

function tweetEvents(e) {
  
  var date = e instanceof Date ? e : new Date(),
      months = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
      maxLength = 280,
      events = getEventsForDate(date);
  
  for(i in events)
  {
    var prefix = (date.getDate() == new Date().getDate()) ? "Heute " : "Am " + days[date.getDay()] + ", " + date.getDate() + ". " + months[date.getMonth()] + " ";
    var text = prefix + "@MetalabVie: " +
      events[i].summary + ", " + 
      Utilities.formatDate(events[i].dtstart, Session.getScriptTimeZone(), "HH:mm") + 
      (events[i].dtend ? " – " + Utilities.formatDate(events[i].dtend, Session.getScriptTimeZone(), "HH:mm") : "") + ". " +
      (events[i].description ? events[i].description + " " : "");
    if(text.length > maxLength) text = text.substr(0, (maxLength - 2)) + "… ";
    text += events[i].url;
    Logger.log(text);
    // twitter('post', 'statuses/update.json', { status: text });
    tweet(text)
  }
}

function eventsAfterTomorrow() {
  var date = new Date();
  date.setDate(date.getDate()+2)
  tweetEvents(date);
}

function eventsNextWeek() {
  var date = new Date();
  date.setDate(date.getDate()+7)
  tweetEvents(date);
}

function test() {
  var date = new Date();
  getEventsForDate(date);
}