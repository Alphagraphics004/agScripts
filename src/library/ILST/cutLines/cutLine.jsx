var CONFIG = {
  outlineColor: {
    cyan: 0,
    magenta: 100,
    yellow: 100,
    black: 0,
  },
  outlineWidth: 36,
  autoOffsetX: true,
  offsetXFactor: 2,
};

// Final array we'll use to proc selection
var groupList = [];
var rectList = [];

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
CMYKColor.prototype.create = function (cyan, magenta, yellow, black) {
  this.cyan = cyan;
  this.magenta = magenta;
  this.yellow = yellow;
  this.black = black;
  return this;
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

function createCutLinesOfObjects() {
  try {
    if (!app.selection.length) {
      return alert("Must have objects selected to use this script");
    }
    var list = get("selection", app.activeDocument, false);
    app.selection = null;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var group = createPseudoBoundingBox(item);
      groupList.push(group);
      // group.geometricBounds = offsetGeometricBounds(group.geometricBounds, i);
      offsetGeometricBounds(group, i);
    }
    app.selection = null;
    for (var i = 0; i < rectList.length; i++) {
      var item = rectList[i];
      item.selected = true;
    }
    setStrokeAlignToOutside();
    app.selection = null;
    for (var i = 0; i < groupList.length; i++) {
      groupList[i].selected = true;
    }
  } catch (err) {
    alert(err);
  }
}

function createPseudoBoundingBox(item) {
  // readLineBounds(app.activeDocument.artboards[0].artboardRect);
  // readLineBounds(item.geometricBounds);
  var clientRect = getClientBoundingRect(item.geometricBounds);
  var groupItem = item.parent.groupItems.add();
  item.move(groupItem, ElementPlacement.PLACEATBEGINNING);
  var rect = groupItem.pathItems.rectangle(
    clientRect.top,
    clientRect.left,
    clientRect.width,
    clientRect.height
  );
  rect.move(groupItem, ElementPlacement.PLACEATBEGINNING);
  rect.stroked = true;
  rect.strokeColor = new CMYKColor().create(
    CONFIG.outlineColor.cyan,
    CONFIG.outlineColor.magenta,
    CONFIG.outlineColor.yellow,
    CONFIG.outlineColor.black
  );
  rect.strokeWidth = CONFIG.outlineWidth;
  rectList.push(rect);
  return groupItem;
}

function getClientBoundingRect(bounds) {
  var data = {
    left: bounds[0],
    top: bounds[1],
    right: bounds[2],
    bottom: bounds[3] * -1,
    width: bounds[2] - bounds[0],
    height: (bounds[3] - bounds[1]) * -1,
    heightAlt: bounds[3] - bounds[1],
  };
  return {
    left: data.left,
    top: data.top,
    right: data.right,
    bottom: data.bottom,
    width: data.width,
    height: data.height,
    heightAlt: data.heightAlt,
    center: [data.left + data.width / 2, data.top + data.height / 2],
  };
}
function setStrokeAlignToOutside() {
  if ((app.documents.length = 0)) {
    return;
  }
  var ActionString = [
    "/version 3",
    "/name [ 4",
    "	74657374",
    "]",
    "/isOpen 1",
    "/actionCount 1",
    "/action-1 {",
    "	/name [ 9",
    "		5365745374726f6b65",
    "	]",
    "	/keyIndex 0",
    "	/colorIndex 0",
    "	/isOpen 0",
    "	/eventCount 1",
    "	/event-1 {",
    "		/useRulersIn1stQuadrant 0",
    "		/internalName (ai_plugin_setStroke)",
    "		/localizedName [ 10",
    "			536574205374726f6b65",
    "		]",
    "		/isOpen 0",
    "		/isOn 1",
    "		/hasDialog 0",
    "		/parameterCount 2",
    "		/parameter-1 {",
    "			/key 1785686382",
    "			/showInPalette -1",
    "			/type (enumerated)",
    "			/name [ 10",
    "				4d69746572204a6f696e",
    "			]",
    "			/value 0",
    "		}",
    "		/parameter-2 {",
    "			/key 1634494318",
    "			/showInPalette -1",
    "			/type (enumerated)",
    "			/name [ 6",
    "				496e73696465",
    "			]",
    "			/value 2",
    "		}",
    "	}",
    "}",
  ].join("\n");
  createAction(ActionString);
  var ActionString = null;
  app.doScript("SetStroke", "test", false);
  app.unloadAction("test", "");
  function createAction(str) {
    var f = new File("~/ScriptAction.aia");
    f.open("w");
    f.write(str);
    f.close();
    app.loadAction(f);
    f.remove();
  }
}

//
function translateGeometricBounds(group, index) {
  var currentOffset = CONFIG.outlineWidth * index;
  group.translate(currentOffset);
}

// This doesn't work unfortunately
function offsetGeometricBounds(group, index) {
  var bounds = group.geometricBounds;
  var currentOffset = CONFIG.outlineWidth * (index * 2);
  group.geometricBounds = [
    bounds[0] + currentOffset,
    bounds[1],
    bounds[2],
    bounds[3],
  ];
}

createCutLinesOfObjects();
