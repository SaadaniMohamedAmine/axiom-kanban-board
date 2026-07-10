export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  invitedAt: Date;
  joinedAt: Date | null;
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expiresAt: Date;
  createdAt: Date;
}
