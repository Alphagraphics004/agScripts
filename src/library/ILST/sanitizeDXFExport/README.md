This is a Markdown file, meant to be viewed from a Markdown viewer (like Github, Slack, or other free tools)

---

# How to use this script:

1. Open the desired PDF file in Illustrator
2. Run the script via Switch or File > Scripts > Other Scripts

## Input file is a PDF having a single layer and no structure:

![](./_01%20-%20Input.png)

## Output file will be a DXF with structured layers, named accordingly:

![](./_02%20-%20Output.png)

## Exported file location will be the same folder / name as the original file, but with DXF file extension:

![](./_03%20-%20Exports%20Files%20at%20Same%20Location.png)

## Top of the file has a config which can be edited, tweaked, or expanded for more fine tune control over behavior:

![](./_04%20-%20Config.png)

```js
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
  autoclose: false, // Whether to automatically close the document on script completion
};
```
