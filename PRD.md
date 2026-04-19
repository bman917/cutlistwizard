# Product Requirements Document — CutList Wizard

## Overview

CutList Wizard is a web-based cut list optimizer. Users enter stock sheet dimensions and a list of required parts; the app calculates the most efficient way to cut those parts from the available stock, minimizing material waste.

---

## Core Features

### 1. Stock Sheet Input

Users define the sheets of material available to cut from.

| Field | Description |
|-------|-------------|
| Width | Sheet width |
| Height | Sheet height |
| Quantity | How many sheets are available (0 = unlimited) |

- Multiple stock sheet sizes can be added (e.g. mixing full sheets and offcuts)

---

### 2. Parts (Required Cuts) Input

Users define the list of pieces they need to cut.

| Field | Description |
|-------|-------------|
| Width | Part width |
| Height | Part height |
| Quantity | How many of this part are needed |
| Label | Optional name (e.g. "Side Panel") |

- Multiple distinct parts can be added
- CSV import supported for bulk entry

---

### 3. Cutting Parameters

| Parameter | Description |
|-----------|-------------|
| Kerf width | Saw blade thickness; subtracted from available space at each cut. Default: **1.6mm** |
| Trim (per edge) | Material trimmed from each edge of the stock sheet before cutting |

**Kerf width** is a free-input field with a dropdown of common presets:

| Value | Common use |
|-------|-----------|
| 1.6mm | Festool cordless track saw (default) |
| 2.2mm | Festool corded track saw |
| 2.4mm | Standard circular saw (thin kerf blade) |
| 3.2mm | Standard circular saw (full kerf blade) |
| 3.8mm | Table saw (full kerf) |
| 0.0mm | No kerf (e.g. scoring knife, laser) |

---

### 4. Cut Layout Output

- Visual diagram for each stock sheet used, showing how parts are arranged
- Each part labeled with its name and dimensions
- Color-coded by part label for readability
- Waste areas clearly marked
- Summary: total sheets used, total waste %, cost (if prices provided)
- Paginated — one sheet per view, navigable

---

### 6. Sessions

Users can save and load named sessions, each containing a stocks list and a parts list. Sessions are stored locally in the browser and persist across page reloads.

**Behavior**
- A session has a name (user-defined) and a last-modified timestamp
- Users can create, rename, load, and delete sessions
- Loading a session replaces the current stocks and parts in the editor
- The most recently active session is restored automatically on next visit
- No limit on the number of saved sessions

**Storage schema (localStorage key: `cutlistwizard_sessions`)**
```json
{
  "activeSessionId": "abc123",
  "sessions": [
    {
      "id": "abc123",
      "name": "Kitchen Cabinets",
      "updatedAt": "2026-04-19T10:00:00Z",
      "stocks": [...],
      "parts": [...]
    }
  ]
}
```

---

### 7. Units

- Metric (mm) and Imperial (inches — fractional and decimal)
- User selects unit on first use; persists across sessions

---

### 5. Import / Export

Users can import and export their project as a JSON file.

**Import**
- Accepts a `.json` file containing stock sheets and/or parts
- Schema:
```json
{
  "stocks": [
    { "width": 2440, "height": 1220, "quantity": 3 }
  ],
  "parts": [
    { "label": "Side Panel", "width": 600, "height": 400, "quantity": 2 }
  ]
}
```
- Both `stocks` and `parts` are optional — importing one does not clear the other
- `label` is optional on each part
- Invalid or missing fields on a row are reported; valid rows are imported
- Importing merges with existing data (does not replace)

**Export**
- Downloads the current stocks and parts as a `.json` file using the same schema
- File is named `cutlistwizard.json`

---

## Out of Scope (v1)

- Non-rectangular parts
- Roll/linear material (fabric, trim)
- PDF export of cut layouts
- User accounts / saved projects
- Mobile-optimized layout (desktop-first for v1)
