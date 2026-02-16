<?php
require_once __DIR__ . '/../config/Database.php';

class ReportManager
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get high-level KPI indicators for a church.
     */
    public function getKpis($churchId)
    {
        $stats = [];

        // 1. Active Members
        $sqlMembers = "SELECT COUNT(*) FROM member WHERE church_id = :cid AND status_id = 1";
        $stmt = $this->db->prepare($sqlMembers);
        $stmt->execute([':cid' => $churchId]);
        $stats['activeMembers'] = (int) $stmt->fetchColumn();

        // 2. Events this month
        $sqlEvents = "SELECT COUNT(*) FROM meeting_instances 
                      WHERE church_id = :cid 
                      AND MONTH(instance_date) = MONTH(CURRENT_DATE()) 
                      AND YEAR(instance_date) = YEAR(CURRENT_DATE())";
        $stmt = $this->db->prepare($sqlEvents);
        $stmt->execute([':cid' => $churchId]);
        $stats['monthlyEvents'] = (int) $stmt->fetchColumn();

        // 3. New Songs (last 30 days)
        $sqlSongs = "SELECT COUNT(*) FROM songs 
                     WHERE church_id = :cid 
                     AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $stmt = $this->db->prepare($sqlSongs);
        $stmt->execute([':cid' => $churchId]);
        $stats['newSongs'] = (int) $stmt->fetchColumn();

        // 4. Team Efficiency (Percentage of confirmed assignments)
        $sqlEfficiency = "SELECT 
                            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
                            COUNT(*) as total
                          FROM meeting_team_assignments 
                          WHERE church_id = :cid 
                          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $stmt = $this->db->prepare($sqlEfficiency);
        $stmt->execute([':cid' => $churchId]);
        $eff = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['efficiency'] = $eff['total'] > 0 ? round(($eff['confirmed'] / $eff['total']) * 100) : 100;

        return $stats;
    }

    /**
     * Get assistance growth for the last 6 months.
     */
    public function getAttendanceGrowth($churchId)
    {
        $sql = "SELECT 
                    DATE_FORMAT(instance_date, '%b') as month,
                    COUNT(DISTINCT mi.id) as events,
                    COUNT(ta.id) as attendance
                FROM meeting_instances mi
                LEFT JOIN meeting_team_assignments ta ON mi.id = ta.meeting_instance_id AND ta.status = 'confirmed'
                WHERE mi.church_id = :cid 
                AND mi.instance_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
                GROUP BY YEAR(mi.instance_date), MONTH(mi.instance_date)
                ORDER BY YEAR(mi.instance_date) ASC, MONTH(mi.instance_date) ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get membership distribution by area.
     */
    public function getAreaDistribution($churchId)
    {
        $sql = "SELECT 
                    a.name, 
                    COUNT(ma.member_id) as value
                FROM area a
                LEFT JOIN member_area ma ON a.id = ma.area_id
                WHERE a.church_id = :cid
                GROUP BY a.id, a.name";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get team efficiency stats.
     */
    public function getTeamStats($churchId)
    {
        $sql = "SELECT 
                    g.name,
                    ROUND(COUNT(CASE WHEN ta.status = 'confirmed' THEN 1 END) * 100.0 / NULLIF(COUNT(ta.id), 0), 0) as servicio,
                    80 as ensayo -- Placeholder as we don't have rehearsal attendance tracking yet
                FROM `group` g
                JOIN member_group mg ON g.id = mg.group_id
                LEFT JOIN meeting_team_assignments ta ON mg.member_id = ta.member_id
                WHERE g.church_id = :cid
                GROUP BY g.id, g.name";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
