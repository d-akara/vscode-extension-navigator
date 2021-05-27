## 1.5.0
- Plain text colorizer
  - Performance
- Improvements in navigator tree view
  - 

## 1.4.0
- Plain text colorizer
  - Performance
    - slightly increased view range update size to make uncolorized text less frequent on scrolling
  - Enhanced customizations
    - define custom gradients (scales)
    - specify gamma adjustment
    - specify interpolation mode
    - specify brightness adjustment
- Improvements in navigator tree view
  - Improved clarity of text using the tree item description field which displays in slighly different color
  - Added action icon to all tree items to remove from view
  
## 1.3.0
- Plain text colorizer
  - Indentation level colorizer for plain text files

## 1.2.0
- Enhanced Matches Tree View
  - Multiple match groups can now be set
  - Match group shows document name and match text
  - Preference can be set for limit of match groups to show
- Recent Edits Section
  - Shows recent edit locations
  - Preference can be set for what is considered the span of a single edit
  - Preference can be set for how many edits to show
- Line Level Section
  - Shows the line level hierarchy from the current cursor line
- Command `Show current find matches in view` renamed `Add Matches`
  - Now adds a new match section on each execution
  - Uses `find matches` when the find input box is open and find matches are viewable in the editor
    - Otherwise uses `current selection` to find all lines with the currently selected text
    - Otherwise uses `word under cursor` to find all lines with the word under cursor

## 1.1.0
- Added a tree view to show current find matches
  - use command `Show current find matches in view`

## 1.0.0
- Initial release