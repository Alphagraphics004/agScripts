## Replace Boqueria Thumbs

The goal of this script is to sync with `uStoreAPI` to automate Boqueria thumbnail creation.

1. Boqueria action creation should dump to a specific file, separate from solely the log file.
2. The script should parse the config file and through this, know which log file to target. The log file is for Node, the config file is for the script -- so maybe it's worth doing a slim version of the log that excludes unnecessary data.
3. Once the script has this data, it should replace any PlacedItems in the document with their incoming newest file versions.

### Alternative

This could be done "smart" by just scanning the Boqueria top product folder then creating a flatmap of it's contents, with filepaths per top-level product (excluding old folders). This way it can be used to refresh the config file at any time, and the script will just be product agnostic -- it will determine which part of the config to run by the document title, since it will always be run from within a Boqueria Thumbnail document. I like the idea of this because it could be run at any time, at any point of the process, or even completely separate from the uStoreAPI integration. These steps would be:

1. Create a node script that creates a shallow map of the Boqueria product folder, down to `/old/` folders, and dumps this data into a static location like AppData (or Mac equivalent).
2. The script ingests the config JSON, then parses the document title to know which product it's currently targeting
3. The script replaces _all_ thumbs in the currect document with the most updated versions
4. Moves all old thumbnails to the old folder
5. Exports every artboard in the document to the product's thumbnail folder
