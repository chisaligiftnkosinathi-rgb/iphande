# iPhande VBA Learning Tools

This folder contains companion Excel/VBA learning and admin automation tools for iPhande.

## Boundary

- `api` contains the backend truth engine.
- `mobile` contains the user interface.
- `tools/vba` contains supporting workbook-based learning and automation tools.

VBA tools must not become part of the app runtime. They may support learning, exports, reporting, and manual operational workflows.

## Workbook

Expected workbook path:

```text
C:\Projects\iphande\tools\vba\iPhande_VBA_Learning_System.xlsm
```

Save the workbook as **Excel Macro-Enabled Workbook (*.xlsm)**.

## Sheet Structure

The workbook starts as a small data system. Each row represents one record, and each column represents one field.

Required sheets:

| Sheet | Purpose |
| --- | --- |
| `Dashboard` | Main navigation and workbook overview |
| `BusinessOwners` | Registry of business owners |
| `ContentPosts` | Generated content post exports |
| `ReplayEvents` | Timeline and replay event exports |
| `Settings` | Constants and workbook configuration |

Initial `BusinessOwners` headers:

| Column | Header |
| --- | --- |
| A | `OwnerID` |
| B | `BusinessName` |
| C | `Category` |
| D | `Location` |
| E | `Phone` |

## Exports

Generated exports should be placed in:

```text
C:\Projects\iphande\tools\vba\exports
```
