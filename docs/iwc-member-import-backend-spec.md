# IWC Excel Import Backend Spec

## Goal

Allow the team to upload partner-provided Excel files into the database instead of managing the data only in spreadsheets.

The first known partner is `IWC`.

Each upload should:

- create a `batch`
- store the original upload metadata
- save every Excel row as a database record
- track who uploaded it and when
- support a `paid` flag per member row
- make future re-uploads easy without deleting history

## Recommended Data Model

Use **two tables**, not one:

1. `partner_member_batches`
2. `partner_member_records`

This is safer than merging everything into a single table because:

- every Excel upload becomes traceable
- previous uploads stay available for audit/history
- you can mark one batch as the current active version for a company
- future updates are much easier

## Table 1: `partner_member_batches`

One row per uploaded Excel file.

Suggested fields:

- `id`
- `batch_code`
- `company_code`
- `company_name`
- `source_filename`
- `source_sheet_name`
- `uploaded_by_user_id`
- `uploaded_by_name`
- `uploaded_at`
- `is_current`
- `status`
- `total_rows`
- `paid_rows`
- `unpaid_rows`
- `remarks`
- `created_at`
- `updated_at`

Recommended meaning:

- `batch_code`: human-readable reference like `IWC-20260801-001`
- `company_code`: short identifier like `IWC`
- `is_current`: marks the latest approved batch for that company
- `status`: `draft`, `processed`, `archived`, or `failed`

## Table 2: `partner_member_records`

One row per Excel line item.

Suggested fields:

- `id`
- `batch_id`
- `row_number`
- `excel_no`
- `area_location`
- `id_no`
- `full_name`
- `card_no`
- `paid`
- `paid_at`
- `payment_reference`
- `remarks`
- `raw_payload`
- `created_at`
- `updated_at`

Recommended meaning:

- `row_number`: actual spreadsheet row position for troubleshooting
- `excel_no`: value from Excel column `No.`
- `raw_payload`: optional JSON/text copy of the original imported row
- `paid`: internal business flag, default `false`

## Excel Header Mapping

Expected spreadsheet headers from the partner:

- `No.`
- `AREA/LOCATION`
- `ID NO.`
- `FULL NAME`
- `CARD NO.`

Suggested import mapping:

- `No.` -> `excel_no`
- `AREA/LOCATION` -> `area_location`
- `ID NO.` -> `id_no`
- `FULL NAME` -> `full_name`
- `CARD NO.` -> `card_no`

Internal fields not from Excel:

- `batch_id`
- `paid`
- `uploaded_by_user_id`
- `uploaded_by_name`
- `uploaded_at`
- `remarks`

## Recommended Rules

### 1. Never overwrite old batches

Each new upload should create a new batch.

That gives you:

- audit trail
- rollback safety
- easier comparison between uploads

### 2. Mark one batch as current

When a new IWC upload is accepted:

- set the new batch `is_current = true`
- set older IWC batches `is_current = false`

### 3. Do not trust Excel formatting

Normalize headers before import:

- trim spaces
- uppercase them
- accept minor header variations if needed

### 4. Validate required columns

Reject the file if any required header is missing:

- `AREA/LOCATION`
- `ID NO.`
- `FULL NAME`
- `CARD NO.`

`No.` can be accepted as optional if the actual row number is used as fallback.

### 5. Keep payment status inside the system

The partner spreadsheet may not contain payment state.

So `paid` should be maintained by your system, not by the uploaded Excel file.

## Suggested API Endpoints

### Upload a batch

`POST /partner-members/batches/import`

Multipart form data:

- `file`
- `companyCode`
- `companyName`
- `remarks` optional

Behavior:

- parse Excel
- validate headers
- create batch row
- insert member rows
- return import summary

### List batches

`GET /partner-members/batches?companyCode=IWC`

### Get batch details

`GET /partner-members/batches/:batchId`

### List active/current members

`GET /partner-members/records?companyCode=IWC&currentOnly=true`

### Update payment status

`PATCH /partner-members/records/:recordId/payment`

Body example:

```json
{
  "paid": true,
  "paidAt": "2026-08-01",
  "paymentReference": "OR-10021"
}
```

### Set batch as current

`PATCH /partner-members/batches/:batchId/set-current`

## Import Flow

1. User uploads Excel file and selects company `IWC`.
2. Backend validates required headers.
3. Backend creates a new row in `partner_member_batches`.
4. Backend inserts all spreadsheet rows into `partner_member_records`.
5. Backend stores uploader name, uploader user id, upload timestamp, and row counts.
6. Backend optionally marks the batch as current.

## Good Extra Fields To Keep

These are useful even if not required on day one:

- `source_sheet_name`
- `payment_reference`
- `paid_at`
- `remarks`
- `raw_payload`
- `status`
- `is_current`

## Recommended Deduping Strategy

Within a single batch, prevent exact duplicates using a unique combination like:

- `batch_id`
- `id_no`
- `card_no`

If duplicate rows are expected from the partner, keep them but log them in the import summary.

## Recommendation

Use **batch table + member rows table**.

That is the cleanest design for:

- recurring Excel uploads
- auditability
- partner-specific batches like `IWC`
- payment tracking inside your system

## Next Backend Step

When you open the real backend repo, implement:

1. the two tables
2. the Excel parser/import endpoint
3. the payment update endpoint
4. batch listing/history endpoints

