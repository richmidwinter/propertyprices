//chrome.storage.local.clear();

/**
 * Saves property details. Only call when an update is required.
 */
function save(id, title, price, records) {
  var path = location.pathname;
  var date = new Date().toISOString();

  var record = {};
  record["id"] = id;
  record["title"] = title;
  record["price"] = price;
  record["path"] = path;
  record["date"] = date;

  if (!records) {
    records = [];
  }

  records.unshift(record);

  var toPersist = {};
  toPersist[id] = JSON.stringify(records);

  // id => [record2, record1]
  chrome.storage.local.set(toPersist);
};

/**
 * Compares the current record against the last saved record.
 * 
 * If there are differences update the UI and save.
 */
function compare(live, uiElement, history) {
  if (history && history.length > 0) {
    var persisted = history[0];
    var persistedPrice = 1*persisted.price.replace(/\D/g,'');
    var livePrice = 1*live.price.replace(/\D/g,'');
    if (persistedPrice === livePrice) {  // Same price.
      uiElement.css('border-top', '5px solid orange');
    } else { //FIXME: Compare up/down
      if (livePrice < persistedPrice) {
        uiElement.css('border-top', '5px solid red');
      } else {
        uiElement.css('border-top', '5px solid green');
      }
      save(live.id, live.title, live.price, history);
    }
  } else {
    uiElement.css('border-top', '5px solid fuchsia');
    save(live.id, live.title, live.price, history);
  }
};

/**
 * Viewing a list of properties. Populate the UI.
 */
function populateListView(properties) {
  var cProperties = [];

  for (var i = 0; i<properties.length; i++) {
    var property = $(properties[i]);
    var id = property.find('a').attr('id'), price, title;
    if (location.pathname.substring(0, location.pathname.lastIndexOf("/")) == "/commercial-property-to-let") {
      price = property.find('.price').text();
      title = $(property.find('.address span')[0]).text();
    } else {
      price = property.find('.price').text();
      title = property.find('.type').text();
    }

    cProperties[id] = {"id": id, "price": price, "uiElement": property, "title": title};
  }

  chrome.storage.local.get(null, function(items) {
    var persisted = [];
    for (var id in items) {
      persisted[id] = JSON.parse(items[id]);
    }

    for (var c in cProperties) {
      var live = cProperties[c];
      compare(live, live.uiElement, persisted[live.id]);
    }
  });
};

/**
 * Viewing the details of a property. Populate the UI.
 */
function populateDetailsView() {
  var property = $('#propertydetails');
  var page = location.pathname.substring(location.pathname.lastIndexOf('-') +1);
  var id = "prop" +page.substring(0, page.length -5);
  var price = property.find('div#amount').text();
  var title = document.title;

  chrome.storage.local.get(id, function(result) {
    var live = {};
    live["id"] = id;
    live["title"] = title;
    live["price"] = price;

    var uiElement = $('#propertysummary');
    var history = result[id] ? JSON.parse(result[id]) : [];

    for (var i = 0; i<history.length; i++) {
      var persisted = history[i];
      $('#propertydetails').append('<div><h3>History</h3><table class="history"><thead><td>Title</td><td>Price</td><td>Date</td></thead><tbody></tbody></table></div>');
      $('table.history').append('<tr><td>' +persisted.title +'</td><td>' +persisted.price +'</td><td>' +getFriendlyDate(persisted.date) +'</td></tr>');
    }

    compare(live, uiElement, history);
  });
};

function getFriendlyDate(d) {
  var dObj = new Date(Date.parse(d));

  return dObj.getFullYear() +"-" +(dObj.getMonth() +1) +"-" +dObj.getDate() +" " +dObj.getHours() +":" +dObj.getMinutes();
};

/**
 * Main.
 */
var page = location.pathname.substring(location.pathname.lastIndexOf("/")+1);
var properties = $("li[name='summary-list-item']");
if (page.match(/property-\d+\.html/)) {
  populateDetailsView();
} else if (properties && properties.length > 0) {
  populateListView(properties);
}
