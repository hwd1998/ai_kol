-- 若生产环境关闭 TypeORM synchronize，请手工执行本脚本一次
-- MySQL 8+

ALTER TABLE `users` ADD COLUMN `is_enabled` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `platforms` ADD COLUMN `is_enabled` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `products` ADD COLUMN `is_enabled` TINYINT(1) NOT NULL DEFAULT 1;
