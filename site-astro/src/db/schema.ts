import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['admin', 'editor', 'viewer'] })
      .notNull()
      .default('editor'),
    // segredo TOTP guardado CRIPTOGRAFADO (encrypt/decrypt de lib/crypto.ts):
    // dump do banco sem a APP_ENCRYPTION_KEY não serve para gerar códigos
    totpSecret: text('totp_secret'),
    // só depois de confirmar um código o 2FA passa a ser exigido — senão um
    // cadastro pela metade tranca o dono para fora
    totpEnabledAt: timestamp('totp_enabled_at', { withTimezone: true }),
    // JSON com os hashes dos códigos de recuperação; cada um serve uma vez
    totpRecoveryCodes: text('totp_recovery_codes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    message: text('message').notNull(),
    read: boolean('read').notNull().default(false),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('contacts_created_at_idx').on(table.createdAt),
  })
);

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    notes: text('notes'), // criptografado em application-layer
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('clients_name_idx').on(table.name),
  })
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    date: date('date'),
    type: text('type'),
    status: text('status', { enum: ['pending', 'done', 'delivered', 'archived'] })
      .notNull()
      .default('pending'),
    passwordHash: text('password_hash'), // senha da galeria privada
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('sessions_client_id_idx').on(table.clientId),
  })
);

export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
    originalName: text('original_name').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    mimeType: text('mime_type'),
    sizeBytes: integer('size_bytes'),
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('files_session_id_idx').on(table.sessionId),
  })
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type File = typeof files.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
