function getEventsForDate(date) {

  var ical = UrlFetchApp.fetch('https://metalab.at/calendar/export/ical/', {muteHttpExceptions: true}).getContentText();
  var vevents = ical.match(/(SUMMARY:[\s\S]*?)(?=END:VEVENT)/g);
  
  if(!(vevents instanceof Array) || !(date instanceof Date)) return [];
  
  var events = vevents.reduce(function(acc, vevent) {
    var event = vevent.match(/(\b[A-Z]+\b):(.+(?:\n\s.*)?)/g).reduce(function(cca, keyValue) {
    
      var key = keyValue.split(':')[0];
      var value = keyValue.split(':').slice(1).join(':')
        .replace(/\\([,;:])/g, '$1')
        .replace("\n ", '');
      
      if(/^DT\w+/.test(key) && /\d{8}T\d{6}/.test(value)) value = icalDate(value);
      if(key == "URL" && value) value = decodeURIComponent(value).replace(/\s/g, '_');
      
      cca[key.toLowerCase()] = value;
      return cca;
     
    }, {});
    
    if(event.dtstart.toDateString() == date.toDateString()) {
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

function icalDate(icalStr)  {            
    var strYear = icalStr.substr(0,4);
    var strMonth = parseInt(icalStr.substr(4,2),10)-1;
    var strDay = icalStr.substr(6,2);
    var strHour = icalStr.substr(9,2);
    var strMin = icalStr.substr(11,2);
    var strSec = icalStr.substr(13,2);

    return new Date(strYear,strMonth, strDay, strHour, strMin, strSec)
}

function tweetEvents(e) {
  
  var date = e instanceof Date ? e : new Date(),
      months = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
      maxLength = 140-23, // Max tweet length minus URL length
      events = getEventsForDate(date);
  
  for(i in events)
  {
    var prefix = (date.getDate() == new Date().getDate()) ? "Heute " : "Am " + days[date.getDay()] + ", " + date.getDate() + ". " + months[date.getMonth()] + " ";
    var text = prefix + "@MetalabVie: " +
      events[i].summary + ", " + 
      Utilities.formatDate(events[i].dtstart, Session.getScriptTimeZone(), "HH:mm") + 
      (events[i].dtend ? " - " + Utilities.formatDate(events[i].dtend, Session.getScriptTimeZone(), "HH:mm") : "") + ". " +
      (events[i].description ? events[i].description + " " : "");
    if(text.length > maxLength) text = text.substr(0, (maxLength - 2)) + "… ";
    text += events[i].url;
    Logger.log(text);
    twitter('post', 'statuses/update.json', { status: text });
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