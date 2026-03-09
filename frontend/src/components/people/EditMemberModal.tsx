import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { peopleService } from '../../services/peopleService';
import { useAuth } from '../../hooks/useAuth';

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
    const [churches, setChurches] = useState<any[]>([]);
    const { isMaster } = useAuth();

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
        selectedInstruments: user.instruments?.map((i: any) => i.id) || [],
        churchId: user.church_id || user.churchId || ''
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (formData.churchId) {
            refreshOrgData();
        }
    }, [formData.churchId]);

    const refreshOrgData = async () => {
        const aData = await peopleService.getAreas(parseInt(formData.churchId as string));
        setAreas(aData);
        setGroups([]); // Reset groups when church changes
    };

    const loadData = async () => {
        try {
            console.log('Loading profile data...', { userId: user.id });
            const targetChurchId = formData.churchId || user.church_id || user.churchId;

            const promises: Promise<any>[] = [
                peopleService.getRoles(),
                peopleService.getAreas(targetChurchId),
                peopleService.getInstruments()
            ];

            if (isMaster) {
                promises.push(peopleService.getChurches());
            }

            const [rData, aData, iData, cData] = await Promise.all(promises);

            console.log('Data loaded:', { rolesCount: rData.length, areasCount: aData.length, roles: rData });
            if (rData && rData.length > 0) {
                setRoles(rData);
            } else {
                // Highly resilient fallback for essential roles
                setRoles([
                    { id: 2, name: 'pastor', displayName: t('people.roles.pastor') },
                    { id: 3, name: 'leader', displayName: t('people.roles.leader') },
                    { id: 4, name: 'coordinator', displayName: t('people.roles.coordinator') },
                    { id: 5, name: 'member', displayName: t('people.roles.member') }
                ]);
            }
            setAreas(aData);
            setInstruments(iData);
            if (cData) setChurches(cData);

            // If user already has areas, load groups for the first one
            const currentAreaId = formData.areaIds[0] || user.areas?.[0]?.id;
            if (currentAreaId) {
                const gData = await peopleService.getGroups(targetChurchId, currentAreaId);
                setGroups(gData);
            }
        } catch (err) {
            console.error('Error in loadData:', err);
        }
    };

    const toggleArea = async (id: number) => {
        const targetChurchId = formData.churchId || user.church_id || user.churchId;
        const nextAreas = formData.areaIds.includes(id)
            ? formData.areaIds.filter((a: number) => a !== id)
            : [...formData.areaIds, id];

        setFormData(prev => ({ ...prev, areaIds: nextAreas }));

        // Update groups list if we added an area
        if (nextAreas.length > 0) {
            const gData = await peopleService.getGroups(targetChurchId, nextAreas[0]);
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
        const selectedRole = roles.find(r => r.id == formData.roleId);
        const selectedRoleName = (selectedRole?.name || '').toLowerCase();
        const isAdminRole = ['pastor', 'admin', 'master', 'superadmin'].includes(selectedRoleName);

        if (!isAdminRole && formData.areaIds.length === 0) {
            alert(t('people.mandatoryArea'));
            return;
        }

        setIsSaving(true);
        try {
            const selectedRole = roles.find(r => r.id == formData.roleId);
            const selectedRoleName = (selectedRole?.name || '').toLowerCase();
            const isAdminRole = ['pastor', 'admin', 'master', 'superadmin'].includes(selectedRoleName);

            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const success = await peopleService.updateMemberProfile(user.id, {
                name: fullName,
                email: formData.email,
                sex: formData.sex,
                roleId: parseInt(formData.roleId as string),
                areaIds: isAdminRole ? [] : formData.areaIds,
                groups: (isAdminRole || !formData.groupId) ? [] : [parseInt(formData.groupId as string)],
                instruments: formData.selectedInstruments,
                churchId: formData.churchId ? parseInt(formData.churchId as string) : null
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
    const selectedRoleName = (selectedRole?.name || '').toLowerCase();
    const needsTeam = !['pastor', 'admin', 'master', 'superadmin'].includes(selectedRoleName);
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
            backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease-out'
        }} onClick={onClose}>
            <Card style={{
                maxWidth: '480px',
                width: '95%',
                padding: '0',
                overflow: 'hidden',
                border: '1px solid var(--color-border-subtle)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                backgroundColor: 'var(--color-card-bg)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    position: 'relative',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    background: 'linear-gradient(to bottom, var(--color-ui-surface), var(--color-card-bg))'
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px',
                        backgroundColor: 'var(--color-ui-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        border: `2px solid ${accentColor}`,
                        boxShadow: `0 0 15px ${accentColor}33`
                    }}>
                        {isGuest ? (
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ui-text)' }}>{formData.firstName.charAt(0) || '?'}</span>
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
                        <h2 className="text-h2" style={{ color: 'var(--color-ui-text)', margin: 0, fontSize: '20px', letterSpacing: '-0.3px' }}>
                            {formData.firstName} {formData.lastName}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accentColor }}></span>
                            <span className="text-overline" style={{ fontSize: '11px', letterSpacing: '0.5px', color: 'var(--color-ui-text-soft)' }}>
                                {selectedRole?.displayName || selectedRole?.display_name || (isGuest ? t('people.guest') : t('people.noRole'))}
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} style={{ color: 'var(--color-ui-text-soft)', padding: '4px', minWidth: 'auto', background: 'none' }}>
                        <span className="material-symbols-outlined">close</span>
                    </Button>
                </div>

                <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('common.firstName')}</label>
                            <input
                                className="text-body w-full"
                                value={formData.firstName}
                                onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                style={{
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    border: '1px solid var(--color-border-subtle)',
                                    borderRadius: '12px',
                                    padding: '10px 14px'
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('common.lastName')}</label>
                            <input
                                className="text-body w-full"
                                value={formData.lastName}
                                onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                style={{
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    border: '1px solid var(--color-border-subtle)',
                                    borderRadius: '12px',
                                    padding: '10px 14px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('common.sex')}</label>
                            <select
                                value={formData.sex}
                                onChange={e => setFormData(prev => ({ ...prev, sex: e.target.value }))}
                                className="w-full"
                                style={{
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    border: '1px solid var(--color-border-subtle)',
                                    borderRadius: '12px',
                                    padding: '10px 14px'
                                }}
                            >
                                <option value="M">{t('common.male')}</option>
                                <option value="F">{t('common.female')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('people.filterByRole')}</label>
                            <select
                                value={formData.roleId}
                                onChange={e => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                                className="w-full"
                                style={{
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    border: '1px solid var(--color-border-subtle)',
                                    borderRadius: '12px',
                                    padding: '10px 14px'
                                }}
                            >
                                <option value="">{t('people.selectRole')}</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.displayName || r.display_name || r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>EMAIL</label>
                            <input
                                className="text-body w-full"
                                value={formData.email}
                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                style={{
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    border: '1px solid var(--color-border-subtle)',
                                    borderRadius: '12px',
                                    padding: '10px 14px'
                                }}
                            />
                        </div>
                        {isMaster && (
                            <div>
                                <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('common.church') || 'IGLESIA'}</label>
                                <select
                                    value={formData.churchId}
                                    onChange={e => setFormData(prev => ({ ...prev, churchId: e.target.value }))}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-ui-bg)',
                                        color: 'var(--color-ui-text)',
                                        border: '1px solid var(--color-border-subtle)',
                                        borderRadius: '12px',
                                        padding: '10px 14px'
                                    }}
                                >
                                    <option value="">{t('churches.select_church')}</option>
                                    {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Org Section */}
                    <div style={{
                        padding: '16px',
                        backgroundColor: 'var(--color-ui-surface)',
                        borderRadius: '16px',
                        marginBottom: '20px',
                        border: '1px solid var(--color-border-subtle)'
                    }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '10px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('people.mandatoryAreaLabel')}</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {areas.map(area => {
                                    const isSelected = formData.areaIds.includes(area.id);
                                    return (
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
                                                borderColor: isSelected ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)',
                                                backgroundColor: isSelected ? 'rgba(61, 104, 223, 0.1)' : 'var(--color-ui-bg)',
                                                color: isSelected ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)'
                                            }}
                                        >
                                            {area.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {needsTeam && (
                            <div>
                                <label className="text-overline" style={{ display: 'block', marginBottom: '6px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('people.teamBasedOnArea')}</label>
                                <select
                                    value={formData.groupId}
                                    onChange={e => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-ui-bg)',
                                        color: 'var(--color-ui-text)',
                                        border: '1px solid var(--color-border-subtle)',
                                        borderRadius: '12px',
                                        padding: '10px 14px'
                                    }}
                                >
                                    <option value="">{t('people.selectTeam')}</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                                <p className="text-overline" style={{ marginTop: '8px', opacity: 0.6 }}>Solo se listan los equipos del área seleccionada.</p>
                            </div>
                        )}
                    </div>

                    {/* Instruments (Conditional) */}
                    {isAlabanza && (
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '10px', fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{t('people.instruments')}</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {instruments.map(inst => {
                                    const isSelected = formData.selectedInstruments.includes(inst.id);
                                    return (
                                        <div
                                            key={inst.id}
                                            onClick={() => toggleInstrument(inst.id)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                                                backgroundColor: isSelected ? accentColor : 'var(--color-ui-surface)',
                                                color: isSelected ? 'white' : 'var(--color-ui-text-soft)',
                                                border: '1px solid',
                                                borderColor: isSelected ? accentColor : 'var(--color-border-subtle)',
                                                transition: 'all 0.2s',
                                                fontWeight: isSelected ? 600 : 400
                                            }}
                                        >
                                            {inst.name}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-ui-surface)'
                }}>
                    <Button
                        variant="ghost"
                        label={t('common.delete')}
                        onClick={handleDeactivate}
                        style={{ color: 'var(--color-danger-red)', height: '40px', padding: '0 16px' }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button variant="ghost" label={t('common.cancel')} onClick={onClose} disabled={isSaving} />
                        <Button
                            variant="primary"
                            label={isSaving ? t('common.loading') : t('common.saveChanges')}
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{ minWidth: '140px' }}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};
