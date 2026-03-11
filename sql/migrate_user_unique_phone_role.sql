USE county_companion;

ALTER TABLE `user`
  DROP INDEX `uk_user_phone`;

ALTER TABLE `user`
  ADD UNIQUE KEY `uk_user_phone_role` (`phone`, `role`);
