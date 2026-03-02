
export interface InvitationTemplate {
    id?: number;
    church_id: number;
    template_index: number;
    is_active: boolean;
    subject: string;
    body_html: string;
}

export const invitationService = {
    getTemplates: async (churchId: number): Promise<InvitationTemplate[]> => {
        const response = await fetch(`/api/settings/invitation-templates?church_id=${churchId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        return data.templates || [];
    },

    saveTemplate: async (template: InvitationTemplate): Promise<boolean> => {
        const response = await fetch('/api/settings/invitation-templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(template)
        });
        const data = await response.json();
        return data.success;
    }
};
