import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        tenantId: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            tenantId: string;
            nom: string | null;
            prenom: string | null;
            membreId: string | null;
        };
        tenant: {
            id: string;
            nom: string;
            slug: string;
            devise: string;
        };
    }>;
    private generateTokens;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    assignRole(presidentId: string, userId: string, newRole: string, motif?: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        message: string;
    }>;
    getUsersByTenant(tenantId: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        lastLogin: Date | null;
        createdAt: Date;
        membre: {
            nom: string;
            prenom: string;
            telephone: string;
        } | null;
    }[]>;
}
