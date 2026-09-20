import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { ContentStatus, Prisma } from '../../generated/prisma/client';
import {
  validateCreateContentPage,
  validateCreateFaq,
  validateContentPageQuery,
  validateFaqQuery,
  validateUpdateContentPage,
  validateUpdateFaq,
} from '@wildera/validation';
import type { ContentPageItem, FaqItem } from '@wildera/types';

export interface AuditContext {
  adminUserId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // PUBLIC FAQ & CONTENT PAGES
  // ---------------------------------------------------------------------------

  async listPublicFaqs(category?: string) {
    const where: Prisma.FaqWhereInput = {
      status: ContentStatus.PUBLISHED,
    };

    if (
      category &&
      typeof category === 'string' &&
      category.trim().length > 0
    ) {
      where.category = { equals: category.trim(), mode: 'insensitive' };
    }

    const items = await this.prisma.faq.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        category: true,
        question: true,
        answer: true,
        sortOrder: true,
      },
    });

    return items;
  }

  async getPublicContentPage(slug: string) {
    const page = await this.prisma.contentPage.findFirst({
      where: {
        OR: [{ slug }, { pageKey: slug }],
        status: ContentStatus.PUBLISHED,
      },
    });

    if (!page) {
      throw new NotFoundException({
        code: 'CONTENT_PAGE_NOT_FOUND',
        message: `Halaman konten "${slug}" tidak ditemukan atau belum dipublikasikan.`,
      });
    }

    return {
      title: page.title,
      slug: page.slug,
      pageKey: page.pageKey,
      content: page.content,
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
      seo: {
        title: page.seoTitle || page.title,
        description: page.seoDescription || '',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // ADMIN FAQ OPERATIONS
  // ---------------------------------------------------------------------------

  async listAdminFaqs(queryInput: unknown) {
    const validation = validateFaqQuery(
      (typeof queryInput === 'object' && queryInput !== null
        ? queryInput
        : {}) as Record<string, unknown>,
    );
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        errors: validation.errors,
      });
    }

    const { category, status, search } = validation.data;
    const where: Prisma.FaqWhereInput = {};

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (status && status !== 'ALL') {
      where.status = status as ContentStatus;
    }

    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.faq.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return items.map((f) => this.mapToFaqItem(f));
  }

  async getAdminFaq(id: string): Promise<FaqItem> {
    const item = await this.prisma.faq.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'FAQ_NOT_FOUND',
        message: 'FAQ tidak ditemukan.',
      });
    }

    return this.mapToFaqItem(item);
  }

  async createFaq(input: unknown, audit?: AuditContext): Promise<FaqItem> {
    const validation = validateCreateFaq(input);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        errors: validation.errors,
      });
    }

    const created = await this.prisma.faq.create({
      data: {
        category: validation.data.category,
        question: validation.data.question,
        answer: validation.data.answer,
        sortOrder: validation.data.sortOrder ?? 0,
        status:
          (validation.data.status as ContentStatus) ?? ContentStatus.DRAFT,
      },
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'FAQ_CREATED',
        entityType: 'FAQ',
        entityId: created.id,
        oldData: null,
        newData: created,
      });
    }

    return this.mapToFaqItem(created);
  }

  async updateFaq(
    id: string,
    input: unknown,
    audit?: AuditContext,
  ): Promise<FaqItem> {
    const existing = await this.prisma.faq.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'FAQ_NOT_FOUND',
        message: 'FAQ tidak ditemukan.',
      });
    }

    const validation = validateUpdateFaq(input);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        errors: validation.errors,
      });
    }

    const dataToUpdate: Prisma.FaqUpdateInput = {};
    if (validation.data.question !== undefined) {
      dataToUpdate.question = validation.data.question;
    }
    if (validation.data.answer !== undefined) {
      dataToUpdate.answer = validation.data.answer;
    }
    if (validation.data.category !== undefined) {
      dataToUpdate.category = validation.data.category;
    }
    if (validation.data.sortOrder !== undefined) {
      dataToUpdate.sortOrder = validation.data.sortOrder;
    }
    if (validation.data.status !== undefined) {
      dataToUpdate.status = validation.data.status as ContentStatus;
    }

    const updated = await this.prisma.faq.update({
      where: { id },
      data: dataToUpdate,
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'FAQ_UPDATED',
        entityType: 'FAQ',
        entityId: id,
        oldData: existing,
        newData: updated,
      });
    }

    return this.mapToFaqItem(updated);
  }

  async deleteFaq(id: string, audit?: AuditContext): Promise<void> {
    const existing = await this.prisma.faq.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'FAQ_NOT_FOUND',
        message: 'FAQ tidak ditemukan.',
      });
    }

    await this.prisma.faq.delete({
      where: { id },
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'FAQ_DELETED',
        entityType: 'FAQ',
        entityId: id,
        oldData: existing,
        newData: null,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // ADMIN CONTENT PAGES OPERATIONS
  // ---------------------------------------------------------------------------

  async listAdminContentPages(queryInput: unknown) {
    const validation = validateContentPageQuery(
      (typeof queryInput === 'object' && queryInput !== null
        ? queryInput
        : {}) as Record<string, unknown>,
    );
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        errors: validation.errors,
      });
    }

    const { status, search } = validation.data;
    const where: Prisma.ContentPageWhereInput = {};

    if (status && status !== 'ALL') {
      where.status = status as ContentStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { pageKey: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.contentPage.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
    });

    return items.map((p) => this.mapToContentPageItem(p));
  }

  async getAdminContentPage(keyOrId: string): Promise<ContentPageItem> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        keyOrId,
      );

    const page = await this.prisma.contentPage.findFirst({
      where: {
        OR: isUuid
          ? [{ id: keyOrId }, { pageKey: keyOrId }, { slug: keyOrId }]
          : [{ pageKey: keyOrId }, { slug: keyOrId }],
      },
    });

    if (!page) {
      throw new NotFoundException({
        code: 'CONTENT_PAGE_NOT_FOUND',
        message: 'Halaman konten tidak ditemukan.',
      });
    }

    return this.mapToContentPageItem(page);
  }

  async createContentPage(
    input: unknown,
    audit?: AuditContext,
  ): Promise<ContentPageItem> {
    const validation = validateCreateContentPage(input);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        errors: validation.errors,
      });
    }

    // Check unique pageKey and slug
    const existingKey = await this.prisma.contentPage.findUnique({
      where: { pageKey: validation.data.pageKey },
    });
    if (existingKey) {
      throw new ConflictException({
        code: 'PAGE_KEY_ALREADY_EXISTS',
        message: `Halaman dengan key "${validation.data.pageKey}" sudah ada.`,
      });
    }

    const existingSlug = await this.prisma.contentPage.findUnique({
      where: { slug: validation.data.slug },
    });
    if (existingSlug) {
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: `Slug "${validation.data.slug}" sudah digunakan.`,
      });
    }

    const created = await this.prisma.contentPage.create({
      data: {
        pageKey: validation.data.pageKey,
        title: validation.data.title,
        slug: validation.data.slug,
        content: validation.data.content,
        status:
          (validation.data.status as ContentStatus) ?? ContentStatus.DRAFT,
        seoTitle: validation.data.seoTitle ?? null,
        seoDescription: validation.data.seoDescription ?? null,
        publishedAt: validation.data.publishedAt
          ? new Date(validation.data.publishedAt)
          : null,
      },
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'CONTENT_PAGE_CREATED',
        entityType: 'CONTENT_PAGE',
        entityId: created.id,
        oldData: null,
        newData: created,
      });
    }

    return this.mapToContentPageItem(created);
  }

  async updateContentPage(
    keyOrId: string,
    input: unknown,
    audit?: AuditContext,
  ): Promise<ContentPageItem> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        keyOrId,
      );

    const existing = await this.prisma.contentPage.findFirst({
      where: {
        OR: isUuid
          ? [{ id: keyOrId }, { pageKey: keyOrId }, { slug: keyOrId }]
          : [{ pageKey: keyOrId }, { slug: keyOrId }],
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'CONTENT_PAGE_NOT_FOUND',
        message: 'Halaman konten tidak ditemukan.',
      });
    }

    const validation = validateUpdateContentPage(input);
    if (!validation.valid || !validation.data) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        errors: validation.errors,
      });
    }

    if (
      validation.data.pageKey &&
      validation.data.pageKey !== existing.pageKey
    ) {
      const conflictKey = await this.prisma.contentPage.findUnique({
        where: { pageKey: validation.data.pageKey },
      });
      if (conflictKey) {
        throw new ConflictException({
          code: 'PAGE_KEY_ALREADY_EXISTS',
          message: `Halaman dengan key "${validation.data.pageKey}" sudah ada.`,
        });
      }
    }

    if (validation.data.slug && validation.data.slug !== existing.slug) {
      const conflictSlug = await this.prisma.contentPage.findUnique({
        where: { slug: validation.data.slug },
      });
      if (conflictSlug) {
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: `Slug "${validation.data.slug}" sudah digunakan.`,
        });
      }
    }

    const dataToUpdate: Prisma.ContentPageUpdateInput = {};
    if (validation.data.pageKey !== undefined) {
      dataToUpdate.pageKey = validation.data.pageKey;
    }
    if (validation.data.title !== undefined) {
      dataToUpdate.title = validation.data.title;
    }
    if (validation.data.slug !== undefined) {
      dataToUpdate.slug = validation.data.slug;
    }
    if (validation.data.content !== undefined) {
      dataToUpdate.content = validation.data.content;
    }
    if (validation.data.status !== undefined) {
      dataToUpdate.status = validation.data.status as ContentStatus;
      if (validation.data.status === 'PUBLISHED' && !existing.publishedAt) {
        dataToUpdate.publishedAt = new Date();
      }
    }
    if (validation.data.seoTitle !== undefined) {
      dataToUpdate.seoTitle = validation.data.seoTitle;
    }
    if (validation.data.seoDescription !== undefined) {
      dataToUpdate.seoDescription = validation.data.seoDescription;
    }

    const updated = await this.prisma.contentPage.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'CONTENT_PAGE_UPDATED',
        entityType: 'CONTENT_PAGE',
        entityId: existing.id,
        oldData: existing,
        newData: updated,
      });
    }

    return this.mapToContentPageItem(updated);
  }

  async deleteContentPage(
    keyOrId: string,
    audit?: AuditContext,
  ): Promise<void> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        keyOrId,
      );

    const existing = await this.prisma.contentPage.findFirst({
      where: {
        OR: isUuid
          ? [{ id: keyOrId }, { pageKey: keyOrId }, { slug: keyOrId }]
          : [{ pageKey: keyOrId }, { slug: keyOrId }],
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'CONTENT_PAGE_NOT_FOUND',
        message: 'Halaman konten tidak ditemukan.',
      });
    }

    await this.prisma.contentPage.delete({
      where: { id: existing.id },
    });

    if (audit) {
      await this.logAudit({
        audit,
        action: 'CONTENT_PAGE_DELETED',
        entityType: 'CONTENT_PAGE',
        entityId: existing.id,
        oldData: existing,
        newData: null,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private mapToFaqItem(item: {
    id: string;
    category: string | null;
    question: string;
    answer: string;
    sortOrder: number;
    status: ContentStatus;
    createdAt: Date;
    updatedAt: Date;
  }): FaqItem {
    return {
      id: item.id,
      category: item.category,
      question: item.question,
      answer: item.answer,
      sortOrder: item.sortOrder,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private mapToContentPageItem(item: {
    id: string;
    pageKey: string;
    title: string;
    slug: string;
    content: string;
    status: ContentStatus;
    seoTitle: string | null;
    seoDescription: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ContentPageItem {
    return {
      id: item.id,
      pageKey: item.pageKey,
      title: item.title,
      slug: item.slug,
      content: item.content,
      status: item.status,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private async logAudit(params: {
    audit: AuditContext;
    action: string;
    entityType: string;
    entityId: string;
    oldData: unknown;
    newData: unknown;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: params.audit.adminUserId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: (params.oldData ??
            Prisma.JsonNull) as Prisma.InputJsonValue,
          newValue: (params.newData ??
            Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });
    } catch {
      // Non-blocking audit failure
    }
  }
}
