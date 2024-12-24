/**
 * SanitizedDXFExport.js
 * ---------------------
 * Takes an unorganized PDF file with a single layer and no metadata and sorts items into specific layers based on spot color value.
 * Cleans up any redundant paths like clipping masks or groups, then exports the result as a standard and modern DXF
 */

// You can edit the values below:
var CONFIG = {
  isGetSpotVal: false, // Whether to write direct values to name
  isGetTintVal: true, // Whether to write direct tint values to name
  schema: {
    Register: "CCD", // Any match for "Register" as spot color will be dumped to "CCD" layer
    Registration: "CCD", // ^ The same logic applies for this entire block
    KissCut: "DK2",
    ThroughCut: "EOTCUT1",
    Crease: "CREASE",
    // Except here, since this is a lookup property:
    keys: ["Registration", "Register", "KissCut", "ThroughCut", "Crease"],
  },
  cleanUp: true, // Whether to delete the redundant Layer 1 collection and empty clipping masks /
  exportRelative: true,
  autoclose: false,
};

/** Polyfills for bringing ECMA up to more modern standards */
Object.prototype.keys = function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
};
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
Array.prototype.indexOf = function (item) {
  for (var i = 0; i < this.length; i++) if (this[i] == item) return i;
  return -1;
};
Array.prototype.filter = function (callback) {
  var filtered = [];
  for (var i = 0; i < this.length; i++)
    if (callback(this[i], i, this)) filtered.push(this[i]);
  return filtered;
};
function lerp(start, end, t) {
  return Math.round(start + (end - start) * t);
}
// Shorthand for compiling color string value, later used to discriminate against in match lists
RGBColor.prototype.getString =
  CMYKColor.prototype.getString =
  SpotColor.prototype.getString =
  LabColor.prototype.getString =
  GradientColor.prototype.getString =
  GrayColor.prototype.getString =
    function () {
      var result = this.typename.replace(/color$/i, "").toUpperCase() + "=";
      var self = this; // Prevent namespace conflicts from scoping
      if (/gradient/i.test(this)) {
        var stops = get("gradientStops", this.gradient);
        var colors = stops.map(function (stop) {
          return stop.color;
        });
        result =
          "" +
          colors
            .map(function (color) {
              return color.getString(CONFIG.isGetSpotVal); // Replace values with string in form [TYPE]=[VALUES]
            })
            .join("\n");
      } else if (this.spot) {
        if (!CONFIG.isGetSpotVal) return this.spot.name;
        result = this.spot.name + "=";
        self = self.spot.color;
      }
      if (/gradient/i.test(this)) {
        return result;
      }
      // Variables for calculating Spot tint by linear interpolation
      var white = /rgb/i.test(app.activeDocument.documentColorSpace) ? 255 : 0;
      var t = this.spot && CONFIG.isGetTintVal ? this.tint / 100 : 1;
      result += Object.keys(self)
        .filter(function (key) {
          return !/typename|getString/.test(key);
        })
        .map(function (key) {
          var val = lerp(white, self[key], t);
          // Color keys are always in order, so just return them rounded:
          return Math.round(val);
        })
        .join(",");
      return result;
    };

// Main function
function collectPathsAsColorList() {
  try {
    // First we collect the original layer, of which there will always only be one
    var refLayer = app.activeDocument.layers[0];
    // Then create an empty array which we'll store our full color lists into
    var colorList = [];
    // Iterate through every pathItem inside the document:
    for (var i = 0; i < app.activeDocument.pathItems.length; i++) {
      var item = app.activeDocument.pathItems[i];
      // If the item has some kind of fill or stroke, we act on it
      if (item.filled || item.stroked) {
        var c = "";
        // Fills wouldn't really exist in this context, but we'll handle them anyway:
        if (item.filled) {
          c = item.fillColor.getString();
          if (!colorList.includes(c)) {
            // Create new
            createNewLayer(c, item.fillColor, item);
            colorList.push(c);
          } else {
            moveItemToLayer(c, item.fillColor, item);
          }
        } else if (item.stroked) {
          // If there is a stroke, get our shorthand color
          c = item.strokeColor.getString();
          //   If it hasn't been found by the script in our pathItem list so far:
          if (!colorList.includes(c)) {
            // Then create a new layer, and move this object inside of that layer
            createNewLayer(c, item.strokeColor, item);
            // Finally add this color to our total list
            colorList.push(c);
          } else {
            // If we've already seen this color, then it will already have a layer.
            moveItemToLayer(c, item.strokeColor, item); // So just move our current object into that layer
          }
        }
      }
    }
    // Optional: should we delete the first layer, and all the redundant clipping masks?
    if (CONFIG.cleanUp) cleanUp(refLayer);
    // Finally export it as a DXF at the same location of the original document
    exportAsDXF();
    // Optional: Should we automatically close the file?
    if (CONFIG.autoclose)
      app.activeDocument.close(SaveOptions.DONOTSAVECHANGES); // If yes, never save changes to current file
  } catch (err) {
    alert(err);
  }
}

// Creates a layer, names it according to schema or color as fallback, moves the item into it
function createNewLayer(keyMatch, color, pathItem) {
  try {
    var layerName = CONFIG.schema.keys.includes(keyMatch)
      ? CONFIG.schema[keyMatch]
      : color.getString();
    var layer = app.activeDocument.layers.add();
    layer.name = layerName;
    pathItem.move(layer, ElementPlacement.PLACEATBEGINNING);
  } catch (err) {
    alert(err);
  }
}

// Moves a given pathItem into a layer
function moveItemToLayer(keyMatch, color, pathItem) {
  var layerName = CONFIG.schema.keys.includes(keyMatch)
    ? CONFIG.schema[keyMatch]
    : color.getString();
  var layer = findLayer(layerName);
  if (layer) {
    pathItem.move(layer, ElementPlacement.PLACEATEND);
  }
}

// Iterates through doc's layers to find a name, or null if none
function findLayer(str) {
  for (var i = 0; i < app.activeDocument.layers.length; i++) {
    var layer = app.activeDocument.layers[i];
    if (str == layer.name) return layer;
  }
  return null;
}

// Iterates through a given layer's pathItems in reverse order, removing them as we go
function cleanUp(layer) {
  try {
    for (var i = layer.pageItems.length - 1; i >= 0; i--)
      layer.pageItems[i].remove();
    layer.remove();
  } catch (err) {
    alert(err);
  }
}

// Right now this is relative export only. Since it wasn't specified, I'd rather keep it that way
function exportAsDXF() {
  var name = new File(
    app.activeDocument.path +
      "/" +
      app.activeDocument.name.replace(/\.pdf$/, ".dxf") // Just replace our PDF extension with DXF
  );
  var opts = getDXFOptions();
  app.activeDocument.exportFile(name, ExportType.AUTOCAD, opts);
}

// Reference here:
// https://ai-scripting.docsforadobe.dev/jsobjref/ExportOptionsAutoCAD.html
function getDXFOptions() {
  var exportAutoCADOptions = new ExportOptionsAutoCAD();
  exportAutoCADOptions.exportFileFormat = AutoCADExportFileFormat.DXF;
  exportAutoCADOptions.exportOption = AutoCADExportOption.PreserveAppearance;
  exportAutoCADOptions.exportSelectedArtOnly = false;
  exportAutoCADOptions.convertTextToOutlines = false;
  return exportAutoCADOptions;
}

/** Main initializer */
collectPathsAsColorList();
