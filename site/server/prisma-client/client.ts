export enum OrganizationRole {
        OWNER = "OWNER",
        ADMIN = "ADMIN",
        MEMBER = "MEMBER",
}

export interface User {
        id: number;
        email: string;
        name: string | null;
        avatarUrl: string | null;
        bio: string | null;
        createdAt: Date;
        updatedAt: Date;
}

export interface Account {
        id: number;
        provider: string;
        providerId: string;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
}

export interface OrganizationMember {
        id: number;
        organizationId: number;
        userId: number;
        role: OrganizationRole;
        createdAt: Date;
        updatedAt: Date;
        organization: Organization;
        user: User;
}

export interface OrganizationInvitation {
        id: number;
        organizationId: number;
        email: string;
        role: OrganizationRole;
        token: string;
        expiresAt: Date;
        createdAt: Date;
}

export interface Organization {
        id: number;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        allowedDomains: string | null;
        members: OrganizationMember[];
}

export interface Minuts {
        id: number;
        title: string;
        videoKey: string;
        userId: number;
        status: string;
        summary: string | null;
        transcript: string | null;
        createdAt: Date;
        updatedAt: Date;
}

type AnyArgs = Record<string, unknown>;

type TransactionClient = PrismaClient;

type Thenable<T> = Promise<T>;

function notGenerated(): never {
        throw new Error("Prisma client not generated. Run `pnpm --filter ./site prisma:generate`.");
}

export class PrismaClient {
        constructor(_args?: unknown) {}

        readonly user = {
                findUnique: async (..._args: AnyArgs[]): Thenable<User | null> => notGenerated(),
                create: async (..._args: AnyArgs[]): Thenable<User> => notGenerated(),
                update: async (..._args: AnyArgs[]): Thenable<User> => notGenerated(),
        };

        readonly account = {
                findUnique: async (..._args: AnyArgs[]): Thenable<Account | null> => notGenerated(),
                create: async (..._args: AnyArgs[]): Thenable<Account> => notGenerated(),
        };

        readonly organization = {
                findUnique: async (..._args: AnyArgs[]): Thenable<Organization | null> => notGenerated(),
                findMany: async (..._args: AnyArgs[]): Thenable<Organization[]> => notGenerated(),
                create: async (..._args: AnyArgs[]): Thenable<Organization> => notGenerated(),
                update: async (..._args: AnyArgs[]): Thenable<Organization> => notGenerated(),
        };

        readonly organizationMember = {
                findUnique: async (..._args: AnyArgs[]): Thenable<OrganizationMember | null> => notGenerated(),
                findMany: async (..._args: AnyArgs[]): Thenable<OrganizationMember[]> => notGenerated(),
                create: async (..._args: AnyArgs[]): Thenable<OrganizationMember> => notGenerated(),
                update: async (..._args: AnyArgs[]): Thenable<OrganizationMember> => notGenerated(),
        };

        readonly organizationInvitation = {
                findUnique: async (..._args: AnyArgs[]): Thenable<OrganizationInvitation | null> =>
                        notGenerated(),
                create: async (..._args: AnyArgs[]): Thenable<OrganizationInvitation> => notGenerated(),
        };

        readonly minuts = {
                findMany: async (..._args: AnyArgs[]): Thenable<Minuts[]> => notGenerated(),
                findUnique: async (..._args: AnyArgs[]): Thenable<Minuts | null> => notGenerated(),
                create: async (..._args: AnyArgs[]): Thenable<Minuts> => notGenerated(),
                update: async (..._args: AnyArgs[]): Thenable<Minuts> => notGenerated(),
        };

        async $transaction<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T> {
                return callback(this);
        }
}
