-- 若 audit_logs.action_type 原为 VARCHAR(40)，需加长以容纳新动作类型（如 SOCIAL_ACCOUNT_SET_STATUS）
ALTER TABLE `audit_logs` MODIFY COLUMN `action_type` VARCHAR(48) NOT NULL;
