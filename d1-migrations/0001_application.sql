CREATE TABLE "admin_password" (
  "id" TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  "password_hash" TEXT NOT NULL,
  "created_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "admin_password_pkey" PRIMARY KEY (id)
);

CREATE TABLE "portfolios" (
  "id" TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "image_url" TEXT,
  "images" TEXT CHECK ("images" IS NULL OR (json_valid("images") AND json_type("images") = 'array')),
  "thumbnail_url" TEXT,
  "tags" TEXT CHECK ("tags" IS NULL OR (json_valid("tags") AND json_type("tags") = 'array')),
  "is_featured" INTEGER CHECK ("is_featured" IN (0,1)) DEFAULT 0,
  "is_published" INTEGER CHECK ("is_published" IN (0,1)) DEFAULT 1,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "portfolios_pkey" PRIMARY KEY (id)
);

CREATE TABLE "services" (
  "id" TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "sort_order" INTEGER DEFAULT 0,
  "is_active" INTEGER CHECK ("is_active" IN (0,1)) DEFAULT 1,
  "created_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  "updated_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "services_pkey" PRIMARY KEY (id)
);

CREATE TABLE "site_settings" (
  "id" TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  "key" TEXT NOT NULL,
  "value" TEXT,
  "type" TEXT DEFAULT 'text',
  "description" TEXT,
  "updated_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "site_settings_pkey" PRIMARY KEY (id),
  CONSTRAINT "site_settings_key_key" UNIQUE (key)
);

CREATE TABLE "social_links" (
  "id" TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  "platform" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "icon" TEXT,
  "sort_order" INTEGER DEFAULT 0,
  "is_active" INTEGER CHECK ("is_active" IN (0,1)) DEFAULT 1,
  "created_at" TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z'),
  CONSTRAINT "social_links_pkey" PRIMARY KEY (id)
);

CREATE INDEX idx_portfolios_featured ON portfolios (is_featured) WHERE (is_featured = true);

CREATE INDEX idx_portfolios_published ON portfolios (is_published) WHERE (is_published = true);

CREATE INDEX idx_portfolios_sort ON portfolios (sort_order);

CREATE INDEX idx_services_active ON services (is_active) WHERE (is_active = true);

CREATE INDEX idx_services_sort ON services (sort_order);

CREATE TRIGGER portfolios_updated_at AFTER UPDATE ON "portfolios" WHEN NEW.updated_at = OLD.updated_at AND NEW.updated_at <> (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') BEGIN UPDATE "portfolios" SET updated_at = (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') WHERE id = NEW.id; END;

CREATE TRIGGER services_updated_at AFTER UPDATE ON "services" WHEN NEW.updated_at = OLD.updated_at AND NEW.updated_at <> (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') BEGIN UPDATE "services" SET updated_at = (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') WHERE id = NEW.id; END;

CREATE TRIGGER site_settings_updated_at AFTER UPDATE ON "site_settings" WHEN NEW.updated_at = OLD.updated_at AND NEW.updated_at <> (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') BEGIN UPDATE "site_settings" SET updated_at = (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') WHERE id = NEW.id; END;

CREATE TRIGGER admin_password_updated_at AFTER UPDATE ON "admin_password" WHEN NEW.updated_at = OLD.updated_at AND NEW.updated_at <> (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') BEGIN UPDATE "admin_password" SET updated_at = (strftime('%Y-%m-%dT%H:%M:%f','now') || '000Z') WHERE id = NEW.id; END;
