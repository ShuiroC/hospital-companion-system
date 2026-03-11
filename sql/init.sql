CREATE DATABASE IF NOT EXISTS county_companion DEFAULT CHARACTER SET utf8mb4;
USE county_companion;

CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL DEFAULT '',
  `age` TINYINT NULL,
  `education` VARCHAR(30) NULL,
  `work_years` TINYINT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `password` VARCHAR(64) NOT NULL DEFAULT '123123',
  `role` TINYINT NOT NULL COMMENT '1 patient 2 family 3 companion 9 admin',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0 disabled 1 active 2 pending_approval',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_phone_role` (`phone`,`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `hospital` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(128) NOT NULL,
  `level` VARCHAR(32),
  `address` VARCHAR(256),
  `phone` VARCHAR(20),
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_hospital_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL,
  `user_id` BIGINT,
  `companion_id` BIGINT,
  `hospital_id` BIGINT,
  `service_type` TINYINT COMMENT '1 full companion 2 exam companion 3 town pickup',
  `status` TINYINT NOT NULL COMMENT '0 unpaid 1 waiting_accept 2 accepted 3 in_service 4 to_confirm 5 completed 6 canceled 7 refunding 8 refunded',
  `amount` DECIMAL(10,2) NOT NULL,
  `pay_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0 unpaid 1 paid 2 refunded',
  `reserve_time` DATETIME,
  `patient_name` VARCHAR(64),
  `patient_phone` VARCHAR(20),
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_order_user` (`user_id`),
  KEY `idx_order_companion` (`companion_id`),
  KEY `idx_order_hospital` (`hospital_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `review` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `score` TINYINT NOT NULL,
  `content` VARCHAR(500),
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_review_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `withdraw` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `companion_id` BIGINT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` TINYINT NOT NULL COMMENT '0 pending 1 approved 2 rejected 3 paid',
  `apply_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_withdraw_companion` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `hospital`(`name`,`level`,`address`,`phone`) VALUES
('县人民医院','二甲','中心大道1号','010-88886666'),
('县中医院','二甲','康宁路9号','010-66668888'),
('城关镇卫生院','基层','健康路8号','010-55557777')
ON DUPLICATE KEY UPDATE
`level` = VALUES(`level`),
`address` = VALUES(`address`),
`phone` = VALUES(`phone`);

INSERT INTO `user`(`username`,`phone`,`password`,`role`,`status`) VALUES
('患者演示账号','13800001111','123123',1,1),
('陪诊员演示账号','13800001112','123123',3,2)
ON DUPLICATE KEY UPDATE
`username` = VALUES(`username`),
`password` = VALUES(`password`),
`role` = VALUES(`role`),
`status` = VALUES(`status`);
