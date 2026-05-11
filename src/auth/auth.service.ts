import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, tenantId, role, associationNom, associationSlug, associationDevise, associationLangue } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // Vérifier si le tenant existe, sinon le créer
    let tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      const nom = associationNom || `Association ${tenantId}`;
      const slug = associationSlug || tenantId.toLowerCase().replace(/\s+/g, '-');
      const devise = associationDevise || 'FCFA';
      const langue = associationLangue || 'fr';

      tenant = await this.prisma.tenant.create({
        data: {
          id: tenantId,
          nom,
          slug,
          devise,
          langue,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        tenantId: tenant.id,
        role,
      },
    });

    // Si c'est un PRESIDENT ou SECRETAIRE, créer automatiquement son profil membre
    if (role === 'PRESIDENT' || role === 'SECRETAIRE') {
      const count = await this.prisma.membre.count({ where: { tenantId: tenant.id } });
      const numeroMembre = `M${(count + 1).toString().padStart(4, '0')}`;

      // Extraire nom/prenom depuis l'email si pas fourni
      const emailPrefix = email.split('@')[0];

      await this.prisma.membre.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          numeroMembre,
          nom: emailPrefix.toUpperCase(),
          prenom: role === 'PRESIDENT' ? 'Président' : 'Secrétaire',
          telephone: '0000000000',
          statut: 'ACTIF',
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, tenantId } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked. Try again later.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const failedAttempts = user.failedAttempts + 1;
      const updateData: any = { failedAttempts };

      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Récupérer le profil membre si existe
    const membre = await this.prisma.membre.findUnique({
      where: { userId: user.id },
      select: { id: true, nom: true, prenom: true, numeroMembre: true },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        nom: membre?.nom || null,
        prenom: membre?.prenom || null,
        membreId: membre?.id || null,
      },
      tenant: {
        id: user.tenant.id,
        nom: user.tenant.nom,
        slug: user.tenant.slug,
        devise: user.tenant.devise,
      },
      ...tokens,
    };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret';
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret';
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshTokenSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error('Refresh token verification failed', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async assignRole(presidentId: string, userId: string, newRole: string, motif?: string) {
    const president = await this.prisma.user.findUnique({
      where: { id: presidentId },
    });

    if (!president || president.role !== 'PRESIDENT') {
      throw new UnauthorizedException('Only president can assign roles');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new UnauthorizedException('User not found');
    }

    if (president.tenantId !== targetUser.tenantId) {
      throw new UnauthorizedException('Cannot assign role to user from different tenant');
    }

    const oldRole = targetUser.role;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: president.tenantId,
        userId: presidentId,
        entityType: 'USER',
        entityId: userId,
        action: 'ASSIGN_ROLE',
        oldValue: oldRole,
        newValue: newRole,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      message: `Role updated from ${oldRole} to ${newRole}`,
    };
  }

  async getUsersByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        membre: {
          select: {
            nom: true,
            prenom: true,
            telephone: true,
          },
        },
      },
    });
  }
}
