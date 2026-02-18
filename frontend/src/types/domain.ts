export type UserRoleName = 'master' | 'pastor' | 'leader' | 'coordinator' | 'member' | 'admin' | 'guest';

export interface Instrument {
    id: number;
    name: string;
    code: string;
}

export interface UserRole {
    id: number;
    name: UserRoleName;
    displayName: string;
    level: number;
    isSystemRole: boolean;
}

export interface UserService {
    serviceKey: string;
    enabled: boolean;
    roleId?: number;
    role?: UserRole;
}

export interface User {
    id: number;
    churchId: number | null; // null for master
    roleId: number;
    statusId: number;
    status?: string; // String representation from API
    name: string;
    email: string;
    phone?: string;
    sex?: 'M' | 'F';
    photoUrl?: string;
    role?: UserRole; // Hydrated
    defaultTheme?: string;
    defaultLanguage?: string;
    instruments?: Instrument[];
    groups?: Team[];
    areas?: { id: number; name: string }[];
    services?: UserService[]; // Multi-hub support
}

export interface Church {
    id: number;
    name: string;
    slug?: string;
    subscriptionPlan: 'free' | 'pro' | 'enterprise';
}

export interface Song {
    id: number | string;
    churchId: number;
    title: string;
    artist: string;
    originalKey: string; // e.g., "C", "F#m"
    tempo?: number;
    timeSignature: string; // "4/4", "6/8"
    content: string; // ChordPro format: "Amazing [D]Grace how [G]sweet..."

    // Calculated/Cached fields for quick access
    lyricsPreview?: string;

    // Metadata
    youtubeUrl?: string;
    bpmType?: 'fast' | 'slow';
    tags?: string[];
    category?: 'worship' | 'praise' | 'hymn' | 'special';

    createdBy?: number;
    createdAt?: string;
    updatedAt?: string;
    memberKeys?: MemberKey[];
}

export interface MemberKey {
    id?: number;
    songId: number | string;
    memberId: number;
    memberName?: string;
    preferredKey: string;
}

export interface SongSection {
    id: number;
    songId: number;
    type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
    content: string; // Local content or override
}

export interface Team {
    id: number;
    churchId: number;
    name: string;
    description?: string;
    isServiceTeam: boolean;
    leaderId?: number;
    members?: TeamMember[]; // Hydrated
}

export interface TeamMember {
    memberId: number;
    groupId: number;
    role: 'leader' | 'coordinator' | 'member';
}

export interface Meeting {
    id: number;
    churchId: number;
    name: string;
    dateTime: string;
    endTime?: string;
    status: 'draft' | 'published' | 'completed';
    assignments?: MeetingAssignment[];
    playlist?: Playlist;
}

export interface MeetingAssignment {
    id: number;
    meetingId: number;
    memberId?: number;
    roleName: string; // "Predicador", "Worship Leader"
    isConfirmed: boolean;
}

export interface Playlist {
    id: number;
    churchId: number;
    meetingId?: number;
    name: string;
    items: PlaylistItem[];
    status: 'pending' | 'in_progress' | 'completed';
    isSantaCena: boolean;
    createdAt: string;
}

export interface PlaylistItem {
    id: number;
    song: Song;
    songKey?: string; // Transposed key for this specific event
    sequenceOrder: number;
    notes?: string;
}
export interface SongEdit {
    id: number;
    songId: number | string;
    memberId: number;
    proposedTitle?: string;
    proposedArtist?: string;
    proposedContent?: string;
    proposedKey?: string;
    proposedTempo?: number;
    proposedTimeSignature?: string;
    proposedBpmType?: 'fast' | 'slow';
    status: 'pending' | 'approved' | 'rejected';
    reviewerId?: number;
    reviewerNotes?: string;
    reviewedAt?: string;
    createdAt: string;
}
