-- Senior Architectural Refactoring: Multi-tenancy and Subscriptions

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS `organizations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `current_subscription_id` INT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `organization_id` INT DEFAULT NULL, -- Can be linked to an org
    `member_id` INT DEFAULT NULL,       -- Or directly to a member (pre-multi-tenant)
    `status` ENUM('trialing', 'active', 'canceled', 'past_due') DEFAULT 'active',
    `trial_end` DATETIME DEFAULT NULL,
    `current_period_end` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_org_sub` (`organization_id`),
    INDEX `idx_member_sub` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add organization_id to member table
-- Check if column exists first (some DBs don't support IF NOT EXISTS for columns)
ALTER TABLE `member` ADD COLUMN `organization_id` INT DEFAULT NULL AFTER `church_id`;

-- 4. Strengthen Invitations table (if using member for now)
ALTER TABLE `member` ADD COLUMN `invitation_status` ENUM('pending', 'accepted', 'expired') DEFAULT 'pending' AFTER `status`;
ALTER TABLE `member` ADD COLUMN `invited_role_id` INT DEFAULT NULL AFTER `invitation_status`;

-- 5. Seed default organization for existing members (Optional/Manual step)
-- INSERT INTO organizations (name, slug) VALUES ('Default Organization', 'default');
-- UPDATE member SET organization_id = 1;
