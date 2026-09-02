**PPE Module — Updated User Stories**

41 existing stories updated with change marking \+ 9 new stories  ·  Project HSE (Spark)  ·  25 Oct 2026

## **How to read the changes**

**Green text** \= added or reworded text.   **~~Red strikethrough~~** \= removed text.   Black \= unchanged.

Table rows or list items that are completely new are shaded green; completely removed ones are shaded red. Each story starts with a yellow "What changed" box that names the decision rules (1 to 19\) applied. NEW-01 to NEW-09 are brand-new stories, shown as a clean text with a green header.

Stories are in BD-I id order, followed by NEW-01 to NEW-09. Numbered references such as "Story 13" or "Epic 2" were replaced by the BD-I id of the story depended on.

## **Summary of all stories**

| ID | Story | Epic | Status | Rules applied |
| :---- | :---- | :---- | :---- | :---- |
| **BD-I443** | Add a New PPE Item to the Catalog | PPE Catalog Management | **Modified** | 5, 12, 15 |
| **BD-I444** | Edit or Deactivate a PPE Item | PPE Catalog Management | **Modified** | 3 |
| **BD-I445** | Set Item Lifespan (for Expiry Calculation) | PPE Catalog Management | **Modified** | 12 |
| **BD-I446** | Move a PPE Item to Trash and Restore It | PPE Catalog Management | **Modified** | 3, 14 |
| **BD-I447** | Add a New Attribute | Attributes Management | **Modified** | 5 |
| **BD-I448** | Edit an Attribute | Attributes Management | **Modified** | 3 |
| **BD-I449** | View and Filter the Attributes List | Attributes Management | **Modified** | 3 |
| **BD-I450** | View Attribute Details | Attributes Management | **Modified** | — |
| **BD-I451** | Move an Attribute to Trash and Restore It | Attributes Management | **Modified** | 3, 14 |
| **BD-I452** | Add a New Item Group | Item Groups Management | **Modified** | 5 |
| **BD-I453** | Edit an Item Group | Item Groups Management | **Modified** | 3, 5 |
| **BD-I454** | View and Filter the Item Groups List | Item Groups Management | **Modified** | 3 |
| **BD-I455** | View Item Group Details | Item Groups Management | **Modified** | — |
| **BD-I456** | Move an Item Group to Trash and Restore It | Item Groups Management | **Modified** | 3, 14 |
| **BD-I457** | Add a New Warehouse/Location | Locations Management | **Modified** | 4, 13, 16 |
| **BD-I458** | Edit a Location | Locations Management | **Modified** | 4, 13 |
| **BD-I459** | View and Filter the Locations List | Locations Management | **Modified** | 3 |
| **BD-I460** | View Location Details | Locations Management | **Modified** | — |
| **BD-I461** | Move a Location to Trash and Restore It | Locations Management | **Modified** | 3, 14 |
| **BD-I462** | Restrict Store Keeper Access to Specific Locations | Locations Management | **Modified** | 4 |
| **BD-I464** | Transfer Stock Between Locations | Locations Management | **Modified** | 13 |
| **BD-I466** | View Stock Levels and Low Stock Alerts | Locations Management | **Modified** | 9, 15 |
| **BD-I467** | Issue a Single PPE Item to an Employee | PPE Issuance | **Modified** | 2, 5, 12, 17 |
| **BD-I468** | Auto-Suggest and Issue a Job-Specific Kit | PPE Issuance | **Modified** | 1, 2, 7, 17 |
| **BD-I469** | Add a New Job-Specific Kit | Kit Management | **Modified** | 3 |
| **BD-I470** | Issue PPE as a Loan to a Visitor/Contractor | PPE Issuance | **Modified** | 2, 8 |
| **BD-I471** | Return a Loaned Item | PPE Issuance | **Modified** | 2, 8, 13 |
| **BD-I472** | Return Item and Auto-Scrap if Damaged | PPE Issuance | **Modified** | 2, 7, 13 |
| **BD-I473** | ~~Request and Approve PPE Replacement~~Send Replacement Reminders | PPE Issuance | **Modified** | 7, 11, 15 |
| **BD-I475** | View and Filter the PPE Catalog List | PPE Catalog Management | **Modified** | 3, 15 |
| **BD-I476** | View PPE Item Details | PPE Catalog Management | **Modified** | 5 |
| **BD-I477** | Edit a Kit | Kit Management | **Modified** | 3 |
| **BD-I478** | View and Filter the Kits List | Kit Management | **Modified** | 3 |
| **BD-I479** | View Kit Details | Kit Management | **Modified** | — |
| **BD-I480** | Move a Kit to Trash and Restore It | Kit Management | **Modified** | 3, 14 |
| **BD-I486** | Export and Import the PPE Catalog List | ~~PPE Issuance~~PPE Catalog Management | **Modified** | 5 |
| **BD-I488** | View and Filter the Employee List | Personal information | **Modified** | 11 |
| **BD-I489** | View Employee Details and PPE Issuance Timeline | Personal information | **Modified** | 17 |
| **BD-I490** | Tab 1 \- Interactive Stock Movement Trend | PPE Dashboard | **Modified** | — |
| **BD-I491** | Tab 2 \- Location Capacity Stacked Bar & Filter | PPE Dashboard | **Modified** | 9, 16 |
| **BD-I492** | Tab 3 \- Action-Driven "Top Job Kits" Chart | PPE Dashboard | **Modified** | 1 |
| **NEW-01** | Post Opening Balance for a Location | Stock Management | **NEW** | New rule set |
| **NEW-02** | Record Stock IN | Stock Management | **NEW** | New rule set |
| **NEW-03** | Record Stock OUT (write-off, damage, quarantine) | Stock Management | **NEW** | New rule set |
| **NEW-04** | Trash Bin (shared screen) | System Foundation | **NEW** | New rule set |
| **NEW-05** | Audit Log | System Foundation | **NEW** | New rule set |
| **NEW-06** | Module Settings | System Foundation | **NEW** | New rule set |
| **NEW-07** | Replacements Due screen | PPE Issuance | **NEW** | New rule set |
| **NEW-08** | Open Loans list | PPE Issuance | **NEW** | New rule set |
| **NEW-09** | Import Historical Issuances from Excel | PPE Catalog Management / Employee Tracking | **NEW** | New rule set |

