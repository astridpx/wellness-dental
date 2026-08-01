CREATE TABLE partner_member_batches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_code VARCHAR(64) NOT NULL,
  company_code VARCHAR(32) NOT NULL,
  company_name VARCHAR(160) NOT NULL,
  source_filename VARCHAR(255) NOT NULL,
  source_sheet_name VARCHAR(120) NULL,
  uploaded_by_user_id BIGINT UNSIGNED NULL,
  uploaded_by_name VARCHAR(160) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'processed',
  total_rows INT NOT NULL DEFAULT 0,
  paid_rows INT NOT NULL DEFAULT 0,
  unpaid_rows INT NOT NULL DEFAULT 0,
  remarks TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_partner_member_batches_batch_code (batch_code),
  KEY idx_partner_member_batches_company_code (company_code),
  KEY idx_partner_member_batches_uploaded_at (uploaded_at)
);

CREATE TABLE partner_member_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NOT NULL,
  row_number INT NOT NULL,
  excel_no VARCHAR(32) NULL,
  area_location VARCHAR(180) NOT NULL,
  id_no VARCHAR(64) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  card_no VARCHAR(128) NOT NULL,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  paid_at DATE NULL,
  payment_reference VARCHAR(120) NULL,
  remarks TEXT NULL,
  raw_payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_partner_member_records_batch
    FOREIGN KEY (batch_id) REFERENCES partner_member_batches(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_partner_member_records_batch_row (batch_id, row_number),
  KEY idx_partner_member_records_batch_id (batch_id),
  KEY idx_partner_member_records_id_no (id_no),
  KEY idx_partner_member_records_card_no (card_no),
  KEY idx_partner_member_records_paid (paid)
);

-- Example:
-- when a new IWC batch is approved, unset older current batch rows first:
--
-- UPDATE partner_member_batches
-- SET is_current = 0
-- WHERE company_code = 'IWC';
--
-- UPDATE partner_member_batches
-- SET is_current = 1
-- WHERE id = ?;
