declare module "@/server/prisma-client/client" {
  export const OrganizationRole: {
    readonly OWNER: "OWNER";
    readonly ADMIN: "ADMIN";
    readonly MEMBER: "MEMBER";
  };

  export type OrganizationRole = (typeof OrganizationRole)[keyof typeof OrganizationRole];

  export interface User {
    id: number;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Organization {
    id: number;
    name: string;
    slug: string;
    allowedDomains: string | null;
    members: OrganizationMember[];
  }

  export interface OrganizationMember {
    id: number;
    organizationId: number;
    userId: number;
    role: OrganizationRole;
    organization: Organization;
    user: User;
  }

  export interface OrganizationInvitation {
    id: number;
    organizationId: number;
    email: string;
    role: OrganizationRole;
    token: string;
    expiresAt: Date | null;
  }

  export interface Minuts {
    id: number;
    title: string;
    status: string;
    createdAt: Date;
    userId: number;
    summary?: string | null;
    transcript?: string | null;
  }

  export class PrismaClient {
    organization: {
      findUnique: (args: unknown) => Promise<Organization | null>;
      findMany: (args: unknown) => Promise<Organization[]>;
      update: (args: unknown) => Promise<Organization>;
      create: (args: unknown) => Promise<Organization>;
    };

    organizationMember: {
      findMany: (args: unknown) => Promise<OrganizationMember[]>;
      findUnique: (args: unknown) => Promise<OrganizationMember | null>;
      create: (args: unknown) => Promise<OrganizationMember>;
      update: (args: unknown) => Promise<OrganizationMember>;
    };

    organizationInvitation: {
      findUnique: (args: unknown) => Promise<OrganizationInvitation | null>;
      create: (args: unknown) => Promise<OrganizationInvitation>;
    };

    user: {
      findUnique: (args: unknown) => Promise<User | null>;
      create: (args: unknown) => Promise<User>;
      update: (args: unknown) => Promise<User>;
    };

    account: {
      findUnique: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
    };

    minuts: {
      findMany: (args: unknown) => Promise<Minuts[]>;
      findUnique: (args: unknown) => Promise<Minuts | null>;
      create: (args: unknown) => Promise<Minuts>;
      update: (args: unknown) => Promise<Minuts>;
    };

    $transaction: <T>(fn: (tx: PrismaClient) => Promise<T>) => Promise<T>;

    constructor(options?: unknown);
  }
}
