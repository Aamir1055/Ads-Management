ALTER TABLE bm
ADD COLUMN account_name VARCHAR(255) NOT NULL AFTER bm_name,
ADD COLUMN facebook_account_id INT NOT NULL AFTER account_name,
ADD FOREIGN KEY (facebook_account_id) REFERENCES facebook_accounts(id) ON DELETE RESTRICT;