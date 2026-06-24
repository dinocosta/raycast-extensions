-- Convert existing session durations from minutes to seconds.
--
-- Up until this migration the `duration` column stored whole minutes. Going forward it stores
-- seconds (sourced directly from Raycast's Focus session activity summary log). Every row that
-- exists at this point was written in minutes, so multiplying by 60 brings them to seconds.
UPDATE `sessions` SET `duration` = `duration` * 60;
