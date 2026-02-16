-- ============================================================
-- CLEANUP SCRIPT: REMAINS ONLY 'ALABANZA' AREA
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Identify IDs of areas to keep (Alabanza usually has ID 1)
-- Delete all areas except 'Alabanza'
DELETE FROM area WHERE name != 'Alabanza';

-- 2. Delete groups that belonged to other areas OR keep only specific core groups
-- This ensures no orphaned groups remain from the deleted areas
DELETE FROM `group` 
WHERE area_id NOT IN (SELECT id FROM area) 
   OR (area_id IS NULL AND name != 'Banda de Domingo');

-- 3. Cleanup member_area associations for non-existent areas
DELETE FROM member_area WHERE area_id NOT IN (SELECT id FROM area);

-- 4. Cleanup member_group associations for non-existent groups
DELETE FROM member_group WHERE group_id NOT IN (SELECT id FROM `group`);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Cleanup complete. Only Alabanza area and its core groups remain.' AS Result;
