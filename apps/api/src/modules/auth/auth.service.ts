import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as dns from 'dns';
import { promisify } from 'util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationTemplate, NotificationType } from '../notifications/dto';
import { RegisterDto, LoginDto } from './dto';

const resolveMx = promisify(dns.resolveMx);

@Injectable()
export class AuthService {
  private verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    // Validate email format and domain
    await this.validateEmail(dto.email);

    // Check for existing email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check for existing phone
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Get or create default tenant
    let tenant = await this.prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: { name: 'Ghana Lands', slug: 'ghana-lands' },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        ghanaCardNumber: dto.ghanaCardNumber,
        emailVerified: false,
      },
    });

    // Send verification email
    await this.sendVerificationEmail(user.id);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: false,
        },
        requiresVerification: true,
        message: 'Registration successful. Please check your email for the verification code.',
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification code.');
    }

    // Check if account is active
    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Your account is not active. Please contact support.');
    }

    const tokens = await this.generateTokens(user.id, user.tenantId, user.email);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
          roles: user.userRoles.map((ur) => ur.role.name),
        },
        ...tokens,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.tenantId,
      stored.user.email,
    );

    return {
      success: true,
      data: tokens,
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      data: { message: 'Logged out successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      return {
        success: true,
        data: { message: 'Email already verified' },
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code
    this.verificationCodes.set(userId, { code, expiresAt });

    // Log code in development for testing
    if (this.config.get('NODE_ENV') === 'development') {
      console.log(`\n========================================`);
      console.log(`📧 VERIFICATION CODE for ${user.email}: ${code}`);
      console.log(`========================================\n`);
    }

    // Send email
    await this.notifications.sendNotification(
      userId,
      NotificationTemplate.OTP,
      NotificationType.EMAIL,
      { code },
    );

    return {
      success: true,
      data: { message: 'Verification email sent' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async verifyEmail(userId: string, code: string) {
    const stored = this.verificationCodes.get(userId);

    if (!stored) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (stored.expiresAt < new Date()) {
      this.verificationCodes.delete(userId);
      throw new BadRequestException('Verification code expired. Please request a new one.');
    }

    if (stored.code !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Clean up
    this.verificationCodes.delete(userId);

    return {
      success: true,
      data: { message: 'Email verified successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        data: { message: 'If the email exists, a verification code has been sent' },
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    }

    if (user.emailVerified) {
      return {
        success: true,
        data: { message: 'Email is already verified' },
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    }

    return this.sendVerificationEmail(user.id);
  }

  async verifyEmailByEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification request');
    }

    return this.verifyEmail(user.id, code);
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        data: { message: 'If the email exists, a reset code has been sent' },
        meta: { requestId: `req_${Date.now()}` },
        error: null,
      };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store code with prefix to distinguish from email verification
    this.verificationCodes.set(`reset_${user.id}`, { code, expiresAt });

    // Send email
    await this.notifications.sendNotification(
      user.id,
      NotificationTemplate.PASSWORD_RESET,
      NotificationType.EMAIL,
      { code },
    );

    return {
      success: true,
      data: { message: 'If the email exists, a reset code has been sent' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid reset request');
    }

    const stored = this.verificationCodes.get(`reset_${user.id}`);

    if (!stored) {
      throw new BadRequestException('No reset code found. Please request a new one.');
    }

    if (stored.expiresAt < new Date()) {
      this.verificationCodes.delete(`reset_${user.id}`);
      throw new BadRequestException('Reset code expired. Please request a new one.');
    }

    if (stored.code !== code) {
      throw new BadRequestException('Invalid reset code');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Clean up
    this.verificationCodes.delete(`reset_${user.id}`);

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      data: { message: 'Password reset successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  private async validateEmail(email: string): Promise<void> {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Extract domain
    const domain = email.split('@')[1];

    // Check for disposable email domains
    const disposableDomains = [
      'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
      'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com',
      'yopmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
    ];
    if (disposableDomains.includes(domain.toLowerCase())) {
      throw new BadRequestException('Disposable email addresses are not allowed');
    }

    // Verify domain has MX records (can receive email)
    try {
      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        throw new BadRequestException('Email domain does not appear to be valid');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Unable to verify email domain. Please use a valid email address.');
    }
  }

  private async generateTokens(userId: string, tenantId: string, email: string) {
    const payload = { sub: userId, tenantId, email };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('REFRESH_TOKEN_EXPIRES_IN', '7d'),
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
