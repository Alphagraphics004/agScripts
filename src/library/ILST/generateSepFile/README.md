# Generate Sep File

Script for generating the color separation files needed for apparel prepress

## Technical requirements

- Collection of all same-color artwork objects in the document, then grouping when necessary
- Optional compound / pathfinder action running on artwork to cut out negative space
- Conversion of all color values to matching swatches
- Grouping then proportional resizing of artwork to match dimensions required
- Access to and opening of template files
- Moving southern registration mark to just beneath bounding box of artwork
- Filling in information about the file, potentially via parsed paths

## Ideal form

- It would be great if this were a CEP panel instead of solely a script, so that a user could drag and drop a working file onto it from the apparel server customer's folder location. The filepath could then be parsed to get information like Customer, Job Name, deco name, given a filepath will look something like this:

`/Volumes/Apparel/Customers/F/Fairway/KYM AND AMY/POLOS (EMB/02 Working/EMB_LOGO.eps`

Already have customer of `Fairway` and job name of `KYM AND AMY` from the filepath alone.
