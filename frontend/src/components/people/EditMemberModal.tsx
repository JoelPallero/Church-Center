import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { peopleService } from '../../services/peopleService';

interface Props {
    user: any;
    onClose: () => void;
    onSave: () => void;
}

export const EditMemberModal: FC<Props> = ({ user, onClose, onSave }) => {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [instruments, setInstruments] = useState<any[]>([]);

    // Split name and surname if they are together in user.name
    const nameParts = (user.name || '').split(' ');
    const initialName = nameParts[0] || '';
    const initialSurname = nameParts.slice(1).join(' ') || '';

    // Profile State
    const [formData, setFormData] = useState({
        firstName: initialName,
        lastName: initialSurname,
        email: user.email || '',
        sex: user.sex || 'M',
        roleId: user.role_id || (user.role?.id) || '',
        areaIds: (user.areas || []).map((a: any) => a.id),
        groupId: user.group_id || (user.groups?.[0]?.id) || '',
        selectedInstruments: user.instruments?.map((i: any) => i.id) || []
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [rData, aData, iData] = await Promise.all([
            peopleService.getRoles(),
            peopleService.getAreas(),
            peopleService.getInstruments()
        ]);
        setRoles(rData);
        setAreas(aData);
        setInstruments(iData);

        // If user already has areas, load groups for the first one (legacy logic/preview)
        const currentAreaId = formData.areaIds[0] || user.areas?.[0]?.id;
        if (currentAreaId) {
            const gData = await peopleService.getGroups(currentAreaId);
            setGroups(gData);
        }
    };

    const toggleArea = async (id: number) => {
        const nextAreas = formData.areaIds.includes(id)
            ? formData.areaIds.filter((a: number) => a !== id)
            : [...formData.areaIds, id];

        setFormData(prev => ({ ...prev, areaIds: nextAreas }));

        // Update groups list if we added an area
        if (nextAreas.length > 0) {
            const gData = await peopleService.getGroups(nextAreas[0]);
            setGroups(gData);
        }
    };

    const toggleInstrument = (id: number) => {
        setFormData(prev => ({
            ...prev,
            selectedInstruments: prev.selectedInstruments.includes(id)
                ? prev.selectedInstruments.filter((iid: number) => iid !== id)
                : [...prev.selectedInstruments, id]
        }));
    };

    const handleSave = async () => {
        if (formData.areaIds.length === 0) {
            alert(t('people.mandatoryArea'));
            return;
        }

        setIsSaving(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const success = await peopleService.updateMemberProfile(user.id, {
                name: fullName,
                email: formData.email,
                sex: formData.sex,
                roleId: parseInt(formData.roleId as string),
                areaIds: formData.areaIds,
                groups: formData.groupId ? [parseInt(formData.groupId as string)] : [],
                instruments: formData.selectedInstruments
            });

            if (success) {
                onSave();
            } else {
                alert(t('common.failed'));
            }
        } catch (err) {
            alert(t('common.connectionError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async () => {
        // Actually, let's just make it a real Delete since Super Admin asked for it.

        const confirmMsg = t('people.confirmDeleteProfile');
        if (!window.confirm(confirmMsg)) return;

        const success = await peopleService.deleteMember(user.id);
        if (success) {
            onSave();
        } else {
            alert(t('common.failed'));
        }
    };

    const selectedRole = roles.find(r => r.id == formData.roleId);
    const selectedRoleName = selectedRole?.name || '';
    const needsTeam = !['pastor', 'admin', 'master'].includes(selectedRoleName);
    const isAlabanza = areas.filter(a => formData.areaIds.includes(a.id)).some(a => a.name?.toLowerCase().includes('alabanza'));

    // Avatar Logic & Colors
    const isGuest = !selectedRoleName || selectedRoleName === 'guest';
    const accentColor = selectedRoleName === 'pastor' || selectedRoleName === 'admin' || selectedRoleName === 'master' ? '#9333EA' : // Purpura
        selectedRoleName === 'leader' ? '#2563EB' :   // Azul
            selectedRoleName === 'coordinator' ? '#0D9488' : // Teal
                isGuest ? '#475569' : // Gris para invitados
                    '#16A34A'; // Verde para miembros (default)

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            backdropFilter: 'blur(10px)'
        }} onClick={onClose}>
            <Card style={{ maxWidth: '440px', width: '95%', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                {/* Header: More compact and black */}
                <div style={{ backgroundColor: '#000000', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        border: `2px solid ${accentColor}`, boxShadow: `0 0 15px ${accentColor}33`
                    }}>
                        {isGuest ? (
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{formData.firstName.charAt(0) || '?'}</span>
                        ) : (
                            <img
                                src={formData.sex === 'F' ? '/avatars/female.png' : '/avatars/male.png'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt="Avatar"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerText = formData.firstName.charAt(0);
                                }}
                            />
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 className="text-h2" style={{ color: 'white', margin: 0, fontSize: '20px', letterSpacing: '-0.3px' }}>
                            {formData.firstName} {formData.lastName}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accentColor }}></span>
                            <span className="text-overline" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                                {selectedRole?.displayName || (isGuest ? t('people.guest') : t('people.noRole'))}
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} style={{ color: '#94A3B8', padding: '4px', minWidth: 'auto', background: 'none' }}>
                        <span className="material-symbols-outlined">close</span>
                    </Button>
                </div>

                <div style={{ padding: '24px', maxHeight: '55vh', overflowY: 'auto', backgroundColor: 'var(--color-ui-bg)' }}>
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>{t('common.firstName')}</label>
                            <input
                                className="text-body"
                                value={formData.firstName}
                                onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>{t('common.lastName')}</label>
                            <input
                                className="text-body"
                                value={formData.lastName}
                                onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>{t('common.sex')}</label>
                            <select
                                value={formData.sex}
                                onChange={e => setFormData(prev => ({ ...prev, sex: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white', outline: 'none', fontSize: '14px' }}
                            >
                                <option value="M">{t('common.male')}</option>
                                <option value="F">{t('common.female')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>{t('people.filterByRole')}</label>
                            <select
                                value={formData.roleId}
                                onChange={e => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white', outline: 'none', fontSize: '14px' }}
                            >
                                <option value="">{t('people.selectRole')}</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.displayName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>EMAIL</label>
                        <input
                            className="text-body"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white', outline: 'none', fontSize: '14px' }}
                        />
                    </div>

                    {/* Org Section */}
                    <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '10px', fontSize: '10px' }}>{t('people.mandatoryAreaLabel')}</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {areas.map(area => (
                                    <button
                                        key={area.id}
                                        type="button"
                                        onClick={() => toggleArea(area.id)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            border: '1px solid',
                                            borderColor: formData.areaIds.includes(area.id) ? '#10B981' : 'rgba(255,255,255,0.06)',
                                            backgroundColor: formData.areaIds.includes(area.id) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                            color: formData.areaIds.includes(area.id) ? '#10B981' : '#64748B'
                                        }}
                                    >
                                        {area.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {needsTeam && (
                            <div>
                                <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px' }}>{t('people.teamBasedOnArea')}</label>
                                <select
                                    value={formData.groupId}
                                    onChange={e => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'var(--color-ui-bg)', color: 'white', outline: 'none', fontSize: '13px' }}
                                >
                                    <option value="">{t('people.selectTeam')}</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Instruments (Conditional) */}
                    {isAlabanza && (
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '10px', fontSize: '10px' }}>{t('people.instruments')}</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {instruments.map(inst => (
                                    <div
                                        key={inst.id}
                                        onClick={() => toggleInstrument(inst.id)}
                                        style={{
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                                            backgroundColor: formData.selectedInstruments.includes(inst.id) ? accentColor : 'rgba(255,255,255,0.03)',
                                            color: formData.selectedInstruments.includes(inst.id) ? 'white' : '#64748B',
                                            border: '1px solid',
                                            borderColor: formData.selectedInstruments.includes(inst.id) ? accentColor : 'rgba(255,255,255,0.06)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {inst.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <Button
                        variant="ghost"
                        label={t('common.delete')}
                        onClick={handleDeactivate}
                        style={{ color: '#EF4444', height: '36px', padding: '0 12px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button variant="ghost" label={t('common.cancel')} onClick={onClose} disabled={isSaving} style={{ height: '38px', fontSize: '14px' }} />
                        <Button variant="primary" label={isSaving ? t('common.loading') : t('common.saveChanges')} onClick={handleSave} disabled={isSaving} style={{ height: '38px', fontSize: '14px', background: 'white', color: 'black', fontWeight: 600 }} />
                    </div>
                </div>
            </Card>
        </div>
    );
};
