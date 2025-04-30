var CONFIG = {
  foo: "bar",
};

var DATA = [
  {
    name: "36899-1001-001-ADM-25.01.02 (P) - All Day Menu - 8 x 13",
    path: "/Volumes/agOnline/Boqueria/Products/#Product Management/36899-1001-All Day Menu - 8 x 13/001 - NYC Flatiron/36899-1001-001-ADM-25.01.02 (P) - All Day Menu - 8 x 13.pdf",
    code: "001",
    menuType: "All Day Menu",
    store: "NYC Flatiron",
    sku: "36899-1001",
  },
  {
    name: "36899-1001-002-ADM-25.01.02 (P) - All Day Menu - 8 x 13",
    path: "/Volumes/agOnline/Boqueria/Products/#Product Management/36899-1001-All Day Menu - 8 x 13/002 - NYC Soho/36899-1001-002-ADM-25.01.02 (P) - All Day Menu - 8 x 13.pdf",
    code: "002",
    menuType: "All Day Menu",
    store: "NYC Soho",
    sku: "36899-1001",
  },
  {
    name: "36899-1003-003-BRU-11.11 (P) - Brunch Menu - 7 x 11",
    path: "/Volumes/agOnline/Boqueria/Products/#Product Management/36899-1003-Brunch Menu - 7 x 11/003 - NYC UES/36899-1003-003-BRU-11.11 (P) - Brunch Menu - 7 x 11.pdf",
    code: "003",
    menuType: "Brunch Menu",
    store: "NYC UES",
    sku: "36899-1003",
  },
];

// Force Illustrator to use relative positioning
app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
/** Polyfills for bringing ECMA up to more modern standards */
Array.prototype.includes = function (item) {
  for (var i = 0; i < this.length; i++) if (this[i] == item) return true;
  return false;
};
Array.prototype.map = function (callback) {
  var mappedParam = [];
  for (var i = 0; i < this.length; i++)
    mappedParam.push(callback(this[i], i, this));
  return mappedParam;
};
Array.prototype.filter = function (callback) {
  var filtered = [];
  for (var i = 0; i < this.length; i++)
    if (callback(this[i], i, this)) filtered.push(this[i]);
  return filtered;
};
Array.prototype.forEach = function (callback) {
  for (var i = 0; i < this.length; i++) callback(this[i], i, this);
};

/**
 * Agnostic getter function to convert Illustrator list items to ES6 native Arrays
 * @param {String} type - The key of parent to retrieve as list
 * @param {Object} parent - The parent object to comb
 * @returns {Array} - An iterable array of Objects which can use advanced Array methods like find(), forEach()
 *
 */
function get(type, parent, deep) {
  if (arguments.length == 1 || !parent) {
    parent = app.activeDocument;
    deep = true;
  }
  var result = [];
  if (!parent[type]) return [];
  for (var i = 0; i < parent[type].length; i++) {
    result.push(parent[type][i]);
    if (parent[type][i][type] && deep)
      result = [].concat(result, get(type, parent[type][i], deep));
  }
  return result;
}

function updateAllBoqueriaThumbnailsInDocument() {
  try {
    var slimData = DATA.filter(function (item) {
      return new RegExp(item.sku).test(app.activeDocument.name);
    });
    var list = get("placedItems").filter(function (item) {
      return item.name && item.name.length;
    });
    var pdfOptions = app.preferences.PDFFileOptions;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      pdfOptions.pageToOpen = /front/i.test(item.name) ? 1 : 2;
      var temp = findMatchingDataEntryFromPlacedItem(item, slimData);
      item.relink(new File(temp.path));
    }
  } catch (err) {
    alert(err);
  }
}

function findMatchingDataEntryFromPlacedItem(item, list) {
  var name = item.name;
  var code = name.match(/\d{3}/)[0];
  return list.find(function (sibling) {
    return sibling.code == code;
  });
}

updateAllBoqueriaThumbnailsInDocument();
