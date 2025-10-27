-- Add new fields to bm table
ALTER TABLE bm
ADD COLUMN account_name VARCHAR(255) NOT NULL AFTER bm_name,
ADD COLUMN facebook_account_id INT NOT NULL AFTER account_name;

-- Add foreign key constraint
ALTER TABLE bm
ADD CONSTRAINT fk_bm_facebook_account
FOREIGN KEY (facebook_account_id)
REFERENCES facebook_accounts(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Add index for better performance
CREATE INDEX idx_bm_facebook_account ON bm(facebook_account_id);