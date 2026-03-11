USE county_companion;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user'
        AND COLUMN_NAME = 'username'
    ),
    'SELECT 1',
    'ALTER TABLE `user` ADD COLUMN `username` VARCHAR(50) NOT NULL DEFAULT '''' AFTER `id`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `user`
SET `username` = CONCAT(CASE WHEN `role` = 3 THEN 'companion_' ELSE 'patient_' END, RIGHT(`phone`, 4))
WHERE (`username` IS NULL OR `username` = '');
