# embodi

## 0.15.1

### Patch Changes

- 49d084a: Fix: Remove export Component on plugin parser

## 0.15.0

### Minor Changes

- 233c69e: Load html via content.json to keep editings via LayoutAction

## 0.14.4

### Patch Changes

- f0bf7ec: Fix: missing export for layout
- 9e011de: Fix: origin should be not required in config file

## 0.14.3

### Patch Changes

- 6605b5f: Fix: Check if layoutActions exists before generate the import

## 0.14.2

### Patch Changes

- e0a1694: Fix: Catch error when no additional file for a layout exists

## 0.14.1

### Patch Changes

- 4b9ff40: Cleanup: Revmoce Image.svelte and LayoutConfig exports

## 0.14.0

### Minor Changes

- 8f155ae: rename $layout2 to $layout and use the resolve of vite for internal uses
- 13c4690: Give each $layout file the possiblity to have a own file with definition and offer a function to manipulate/enrich the data and html
- 647d068: Set page store url to type URL and add to load/enrich function url auf URL

## 0.13.12

### Patch Changes

- ad75507: Fix: Full page load after error in goto, to avoid not working navigation on updated pages.
- 466f14c: Fix: Browser Navigation

## 0.13.11

### Patch Changes

- 6a12413: Fix: Load data.json only once and preload on pointerenter insted of mousedown

## 0.13.10

### Patch Changes

- b9aa7f9: Fix: Scroll to hash instead to top

## 0.13.9

### Patch Changes

- caa7d52: Fix: Navigate realtive paths with JS

## 0.13.8

### Patch Changes

- a49097e: Fix the size returned for image

## 0.13.7

### Patch Changes

- d91af87: Fix scroll postion. Jump to top

## 0.13.6

### Patch Changes

- dd58ab4: fix: await tick before set event listener on ticks to get the new laoded page

## 0.13.5

### Patch Changes

- 0311959: Fix load a tag selection: Use query selector

## 0.13.4

### Patch Changes

- ab54fb7: Prepare links on site loaded with goto and add `data-embodi-reload` to do a full reload and not prepare link

## 0.13.3

### Patch Changes

- 4db6ca0: Allow async in convertContent for Plugin helper

## 0.13.2

### Patch Changes

- 9e61671: Fix load data in devmode: Handle data in Filemanger as Buffer

## 0.13.1

### Patch Changes

- 4cc9bbc: Fix: Devmode load data.json ends in error. Fixed by setting header and content-type

## 0.13.0

### Minor Changes

- 6d4c096: Remove markdown from embodi core and moved it to a seperate plugin
- 4b3bca1: Improve loading of pages by handle load with js if possible

## 0.12.2

### Patch Changes

- 9f2ea58: Allow Comonent pages

## 0.12.1

### Patch Changes

- add note to readme to not use version 0.11 and 0.12

## 0.12.0

### Minor Changes

- require layout for prerender

## 0.11.12

### Patch Changes

- d36fd92: Add templating for index file

## 0.11.11

### Patch Changes

- 1057fdd: simplify hydration

## 0.11.10

### Patch Changes

- 41e8e3c: preload data

## 0.11.9

### Patch Changes

- 1be22a8: abort load of data from frontend on pagehide

## 0.11.8

### Patch Changes

- 2479aa3: Rendered head of svelte is missing in prerendering head

## 0.11.7

### Patch Changes

- 3c1011e: Add url to collection record

## 0.11.6

### Patch Changes

- 0b5a48a: Set image quality to 80 by default and give option to set quatlity

## 0.11.5

### Patch Changes

- 44b941b: Fix +data load and some minor fixes

## 0.11.4

### Patch Changes

- mkdir before writing file

## 0.11.3

### Patch Changes

- Fix undefined

## 0.11.2

### Patch Changes

- d1fe2eb: for existing (old) $layout mechanism schema need to be optional

## 0.11.1

### Patch Changes

- f959b68: Set the new layout mechanism to layout2 and keep the old one to approve new mechanism. Old mechanism will be marked as depricted in near future

## 0.11.0

### Minor Changes

- 25c7503: ![Important] defineConfig is now exportet from 'embodi/config' instead of 'embodi'
- 23416a0: Require min node 20.12.0
- f94d768: create a data.json and fetch it from client instead of running load code in client and instead getting the data from different files
- 7497c9f: Add possiblity to convert images and offer a image component for this