# **BD-I443  —  Add a New PPE Item to the Catalog**

 **MODIFIED    Epic:** PPE Catalog Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Gender and Has Size removed (variants come from the Item Group's Attributes). Lifespan is time-based only (value \+ unit). Unit of Measure added. Reorder Level moves to one optional number per location. Category list needs the final fixed list. Only Active, non-Scrap locations are offered.  (Rules 5, 12, 15\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to add a new PPE item (like a helmet or gloves) into the system

**SO THAT**  Store Keepers can give this item to employees when they need it

## **Story Dependencies**

* The Item Group must already exist (~~Story 13~~BD-I452)

* The Attributes (like Color, Size) must already exist (~~Story 8~~BD-I447)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item Code | Text | Must be one word, no repeats, e.g. HLM-001 | Required. Cannot repeat another item's code |
| Item Name (English & Arabic) | Text | e.g. Safety Helmet / خوذة أمان | Required |
| Item Photo | Image | JPG/PNG | Optional |
| Category | List | Head, Eye, Hearing, Hand, Foot, Body~~, etc.~~ (final fixed list to be confirmed, see open points) | Required, pick one |
| Item Group | List | e.g. Helmets, Gloves | Required, decides what extra fields appear (variants come from the Attributes of the chosen group) |
| ~~Has Size~~ | ~~Yes/No~~ | ~~Yes or No~~ | ~~If Yes, must choose a Size list~~ |
| ~~Gender~~ | ~~List~~ | ~~Male / Female / Both~~ | ~~Required only for Clothing and Footwear items~~ |
| Lifespan ~~Type &~~ Value & Unit | ~~List \+~~ Number \+ List | e.g. ~~Time-based, 6 months~~6 \+ Months | Required. Time-based only. Unit: days / months / years. Used to know when item expires |
| Unit of Measure | List | Piece / Pair / Set | Required (already exported by BD-I486) |
| Locations | List | One or more warehouses | Required, at least one location. Only Active locations that are not Scrap are offered |
| Description (English & Arabic) | Text | e.g. Certified impact-resistant hard hat | Optional |
| Manufacturer / Model | Text | e.g. 3M / H-700 | Optional |
| Standard / Certification | Text | e.g. ANSI Z89.1 | Optional |
| Risk Category | List | Category I (Minor Risk), Category II (Intermediate Risk), Category III (Irreversible/Lethal Risk) | Required |
| Reorder Level | Number per location | e.g. 20 | Optional, one number for each assigned location. When Available stock at that location falls below this number, item is flagged Low Stock |

## **Logic Workflow**

1\.  Admin opens the 'Add New Item' screen.

2\.  Admin types the Item Code and Name and picks the Item Group.

3\.  The screen shows the extra fields that belong to that Item Group (like Color or Size), taken from the Item Group's Attributes.

4\.  Admin fills the Lifespan (how long the item lasts) as a value and a unit, picks the Unit of Measure, and picks at least one Location (optionally setting a Reorder Level for each).

5\.  Admin saves the item.

6\.  The system checks the Item Code is not already used.

7\.  If everything is correct, the item is saved and appears in the Catalog list.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item Code already used | Admin types HLM-001 which already exists | System shows an error and does not save |
| Missing Lifespan Value | Admin ~~picks 'Time-based' but~~ leaves the value or unit empty | System blocks save and asks to fill it |
| ~~Clothing item with no Gender~~ | ~~Admin adds a Coverall item and skips Gender~~ | ~~System blocks save and asks for Gender~~ |
| No Location chosen | Admin tries to save without picking any Location | System blocks save, at least one Location is required |
| No Risk Category chosen | Admin saves the item without picking a Risk Category | System blocks save and asks Admin to choose one |
| Missing Unit of Measure | Admin saves without a Unit of Measure | System blocks save and asks to choose one |
| Scrap or inactive Location | Admin looks for a Scrap-flag or inactive location | Location is not offered in the list |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Successful save | All required fields filled correctly | New item appears in the Catalog list and is ready to use |
| Item Code duplicate | Item Code already exists | Error message shown, item not saved |

## **Use Case**

Admin creates 'Safety Helmet' item, sets Lifespan to 6 months, Unit of Measure Piece, links it to 2 warehouses, and saves it. It now appears for Store Keepers to issue.

## **UI/UX**

* Simple form with clear sections: Basic Info, Variants (~~Size/Color~~from the Item Group's Attributes), Lifespan, Locations

* Show only the fields that matter for the chosen Item Group

* Show a friendly success message after saving

## **Non-Functional Requirements**

* Should work well in both English and Arabic

* Page should load quickly, even with many items in the catalog

## **Definition of Done**

* Item can be created, edited, and deactivated

* Item Code uniqueness is enforced

* All required fields are validated before save

* Variants come only from the Item Group's Attributes; no Gender or Has Size field on the item

* Lifespan value and unit and Unit of Measure are required

* Tested in both English and Arabic

# **BD-I444  —  Edit or Deactivate a PPE Item**

 **MODIFIED    Epic:** PPE Catalog Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Deactivation with active issuances is blocked unless Admin overrides with a logged reason. Item Code locks after any transaction. Inactive items cannot be issued, received or added to a Kit. A lifespan change affects future issuances only.  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to edit an existing PPE item's details or turn it off (deactivate) when it's no longer used

**SO THAT**  the Catalog always shows correct and up-to-date items

## **Story Dependencies**

* Item must already exist in the Catalog (~~Story 1~~BD-I443)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item to Edit | Selection | Pick from list | Required |
| Any field | Various | Same as Add Item form | Editable except Item Code once used in a transaction (issue, stock movement or loan) |
| Active/Inactive | Toggle | On/Off | Turns item on or off |
| Override reason | Text | Reason entered by Admin | Required only to deactivate an item that active issuances still use |

## **Logic Workflow**

1\.  Admin opens an item from the Catalog list.

2\.  Admin changes any field needed (name, photo, lifespan, locations, etc.).

3\.  Admin saves the changes.

4\.  If Admin wants to deactivate the item, they switch it to Inactive.

5\.  System checks if any employee still has this item issued to them and not returned.

6\.  If yes, system blocks the deactivation unless ~~Admin confirms an override~~an Admin overrides it with a reason, which is logged.

7\.  Inactive items cannot be issued, received or added to a new Kit, but existing issuances keep their reminders.

8\.  A lifespan change affects future issuances only; replacement dates already calculated do not change.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item has active issues | Admin tries to deactivate an item that 50 employees still have | System blocks it and asks for ~~an override confirmation~~an Admin override with a reason |
| Item has no active issues | Admin deactivates an item nobody currently holds | System deactivates it immediately |
| Edit a field | Admin updates the Item Photo | Change saved, shown immediately in Catalog |
| Item Code after a transaction | Admin tries to change the Item Code of an item already issued, moved or loaned | Field is locked, change not allowed |
| Lifespan changed | Admin changes Lifespan from 6 to 12 months | Applies to future issuances only |
| Inactive item | Store Keeper tries to issue it, receive it or add it to a new Kit | Not allowed; existing issuances keep their reminders |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Edit saved | Valid changes made | Item updated in Catalog |
| Deactivation blocked | Item still issued to employees | ~~Warning shown, Admin must confirm override to proceed~~Blocked; only an Admin override with a reason lets it proceed |

## **Use Case**

Admin updates the photo of 'Safety Gloves' and tries to deactivate an old 'Old Style Boots' item that is still issued to 5 people; system ~~warns before allowing it~~blocks it unless the Admin overrides with a logged reason.

## **UI/UX**

* Edit screen looks the same as the Add screen, pre-filled with current data

* Clear warning message with item count before deactivation

## **Non-Functional Requirements**

* All changes must be logged (who changed what and when)

## **Definition of Done**

* Editing works for all fields

* Deactivation is blocked correctly when items are still issued

* Override option requires a reason, works and is logged

* Item Code is locked after any transaction

* Inactive items cannot be issued, received or added to a Kit

# **BD-I445  —  Set Item Lifespan (for Expiry Calculation)**

 **MODIFIED    Epic:** PPE Catalog Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Usage-based removed. Lifespan is time-based only: value \+ unit, always required. A change never recalculates items already issued. Open decision: merge this story into BD-I443/BD-I444 (they already hold the field) or keep it as the dedicated edit screen.  (Rules 12\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to set how long a PPE item lasts before it needs to be replaced

**SO THAT**  the system can automatically remind people when it's time to replace the item

## **Story Dependencies**

* Item must already exist in the Catalog (~~Story 1~~BD-I443)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| ~~Lifespan Type~~ | ~~List~~ | ~~Time-based or Usage-based~~ | ~~Required~~ |
| Lifespan Value | Number | e.g. 6 (months) | Required ~~if Lifespan Type is chosen~~, always |
| Lifespan Unit | List | Days / Months / Years | Required |

## **Logic Workflow**

1\.  Admin opens the item and goes to the Lifespan section.

~~–  Admin picks the Lifespan Type (Time-based, like 6 months).~~

2\.  Admin types the Lifespan Value and picks the Unit (days / months / years).

3\.  System saves this Lifespan on the item.

4\.  This Lifespan is the same for every issuance of this item — it only starts counting from the day it is given to an employee, not before.

5\.  A lifespan change never recalculates items already issued; it applies to future issuances only.

6\.  A reused item reissued from a Used location starts a fresh lifespan on the new issue date.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| No value given | Admin ~~picks Time-based but~~ leaves the number empty | System blocks save |
| Item not yet issued | Item is sitting in the warehouse, not given to anyone | No expiry date exists yet — expiry only starts once issued |
| Item issued | Employee receives the item on 1 January, lifespan is 6 months | System sets the replacement date to 1 July automatically |
| Lifespan changed later | Lifespan changed from 6 to 12 months after issuance | Existing replacement dates stay the same; only future issuances use 12 months |
| Reused item reissued | Item from a Used location is issued again | A fresh lifespan starts on the new issue date |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Lifespan saved | Valid Lifespan ~~Type and~~ Value and Unit entered | Every future issuance of this item will auto-calculate its replacement date |

## **Use Case**

Admin sets 'Safety Gloves' lifespan to 3 months. When Ahmed receives gloves on 1 March, the system automatically marks 1 June as his replacement date.

## **UI/UX**

* Simple number field with a dropdown ~~for Time-based / Usage-based~~for the unit (days / months / years)

## **Non-Functional Requirements**

* Calculation must always be accurate and automatic — no manual entry needed

## **Definition of Done**

* Lifespan can be set and edited

* Expiry date auto-calculates correctly at issuance

* No expiry shown for items still in stock

* Editing the lifespan never changes replacement dates of items already issued

# **BD-I446  —  Move a PPE Item to Trash and Restore It**

 **MODIFIED    Epic:** PPE Catalog Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Active issuances now block deletion unless Admin overrides with a logged reason. Trashed items cannot be issued or received; holders keep a read-only record and their reminders. Restore follows the NEW-04 checks. Shared Trash Bin with 90-day auto-purge.  (Rules 3, 14\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to delete a PPE item by moving it to a Trash Bin instead of removing it forever, and bring it back if needed

**SO THAT**  mistakes can be undone and we never lose catalog history by accident

## **Story Dependencies**

* Item must already exist in the Catalog (~~Story 1~~BD-I443); Trash Bin screen: NEW-04

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item to Delete | Selection | Pick from Catalog list | Required |
| Delete Reason | Text | Optional short note | Optional |
| Override reason | Text | Reason entered by Admin | Required only when the item still has active issuances |
| Item to Restore | Selection | Pick from Trash Bin list | Required when restoring |

## **Logic Workflow**

1\.  Admin clicks Delete on a PPE item from the Catalog list.

2\.  System asks Admin to confirm before deleting.

3\.  System checks if any employee still holds the item. If yes, the delete is blocked unless Admin overrides with a reason, which is logged.

4\.  Once confirmed, the item is moved out of the active Catalog list and into the Trash Bin — it is not permanently removed.

5\.  The item can no longer be used for new issuance, receiving, stock, or Kits while it's in the Trash Bin.

6\.  Employees who still hold it keep a read-only record and their reminders until the item is returned.

7\.  Admin opens the Trash Bin screen to see all deleted items.

8\.  Admin picks an item and clicks Restore to bring it back to the active Catalog list, exactly as it was before (parent and code checks follow NEW-04).

9\.  Items stay in the Trash Bin for 90 days, then are removed automatically (see NEW-04).

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Delete an item still in use | Item has active, non-returned issuances | System ~~warns Admin and asks for confirmation before moving it to Trash~~blocks the delete unless Admin overrides with a reason, which is logged |
| Restore an item | Item exists in the Trash Bin | Item returns to the active Catalog list with all its original details |
| Item in Trash Bin | Item was deleted | Item cannot be selected for stock, receiving or issuance until restored |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item moved to Trash | Admin confirms delete | Item disappears from the active Catalog and appears in the Trash Bin |
| Item restored | Admin restores from Trash Bin | Item reappears in the active Catalog list, fully usable again |

## **Use Case**

Admin accidentally deletes 'Safety Goggles' from the Catalog, then opens the Trash Bin and restores it a minute later with no data lost.

## **UI/UX**

* Trash Bin is a separate screen, easy to find from the Catalog page

* Clear Restore button next to each trashed item

## **Non-Functional Requirements**

* Deleting must never permanently remove data without going through the Trash Bin first

* Every delete and restore action is logged with user and date

## **Definition of Done**

* Delete moves the item to the Trash Bin instead of erasing it

* Restore brings the item back with all original data

* Items in Trash cannot be used anywhere in the system until restored

* Delete and restore actions are logged

* Active issuances block the delete unless Admin overrides with a logged reason

# **BD-I447  —  Add a New Attribute**

 **MODIFIED    Epic:** Attributes Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: The GENDER Attribute (Male, Female, Unisex) is seeded or documented so the gender-match rule of BD-I452 / BD-I467 can use it.  (Rules 5\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to create a new global option (like Size or Color) that can be reused across many items

**SO THAT**  I don't have to recreate the same options again and again for every item

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Code | Text | e.g. SIZE | Required, must be unique |
| Name (English) | Text | e.g. Size | Required |
| Name (Arabic) | Text | e.g. المقاس | Optional |
| Active | Toggle | On/Off | On by default |
| Attribute Values | Repeatable table | Value (EN), Value (AR), Sort Order, Active — add more using the Add button | At least one value required |

## **Logic Workflow**

1\.  Admin opens 'Add Attribute' and types the Code and Name.

2\.  Admin adds one or more Attribute Values (like Red, Blue, Green) using the Add button, one at a time.

3\.  Each value gets a Sort Order to control the display order.

4\.  Admin saves the Attribute.

5\.  System checks the Code is unique and at least one Value was added.

6\.  The new Attribute becomes available to link to any Item Group.

7\.  The GENDER Attribute with values Male, Female and Unisex is seeded (or documented) so the gender rule of BD-I452 can use it.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Duplicate Code | Admin types SIZE which already exists | System blocks save and shows an error |
| No values added | Admin tries to save with zero Attribute Values | System blocks save, at least one Value is required |
| Duplicate value under same Attribute | Admin adds 'Red' twice under Color | System blocks the duplicate value |
| GENDER Attribute | System set-up | GENDER exists with values Male, Female, Unisex |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Attribute saved | Unique Code and at least one Value | New Attribute appears in the Attributes list, ready to link to Item Groups |

## **Use Case**

Admin creates the 'COLOR' Attribute, adds values Red, Blue, and Green one by one using the Add button, then saves it.

## **UI/UX**

* Add button next to the Value fields lets Admin add many values without leaving the screen

* Values appear as a simple list below, each with a small remove option before saving

## **Non-Functional Requirements**

* Should support adding many values quickly without page reloads

## **Definition of Done**

* Attribute and its Values save correctly

* Code uniqueness enforced

* At least one Value required before save

* Values can be added one by one with the Add button

* GENDER Attribute (Male, Female, Unisex) exists

# **BD-I448  —  Edit an Attribute**

 **MODIFIED    Epic:** Attributes Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Removing a Value in use is blocked unless Admin overrides with a reason; the reason is logged.  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to edit an Attribute's name or its list of values

**SO THAT**  the option list stays correct and up to date

## **Story Dependencies**

* Attribute must already exist (~~previous story~~BD-I447)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Attribute to Edit | Selection | Pick from list | Required |
| Name (EN/AR) | Text | Editable | Optional to change |
| Attribute Values | Table | Add, edit, or remove values | At least one value must remain |
| Override reason | Text | Reason entered by Admin | Required to remove a Value that is in use |

## **Logic Workflow**

1\.  Admin opens an existing Attribute from the list.

2\.  Admin edits the Name or adds/removes Values.

3\.  Admin saves the changes.

4\.  System blocks removing a Value that is currently used by an active Catalog item, unless Admin ~~confirms an override~~overrides with a reason, which is logged.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Remove a Value in use | Value 'Red' is used by an active item | System blocks removal unless Admin ~~confirms override~~overrides with a reason (logged) |
| Edit Name only | Admin changes 'Size' to 'Sizing' | Change saved, shown everywhere the Attribute is used |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Edit saved | Valid changes made | Attribute updated everywhere it's used |

## **Use Case**

Admin adds a new value 'XXL' to the existing 'SIZE' Attribute so it can be used on new items.

## **UI/UX**

* Same layout as the Add screen, pre-filled with current data

## **Non-Functional Requirements**

* Changes must reflect immediately on any Catalog item using this Attribute

## **Definition of Done**

* Editing Name and Values works correctly

* Removing an in-use Value is blocked unless overridden with a logged reason

* At least one Value always remains

# **BD-I449  —  View and Filter the Attributes List**

 **MODIFIED    Epic:** Attributes Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Toggling off an in-use Attribute is blocked unless Admin overrides with a reason (the workflow said block, the business rule said warn; now aligned to block).  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to see all Attributes in one list, search/filter them, and turn them Active or Inactive directly from the list

**SO THAT**  I can manage all my options quickly without opening each one

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Search Text | Text | Search by Code or Name | Optional |
| Status Filter | Selection | All / Active / Inactive | Optional |
| Active/Inactive Toggle | Toggle (in Actions column) | On/Off switch per row | Available directly in the list |
| Override reason | Text | Reason entered by Admin | Required to turn off an in-use Attribute |

## **Logic Workflow**

1\.  Admin opens the Attributes list.

2\.  Admin can search by Code or Name, and filter by Active/Inactive status.

3\.  Each row shows a toggle switch in the Actions column to turn the Attribute Active or Inactive directly from the list, without opening it.

4\.  Turning a toggle off deactivates the Attribute; turning it on reactivates it.

5\.  System blocks turning off an Attribute that is still used by an active Catalog item, unless Admin ~~confirms an override~~overrides with a reason, which is logged.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Search matches | Admin types 'SIZE' | List shows only matching Attributes |
| Toggle off an Attribute in use | Attribute is linked to an active Catalog item | System ~~warns and asks for confirmation before turning it off~~blocks it unless Admin overrides with a reason (logged) |
| Toggle off an unused Attribute | Attribute has no active links | Turns off immediately |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List displayed | Attributes exist | Filtered, searchable list shown with working toggle switches |

## **Use Case**

Admin searches for 'GENDER' in the Attributes list and turns it Inactive directly using the toggle switch in the Actions column.

## **UI/UX**

* Toggle switch clearly visible in the Actions column of each row

* Search box and status filter at the top of the list

## **Non-Functional Requirements**

* List should load quickly even with many Attributes

## **Definition of Done**

* Search and filter work correctly

* Toggle switch in the list changes Active/Inactive status immediately

* In-use protection rule enforced before turning off (block, override with a logged reason)

# **BD-I450  —  View Attribute Details**

 **MODIFIED    Epic:** Attributes Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: The 'used by' list of Item Groups excludes trashed records. |
| :---- |

**AS A**  Admin

**I WANT TO**  to open an Attribute and see all its information and values in one read-only screen

**SO THAT**  I can quickly check its setup without risk of accidentally changing anything

## **Story Dependencies**

* Attribute must exist (BD-I447)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Attribute to View | Selection | Pick from list | Required |

## **Logic Workflow**

1\.  Admin clicks on an Attribute from the list (or a 'View' action).

2\.  System shows a read-only screen with the Code, Name (EN/AR), Status, and full list of Values with their Sort Order.

3\.  Admin can see which Item Groups currently use this Attribute (trashed Item Groups are not listed).

4\.  Admin can go to Edit directly from this screen if changes are needed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Attribute has linked Item Groups | Attribute is used by 2 Item Groups | Both linked Item Groups are listed on the View screen |
| Attribute has no links | Attribute not yet used anywhere | View screen shows 'Not currently used' message |
| Linked Item Group is in the Trash | Attribute used only by a trashed Item Group | Trashed group is not listed; screen shows 'Not currently used' |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Details shown | Attribute exists | Full read-only view of the Attribute and its Values displayed |

## **Use Case**

Admin opens 'COLOR' to quickly check which values exist and which Item Groups use it, before deciding to edit it.

## **UI/UX**

* Clean read-only layout, with a clear Edit button to jump into editing if needed

## **Non-Functional Requirements**

* View screen should load instantly

## **Definition of Done**

* View screen shows all Attribute details and Values correctly

* Linked Item Groups are listed, excluding trashed ones

* Edit button available from the View screen

# **BD-I451  —  Move an Attribute to Trash and Restore It**

 **MODIFIED    Epic:** Attributes Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Changed from warn-only to block-unless-override (reason logged). On override the Attribute is unlinked from its Item Groups; sizes recorded on past issuances are kept. Restore follows NEW-04.  (Rules 3, 14\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to delete an Attribute by moving it to the Trash Bin, and restore it if I change my mind

**SO THAT**  I don't lose an option list by mistake

## **Story Dependencies**

* Attribute must exist (BD-I447); Trash Bin screen: NEW-04

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Attribute to Delete | Selection | Pick from list | Required |
| Override reason | Text | Reason entered by Admin | Required when the Attribute is in use |
| Attribute to Restore | Selection | Pick from Trash Bin | Required when restoring |

## **Logic Workflow**

1\.  Admin clicks Delete on an Attribute.

2\.  System checks if the Attribute is currently used by any Item Group or Catalog item.

3\.  If it's in use, system ~~warns Admin and asks for confirmation before deleting~~blocks the delete unless Admin overrides with a reason, which is logged.

4\.  ~~Once confirmed~~Once allowed, the Attribute moves to the Trash Bin instead of being permanently removed.

5\.  On override, the Attribute is unlinked from its Item Groups; sizes already recorded on past issuances are kept.

6\.  Admin opens the Trash Bin and can Restore the Attribute at any time (checks of NEW-04 apply), bringing back all its Values exactly as they were.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Attribute in use | Linked to an active Item Group | System ~~warns before allowing delete~~blocks delete unless Admin overrides with a reason (logged) |
| Restore an Attribute | Attribute exists in Trash Bin | Attribute and all its Values return to the active list |
| Override used | Admin overrides with a reason | Attribute unlinked from its Item Groups, past issuance values kept, override logged |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Attribute trashed | Admin ~~confirms~~deletes (or overrides) | Attribute removed from active list, moved to Trash Bin |
| Attribute restored | Admin restores it | Attribute reappears in the active Attributes list with all Values intact |

## **Use Case**

Admin deletes an old 'MATERIAL' Attribute that's no longer needed, then restores it a week later when it turns out it was still needed.

## **UI/UX**

* Same shared Trash Bin screen (NEW-04) used across the system, with a filter to show Attributes specifically

## **Non-Functional Requirements**

* Deleting must never permanently erase data without passing through the Trash Bin

## **Definition of Done**

* Delete moves the Attribute (with its Values) to the Trash Bin

* Restore brings it back completely intact

* In-use ~~warning shown before delete~~block with logged override enforced

# **BD-I452  —  Add a New Item Group**

 **MODIFIED    Epic:** Item Groups Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: New checkbox 'Requires gender match' for clothing and footwear groups. If ticked, the GENDER Attribute must be assigned; at issuance the variant gender must match the employee's gender or be Unisex.  (Rules 5\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to create a new Item Group and choose which Attributes belong to it

**SO THAT**  items in this group automatically show the right options (like Size or Color)

## **Story Dependencies**

* Attributes must already exist (~~Epic 2~~BD-I447)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Code | Text | e.g. GLOVES | Required, unique |
| Name (English) | Text | e.g. Gloves | Required |
| Name (Arabic) | Text | e.g. قفازات | Optional |
| Assigned Attributes | Multi-select (checkboxes) | e.g. Size, Color, Gender | Optional, choose zero or more |
| Requires gender match | Checkbox | Ticked / unticked | Optional, for clothing and footwear groups. If ticked, the GENDER Attribute must be assigned |

## **Logic Workflow**

1\.  Admin opens 'Add Item Group' and types the Code and Name.

2\.  Admin ticks the checkboxes for any Attributes that should apply to items in this group (e.g. Size, Color).

3\.  For clothing and footwear groups, Admin can tick 'Requires gender match'; the system then requires the GENDER Attribute to be assigned.

4\.  Admin saves the Item Group.

5\.  System checks the Code is unique.

6\.  The new Item Group becomes available for Catalog items to use.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Duplicate Code | Admin types GLOVES which already exists | System blocks save |
| No Attributes selected | Admin saves without ticking any Attribute | Allowed, but no extra fields will show for items in this group |
| Gender match without GENDER | Admin ticks 'Requires gender match' but GENDER is not assigned | System blocks save and asks to assign GENDER |
| Gender match at issuance | Group requires match | At issuance (BD-I467) the variant gender must equal the employee's gender or be Unisex |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item Group saved | Unique Code, valid Name | New Item Group appears in the list and is ready to use in the Catalog |

## **Use Case**

Admin creates the 'GLOVES' Item Group and ticks Size and Color, so every glove item will show those two fields automatically.

## **UI/UX**

* Simple checklist for Assigned Attributes, easy to tick on mobile or desktop

## **Non-Functional Requirements**

* Linked Attributes must reflect instantly on the Catalog item form

## **Definition of Done**

* Item Group and its Assigned Attributes save correctly

* Code uniqueness enforced

* Attribute checklist works correctly

* 'Requires gender match' saves and forces the GENDER Attribute when ticked

# **BD-I453  —  Edit an Item Group**

 **MODIFIED    Epic:** Item Groups Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Unticking an Attribute that items already use needs a reason and the cleared values are logged. Same 'Requires gender match' behavior as BD-I452.  (Rules 3, 5\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to edit an Item Group's name or change which Attributes are linked to it

**SO THAT**  the group always shows the correct fields for its items

## **Story Dependencies**

* Item Group must already exist (BD-I452)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item Group to Edit | Selection | Pick from list | Required |
| Name (EN/AR) | Text | Editable | Optional to change |
| Assigned Attributes | Multi-select | Add or remove ticks | Optional to change |
| Requires gender match | Checkbox | Ticked / unticked | Same rules as BD-I452 |
| Reason | Text | Reason entered by Admin | Required when removing an Attribute that items already use |

## **Logic Workflow**

1\.  Admin opens an existing Item Group.

2\.  Admin edits the Name or changes the ticked Attributes.

3\.  Admin saves.

4\.  If Admin removes an Attribute that items already have values for, system ~~asks for confirmation before clearing those values~~requires a reason and logs the cleared values.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Removing a linked Attribute with existing values | Items already have Color values saved, Admin unticks Color | System ~~asks for confirmation before clearing those saved values~~asks for a reason, clears the values and logs them |
| Edit Name only | Admin renames 'GLOVES' to 'Hand Protection' | Change saved everywhere it's used |
| Requires gender match | Admin ticks it without the GENDER Attribute | System blocks save, same as BD-I452 |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Edit saved | Valid changes made | Item Group updated, Catalog forms reflect new Attribute list |

## **Use Case**

Admin adds the 'Gender' Attribute to the existing 'CLOTHING' Item Group so all clothing items now also show a Gender field.

## **UI/UX**

* Same layout as Add screen, pre-filled with current data

## **Non-Functional Requirements**

* Confirmation prompt and reason field must be clear about what data will be affected

## **Definition of Done**

* Editing Name and Assigned Attributes works correctly

* Confirmation shown with a required reason before clearing existing values; cleared values are logged

* Changes reflect immediately on the Catalog form

# **BD-I454  —  View and Filter the Item Groups List**

 **MODIFIED    Epic:** Item Groups Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Toggling off an in-use group is blocked unless Admin overrides with a reason.  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to see all Item Groups in one list, search/filter them, and turn them Active or Inactive directly from the list

**SO THAT**  I can manage them quickly without opening each one

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Search Text | Text | Search by Code or Name | Optional |
| Status Filter | Selection | All / Active / Inactive | Optional |
| Active/Inactive Toggle | Toggle (in Actions column) | On/Off switch per row | Available directly in the list |
| Override reason | Text | Reason entered by Admin | Required to turn off an in-use Item Group |

## **Logic Workflow**

1\.  Admin opens the Item Groups list.

2\.  Admin can search by Code or Name and filter by status.

3\.  Each row shows a toggle switch in the Actions column to activate/deactivate directly.

4\.  System blocks turning off an Item Group that is still assigned to an active Catalog item, unless Admin ~~confirms an override~~overrides with a reason, which is logged.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Toggle off an Item Group in use | Item Group assigned to an active Catalog item | System ~~warns and asks for confirmation~~blocks it unless Admin overrides with a reason (logged) |
| Toggle off unused Item Group | No active Catalog items use it | Turns off immediately |
| Search matches | Admin types 'HELMET' | List shows only matching Item Groups |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List displayed | Item Groups exist | Filtered, searchable list shown with working toggle switches |

## **Use Case**

Admin searches 'CLOTHING' in the Item Groups list and reviews its Active status at a glance.

## **UI/UX**

* Toggle switch in the Actions column, same style as the Attributes list for consistency

## **Non-Functional Requirements**

* List should load quickly even with many Item Groups

## **Definition of Done**

* Search and filter work correctly

* Toggle switch changes status immediately

* In-use protection enforced before turning off (block, override with a logged reason)

# **BD-I455  —  View Item Group Details**

 **MODIFIED    Epic:** Item Groups Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: The 'used by' list of Catalog items excludes trashed records. |
| :---- |

**AS A**  Admin

**I WANT TO**  to open an Item Group and see all its information in one read-only screen

**SO THAT**  I can quickly check its setup without accidentally changing anything

## **Story Dependencies**

* Item Group must exist (BD-I452)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item Group to View | Selection | Pick from list | Required |

## **Logic Workflow**

1\.  Admin clicks on an Item Group from the list (or a 'View' action).

2\.  System shows a read-only screen with Code, Name (EN/AR), Status, and the list of Assigned Attributes.

3\.  Admin can see which Catalog items currently use this Item Group (trashed items are not listed).

4\.  Admin can go to Edit directly from this screen if changes are needed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item Group has linked items | 3 Catalog items use this Item Group | All 3 items are listed on the View screen |
| Item Group has no links | No items use it yet | View screen shows 'Not currently used' message |
| Linked item is in the Trash | Item Group used only by a trashed item | Trashed item is not listed |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Details shown | Item Group exists | Full read-only view of the Item Group and its Attributes displayed |

## **Use Case**

Admin opens 'GLOVES' Item Group to see it has Size and Color attached, and that 12 Catalog items are using it.

## **UI/UX**

* Clean read-only layout with a clear Edit button

## **Non-Functional Requirements**

* View screen should load instantly

## **Definition of Done**

* View screen shows all details correctly

* Linked Catalog items are listed, excluding trashed ones

* Edit button available from the View screen

# **BD-I456  —  Move an Item Group to Trash and Restore It**

 **MODIFIED    Epic:** Item Groups Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Changed from warn-only to block-unless-override (reason logged). Restore follows NEW-04.  (Rules 3, 14\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to delete an Item Group by moving it to the Trash Bin, and restore it if needed

**SO THAT**  I don't lose a group setup by mistake

## **Story Dependencies**

* Item Group must exist (BD-I452); Trash Bin screen: NEW-04

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item Group to Delete | Selection | Pick from list | Required |
| Override reason | Text | Reason entered by Admin | Required when the group is in use |
| Item Group to Restore | Selection | Pick from Trash Bin | Required when restoring |

## **Logic Workflow**

1\.  Admin clicks Delete on an Item Group.

2\.  System checks if it's currently assigned to any active Catalog item.

3\.  If in use, system ~~warns Admin and asks for confirmation before deleting~~blocks the delete unless Admin overrides with a reason, which is logged.

4\.  ~~Once confirmed~~Once allowed, the Item Group moves to the Trash Bin instead of being permanently removed.

5\.  Admin can open the Trash Bin and Restore it at any time (checks of NEW-04 apply), with its Assigned Attributes intact.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item Group in use | Assigned to an active Catalog item | System ~~warns before allowing delete~~blocks delete unless Admin overrides with a reason (logged) |
| Restore an Item Group | Item Group exists in Trash Bin | Item Group returns to the active list with Assigned Attributes intact |
| Parent in Trash | Restore while an assigned Attribute is in the Trash | Blocked: restore the Attribute first (NEW-04) |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item Group trashed | Admin ~~confirms~~deletes (or overrides) | Removed from active list, moved to Trash Bin |
| Item Group restored | Admin restores it | Reappears in the active list, fully usable again |

## **Use Case**

Admin deletes an unused 'FOOTWEAR-OLD' Item Group, then restores it later after finding it was still referenced in an old report.

## **UI/UX**

* Same shared Trash Bin screen, filterable by Item Groups

## **Non-Functional Requirements**

* Deleting must never permanently erase data without passing through the Trash Bin

## **Definition of Done**

* Delete moves the Item Group to the Trash Bin

* Restore brings it back completely intact

* In-use ~~warning shown before delete~~block with logged override enforced

# **BD-I457  —  Add a New Warehouse/Location**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Required Stock Condition flag (New, Used, Scrap) replaces 'Used' and 'Scrap' as Location Types. Capacity Units is required (individual pieces or pairs) except on Scrap locations. Store Keeper assignment writes to the shared assignment table of BD-I462.  (Rules 4, 13, 16\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to add a new storage location with all its details

**SO THAT**  Store Keepers know exactly where to store and issue PPE from

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Location Code | Text | Unique, e.g. LOC-001 | Required |
| Location Name | Text | e.g. Clinic A — Fridge 2 | Required |
| Site | List | e.g. Main Campus | Required |
| Location Type | List | Central Warehouse, Site Store, Department Store, ~~Scrap, Used,~~ General | Required |
| Stock Condition | List | New / Used / Scrap | Required. Cannot be changed once the location holds stock |
| Description | Text | e.g. Upper shelf, west wall | Optional |
| Capacity Units | Number | e.g. 200 | ~~Optional~~Required (unit \= individual pieces or pairs), except on Scrap locations |
| Responsible Store Keeper(s) | Searchable multi-select | Search and pick one or more Store Keepers | Optional, can be assigned later. Saved to the shared assignment table of BD-I462 |
| Active | Toggle | On/Off | On by default |

## **Logic Workflow**

1\.  Admin opens 'Add Location' and fills the Location Code and Name.

2\.  Admin picks the Site and Location Type and the Stock Condition (New, Used or Scrap).

3\.  Admin ~~optionally adds a Description and Capacity Units~~optionally adds a Description and enters the Capacity Units (not required for Scrap locations).

4\.  Admin searches for and selects one or more Responsible Store Keeper(s) using the searchable dropdown.

5\.  Admin saves the location.

6\.  System checks the Location Code is unique.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Duplicate Location Code | Admin uses a code already used before | System blocks save |
| No Store Keeper assigned | Admin saves without picking a Store Keeper | Allowed, location is created but no Store Keeper can access it yet |
| Store Keeper search | Admin types 'Sam' in the Store Keeper field | List filters to show only matching Store Keepers |
| Missing Stock Condition | Admin saves without choosing New, Used or Scrap | System blocks save |
| Missing capacity | New- or Used-flag location saved without Capacity Units | System blocks save |
| Scrap location without capacity | Scrap-flag location saved without Capacity Units | Allowed |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Location saved | Valid unique code and name | New location appears in the list and is ready to receive stock |

## **Use Case**

Admin creates 'Clinic A — Fridge 2' as a General location with Stock Condition New on the Main Campus site, sets its capacity to 200 units, and assigns Sam Keeper as responsible.

## **UI/UX**

* Searchable dropdown for Store Keepers so Admin can type a name instead of scrolling a long list

* Clear grouping: Basic Info, Stock Condition, Description, Capacity, Store Keepers

## **Non-Functional Requirements**

* Store Keeper search should return results instantly as Admin types

## **Definition of Done**

* Location can be created with all fields including searchable Store Keeper assignment

* Location Code uniqueness enforced

* Multiple Store Keepers can be assigned to one Location

* Stock Condition is required; Capacity Units required except on Scrap locations

# **BD-I458  —  Edit a Location**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Stock Condition cannot change once the location holds stock. Lowering capacity below current stock shows a warning. Store Keeper changes use the shared assignment table and are logged with before/after values.  (Rules 4, 13\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to edit a Location's details or change its assigned Store Keeper(s)

**SO THAT**  location information always stays accurate

## **Story Dependencies**

* Location must already exist (BD-I457)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Location to Edit | Selection | Pick from list | Required |
| Any field | Various | Same as Add Location form | Editable, except Location Code once stock exists and Stock Condition once the location holds stock |
| Responsible Store Keeper(s) | Searchable multi-select | Add or remove Store Keepers | Optional to change |

## **Logic Workflow**

1\.  Admin opens an existing Location.

2\.  Admin edits any field, or adds/removes Responsible Store Keeper(s).

3\.  If capacity is lowered below the stock currently held, the system shows a non-blocking warning.

4\.  Admin saves the changes.

5\.  System logs the change, especially any change to Store Keeper assignment, with before/after values. Assignments are saved to the shared table of BD-I462.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Change Store Keeper assignment | Admin adds Sara Keeper to a Location | Sara now sees and can act on this Location after saving |
| Remove all Store Keepers | Admin removes every Store Keeper from a Location | Location has no responsible Store Keeper until reassigned |
| Change Stock Condition | Location already holds stock | Blocked |
| Lower capacity below stock | Capacity set to 100 while 150 units are held | Warning shown, save allowed |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Edit saved | Valid changes made | Location updated, Store Keeper access updated immediately |

## **Use Case**

Admin updates the Capacity Units for 'Cairo Main Store' after a shelving upgrade, and adds a second Store Keeper to help manage it.

## **UI/UX**

* Same layout as Add screen, pre-filled with current data

## **Non-Functional Requirements**

* Every change to Store Keeper assignment must be logged with user, date, and before/after values

## **Definition of Done**

* Editing works for all fields

* Store Keeper assignment changes save and take effect immediately

* Changes are logged

* Stock Condition is locked once the location holds stock

# **BD-I459  —  View and Filter the Locations List**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Stock on hand is a hard block with no override. Scrap locations are exempt from the stock check. Also blocked when the location is the only one of an active item or has an open loan. Stock Condition filter added.  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to see all Locations in one list, search/filter them, and turn them Active or Inactive directly from the list

**SO THAT**  I can manage warehouses and stores quickly

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Search Text | Text | Search by Code or Name | Optional |
| Site Filter | Selection | Filter by Site | Optional |
| Location Type Filter | Selection | Filter by type | Optional |
| Stock Condition Filter | Selection | New / Used / Scrap | Optional |
| Status Filter | Selection | All / Active / Inactive | Optional |
| Active/Inactive Toggle | Toggle (in Actions column) | On/Off switch per row | Available directly in the list |

## **Logic Workflow**

1\.  Admin opens the Locations list.

2\.  Admin can search and filter by Site, Location Type, Stock Condition, or Status.

3\.  Each row shows a toggle switch in the Actions column to activate/deactivate directly.

4\.  System blocks turning off a Location that still holds stock (Quantity On Hand greater than zero), with no override~~, unless resolved first~~.

5\.  Scrap locations are exempt from the stock check (they permanently hold scrapped stock). The toggle is also blocked when the location is the only location of an active item or has an open loan.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Toggle off a Location with stock | Location has 50 units of PPE still stored | System blocks it until stock is moved out (no override) |
| Toggle off an empty Location | Location has zero stock | Turns off immediately |
| Filter by Site | Admin picks 'Main Campus' | List shows only Locations on that Site |
| Scrap location | Scrap-flag location holding scrapped stock | Can be turned off |
| Only location of an active item | Item is linked to no other location | Blocked |
| Open loan | Location has an open loan | Blocked |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List displayed | Locations exist | Filtered, searchable list shown with working toggle switches |

## **Use Case**

Admin filters the Locations list by 'Scrap' ~~type~~Stock Condition to review all scrap points across every site.

## **UI/UX**

* Toggle switch in the Actions column, consistent with Attributes and Item Groups lists

## **Non-Functional Requirements**

* List should load quickly even with many locations across many sites

## **Definition of Done**

* Search and filters work correctly

* Toggle switch changes status immediately

* Stock-on-hand protection rule enforced before turning off (hard block, no override; Scrap exempt)

* Open-loan and only-location blocks enforced

# **BD-I460  —  View Location Details**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Shows Stock Condition and capacity used (%). |
| :---- |

**AS A**  Admin

**I WANT TO**  to open a Location and see all its information in one read-only screen

**SO THAT**  I can quickly check its setup, capacity, and assigned Store Keepers

## **Story Dependencies**

* Location must exist (BD-I457)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Location to View | Selection | Pick from list | Required |

## **Logic Workflow**

1\.  Admin clicks on a Location from the list (or a 'View' action).

2\.  System shows a read-only screen with Code, Name, Site, Type, Stock Condition, Description, Capacity Units, capacity used (%), Status, and the list of Responsible Store Keeper(s).

3\.  Admin can see current stock quantity held at this Location.

4\.  Admin can go to Edit directly from this screen if changes are needed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Location has stock | Location currently holds PPE items | Current stock summary is shown on the View screen |
| Location has Store Keepers assigned | One or more Store Keepers are responsible | All are listed by name on the View screen |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Details shown | Location exists | Full read-only view of the Location, its capacity, and its Store Keepers displayed |

## **Use Case**

Admin opens 'Alexandria Site Store' to check its capacity, current stock level, and confirm which Store Keepers are responsible for it.

## **UI/UX**

* Clean read-only layout with a clear Edit button

## **Non-Functional Requirements**

* View screen should load instantly, even while pulling live stock numbers

## **Definition of Done**

* View screen shows all Location details correctly, including Stock Condition and capacity used (%)

* Current stock and assigned Store Keepers are shown

* Edit button available from the View screen

# **BD-I461  —  Move a Location to Trash and Restore It**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Hard block while stock is above zero (no override); Scrap locations exempt. Also blocked when the only location of an active item or with an open loan. Restore follows NEW-04.  (Rules 3, 14\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to delete a Location by moving it to the Trash Bin, and restore it if needed

**SO THAT**  I don't lose a warehouse's setup and history by mistake

## **Story Dependencies**

* Location must exist (BD-I457); Trash Bin screen: NEW-04

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Location to Delete | Selection | Pick from list | Required |
| Location to Restore | Selection | Pick from Trash Bin | Required when restoring |

## **Logic Workflow**

1\.  Admin clicks Delete on a Location.

2\.  System checks if the Location still holds any stock (Quantity On Hand greater than zero), is the only location of an active item, or has an open loan.

3\.  If it does, system blocks the delete until the stock is moved out or resolved (no override). Scrap locations are exempt from the stock check.

4\.  Once the Location is empty, deleting moves it to the Trash Bin instead of permanently removing it.

5\.  Admin can open the Trash Bin and Restore the Location at any time (code check of NEW-04 applies), with all its details and Store Keeper assignments intact.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Location has stock | Quantity On Hand is greater than zero | System blocks delete until stock is cleared (no override) |
| Location is empty | Zero stock at this Location | Delete allowed, moves to Trash Bin |
| Restore a Location | Location exists in Trash Bin | Location returns to the active list with all details intact |
| Scrap location | Scrap-flag location holding scrapped stock | Stock check does not apply |
| Only location of an active item | Item has no other location | Delete blocked |
| Open loan | Location has an open loan | Delete blocked |
| Code taken | Restore a Location whose code was reused | Admin must enter a new code first (NEW-04) |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Location trashed | Admin confirms delete on an empty Location | Removed from active list, moved to Trash Bin |
| Location restored | Admin restores it | Reappears in the active list, fully usable again |

## **Use Case**

Admin deletes a closed-down site's storage Location after confirming it's empty, then restores it months later when the site reopens.

## **UI/UX**

* Same shared Trash Bin screen, filterable by Locations

## **Non-Functional Requirements**

* Deleting must never permanently erase data without passing through the Trash Bin

## **Definition of Done**

* Delete blocked while stock remains (no override)

* Delete moves empty Location to the Trash Bin

* Restore brings it back completely intact, including Store Keeper assignments

# **BD-I462  —  Restrict Store Keeper Access to Specific Locations**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Becomes the second entry point to the single assignment table also used by BD-I457 and BD-I458. Either screen edits the same data and writes the same log.  (Rules 4\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to limit each Store Keeper to only see and work with certain warehouses

**SO THAT**  Store Keepers can only handle stock and issuing for the locations they are responsible for

## **Story Dependencies**

* Locations must already exist (~~Story 16~~BD-I457)

* Store Keeper user accounts must exist

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Store Keeper Account | Reference | Select user | Required |
| Assigned Location(s) | Multi-select | One or more locations | Required, at least one for the Store Keeper to work |

## **Logic Workflow**

1\.  Admin opens a Store Keeper's account.

2\.  Admin picks one or more locations and assigns them to that Store Keeper.

3\.  System saves the assignment and logs the change.

4\.  Next time the Store Keeper logs in, they only see and can work with their assigned location(s).

5\.  If Admin removes all locations from a Store Keeper, that Store Keeper cannot do any stock work until a new location is assigned.

6\.  This screen and the Location screens (BD-I457, BD-I458) edit the same assignment table and write the same log.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Store Keeper has no location | Store Keeper account has zero locations assigned | Store Keeper is blocked from issuing, stock in/out, and reports |
| Store Keeper has one location | Ahmed is assigned to 'Cairo Main Store' only | Ahmed only sees and works with Cairo Main Store |
| Admin or HSE Supervisor | Admin logs in | Admin sees and can work with all locations, no restriction |
| Same data from two screens | Assignment changed on the Location screen | Shown on the Store Keeper's account too, and the other way round, with one shared log |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Assignment saved | Valid locations linked to Store Keeper | Store Keeper's screens are now limited to those locations |

## **Use Case**

Admin assigns 'Alexandria Site Store' to Store Keeper Mona. From then on, Mona only sees Alexandria stock, issuance, and reports — nothing from other cities.

## **UI/UX**

* Simple checklist of locations next to each Store Keeper's name

## **Non-Functional Requirements**

* Every change to a Store Keeper's locations must be logged with date, time, and who made the change

## **Definition of Done**

* Store Keeper sees only assigned locations everywhere (stock, issuing, reports)

* Store Keeper blocked if no location assigned

* Admin/HSE Supervisor unaffected by this restriction

* Changes are logged

* One shared assignment table, editable from the Location screen or the user screen, same log

# **BD-I464  —  Transfer Stock Between Locations**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: 'New/Main Warehouse' replaced by Stock Condition rules: Used to New is blocked; anything out of Scrap is blocked; moving into Scrap only through returns (BD-I472) or Stock OUT (NEW-03). Destination must be linked to the item. Over-capacity gives a non-blocking warning.  (Rules 13\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  to move stock from one warehouse to another

**SO THAT**  each location has the right amount of PPE where it's needed

## **Story Dependencies**

* Both locations must exist and be linked to the item (the destination must be linked to the item)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item | Reference | Pick from Catalog | Required |
| From Location | Reference | Source location | Required, must be my assigned location |
| To Location | Reference | Destination location | Required |
| Quantity | Number | e.g. 30 | Required, more than zero |
| Batch | Reference | Which batch is moving | Required |

## **Logic Workflow**

1\.  Store Keeper picks the Item and the batch to move.

2\.  Store Keeper picks From Location and To Location.

3\.  Store Keeper enters the quantity and saves.

4\.  System reduces stock at the From Location and increases stock at the To Location.

5\.  System blocks the transfer ~~if moving from a Used location into a New/Main Warehouse (used items should not mix with new stock)~~by Stock Condition: Used to New is blocked, anything out of Scrap is blocked, and moving into Scrap happens only through returns (BD-I472) or Stock OUT (NEW-03), not transfers.

6\.  If the transfer takes the destination over its capacity, a non-blocking warning is shown.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Used to New transfer | Store Keeper tries to move stock from a Used\-flag location into a ~~Main Warehouse~~New-flag location | System blocks this transfer |
| Not enough stock | Store Keeper tries to transfer more than what's available | System blocks it |
| Valid transfer | Store Keeper moves 30 helmets from Cairo Main to Alexandria Site Store | Stock updates at both locations correctly |
| New to Used | Stock set aside for loans | Allowed |
| Out of Scrap | Store Keeper picks a Scrap-flag location as source | Blocked |
| Into Scrap | Store Keeper picks a Scrap-flag location as destination | Blocked; scrap stock comes only from returns and Stock OUT |
| Destination not linked | Item is not linked to the destination | Blocked |
| Over capacity | Destination would exceed capacity | Non-blocking warning, transfer allowed |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Transfer completed | Valid transfer between two allowed locations | Stock adjusted at both source and destination |

## **Use Case**

Store Keeper transfers 30 pairs of boots from Cairo Main Store to Alexandria Site Store to cover a shortage there.

## **UI/UX**

* Simple two-dropdown screen: From and To, with quantity field

## **Non-Functional Requirements**

* Transfer should be a single action — both locations update together, not separately

## **Definition of Done**

* Transfer updates both locations correctly

* Used-to-New rule is blocked; Scrap rules enforced; capacity warning shown

* Restricted to Store Keeper's assigned locations

# **BD-I466  —  View Stock Levels and Low Stock Alerts**

 **MODIFIED    Epic:** Locations Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Reserved removed. Available \= On Hand minus Quarantined. Low Stock uses the per-location Reorder Level, with a one-time in-app notification to the location's Store Keepers.  (Rules 9, 15\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  to see how much stock I have and get warned when it's running low

**SO THAT**  I can reorder PPE before we run out

## **Story Dependencies**

* Stock must exist through ~~Opening Balance or Stock In~~NEW-01 (Opening Balance) and NEW-02 (Stock IN)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Location Filter | Selection | My assigned locations | Optional |
| Item Filter | Selection | Any catalog item | Optional |

## **Logic Workflow**

1\.  Store Keeper opens the Stock Levels screen.

2\.  System shows quantity On Hand~~, Reserved,~~ and Available (On Hand minus Quarantined) for each item at each of the Store Keeper's locations.

3\.  Items ~~below their minimum (Reorder Level)~~whose Available quantity is below the Reorder Level set for that location are shown with a Low Stock warning.

4\.  The first time stock drops below the level, an in-app notification goes to the Store Keepers of that location. No repeat until stock recovers above the level.

5\.  Store Keeper can filter by item or location.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Stock below minimum | Available quantity is less than the Reorder Level of that location | Item shows a Low Stock flag |
| Store Keeper with restricted access | Store Keeper only assigned to one location | Only that location's stock is shown |
| First drop below level | Available falls below the Reorder Level | One in-app notification to the location's Store Keepers; no repeat until stock recovers above the level |
| Quarantined stock | A batch is quarantined | Counts in On Hand, not in Available |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Stock list shown | Any stock exists | List of items with quantities and Low Stock flags where relevant |

## **Use Case**

Store Keeper checks the stock screen and sees 'Safety Gloves' is flagged Low Stock at Cairo Main Store, so they plan a new Stock In.

## **UI/UX**

* Clear color flag (like red or yellow) for Low Stock items

* Simple filter dropdowns at the top

## **Non-Functional Requirements**

* Screen should load quickly even with thousands of stock lines

## **Definition of Done**

* Stock levels display correctly with Available~~/Reserved~~/On Hand

* Low Stock flag shows accurately

* Restricted to Store Keeper's own locations

* Low Stock notification fires once per drop below the level

# **BD-I467  —  Issue a Single PPE Item to an Employee**

 **MODIFIED    Epic:** PPE Issuance     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Quantity added. Variant comes from the Item Group's Attributes and must be Active; gender-match check when the group requires it. Condition at Issue (New/Reused) set from the location's Stock Condition. Optional 'Replaces issuance' link. Inactive or trashed items cannot be selected. Both signatures stay required.  (Rules 2, 5, 12, 17\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  to give a PPE item to an employee and record it in the system

**SO THAT**  we know exactly who has which PPE and when it needs to be replaced

## **Story Dependencies**

* Employee must exist in Employee Master

* Item must have available stock at my location

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Employee | Reference | Pick from Employee list | Required |
| Item | Reference | Pick from Catalog | Required. Inactive or trashed items cannot be selected |
| Quantity | Number | 1 | Required, default 1, cannot exceed Available at the location |
| ~~Size/Color~~Variant | Selection | ~~If item has variants~~From the Item Group's Attributes | Required if applicable, must be Active~~, must match employee's gender for clothing~~. If the group requires gender match, the variant gender must equal the employee's gender or be Unisex |
| Batch | Reference | Auto-suggested (oldest first) | Required, can be changed with a reason |
| Issue Date | Date | Today's date | Required |
| Condition at Issue | Fixed | New / Reused | Set automatically from the location's Stock Condition |
| Replaces issuance | Reference | Employee's existing issuance of the same item | Optional. System suggests it if the employee already holds the item; the old item is returned in the same flow |
| Signatures | Signature | Store Keeper and Employee | Both required before completing |

## **Logic Workflow**

1\.  Store Keeper selects the Employee and the Item to give.

2\.  System suggests the oldest available batch of that item first.

3\.  Store Keeper confirms the ~~Size~~Variant and Quantity if needed.

4\.  If the Item Group requires gender match, the system checks the variant gender against the employee's gender (or Unisex) and blocks the issue otherwise.

5\.  If the employee already holds the same item, the system suggests 'Replaces issuance'; the old item is returned in the same flow.

6\.  System calculates the Expected Replacement Date automatically (Issue Date \+ item's Lifespan).

7\.  Store Keeper and Employee both sign on the screen (touchscreen or tablet).

8\.  Store Keeper completes the issuance.

9\.  System reduces the stock quantity by the issued quantity and adds this item to the employee's active PPE list.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| No stock available | Requested item has zero stock at this location | System blocks issuance |
| Missing signature | Employee or Store Keeper signature not captured | Issuance cannot be marked Complete |
| Quantity above Available | Quantity larger than Available at the location | System blocks issuance |
| Gender mismatch | Group requires match, variant is Male, employee is Female | Issuance blocked |
| Inactive variant | Variant is inactive | Not selectable |
| Inactive or trashed item | Store Keeper searches for it | Not selectable |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Issuance completed | Stock available, both signatures given | Item appears in employee's My PPE list, stock reduced, expiry clock starts |
| Issuance blocked | No stock available | System shows the reason; no record created |

## **Use Case**

Store Keeper gives a new helmet to employee Ahmed, both sign on the tablet, and the system marks Ahmed's replacement date as 6 months from today.

## **UI/UX**

* Simple step-by-step screen: pick employee, pick item, confirm ~~size~~variant and quantity, sign, done

* Big clear signature boxes for tablet use

## **Non-Functional Requirements**

* Signature capture must work smoothly on tablets and touchscreens

## **Definition of Done**

* Issuance reduces stock and updates employee record correctly

* Expected Replacement Date auto-calculates

* Both signatures required before completion

* Quantity, variant, gender-match check and Condition at Issue work; 'Replaces issuance' link works

# **BD-I468  —  Auto-Suggest and Issue a Job-Specific Kit**

 **MODIFIED    Epic:** PPE Issuance     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: An out-of-stock item is skipped and listed on the receipt as 'Not issued \- out of stock'; no request is created. Variant step per employee (pre-filled with the last size) with the gender-match check. Items already held are flagged. One pair of signatures (Store Keeper \+ recipient) covers the whole Kit.  (Rules 1, 2, 7, 17\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  the system to automatically suggest the right group of PPE items (Kit) based on the employee's job

**SO THAT**  I can give employees all their required PPE in one go, without picking items one by one

## **Story Dependencies**

* A Kit must already be set up for the employee's Job Position (~~Story 29~~BD-I469)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Employee | Reference | Pick from Employee list | Required |
| Kit (auto-suggested) | Reference | System suggests based on Employee's Job Position | Auto, editable |
| Line Items to Adjust | Selection | Add/remove items just for this issuance | Optional |
| Variant per employee | Selection | Pre-filled with the size the employee last received for that item | Required where the item has Attributes; gender-match check as in BD-I467 |
| Signature | Signature | ~~One signature covers the whole Kit~~One Store Keeper and one recipient signature cover the whole Kit | Required |

## **Logic Workflow**

1\.  Store Keeper selects the Employee.

2\.  System looks up the Employee's Job Position and suggests the matching active Kit(s).

3\.  If more than one Kit matches, Store Keeper is asked to pick the right one.

4\.  Store Keeper can accept the Kit as-is, or add/remove items just for this one issuance (this doesn't change the Kit itself).

5\.  Store Keeper confirms the variant for each item (pre-filled with the size the employee last received); the gender-match check of BD-I467 applies.

6\.  System checks stock for every item in the Kit and flags items the employee already holds ('Held, replacement due on \[date\]'); the Store Keeper skips them or issues them as a replacement.

7\.  Store Keeper issues everything available in one transaction with ~~one signature~~one Store Keeper and one recipient signature.

8\.  ~~Any item that's out of stock automatically becomes an open request instead of blocking the rest.~~An out-of-stock item is skipped and listed on the receipt as 'Not issued \- out of stock'. No request is created. The Store Keeper can issue the rest or cancel.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| No Kit for Position | Employee's Job Position has no active Kit | Store Keeper falls back to issuing items one by one |
| Multiple Kits for Position | Two active Kits exist for 'Electrical Engineer' | Store Keeper is prompted to choose which one |
| One item out of stock in the Kit | Kit has 5 items, 1 is out of stock | The other 4 are issued normally, the 5th ~~becomes an open request~~is listed as 'Not issued \- out of stock' (no request is created) |
| Item already held | Employee holds an item of the Kit | Flagged 'Held, replacement due on \[date\]'; skipped or issued as a replacement |
| Gender mismatch | Group requires match and variant gender differs | That item is blocked |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Kit issued | Stock available for items | All available Kit items issued in one transaction, ~~one signature~~one signature pair, in the employee's record |
| Partial issue | Some items out of stock | Available items issued, missing ones ~~become a request~~listed as 'Not issued \- out of stock', no request created |

## **Use Case**

Store Keeper selects new hire Sara, system suggests the 'Electrical Engineer Kit' (helmet, gloves, boots), Store Keeper issues all 3 in one click with one ~~signature~~signature pair.

## **UI/UX**

* Kit shown as a checklist with each item and its stock status, plus a variant step per employee

* One-click 'Issue Kit' button after review

## **Non-Functional Requirements**

* Kit suggestion must appear instantly after picking the employee

## **Definition of Done**

* Correct Kit auto-suggested by Job Position

* Multiple Kit choice prompt works

* Partial issuance ~~with auto sub-request works~~with 'Not issued \- out of stock' listing works (no request created)

* Single ~~signature~~signature pair (Store Keeper \+ recipient) covers the whole Kit but each item is tracked individually

# **BD-I469  —  Add a New Job-Specific Kit**

 **MODIFIED    Epic:** Kit Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Quantity per Kit line (default 1). Default Size/Color is only a suggestion; the real variant is chosen per employee at issuance. 'Recent issuance' \= last 90 days (NEW-06). Deactivating the only active Kit with recent issuances is blocked unless Admin overrides with a reason. Only Active items can be added.  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to build a group (Kit) of PPE items for a specific job, like 'Electrical Engineer Kit'

**SO THAT**  Store Keepers can issue all needed items for that job in one go

## **Story Dependencies**

* Catalog items must exist (~~Story 1~~BD-I443)

* Job Positions must exist in Employee Master

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Kit Name (EN/AR) | Text | e.g. Electrical Engineer Kit | Required, unique |
| Job Position | Reference | From Employee Master list | Required |
| Kit Line Items | List | Catalog items \+ quantity (default 1\) \+ default size/color (a suggestion only) | Required, at least one item. Only Active items can be added |
| Active/Inactive | Toggle | On/Off | Controls if it's used for suggestions |
| Override reason | Text | Reason entered by Admin | Required to deactivate the only active Kit of a Position with recent issuances |

## **Logic Workflow**

1\.  Admin opens 'Create New Kit' screen.

2\.  Admin names the Kit and picks the Job Position it belongs to.

3\.  Admin adds one or more Catalog items as Kit line items, with a quantity (default 1\) and default Size/Color if needed as a suggestion; the real variant is chosen per employee at issuance.

4\.  Admin activates the Kit.

5\.  More than one Kit can be active for the same Job Position (for example, summer and winter versions).

6\.  Admin cannot deactivate a Kit if it's the only active one for a Position that had a recent issuance (last 90 days, set in NEW-06), unless ~~they confirm an override~~an Admin overrides with a reason, which is logged.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Kit with no items | Admin tries to save a Kit with zero line items | System blocks save |
| Deactivating the only Kit for a Position | Position has one active Kit that was recently used | System blocks unless Admin ~~confirms override~~overrides with a reason (logged) |
| Multiple Kits for same Position | Admin creates a second Kit for 'Electrical Engineer' | Allowed, Store Keeper will be asked to choose at issuance |
| Inactive or trashed item | Admin searches for it to add to the Kit | Not selectable |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Kit saved | Valid Kit with items and Job Position | Kit becomes available for auto-suggestion at issuance |

## **Use Case**

Admin builds 'Electrical Engineer Kit' with helmet, gloves, and insulated boots, links it to the 'Electrical Engineer' Job Position, and activates it.

## **UI/UX**

* Simple builder screen: add items to a list like a shopping cart

## **Non-Functional Requirements**

* Kit setup changes should reflect immediately in the issuance screen

## **Definition of Done**

* Kits can be created, edited, deactivated

* Line items save with quantity and defaults

* Deactivation rule for sole active Kit enforced (block, override with a logged reason)

# **BD-I470  —  Issue PPE as a Loan to a Visitor/Contractor**

 **MODIFIED    Epic:** PPE Issuance     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Rewritten as a multi-line, signed loan with loan number LN-YYYY-NNNNN. Missing step 4 restored (stock deduction and loan record). Overdue: one notification to the Host Employee and the location's Store Keepers, then the loan stays in the Open Loans list (NEW-08) in red.  (Rules 2, 8\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  to give PPE to a visitor or contractor for a short time and track it as a loan

**SO THAT**  we can make sure loaned items come back and are not lost

## **Story Dependencies**

* Item must have stock, preferably at a Used-~~type~~flag location

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| ~~Item~~Loan lines: Item (one or more) | Reference | Pick from Catalog | Required, at least one line |
| Variant (per line) | Selection | From the Item Group's Attributes | Required where the item has Attributes |
| Quantity (per line) | Number | e.g. 2 | Required, cannot exceed Available at the From Location |
| From Location (per line) | Reference | Default: a Used-flag location | Any assigned location allowed when no used stock exists |
| Recipient Name | Text | Visitor/contractor's name | Required |
| Recipient Company | Text | Their company name | Required |
| Host Employee (Visit Directed To) | Reference | Employee they are visiting | Required |
| Issue/Delivery Date | Date | Today's date | Required |
| Expected Return Date | Date | When they should return it | Required |
| Signatures | Signature | Store Keeper and recipient | Both required |

## **Logic Workflow**

1\.  Store Keeper fills in the ~~Item,~~ Recipient details, and Host Employee, then adds one or more lines (Item, Variant, Quantity).

2\.  System defaults ~~the item's source~~each line's From Location to a Used-~~type~~flag location, but Store Keeper can pick another allowed location if needed.

3\.  Store Keeper sets the Issue Date and Expected Return Date.

4\.  Store Keeper and recipient both sign.

5\.  System deducts the quantities from the chosen location(s) and creates the loan record (LN-YYYY-NNNNN), tracked until returned.

6\.  If the Expected Return Date passes and ~~the item isn't~~any line isn't returned yet, ~~system reminds the Host Employee~~the loan becomes Overdue, the Host Employee gets a notification and the location's Store Keepers get an in-app notice (one notification, then the loan stays in the Open Loans list in red).

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| No Used stock available | No stock in Used-~~type~~flag location | Store Keeper may pick any other Assigned Location for that item |
| Expected Return Date passed | Return date passed with no Actual Return Date recorded | System ~~sends a reminder to the Host Employee and marks the loan as Overdue~~marks the loan Overdue and notifies the Host Employee and the location's Store Keepers once |
| Missing signature | Store Keeper or recipient has not signed | Loan cannot be completed |
| Quantity above Available | Line quantity larger than Available | Blocked |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Loan recorded | Valid loan details entered | ~~loan tracked as Overdue if not returned on time~~Loan record LN-YYYY-NNNNN created, stock deducted, tracked until returned and marked Overdue if not returned on time |

## **Use Case**

Store Keeper issues a helmet and vest to a visiting contractor from 'ABC Construction', hosted by employee Omar, expected back by end of day; both parties sign.

## **UI/UX**

* Simple form matching the fields the client already uses (bilingual labels), with a line grid for items

## **Definition of Done**

* Loan issuance form captures all required fields, including multiple lines and both signatures

* ~~Overdue reminder sent to Host Employee automatically~~Loan number generated, stock deducted, Overdue notification sent once to Host Employee and location Store Keepers

# **BD-I471  —  Return a Loaned Item**

 **MODIFIED    Epic:** PPE Issuance     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Return per line with partial returns allowed. Conditions Good / Damaged / Lost. Good goes back to a Used-flag location of the same site as Reused, never New stock. Damaged follows the auto-scrap of BD-I472. Lost closes the line with no stock movement and is logged. Both parties sign each return; the loan closes when every line is closed.  (Rules 2, 8, 13\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  to record when a visitor or contractor returns their loaned PPE

**SO THAT**  the item goes back into stock correctly and the loan is closed

## **Story Dependencies**

* A Loan Issuance must already exist (BD-I470)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Loan to Close | Reference | Pick the open loan | Required |
| Line to return | Selection | One or more loan lines | Required; partial returns allowed |
| Actual Return Date | Date | Today's date | Required |
| Condition on Return | Selection | Good / Damaged / Lost | Required, per line |
| Signatures | Signature | Store Keeper and recipient | Both sign each return |

## **Logic Workflow**

1\.  Store Keeper finds the open loan (from the Open Loans list, NEW-08) and records the Actual Return Date for each returned line.

2\.  Store Keeper marks the condition of ~~the returned item~~each returned line: Good, Damaged or Lost.

3\.  If the item is reusable, it goes back into stock as Reused~~/Refurbished~~ at a Used-~~type Location~~flag location of the same site, not mixed with New stock.

4\.  If damaged, item follows the ~~damage/scrap process instead~~same auto-scrap as BD-I472 (Scrap-flag location, never issued again).

5\.  If Lost, the line closes with no stock movement and the event is logged.

6\.  Both parties sign each return.

7\.  ~~The loan is now closed.~~The loan closes when every line is closed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item returned in good condition | Item can be reused | Goes to Reused stock at a Used-flag location of the same site |
| Item returned damaged | Item can't be reused | Follows scrap process |
| Item lost | Condition Lost | Line closes with no stock movement, logged |
| Partial return | 1 of 2 lines returned | Loan stays open (Partially Returned) until every line is closed |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Loan closed | Return recorded | Item returned to correct stock pool, loan marked as closed once every line is closed |

## **Use Case**

Contractor returns the helmet in good shape at the end of the visit; Store Keeper records it, and it goes back into the Reused stock pool for future loans.

## **UI/UX**

* Simple 'Close Loan' button with condition selection per line

## **Non-Functional Requirements**

* Returned stock must be clearly separated from New stock in reports

## **Definition of Done**

* Loan can be closed with return date and condition per line, with signatures

* Reusable items go to correct Used-location stock pool

* Damaged items route to scrap process

* Lost lines close without stock movement; the loan closes when every line is closed

# **BD-I472  —  Return Item and Auto-Scrap if Damaged**

 **MODIFIED    Epic:** PPE Issuance     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Removed the 'replacement request created directly' for Lost; Lost simply closes the issuance as Lost and a replacement is a normal issue through BD-I467. Partial quantity returns allowed. Good returns go to a Used-flag location of the same site as Reused. Damaged or Worn Out go to the Scrap-flag location of the same site; if none exists the return is blocked. Both parties sign.  (Rules 2, 7, 13\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  to record the condition of a PPE item when an employee returns it, and have damaged items automatically removed from usable stock

**SO THAT**  we never accidentally reuse broken or unsafe PPE

## **Story Dependencies**

* Employee must have an active issuance for the item

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item Being Returned | Reference | Employee's active issuance | Required |
| Quantity returned | Number | e.g. 1 | Required, cannot exceed the quantity held; partial returns allowed |
| Condition | Selection | Good / Damaged / Worn Out / Lost | Required |
| Physical Receipt Confirmation | Checkbox | Only for Damaged/Worn Out | Required if Condition is Damaged or Worn Out |
| Signatures | Signature | Store Keeper and employee | Both required |

## **Logic Workflow**

1\.  Employee returns the item to the Store Keeper.

2\.  Store Keeper selects the Condition: Good, Damaged, Worn Out, or Lost, and the quantity returned.

3\.  If Damaged or Worn Out, Store Keeper confirms they physically received the item back.

4\.  Once confirmed, the system automatically moves that item's batch quantity to ~~a Scrap Location~~the Scrap-flag location of the same site and marks it Scrapped — it can never be issued again. If the site has no Scrap-flag location, the return is blocked with a clear message.

5\.  If Lost, no physical item exists, so no receipt confirmation is needed — ~~it goes straight to being replaced~~the issuance simply closes as Lost; a replacement is a normal issue through BD-I467.

6\.  If Good, the item goes to a Used-flag location of the same site as Reused.

7\.  Store Keeper and employee both sign the return.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Condition \= Good | Item returned in working order | Item ~~can go back into usable stock (reused/refurbished)~~goes to a Used-flag location of the same site as Reused |
| Condition \= Damaged/Worn Out | Store Keeper confirms physical receipt | System auto-scraps the item, removes it from available stock |
| Condition \= Lost | No item to receive | No scrap step needed, ~~replacement request created directly~~the issuance closes as Lost and no request is created |
| No Scrap location at the site | Damaged or Worn Out return | Return blocked with a clear message |
| Partial return | Employee returns 1 of 2 pairs | Only the returned quantity is processed; the rest stays issued |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Return recorded, item scrapped | Damaged/Worn Out with confirmed receipt | Item quantity moved to Scrap Location, marked Scrapped |
| Return recorded, no scrap | Lost | No scrap posting, ~~replacement request created directly~~issuance closed as Lost |

## **Use Case**

Employee returns torn gloves; Store Keeper marks 'Worn Out', confirms receiving them, and the system automatically scraps that quantity ~~and starts a replacement request~~.

## **UI/UX**

* Simple 4-option condition selector with icons (Good/Damaged/Worn Out/Lost)

## **Non-Functional Requirements**

* Every scrap action must be logged with user, date, and reason for audit

## **Definition of Done**

* Condition capture works for all 4 options

* Damaged/Worn Out auto-scraps correctly after confirmation

* Lost skips the scrap step and ~~goes to replacement~~closes the issuance as Lost

* Every scrap event is logged

* Partial returns, Used-flag routing for Good and both signatures work

# **BD-I473  —  ~~Request and Approve PPE Replacement~~Send Replacement Reminders**

 **MODIFIED    Epic:** PPE Issuance     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Retitled (it has no request or approval step). Recipients: the employee (email) and the Store Keepers of the issuing location (in-app \+ email), replacing 'PPE Officer'. Lead time comes from NEW-06 per site (default 14 days); the 'per item category' wording is removed. Terminated and Transferred employees are excluded. The Upcoming/Overdue dashboard becomes NEW-07.  (Rules 7, 11, 15\) |
| :---- |

**AS A**  System

**I WANT TO**  to automatically remind both the ~~PPE Officer~~Store Keepers of the issuing location and the Employee before an issued item reaches its replacement date

**SO THAT**  PPE gets replaced on time and nobody wears expired safety gear

## **Story Dependencies**

* Item must be issued to an employee with a calculated Expected Replacement Date (~~Story 4, 27~~BD-I445, BD-I467); lead time from NEW-06

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Lead Time (days before expiry) | Number | e.g. 14 days | ~~Configurable per client/site~~Set per site in NEW-06 (default 14 days) |
| Employee Email | Reference | From Employee Master | Required for employee reminder |
| ~~PPE Officer/Store Keeper~~Store Keepers of the issuing location | Reference | Responsible for that site/location | Required for ~~officer~~Store Keeper reminder |

## **Logic Workflow**

1\.  System checks every issued item every night against its Expected Replacement Date.

2\.  When an item is within the configured number of days before its replacement date, the system sends: an in-app message and email to the ~~PPE Officer/Store Keeper~~Store Keepers of the issuing location, and an email to the Employee.

3\.  Only one reminder is sent per item (no repeated nagging).

4\.  The item still shows as 'Upcoming' or 'Overdue' on the ~~dashboard~~Replacements Due screen (NEW-07) until it's actually replaced or returned.

5\.  Employees with status Terminated or Transferred are excluded from reminders.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Reminder date reached | Item is 14 days from its replacement date (configured lead time) | Both ~~PPE Officer~~Store Keepers and Employee get notified |
| Employee has no email on file | Email field is empty in Employee Master | System logs the failure, but still sends the ~~PPE Officer~~Store Keeper notification |
| Item already replaced | Employee already got a new item before the reminder date | No reminder needed, item removed from Upcoming/Overdue list |
| Terminated or Transferred employee | Status in Employee Master | No reminder sent |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Reminder sent | Item reaches lead time threshold | ~~PPE Officer~~Store Keepers get in-app \+ email, Employee gets email |
| Reminder partly failed | Employee has no email | ~~PPE Officer~~Store Keepers still notified, failure logged |

## **Use Case**

Ahmed's gloves are due for replacement in 14 days. The system emails Ahmed and also emails/notifies the Store Keeper so he can prepare a new pair.

## **UI/UX**

* ~~Dashboard clearly shows~~Replacements Due screen (NEW-07) clearly shows 'Upcoming' (yellow) and 'Overdue' (red) items

## **Non-Functional Requirements**

* Reminder lead time must be configurable per site ~~or item category~~, not hardcoded

* Reminder job should run automatically every night without manual action

## **Definition of Done**

* Reminders sent automatically at the configured lead time

* Both ~~PPE Officer~~Store Keepers and Employee notified correctly

* Single reminder only, no repeats

* ~~Dashboard~~Replacements Due screen reflects Upcoming/Overdue status correctly

# **BD-I475  —  View and Filter the PPE Catalog List**

 **MODIFIED    Epic:** PPE Catalog Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Toggle follows BD-I444 (blocked unless override with reason). The single Low Stock indicator becomes 'Low at N locations', based on the per-location Reorder Level.  (Rules 3, 15\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to see all PPE items in one list, search/filter them, and turn them Active or Inactive directly from the list

**SO THAT**  I can manage the whole catalog quickly without opening each item

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Search Text | Text | Search by Item Code or Name | Optional |
| Category Filter | Selection | Filter by Category | Optional |
| Item Group Filter | Selection | Filter by Item Group | Optional |
| Risk Category Filter | Selection | Filter by Risk Category | Optional |
| Status Filter | Selection | All / Active / Inactive | Optional |
| Active/Inactive Toggle | Toggle (in Actions column) | On/Off switch per row | Available directly in the list |
| Override reason | Text | Reason entered by Admin | Required to turn off an item that active issuances still use |

## **Logic Workflow**

1\.  Admin opens the PPE Catalog list.

2\.  Admin can search by Item Code or Name, and filter by Category, Item Group, Risk Category, or Status.

3\.  Each row shows a toggle switch in the Actions column to turn the item Active or Inactive directly, without opening it.

4\.  System blocks turning off an item that still has active, non-returned issuances, unless Admin ~~confirms an override~~overrides with a reason (logged), as in BD-I444.

5\.  Each row also shows ~~a quick Reorder Level warning if current stock is below the item's Reorder Level~~'Low at N locations', based on the Reorder Level set per location.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Search matches | Admin types 'Helmet' | List shows only matching items |
| Toggle off an item with active issuances | 50 employees currently hold this item | System ~~warns and asks for confirmation before turning it off~~blocks it unless Admin overrides with a reason (logged) |
| Toggle off an unused item | No active issuances exist | Turns off immediately |
| Filter by Risk Category | Admin picks 'Category III (Irreversible/Lethal Risk)' | List shows only items in that Risk Category |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List displayed | Catalog items exist | Filtered, searchable list shown with working toggle switches |

## **Use Case**

Admin filters the Catalog by 'Category III' Risk items to review all high-risk PPE in one place.

## **UI/UX**

* Toggle switch in the Actions column, consistent with Attributes/Item Groups/Locations lists

* Clear filter bar across the top: Category, Item Group, Risk Category, Status

## **Non-Functional Requirements**

* List should load quickly even with a large catalog

## **Definition of Done**

* Search and filters work correctly

* Toggle switch changes Active/Inactive status immediately

* In-use protection rule enforced before turning off

* ~~Low Stock indicator shows correctly per row~~'Low at N locations' indicator shows correctly per row

# **BD-I476  —  View PPE Item Details**

 **MODIFIED    Epic:** PPE Catalog Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Shows Reorder Level per location and Unit of Measure. The Size/Color/Gender lines are replaced by the variants coming from the Item Group's Attributes.  (Rules 5\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to open a PPE item and see all its information in one read-only screen

**SO THAT**  I can quickly check its full setup without risk of accidentally changing anything

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Item to View | Selection | Pick from Catalog list | Required |

## **Logic Workflow**

1\.  Admin clicks on an item from the Catalog list (or a 'View' action).

2\.  System shows a read-only screen with all item details: Code, Name, Photo, Description, Category, Item Group, Manufacturer/Model, Standard/Certification, Risk Category, ~~Size/Color/Gender options~~variants from the Item Group's Attributes, Lifespan (value and unit), ~~Reorder Level~~Unit of Measure, Reorder Level per location, Assigned Locations, and Status.

3\.  Admin can see current stock quantity and how many are currently issued.

4\.  Admin can go to Edit directly from this screen if changes are needed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item has issued units | 20 units currently issued to employees | Issued count is shown on the View screen |
| Item has no stock | Zero units currently in any location | View screen shows 'Out of Stock' status |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Details shown | Item exists | Full read-only view of the item, its variants, and its stock displayed |

## **Use Case**

Admin opens 'Safety Helmet' to confirm its Risk Category, Lifespan, and current stock before approving it for a new site.

## **UI/UX**

* Clean read-only layout with a clear Edit button

* Photo shown prominently at the top of the screen

## **Non-Functional Requirements**

* View screen should load instantly, even while pulling live stock numbers

## **Definition of Done**

* View screen shows all item details correctly, including the new fields (Risk Category, Manufacturer/Model, Standard/Certification, Unit of Measure, Reorder Level per location)

* Current stock and issued count are shown

* Edit button available from the View screen

# **BD-I477  —  Edit a Kit**

 **MODIFIED    Epic:** Kit Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Step 4 reworded: the block applies when the Job Position of the only active Kit is changed away from a Position with recent issuances (the real case that leaves a Position without a Kit). The 'removing the last remaining Kit' sentence is removed. Inactive or trashed line items are flagged when the Kit is opened.  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to change a Kit's name, its line items, or which Job Position it belongs to

**SO THAT**  the Kit always matches what the job actually needs

## **Story Dependencies**

* Kit must already exist (~~previous story~~BD-I469)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Kit to Edit | Selection | Pick from list | Required |
| Name / Job Position | Text / Reference | Editable | Optional to change |
| Kit Line Items | Repeatable list | Add, edit, or remove items | At least one item must remain |
| Override reason | Text | Reason entered by Admin | Required to move the only active Kit away from a Position with recent issuances |

## **Logic Workflow**

1\.  Admin opens an existing Kit.

2\.  Admin edits the Name, Job Position, or adds/removes line items.

3\.  Admin saves the changes.

4\.  System blocks ~~removing the last remaining Kit for a Position if it had recent issuance activity~~changing the Job Position of the only active Kit away from a Position with recent issuances (last 90 days), which would leave that Position without a Kit, unless Admin ~~confirms an override~~overrides with a reason (logged).

5\.  Inactive or trashed line items are flagged when the Kit is opened.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Remove the only line item | Admin tries to leave the Kit with zero items | System blocks save |
| Edit line items on a Kit with recent issuances | Kit was recently issued to employees | System allows edits but new line items only apply to future issuances |
| Change Job Position of the only active Kit | Position had issuances in the last 90 days | Blocked unless Admin overrides with a reason (logged) |
| Inactive or trashed line item | Kit opened for editing | Item is flagged for review |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Edit saved | Valid changes made | Kit updated, future issuances reflect the new setup |

## **Use Case**

Admin adds safety glasses as a new line item to the existing 'Electrical Engineer Kit'.

## **UI/UX**

* Same layout as the Add screen, pre-filled with current data

## **Non-Functional Requirements**

* Changes must reflect immediately on the issuance screen for future issuances

## **Definition of Done**

* Editing Name, Job Position, and Line Items works correctly

* At least one line item always remains

* Job Position change of the only active Kit is blocked unless overridden with a logged reason

# **BD-I478  —  View and Filter the Kits List**

 **MODIFIED    Epic:** Kit Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Toggle follows BD-I469 (blocked unless override with reason).  (Rules 3\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to see all Kits in one list, search/filter them, and turn them Active or Inactive directly from the list

**SO THAT**  I can manage all job kits quickly without opening each one

## **Story Dependencies**

* None

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Search Text | Text | Search by Kit Name | Optional |
| Job Position Filter | Selection | Filter by Job Position | Optional |
| Status Filter | Selection | All / Active / Inactive | Optional |
| Active/Inactive Toggle | Toggle (in Actions column) | On/Off switch per row | Available directly in the list |
| Override reason | Text | Reason entered by Admin | Required to turn off the only active Kit of a Position with recent issuances |

## **Logic Workflow**

1\.  Admin opens the Kits list.

2\.  Admin can search by Kit Name and filter by Job Position or Status.

3\.  Each row shows a toggle switch in the Actions column to activate/deactivate directly.

4\.  System blocks turning off a Kit if it's the only active Kit for a Position with recent issuance activity (last 90 days), unless Admin ~~confirms an override~~overrides with a reason (logged), as in BD-I469.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Toggle off the only active Kit for a Position | Position has just this one active Kit, recently issued | System ~~warns and asks for confirmation~~blocks it unless Admin overrides with a reason (logged) |
| Toggle off a Kit with other active Kits for the same Position | Position has 2 active Kits | Turns off immediately, the other Kit remains available |
| Search matches | Admin types 'Electrical' | List shows only matching Kits |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List displayed | Kits exist | Filtered, searchable list shown with working toggle switches |

## **Use Case**

Admin searches for all Kits linked to 'Welder' Job Position to review which ones are currently active.

## **UI/UX**

* Toggle switch in the Actions column, consistent with other management lists

## **Non-Functional Requirements**

* List should load quickly even with many Kits

## **Definition of Done**

* Search and filter work correctly

* Toggle switch changes status immediately

* Sole-active-Kit protection rule enforced before turning off (block, override with a logged reason)

# **BD-I479  —  View Kit Details**

 **MODIFIED    Epic:** Kit Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: 'Recent' now means the last 90 days. |
| :---- |

**AS A**  Admin

**I WANT TO**  to open a Kit and see all its information and line items in one read-only screen

**SO THAT**  I can quickly check its setup without accidentally changing anything

## **Story Dependencies**

* Kit must exist (BD-I469)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Kit to View | Selection | Pick from list | Required |

## **Logic Workflow**

1\.  Admin clicks on a Kit from the list (or a 'View' action).

2\.  System shows a read-only screen with Kit Name, Job Position, Status, and the full list of line items with their default Size/Color.

3\.  Admin can see how many times this Kit has been issued recently (last 90 days).

4\.  Admin can go to Edit directly from this screen if changes are needed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Kit has recent issuances | Kit was issued 15 times in the last ~~month~~90 days | Issuance count is shown on the View screen |
| Kit has no issuances yet | Kit was just created | View screen shows 'Not yet issued' |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Details shown | Kit exists | Full read-only view of the Kit and its line items displayed |

## **Use Case**

Admin opens 'Electrical Engineer Kit' to confirm exactly which items are included before approving it for a new site.

## **UI/UX**

* Clean read-only layout with a clear Edit button

## **Non-Functional Requirements**

* View screen should load instantly

## **Definition of Done**

* View screen shows all Kit details and line items correctly

* Recent issuance count is shown (last 90 days)

* Edit button available from the View screen

# **BD-I480  —  Move a Kit to Trash and Restore It**

 **MODIFIED    Epic:** Kit Management     **Sprint:** System Foundation, Master Data & Initial Stock

| What changed: Changed from warn-only to block-unless-override (reason logged). On restore, line items that are now inactive or trashed are flagged. Restore follows NEW-04.  (Rules 3, 14\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to delete a Kit by moving it to the Trash Bin, and restore it if needed

**SO THAT**  I don't lose a Kit setup by mistake

## **Story Dependencies**

* Kit must exist (BD-I469); Trash Bin screen: NEW-04

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Kit to Delete | Selection | Pick from list | Required |
| Override reason | Text | Reason entered by Admin | Required when the Kit is the only active one for a Position with recent issuances |
| Kit to Restore | Selection | Pick from Trash Bin | Required when restoring |

## **Logic Workflow**

1\.  Admin clicks Delete on a Kit.

2\.  System checks if it's the only active Kit for a Position with recent issuance activity.

3\.  If so, system ~~warns Admin and asks for confirmation before deleting~~blocks the delete unless Admin overrides with a reason, which is logged.

4\.  ~~Once confirmed~~Once allowed, the Kit moves to the Trash Bin instead of being permanently removed.

5\.  Admin can open the Trash Bin and Restore the Kit at any time (checks of NEW-04 apply), with its line items intact. Line items that are now inactive or trashed are flagged.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Kit is the only active one for a Position | Position has no other active Kit | System ~~warns before allowing delete~~blocks delete unless Admin overrides with a reason (logged) |
| Restore a Kit | Kit exists in Trash Bin | Kit returns to the active list with all line items intact |
| Restored Kit with inactive or trashed items | A line item was deactivated or trashed meanwhile | Line item flagged for review after restore |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Kit trashed | Admin ~~confirms~~deletes (or overrides) | Removed from active list, moved to Trash Bin |
| Kit restored | Admin restores it | Reappears in the active list, fully usable again |

## **Use Case**

Admin deletes an outdated 'Summer Site Kit', then restores it the next season when it's needed again.

## **UI/UX**

* Same shared Trash Bin screen, filterable by Kits

## **Non-Functional Requirements**

* Deleting must never permanently erase data without passing through the Trash Bin

## **Definition of Done**

* Delete moves the Kit (with line items) to the Trash Bin

* Restore brings it back completely intact

* Sole-active-Kit ~~warning shown before delete~~block with logged override enforced

# **BD-I486  —  Export and Import the PPE Catalog List**

 **MODIFIED    Epic:** ~~PPE Issuance~~PPE Catalog Management     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Moved from the PPE Issuance epic to PPE Catalog Management. Gender / Has Size columns dropped; Unit of Measure and per-location Reorder Level added. Update Existing applies the BD-I444 rules row by row (no Item Code change after a transaction, no deactivation of an in-use item; the import has no override, the row goes to the error report).  (Rules 5\) |
| :---- |

**AS A**  Admin

**I WANT TO**  to export the PPE Catalog to a file, and import a file to add or update many items at once

**SO THAT**  I can manage a large catalog quickly and share it with others outside the system

## **Story Dependencies**

* Item Groups and Attributes should already exist for a smooth import (BD-I452, BD-I447)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Export Format | Fixed | Excel (.xlsx) | Only supported format |
| Export Filter | Selection | All items, or filtered by Category/Item Group/Status | Optional, defaults to all items |
| Import File | File | .xlsx, following the provided template | Required for import |
| Import Mode | Selection | Add New Only / Add New and Update Existing | Required, chosen before uploading |

## **Logic Workflow**

1\.  Admin clicks Export on the Catalog list screen, optionally applying filters first.

2\.  System generates an Excel file with all the Catalog fields (Item Code, Name, Category, Item Group, Lifespan value and unit, Risk Category, Unit of Measure, per-location Reorder Level, and more) and downloads it. The Gender and Has Size columns no longer exist.

3\.  To import, Admin clicks Import and downloads the import template if they don't already have one.

4\.  Admin fills the template (or edits an exported file) and uploads it, choosing Add New Only or Add New and Update Existing.

5\.  System checks every row: valid Item Code, no duplicate codes, valid Item Group and Category, and all required fields filled. In Update Existing mode each row also follows the BD-I444 rules.

6\.  System shows a preview of how many rows will be added, updated, or have errors, before Admin confirms.

7\.  Admin confirms, and the system processes the file.

8\.  Any rows with errors are skipped and listed in a downloadable error report; valid rows are still processed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Invalid or duplicate Item Code in a row | A row has a blank or duplicate Item Code | That row is skipped and listed in the error report; other valid rows are still processed |
| Add New Only, but code already exists | A row's Item Code matches an existing item | That row is skipped and listed as 'already exists' in the error report |
| Add New and Update Existing, code matches | A row's Item Code matches an existing item | That item's details are updated with the new values from the file |
| Missing required field in a row | A row is missing Category or Item Group | That row is skipped and listed in the error report with the reason |
| Large import file | File has thousands of rows | System processes it in the background and notifies Admin when done, instead of freezing the screen |
| Item Code change after a transaction | Update row changes the Item Code of an item already issued, moved or loaned | Row skipped, listed in the error report |
| Deactivating an item in use | Update row sets Inactive for an item with active issuances | Row skipped, listed in the error report (the import has no override) |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Export ready | Admin clicks Export | Excel file downloads with all (or filtered) Catalog items |
| Import successful | All rows valid | New items created and/or existing items updated as chosen; confirmation message shows counts |
| Import partially successful | Some rows have errors | Valid rows processed, invalid rows skipped and listed in a downloadable error report |

## **Use Case**

Admin exports the full Catalog to review with the HSE Manager offline, adds 15 new items in Excel, then re-imports choosing 'Add New and Update Existing.' The system adds the 15 new items and updates 3 existing ones whose details changed.

## **UI/UX**

* Export and Import buttons clearly visible at the top of the Catalog list

* Downloadable template with example rows and clear column headers

* Preview screen before confirming import, showing counts of New / Updated / Errors

* Error report downloadable as its own Excel file

## **Non-Functional Requirements**

* Import should handle large files without freezing the screen

* Export should only include items the Admin is allowed to see

## **Definition of Done**

* Export produces a correct Excel file with all Catalog fields

* Import validates every row and shows a preview before confirming

* Add New Only and Add New and Update Existing modes both work correctly

* Invalid rows are skipped with a clear, downloadable error report

* Large files are processed without freezing the screen

* Gender / Has Size columns removed; Unit of Measure and per-location Reorder Level included

* BD-I444 rules enforced row by row on update

# **BD-I488  —  View and Filter the Employee List**

 **MODIFIED    Epic:** Personal information     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Terminated and Transferred employees stay visible and are marked 'No reminders'. Which employees each role can see follows the platform's role rules (to be confirmed).  (Rules 11\) |
| :---- |

**AS A**  Admin/HSE Supervisor/Store Keeper/Direct Supervisor

**I WANT TO**  to see a list of all employees with their basic information

**SO THAT**  I can quickly find an employee and check their PPE record

## **Story Dependencies**

* Employee data comes from the Employee Master and is read-only in this module

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Search Text | Text | Search by Name or Employee ID | Optional |
| Site/Department Filter | Selection | Filter by Site or Department | Optional |
| Job Position Filter | Selection | Filter by Job Position | Optional |
| Status Filter | Selection | Active / Terminated / Transferred | Optional |

## **Logic Workflow**

1\.  User opens the Employee list from the main menu.

2\.  System pulls the list of employees from the Employee Master (read-only).

3\.  User can search by Name or Employee ID, and filter by Department, Job Position, or Status.

4\.  Each row shows basic info at a glance: Photo, Name, Employee ID, Job Position, Site/Department, and Status. Terminated and Transferred employees stay visible and are marked 'No reminders'.

5\.  User clicks on a row to open that employee's full details and issuance timeline.

6\.  Which employees each role can see (Direct Supervisor, Store Keeper) follows the platform's role rules, to be confirmed.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Search matches | User types 'Ahmed' | List shows only matching employees |
| Employee Master unreachable | Employee Master service is temporarily down | System shows a warning banner and displays the last-known cached list, marked 'Unverified' |
| No PPE issued yet | Employee has never received any PPE | Employee still appears in the list normally |
| Terminated or Transferred | Status in Employee Master | Employee stays in the list, marked 'No reminders' |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List displayed | Employees exist in Employee Master | Filtered, searchable list of employees shown |

## **Use Case**

Store Keeper searches 'Ahmed' in the Employee list to quickly find him and check what PPE he currently has before issuing a replacement.

## **UI/UX**

* Simple list with employee photo, name, and position

* Search box and filters at the top

* Click a row to open the employee's details

## **Non-Functional Requirements**

* List should load quickly even with a large number of employees

* Must never allow editing of Employee Master data from this screen — read-only

## **Definition of Done**

* List pulls employee data correctly from Employee Master

* Search and filters work correctly

* Read-only — no employee data can be edited or deleted here

* Terminated and Transferred employees are visible and marked 'No reminders'

# **BD-I489  —  View Employee Details and PPE Issuance Timeline**

 **MODIFIED    Epic:** Personal information     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Timeline shows Quantity and 'Replaces' when set (Condition at Issue already shown). The PDF includes the signature images. Records imported through NEW-09 are labeled 'Imported' and have no signatures.  (Rules 17\) |
| :---- |

**AS A**  Admin/HSE Supervisor/Store Keeper/Direct Supervisor

**I WANT TO**  to open an employee's profile, see their basic information, and view a timeline of every PPE item they've been issued or returned — and export it as a PDF

**SO THAT**  I have a complete, shareable record of everything an employee has received, just like the paper log but digital

## **Story Dependencies**

* Employee must exist in Employee Master

* Employee List screen (~~Story 39~~BD-I488)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Employee to View | Selection | Pick from the Employee list | Required |
| Export Format | Fixed | PDF | Only supported export format |

## **Logic Workflow**

1\.  User clicks on an employee from the Employee list.

2\.  System shows the employee's basic information: Photo, Name, Employee ID, Job Position, Site/Department, Gender, Status, Email.

3\.  Below the basic info, an 'Issuance Timeline' tab shows every PPE item ever issued to or returned by this employee, newest first.

4\.  Each timeline entry shows: Item Name, Quantity, Batch, Issue Date, Issued By, Condition at Issue, 'Replaces' (when set), Return Date (if returned), Condition at Return (if returned), and Expected Replacement Date.

5\.  User clicks 'Export to PDF' to download the full timeline as a PDF document.

6\.  The PDF includes the signature images, the employee's basic information at the top and the full timeline below, formatted for printing.

7\.  Records imported through NEW-09 are labeled 'Imported' and have no signatures.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Employee has no issuance history | Employee has never received any PPE | Timeline shows a 'No PPE issued yet' message |
| Item still with the employee | Item was issued but not yet returned | Timeline entry shows 'Currently Held' instead of a Return Date |
| Export requested | User clicks Export to PDF | System generates a PDF with the same information shown on screen |
| Large history | Employee has many years of issuance history | Screen loads the most recent entries first with an option to load more; the PDF export always includes the full history |
| Imported record | Issuance created by NEW-09 | Labeled 'Imported', no signature images |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Details and timeline shown | Employee exists | Basic info and full issuance timeline displayed on screen |
| PDF exported | User clicks Export to PDF | A PDF file downloads with the employee's info and full issuance timeline, including signature images |

## **Use Case**

HSE Supervisor opens Ahmed's profile before a safety audit, reviews his full PPE history on the Issuance Timeline tab, and exports it to PDF to attach to the audit report.

## **UI/UX**

* Clean profile layout: photo and basic info at the top, tabs below (Basic Info / Issuance Timeline)

* Timeline shown as a vertical list, newest entry first, similar to the paper log but organized by date

* Clear 'Export to PDF' button at the top of the Issuance Timeline tab

## **Non-Functional Requirements**

* PDF export should complete within a few seconds even for employees with a long history

* PDF must be clearly formatted and readable when printed

## **Definition of Done**

* Employee basic info displays correctly, pulled from Employee Master

* Issuance Timeline shows every issued and returned item in date order

* Currently-held items are clearly marked

* Export to PDF produces a complete, correctly formatted document

* Empty history shows a friendly message instead of an empty screen

* Quantity, 'Replaces' and signature images appear; imported records are labeled

# **BD-I490  —  Tab 1 \- Interactive Stock Movement Trend**

 **MODIFIED    Epic:** PPE Dashboard     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Dependency now names the real stories instead of 'Epics 6, 7, 9'. Optional Site / Location filter added. |
| :---- |

**AS A**  Admin or HSE Supervisor

**I WANT TO**  view an interactive stacked area chart showing PPE stock movements (Issued, Returned, Scrapped) over time

**SO THAT**  I can analyze consumption trends, isolate specific movement types, and forecast future PPE needs.

## **Story Dependencies**

* Stock adjustment and issuance data must exist in the system (~~Epics 6, 7, 9~~NEW-01 to NEW-03 and BD-I467 to BD-I472).

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Date Range Filter | Date Range | Last 30 Days / Last 90 Days / Custom | Defaults to Last 30 Days |
| Site / Location Filter | Selection | All / one site or location | Optional |
| Legend Toggle | Selection | Issued / Returned / Scrapped | Clickable legend items to toggle data layers |
| Zoom Action | Interaction | Click and drag on chart area | Zooms into a specific date window |

## **Logic Workflow**

1\.  User opens the High-Level Overview Dashboard (Tab 1).

2\.  System loads stock movement data for the default "Last 30 Days" (optionally filtered by Site / Location).

3\.  System renders a Stacked Area Chart with three distinct colored layers: Issued (e.g., Blue), Returned (e.g., Green), and Scrapped (e.g., Red).

4\.  User hovers over a specific day on the chart; a tooltip appears showing the exact count for all three metrics on that day.

5\.  User clicks "Returned" in the chart legend; the system hides the Returned layer and recalculates the chart to show only Issued and Scrapped.

6\.  User clicks and drags their mouse across a 7-day period on the chart; the chart zooms in to show day-by-day details for that specific week.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Default Load | User navigates to Tab 1 | Chart renders showing data for the last 30 days with all 3 metrics visible. |
| Toggle Metric Off | User clicks 'Scrapped' in legend | The 'Scrapped' color area disappears; chart scales adjust to fit remaining data. |
| Zooming | User highlights a 5-day span | Chart x-axis updates to show only those 5 days; a 'Reset Zoom' button appears. |
| Site / Location filter | User picks one site or location | Chart shows only movements of that site or location |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Valid interaction | User highlights dates and toggles metrics | Chart updates fluidly without reloading the whole page. |
| No data for period | User selects a date range with zero movements | Chart displays a flat baseline with a "No activity found" watermark. |

## **Use Case**

The HSE Supervisor notices a sudden spike in the chart. By clicking the legend to hide "Issued" and "Returned", they isolate the "Scrapped" layer and see a massive spike on Tuesday. They highlight (zoom in on) Tuesday to investigate exactly how many items were destroyed that day.

## **UI/UX**

* Smooth animations when toggling layers on or off.

* Clear, contrasting colors for Issued, Returned, and Scrapped (e.g., Blue, Green, Red).

* Clean tooltip that follows the mouse cursor when hovering over data points.

## **Non-Functional Requirements**

* The chart must load and render within 2 seconds, even if calculating thousands of stock movements.

## **Definition of Done**

* Chart renders correctly with accurate data.

* Legend clicking toggles data series on and off.

* Zoom functionality works by dragging.

* Tooltips display correct numbers on hover.

* Site / Location filter works.

# **BD-I491  —  Tab 2 \- Location Capacity Stacked Bar & Filter**

 **MODIFIED    Epic:** PPE Dashboard     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: Reserved removed. Bar segments become Available, Quarantined and Empty Space. Scrap locations are not shown. Capacity comes from BD-I457, now required for every non-Scrap location.  (Rules 9, 16\) |
| :---- |

**AS A**  Store Keeper or Admin

**I WANT TO**  view a stacked bar chart showing the capacity of my warehouses and click a bar to filter my stock list

**SO THAT**  I can quickly identify overcrowded locations and manage inventory directly from the visual.

## **Story Dependencies**

* Locations must have "Capacity Units" configured (~~Epic 4, Story 19~~BD-I457, now required for every non-Scrap location).

* Stock Levels Grid must be present on the same screen.

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| User Access Level | System | Store Keeper or Admin | Determines which bars (locations) are rendered |
| Click Action | Interaction | Click on 'Cairo Main Store' bar | Triggers a filter on the Stock Grid |
| Hover Action | Interaction | Mouse hover over a bar section | Triggers a detailed tooltip |

## **Logic Workflow**

1\.  User opens Inventory & Stock Management (Tab 2).

2\.  System checks user role. If Admin, loads all locations. If Store Keeper, loads only assigned locations.

3\.  System renders a horizontal stacked bar chart. Y-axis lists the Locations. X-axis shows Capacity Units. Scrap locations are not shown.

4\.  Each bar is divided into three colors: Available Qty, ~~Reserved Qty~~Quarantined Qty, and Empty Space.

5\.  User hovers over the "Available Qty" section of a bar; a tooltip shows exactly how many units are stored and what percentage of the warehouse is full.

6\.  User clicks the bar for "Site A Store".

7\.  System immediately updates the "Stock Levels Grid" located directly below the chart to show ONLY items stored in "Site A Store".

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Store Keeper views chart | Store Keeper assigned to only 2 locations | Chart only renders 2 bars (for those specific locations). |
| Capacity Exceeded | A location has more stock than its configured capacity limit | The 'Empty Space' section disappears, and the bar turns a warning color (e.g., Red) indicating overcapacity. |
| Grid Filtering | User clicks a location bar | The main data grid below the chart filters to that location, and the bar stays highlighted to show it is selected. |
| Scrap location | Location has the Scrap flag | Not shown in the chart |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Hover | Mouse over '~~Reserved~~Quarantined Qty' section | Tooltip reads: "~~Reserved~~Quarantined: 150 units (20% of capacity)". |
| Click | User clicks 'Alexandria Site Store' | Data grid updates to show Alexandria stock; an 'X' button appears to clear the filter. |

## **Use Case**

A Store Keeper logs in and looks at the Capacity Chart. They see the bar for 'Clinic A \- Fridge' is almost entirely full (very little Empty Space). They click that bar, which instantly filters their stock list below so they can see exactly what is taking up so much space and transfer some items out.

## **UI/UX**

* Visual cues: Bars nearing 100% full change to a warning color (orange/red).

* Mouse pointer changes to a "hand" icon when hovering over the bars to indicate they are clickable.

* Clear visual feedback (e.g., a border outline) on the bar that is currently selected as a filter.

## **Non-Functional Requirements**

* Clicking a bar must filter the grid instantly (under 1 second) without refreshing the webpage.

## **Definition of Done**

* Chart accurately calculates Available, ~~Reserved~~Quarantined, and Empty space based on location settings.

* Clicking a bar successfully filters the adjacent Stock Levels Grid.

* Role-based access is respected (Store Keepers don't see unassigned locations).

* Scrap locations are not shown.

# **BD-I492  —  Tab 3 \- Action-Driven "Top Job Kits" Chart**

 **MODIFIED    Epic:** PPE Dashboard     **Sprint:** Operations, Employee Tracking & Dashboards

| What changed: A Kit is greyed out only when every item is out of stock; with some items out, the bar shows a 'partial issue' badge and still opens the modal (matches BD-I468). Inactive or trashed Kits are excluded. The Timeframe filter drives the calculation (it was hard-coded to 'current week'). Tab renamed 'Issuance' since it shows kits only.  (Rules 1\) |
| :---- |

**AS A**  Store Keeper

**I WANT TO**  to see a horizontal bar chart of the "Top 5 Job Kits Issued" and click a bar to instantly open the issuance modal for that kit

**SO THAT**  I can save time and clicks during busy shift changes when issuing the most common kits.

## **Story Dependencies**

* Job-Specific Kits must exist (~~Epic 5~~BD-I469).

* The "Issue Job Kit" modal must exist (BD-I468).

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Timeframe Filter | Selection | Today / This Week / This Month | Defaults to 'This Week'. Drives the Top 5 calculation |
| Click Action | Interaction | Click on 'Electrical Engineer Kit' bar | Triggers the Issuance Modal |

## **Logic Workflow**

1\.  Store Keeper opens the ~~Issuance & Returns dashboard (Tab 3\)~~Issuance tab (Tab 3, renamed).

2\.  System calculates the top 5 most frequently issued Job Kits for the ~~current week~~selected Timeframe (default This Week) at the user's assigned location(s). Inactive or trashed Kits are excluded.

3\.  System renders a horizontal bar chart showing these 5 kits, ordered from most issued to least.

4\.  Store Keeper clicks the top bar (e.g., "Welder Kit").

5\.  System immediately opens the "Issue Job Kit" modal, with the "Kit" dropdown already pre-selected as "Welder Kit".

6\.  Store Keeper only needs to select the Employee name and sign to complete the issuance.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Kit Out of Stock | The \#1 Kit has every item~~items~~ currently out of stock | The bar is still displayed, but greyed out. Clicking it shows a tooltip: "Insufficient stock to issue this kit." |
| Partial stock | Some Kit items are out of stock | The bar shows a 'partial issue' badge and still opens the modal (BD-I468) |
| Click action | User clicks a valid, in-stock Kit bar | Modal opens, Kit name is pre-filled, saving the user from searching for it in a dropdown. |
| No issuances this week | User selects 'This Week', but no kits were issued | Chart displays a placeholder message: "No kit issuance data for this period." |
| Inactive or trashed Kit | Kit was deactivated or trashed | Excluded from the chart |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Action-driven click | Click on 'Technician Kit' | 'Issue Job Kit' pop-up opens with 'Technician Kit' selected. |
| Out of stock click | Click on greyed-out (every item out of stock) Kit | Modal does not open; warning message appears. |

## **Use Case**

During a morning shift change, 10 new welders arrive at the window. The Store Keeper opens Tab 3, sees "Welder Kit" as the top bar on the chart, and just clicks the bar 10 times in a row, each time typing a name and hitting submit, skipping the step of manually searching for the "Welder Kit" in the system every time.

## **UI/UX**

* The chart should look like a series of large, tap-friendly buttons disguised as a bar chart (great for tablet users at a store window).

* Hovering over a bar should display a "Click to Issue" prompt.

* Greyed out/disabled styling for kits ~~that lack stock~~whose items are all out of stock.

## **Non-Functional Requirements**

* The Top 5 calculation must update in near-real-time (or refresh on page load) so the chart is always accurate.

## **Definition of Done**

* Chart accurately displays the top 5 kits based on issuance history for the selected Timeframe.

* Clicking a bar successfully opens the Issue Job Kit modal.

* Kit name is successfully passed to and pre-filled in the modal.

* ~~Out-of-stock kits are prevented from opening the modal.~~Kits with every item out of stock are prevented from opening the modal; partially stocked kits open with a 'partial issue' badge.

# **NEW-01  —  Post Opening Balance for a Location**

 **NEW STORY    Epic:** Stock Management (suggested)     **Sprint:** System Foundation, Master Data & Initial Stock (suggested)

**AS A**  Admin or Store Keeper of the location

**I WANT TO**  enter the stock physically present at a location on go-live, line by line or from an Excel file

**SO THAT**  stock levels, issuing and transfers start from correct numbers

## **Story Dependencies**

* Catalog items (I443), Locations (I457), Item Group Attributes (I452)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Reference | Auto | ADJ-OB-2026-00001 | System-generated, immutable |
| Location | Reference | Cairo Main Store | Required. Active, not Scrap, one of the user's assigned locations |
| Item | Reference | Safety Helmet | Required. Active and linked to this location |
| Variant | Selection | Size L / Yellow | Required when the Item Group has Attributes |
| Batch Number | Text | BATCH-2026-0031 | Required. Unique per item \+ variant \+ location |
| Quantity | Number | 120 | Required. Whole number above zero |
| Manufacturer Expiry Date | Date | 2029-03-01 | Optional |
| Import File | .xlsx | Provided template | Optional alternative to entering lines |

## **Logic Workflow**

1\.  User opens Stock \> Opening Balance and picks a Location.

2\.  User adds lines one by one, or downloads the template, fills it and uploads it.

3\.  System checks every line: item active and linked to the location, variant valid, batch number unique, quantity above zero.

4\.  System shows a preview: lines OK, lines with errors, total quantity, and capacity used after posting.

5\.  User confirms. System creates one batch per valid line, adds the quantity to the location and records the reference.

6\.  Lines with errors are skipped and listed in a downloadable error report. Valid lines are still posted.

7\.  When the count is finished, the user clicks Close Opening Balance for that location. Later corrections use Stock IN or Stock OUT.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Location already closed | User tries to post a line | Blocked: 'Opening balance is closed for this location. Use a stock adjustment.' |
| Scrap location | User picks a Scrap-flag location | Blocked. Scrap stock comes only from returns and Stock OUT |
| Used-flag location | Existing used stock is entered | Allowed. The stock is labeled Reused |
| Duplicate batch | Same item \+ variant \+ batch already at the location | Line rejected with the reason |
| Over capacity | Total would exceed the location's capacity | Non-blocking warning shown in the preview |
| Large file | Thousands of rows | Processed in the background, user notified when done |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Lines posted | Valid lines confirmed | Batches created, stock visible in Stock Levels (I466), audit entry written |
| Partial success | Some lines invalid | Valid lines posted, error report available |
| Closed | User closes the opening balance | Location locked for opening balance, status shown on the location |

## **Use Case**

Store Keeper Mona counts 40 items at Alexandria Site Store, uploads the template with 40 lines, sees 38 valid and 2 errors in the preview, confirms, downloads the error report, fixes the two lines and posts them, then closes the opening balance.

## **UI/UX**

* Single page with Location selector, line grid, Upload button and a preview step. Error report downloads as its own Excel file. Status chip on top: Open or Closed.

## **Non-Functional Requirements**

* Import of 5,000 lines must not freeze the screen. Posting is atomic per line.

## **Definition of Done**

* Lines can be entered manually and by Excel. Validation and preview work. Closing blocks further posting. Audit entry is written for every posting.

# **NEW-02  —  Record Stock IN**

 **NEW STORY    Epic:** Stock Management (suggested)     **Sprint:** System Foundation, Master Data & Initial Stock (suggested)

**AS A**  Store Keeper

**I WANT TO**  record stock received or added to my location, with its batch

**SO THAT**  the quantity on hand is correct and every addition is documented

## **Story Dependencies**

* NEW-01 (shares the same Stock Adjustment page, this is the Stock IN tab), Catalog items (I443), Locations (I457)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Adjustment type | Fixed | Stock IN | Pre-set, not selectable |
| Reference | Auto | ADJ-IN-2026-00031 | Format ADJ-IN-YYYY-NNNNN, immutable |
| Location | Reference | Cairo Main Store | Required. Active, not Scrap, assigned to the user |
| Item | Reference | Safety Gloves | Required. Active and linked to the location |
| Variant | Selection | Size M | Required when the Item Group has Attributes |
| Batch Number | Text or existing batch | BATCH-2026-0044 | Required. New batch, or pick an existing batch of the same item \+ variant \+ location |
| Quantity | Number | 200 | Required. Whole number above zero |
| Manufacturer Expiry Date | Date | 2029-06-30 | Optional. Cannot be in the past |
| Supplier / Delivery Note | Text | ABC Safety / DN-4471 | Optional |
| Reason category | Selection | Purchase Receipt | Required. Purchase Receipt, Stock Count Correction, Manual Correction, Other |
| Reason detail | Text | Found 20 extra pairs during count | Required (min 10 characters) unless the category is Purchase Receipt |
| Recorded by / Timestamp | System | store.keeper@site.com / UTC | Automatic, read-only |

## **Logic Workflow**

1\.  User opens Stock \> Adjustments \> Stock IN.

2\.  User picks Location, Item, Variant, and either a new Batch Number or an existing batch.

3\.  User enters Quantity, optional expiry and supplier details, and the Reason category.

4\.  If the item is Risk Category III and the reason is a correction (not Purchase Receipt), an amber banner says approval by the HSE Supervisor is required.

5\.  User clicks Save.

6\.  Without approval needed: quantity is added immediately, using a row-level lock on the batch.

7\.  With approval needed: the adjustment is Pending Approval. The quantity is added only when the HSE Supervisor approves. If rejected, nothing is added and the Store Keeper is notified.

8\.  System shows the reference, writes the audit entry, and clears the Low Stock flag if the level is back above Reorder Level.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Inactive or trashed item | User searches for it | Not selectable |
| Scrap location | User picks it | Blocked. Scrap stock comes only from returns and Stock OUT |
| Existing batch with different expiry | Same batch number, other expiry date | Blocked with the existing date shown |
| Expiry date in the past | Date earlier than today | Blocked |
| Reason missing detail | Correction without 10 characters | Save blocked |
| Over capacity | Resulting stock above capacity | Non-blocking warning, save allowed |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Posted | Valid form, no approval needed | Stock increased atomically, reference shown, audit entry |
| Pending approval | Risk Category III correction | Status Pending Approval, no stock change yet |
| Approved | HSE Supervisor approves | Stock increased, Store Keeper notified, audit entry with approver |
| Rejected | HSE Supervisor rejects | No stock change, Store Keeper notified with the reason |

## **Use Case**

A truck delivers 200 pairs of gloves (size M) to Cairo Main Store. The Store Keeper selects Safety Gloves, size M, enters batch BATCH-2026-0044, quantity 200, reason Purchase Receipt and saves. Stock rises to 200, the Low Stock flag disappears and ADJ-IN-2026-00031 is logged.

## **UI/UX**

* Stock IN is the first tab of the Stock Adjustment page, Stock OUT the second. Read-only summary on the right shows current stock for the chosen batch.

## **Non-Functional Requirements**

* Concurrent adjustments on one batch must not lose updates. Audit entries are kept for 7 years.

## **Definition of Done**

* Reference is generated, validation rules work, approval path works for Risk Category III corrections, stock updates atomically, audit entry is written.

# **NEW-03  —  Record Stock OUT (write-off, damage, quarantine)**

 **NEW STORY    Epic:** Stock Management (suggested)     **Sprint:** System Foundation, Master Data & Initial Stock (suggested)

**AS A**  Store Keeper

**I WANT TO**  record stock leaving a location for reasons other than issuing, such as damage, disposal, supplier return or quarantine

**SO THAT**  every non-issuing stock movement is documented and reflected immediately in live stock

## **Story Dependencies**

* NEW-02 (same Stock Adjustment page, this is the Stock OUT tab), Catalog items (I443), Locations (I457)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Adjustment type | Fixed | Stock OUT | Pre-set, not selectable |
| Reference | Auto | ADJ-OUT-2026-00019 | Format ADJ-OUT-YYYY-NNNNN, immutable |
| Location | Reference | Cairo Main Store | Required. Assigned to the user, not Scrap |
| Item and Variant | Reference | Safety Gloves / Size M | Required. Inactive items allowed, to clear leftover stock |
| Batch | Selection | BATCH-2026-0044 | Required. Active and Expiring Soon batches. Expired batches only with reason Expired Disposal. Quarantined batches shown disabled |
| Quantity to deduct | Number | 30 | Required. Above zero and not more than Available of the batch |
| Reason category | Selection | Physical Damage | Required. Expired Disposal, Physical Damage, Stock Count Discrepancy, Supplier Return, Quarantine, Manual Correction, Other |
| Reason detail | Text | Crushed packaging found on inspection | Required, min 10 characters |
| Quarantine reason | Text | Supplier recall notice received | Required when reason is Quarantine, min 20 characters |
| Recorded by / Timestamp | System | store.keeper@site.com / UTC | Automatic, read-only |

## **Logic Workflow**

1\.  User opens Stock \> Adjustments \> Stock OUT and picks Location, Item and Variant.

2\.  Batch list shows eligible batches. System fills in available quantity, location and expiry as read-only.

3\.  User enters the quantity. If it is above Available the form shows: 'Insufficient stock. Available: \[X\]. Requested: \[Y\].'

4\.  User picks the reason. For Quarantine, a mandatory Quarantine Reason field appears and the quantity is the amount to hold (not deducted).

5\.  If the item is Risk Category III, an amber banner says HSE Supervisor approval is required before the deduction.

6\.  User clicks Save.

7\.  Without approval needed: quantity is deducted immediately with a row-level lock. If it reaches zero, the item shows Out of Stock for that location. The Low Stock notification of I466 fires if the level is crossed.

8\.  With approval needed: status is Pending Approval and the deduction is applied only on approval. Rejection leaves stock unchanged.

9\.  Quarantine: the batch is set to Quarantined immediately, even while approval is pending, and its quantity is no longer Available (it still counts as On Hand).

10\.  Release Quarantine: a separate action on the batch. The user enters a release reason (min 20 characters) and confirms. The batch returns to Active or Expiring Soon. The event is logged.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Quantity above Available | Quantity larger than the batch | Save blocked with the message above |
| Batch already quarantined | User tries to select it | Disabled, tooltip 'Batch is already quarantined' |
| Expired Disposal on a batch not yet expired | Reason Expired Disposal, batch Active | Amber warning, save allowed after confirmation |
| Full batch disposal | Quantity equals Available | Allowed. The zero-quantity batch stays visible for audit |
| Risk Category III without approval | Deduction attempted before approval | Deduction blocked. Quarantine still applies |
| Approval after stock was issued meanwhile | Approved quantity no longer available | Approval fails with a message, adjustment returns to the Store Keeper |
| Release without reason | Reason empty or under 20 characters | Blocked with an inline error |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Deduction posted | Valid form, no approval needed | Quantity deducted atomically, reference shown, audit entry |
| Quarantine applied | Reason Quarantine | Batch Quarantined, removed from issuing and transfer lists, audit entry with reason |
| Pending approval | Risk Category III item | Adjustment Pending Approval, deduction awaits the HSE Supervisor |
| Approved / Rejected | HSE Supervisor decision | Deduction applied or voided, Store Keeper notified. A quarantine already applied stays |
| Quarantine released | Valid release reason | Batch back to Active or Expiring Soon, event logged |

## **Use Case**

During a shelf check, Store Keeper Karim finds 30 crushed pairs of gloves in BATCH-2026-0044. He opens Stock OUT, picks the batch, enters 30, chooses Physical Damage and saves. Stock drops from 80 to 50, which is below the Reorder Level, so the Store Keepers of the location get a Low Stock notification. ADJ-OUT-2026-00019 is logged.

## **UI/UX**

* Second tab of the Stock Adjustment page. Status chips on batches (Active, Expiring Soon, Expired, Quarantined). Release Quarantine is a button on the batch detail view.

## **Non-Functional Requirements**

* Deductions use row-level locking so two users cannot take the same units. Audit entries are kept for 7 years.

## **Definition of Done**

* Quantity validation works, all reason categories work, quarantine and release work, approval path works for Risk Category III, stock and Low Stock notification update correctly, audit entry is written.

# **NEW-04  —  Trash Bin (shared screen)**

 **NEW STORY    Epic:** System Foundation (suggested)     **Sprint:** System Foundation, Master Data & Initial Stock (suggested)

**AS A**  Admin

**I WANT TO**  see everything that was moved to the Trash, restore it, and know when it will be removed automatically

**SO THAT**  deletions can be undone safely without the system filling up with old records

## **Story Dependencies**

* Trash behavior in I446, I451, I456, I461, I480; Module Settings (NEW-06) for the retention period

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Type filter | Selection | All / Items / Attributes / Item Groups / Locations / Kits | Optional |
| Search | Text | Code or name | Optional |
| Record to restore | Selection | Row in the list | Required to restore |
| New code | Text | HLM-002 | Required only when the original code is taken |

## **Logic Workflow**

1\.  Admin opens the Trash Bin from the Catalog or from the main menu.

2\.  The list shows Type, Code, Name, Deleted by, Deleted on, Delete reason and Days left before automatic removal (90 minus days in Trash).

3\.  Admin selects one or more records and clicks Restore.

4\.  System checks each record: its parent must not be in the Trash (an Item needs its Item Group, an Item Group needs its Attributes, a Kit needs its Job Position, a Location needs nothing), and its code must not be used by an active record.

5\.  If the check passes, the record returns to its active list exactly as it was, and a Kit whose line items are now inactive or trashed is flagged for review.

6\.  A nightly job permanently deletes records that have been in the Trash for 90 days. Seven days before, Admins receive an in-app notice listing what will be removed.

7\.  Records with history (issuances, stock movements, loans) are never removed automatically. They stay in the Trash, marked 'Retained \- has history', with no countdown.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Parent in Trash | Restore an Item whose Item Group is trashed | Blocked: 'Restore Item Group \[name\] first.' |
| Code taken | Restore a Location whose code was reused | Admin must enter a new code before restore |
| Auto-removal | Record is 90 days old with no history | Permanently deleted by the nightly job, logged |
| Record with history | Trashed Item with past issuances | Never removed automatically, shown as Retained |
| Bulk restore | Several records selected | Each is checked on its own, failures listed with reasons |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Restored | Valid restore | Record back in its active list with all original data, logged |
| Blocked | Parent in Trash or code taken | Clear message, nothing changes |
| Removed | 90 days passed | Record deleted for good, audit entry written |

## **Use Case**

An Admin deletes the 'Summer Site Kit' in March and restores it in May, when the summer kit is needed again. The list showed 35 days left before removal.

## **UI/UX**

* One screen for every type, with the type filter. Days left shown as a number, turning red under 7\. Restore button on each row and a bulk Restore button.

## **Non-Functional Requirements**

* The nightly job runs without manual action. Removal is logged with the record's code and type.

## **Definition of Done**

* Trash lists all five record types, restore checks work, 90-day removal works, records with history are retained, restores and removals are logged.

# **NEW-05  —  Audit Log**

 **NEW STORY    Epic:** System Foundation (suggested)     **Sprint:** System Foundation, Master Data & Initial Stock (suggested)

**AS A**  Admin or HSE Supervisor

**I WANT TO**  search and export a complete record of who did what and when

**SO THAT**  I can answer audit questions and investigate disputes about stock or issuances

*Global rule for the whole module: every create, edit, trash, restore, override, issue, return, loan, transfer, adjustment, approval, import and settings change writes an audit entry automatically. Individual stories no longer need to repeat this requirement, they only list module-specific fields to capture.*

## **Story Dependencies**

* All stories that change data

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Date range | Date range | Last 30 days | Defaults to last 30 days |
| User | Selection | Any user | Optional |
| Object type | Selection | Item, Location, Issuance, Loan, Adjustment, Setting... | Optional |
| Action | Selection | Create, Edit, Trash, Restore, Override, Issue, Return, Transfer, Approve, Import | Optional |
| Search | Text | HLM-001, ADJ-OUT-2026-00019 | Searches the object reference |

## **Logic Workflow**

1\.  Any action that changes data writes an entry: timestamp (UTC), user, object type, object reference, action, before and after values, reason (when the action asks for one), and source (screen, import or system job).

2\.  Admin or HSE Supervisor opens the Audit Log and applies filters.

3\.  Clicking a row opens a detail view with the before and after values side by side.

4\.  User clicks Export to download the filtered result as Excel.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Edit or delete an entry | Anyone, including Admin | Not possible. Entries are immutable |
| Override | Admin overrides an in-use protection | Entry includes the reason entered |
| Large export | More than 50,000 rows | Prepared in the background, user notified when ready |
| Retention | Entry older than 7 years | Eligible for archiving only, never edited |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Entries listed | Filters applied | Matching entries, newest first |
| Export | Click Export | Excel file with the filtered entries |

## **Use Case**

Before an audit, the HSE Supervisor filters by object type Issuance and a date range, opens an entry to see the before and after values and exports the result.

## **UI/UX**

* List with filter bar on top, detail drawer on click, Export button.

## **Non-Functional Requirements**

* Logging must never block the user's action and must never be skipped. List loads within 3 seconds for 1 million entries with filters applied.

## **Definition of Done**

* All module actions write entries, entries cannot be changed, filters and detail view work, export works.

# **NEW-06  —  Module Settings**

 **NEW STORY    Epic:** System Foundation (suggested)     **Sprint:** System Foundation, Master Data & Initial Stock (suggested)

**AS A**  Admin

**I WANT TO**  set the values the module depends on in one place

**SO THAT**  reminders, kit rules and trash retention are not hard-coded

## **Story Dependencies**

* Sites (from Employee Master or Locations)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Reminder lead time per site | Number (days) | 14 | Required per site. Default 14, range 1 to 90\. Used by I473 |
| 'Recent issuance' window | Number (days) | 90 | Default 90\. Used by the Kit rules in I469, I477, I478, I479, I480 |
| Trash retention | Number (days) | 90 | Default 90, minimum 30\. Used by NEW-04 |

## **Logic Workflow**

1\.  Admin opens Settings \> PPE.

2\.  Admin edits the values and saves.

3\.  System validates the ranges and applies the new values to future checks only.

4\.  The change is logged with old and new value.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Out of range | Lead time 0 or 120 | Save blocked with the allowed range shown |
| Site without a value | New site created | Default 14 applies until Admin sets one |
| Change after reminders sent | Lead time reduced | Reminders already sent are not repeated |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Saved | Valid values | Used by the next nightly reminder run and the next Kit rule check |

## **Use Case**

The Admin sets the reminder lead time to 30 days for the Alexandria site, because replacement stock takes longer to arrive there.

## **UI/UX**

* One simple settings page with a table for per-site lead times.

## **Non-Functional Requirements**

* Settings changes apply without a restart.

## **Definition of Done**

* All three settings can be edited, validated, logged, and are read by the stories that use them.

# **NEW-07  —  Replacements Due screen**

 **NEW STORY    Epic:** PPE Issuance (suggested)     **Sprint:** Operations, Employee Tracking & Dashboards (suggested)

**AS A**  Store Keeper, HSE Supervisor or Admin

**I WANT TO**  see which issued items are due for replacement soon or already overdue

**SO THAT**  nobody keeps wearing expired PPE and I can prepare stock before it is needed

## **Story Dependencies**

* I467 (issuance with Expected Replacement Date), I473 (reminders), NEW-06 (lead time)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Status filter | Selection | All / Upcoming / Overdue | Optional, default All |
| Site / Location | Selection | Alexandria Site Store | Optional. Store Keepers see only their assigned locations |
| Department / Job Position | Selection | Welding | Optional |
| Item | Selection | Safety Gloves | Optional |
| Employee search | Text | Name or Employee ID | Optional |

## **Logic Workflow**

1\.  User opens Replacements Due.

2\.  System lists every issued item that has not been returned and whose Expected Replacement Date is within the site's lead time (Upcoming, yellow) or already passed (Overdue, red), oldest date first.

3\.  Each row shows Employee, Item and variant, Quantity, Issue Date, Expected Replacement Date, Days left or Days overdue, and the issuing location.

4\.  Counts of Upcoming and Overdue appear at the top.

5\.  User clicks a row to open the employee's timeline (I489) or clicks Issue Replacement, which opens I467 with the employee, item and 'Replaces issuance' already filled.

6\.  User can export the filtered list to Excel.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Item already returned or replaced | Employee received a new item | Row disappears |
| Terminated or Transferred employee | Employee status in Employee Master | Not listed |
| Employee Master unreachable | Service down | Last known data shown with an 'Unverified' banner |
| Store Keeper with restricted locations | Assigned to one location | Only items issued from that location are shown |
| Direct Supervisor | Opens the screen | Read-only view of their own team, subject to platform role rules |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List shown | Items due exist | Filtered, sorted list with Upcoming and Overdue counts |
| Nothing due | No matching items | Friendly empty message |

## **Use Case**

Store Keeper Mona opens the screen on Sunday, sees 12 Upcoming and 3 Overdue items for her site, clicks Issue Replacement on Ahmed's gloves and completes the issuance with both signatures.

## **UI/UX**

* Yellow and red chips for Upcoming and Overdue. Summary counts on top. Issue Replacement button on each row.

## **Non-Functional Requirements**

* Loads within 3 seconds with 10,000 issued items.

## **Definition of Done**

* Upcoming and Overdue rows are correct, filters and role scoping work, Issue Replacement prefills I467, export works.

# **NEW-08  —  Open Loans list**

 **NEW STORY    Epic:** PPE Issuance (suggested)     **Sprint:** Operations, Employee Tracking & Dashboards (suggested)

**AS A**  Store Keeper, HSE Supervisor or Admin

**I WANT TO**  see all loans that are open, overdue or closed

**SO THAT**  I can find a loan to close it and chase items that have not come back

## **Story Dependencies**

* I470 (loan issuance), I471 (loan return)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Status filter | Selection | Open / Overdue / Partially Returned / Closed | Optional, default Open and Overdue |
| Search | Text | Loan number, recipient, company or host employee | Optional |
| Date range | Date range | Issue date | Optional |
| Location | Selection | Issuing location | Optional. Store Keepers see only their assigned locations |

## **Logic Workflow**

1\.  User opens Loans.

2\.  System lists loans with Loan number, Recipient, Company, Host Employee, Issue Date, Expected Return Date, Status, and lines outstanding.

3\.  A loan whose Expected Return Date has passed and still has outstanding lines shows as Overdue in red with the number of days late.

4\.  Clicking a loan opens its detail: all lines with quantity, variant, condition at return where closed, and signatures.

5\.  A Return button on the detail opens I471 for the outstanding lines.

6\.  User can export the list to Excel.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Some lines returned | 1 of 2 lines closed | Status Partially Returned |
| All lines closed | Every line Good, Damaged or Lost | Status Closed |
| Overdue | Expected Return Date passed, lines outstanding | Status Overdue, shown in red |
| Store Keeper with restricted locations | Assigned to one location | Only loans issued from that location are shown |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| List shown | Loans exist | Filtered, searchable list with status chips |
| Return started | Click Return | I471 opens with the loan's outstanding lines |

## **Use Case**

At the end of the day the Store Keeper opens Loans, sees the 'ABC Construction' loan in red, 2 days late, opens it and sees the contractor still holds one vest.

## **UI/UX**

* Status chips (Open, Overdue, Partially Returned, Closed). Overdue rows in red. Return button inside the detail view.

## **Non-Functional Requirements**

* Loads quickly with thousands of loans.

## **Definition of Done**

* Statuses calculate correctly, search and filters work, Return opens I471, location scoping works, export works.

# **NEW-09  —  Import Historical Issuances from Excel**

 **NEW STORY    Epic:** PPE Catalog Management / Employee Tracking (suggested)     **Sprint:** Operations, Employee Tracking & Dashboards (suggested)

**AS A**  Admin

**I WANT TO**  upload the PPE issuances that are currently recorded on paper

**SO THAT**  employees' PPE history and replacement dates exist from the first day of go-live

## **Story Dependencies**

* Employee Master, Catalog (I443), Item Groups and Attributes (I452), NEW-01 (stock is loaded separately)

## **Story Inputs**

| Field / Item | Data Type | Format / Example | Remarks |
| :---- | :---- | :---- | :---- |
| Import file | .xlsx | Provided template | Required |
| Employee ID | Text | EMP-00421 | Required. Must exist and be active in Employee Master |
| Item Code | Text | GLV-003 | Required. Must exist and be active |
| Variant | Text | Size M | Required when the item has Attributes |
| Quantity | Number | 2 | Required, above zero |
| Issue Date | Date | 2026-03-01 | Required, not in the future |
| Issuing Location | Text | Cairo Main Store | Optional, for reporting only |

## **Logic Workflow**

1\.  Admin opens Import Historical Issuances and downloads the template.

2\.  Admin fills it from the paper log and uploads it.

3\.  System checks every row: employee exists and is active, item and variant valid, quantity above zero, date not in the future, no duplicate of an existing record (same employee, item, variant and date).

4\.  System shows a preview: rows to import, rows with errors, and how many will be Upcoming or Overdue.

5\.  Admin confirms. System creates the issuance records, labeled 'Imported', with an import batch ID, and calculates the Expected Replacement Date as Issue Date plus the item's current lifespan.

6\.  Rows with errors are skipped and listed in a downloadable error report. Valid rows are still imported.

## **Business Rules**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Stock effect | Any imported row | No stock is deducted. Stock comes from the Opening Balance |
| Signatures | Imported record | None captured. Labeled 'Imported' in the timeline and PDF |
| Replacement date already passed | Issue Date plus lifespan is earlier than today | Record is Overdue and appears in Replacements Due. No reminder email is sent for it |
| Replacement date within lead time | Due in 10 days, lead time 14 | Appears as Upcoming. The normal reminder rules apply from the next nightly run |
| Unknown employee or item | Code not found | Row skipped and listed in the error report with the reason |
| Large file | Thousands of rows | Processed in the background, Admin notified when done |

## **Story Output**

| Case | Input | Expected Result |
| :---- | :---- | :---- |
| Import successful | All rows valid | Records created, counts shown, visible in each employee's timeline |
| Partial import | Some rows invalid | Valid rows imported, error report available |

## **Use Case**

Before go-live the Admin uploads 3,200 rows from the paper log. 3,150 import, 50 go to the error report (unknown employee IDs). The Replacements Due screen immediately shows which employees are already overdue.

## **UI/UX**

* Template download with example rows, preview step with counts, error report as its own Excel file.

## **Non-Functional Requirements**

* Import of 10,000 rows runs in the background without freezing the screen.

## **Definition of Done**

* Template works, validation and preview work, records are labeled Imported, no stock or reminder side effects, error report downloads.

# **Open points to confirm**

* Category list (BD-I443): the final fixed list is still needed. The text keeps Head, Eye, Hearing, Hand, Foot, Body as a placeholder and flags it as to be confirmed.

* BD-I445: either merge it into BD-I443 / BD-I444 (they already hold the Lifespan field) or keep it as the dedicated edit screen.

* PPE Officer is replaced by the Store Keepers of the issuing location in reminders (BD-I473). The role is not defined anywhere else.

* Roles: override of in-use protection \= Admin. Approval of Risk Category III adjustments \= HSE Supervisor. What each role can see in the Employee list (Direct Supervisor, Store Keeper) follows the platform role rules and is still to be confirmed.

* Location Type list no longer contains Used and Scrap, because the Stock Condition flag now carries that meaning.

* Transfers: New to Used is allowed (stock set aside for loans). Used to New and anything out of Scrap are blocked.

* Trash: records with history (issuances, stock movements, loans) are never removed automatically after 90 days, because BD-I489 needs the full history.

* Quarantine is the only reason Available differs from On Hand now that Reserved is gone.

* Audit retention is 7 years, copied from the Pharmacy story.

* BD-I486 moved to the PPE Catalog Management epic; its sprint is unchanged and should be reviewed when the epic is changed in the tracker.

* Missing IDs in the export (I463, I465, I474, I481 to I485, I487) may belong to sprints that were filtered out. If any already covers stock, loans or trash, drop the matching NEW story and keep the edits.

* Not covered: no clearance flow for Terminated / Transferred employees (they only stop receiving reminders), and no second reminder or escalation after an item is overdue.