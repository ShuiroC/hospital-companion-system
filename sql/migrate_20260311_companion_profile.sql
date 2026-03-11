USE county_companion;

ALTER TABLE `user`
  ADD COLUMN IF NOT EXISTS `age` TINYINT NULL AFTER `username`,
  ADD COLUMN IF NOT EXISTS `education` VARCHAR(30) NULL AFTER `age`,
  ADD COLUMN IF NOT EXISTS `work_years` TINYINT NULL AFTER `education`;
