-- ComuniApp database schema for Neon Postgres.
-- Every block is independently executable so setup-database.mjs can use
-- @neondatabase/serverless over HTTP without relying on a persistent session.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS report_protocol_sequence START WITH 1 INCREMENT BY 1;

-- statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS report_categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  short_label text NOT NULL,
  icon text NOT NULL,
  scope text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT report_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT report_categories_label_length CHECK (char_length(label) BETWEEN 2 AND 80),
  CONSTRAINT report_categories_short_label_length CHECK (char_length(short_label) BETWEEN 2 AND 40),
  CONSTRAINT report_categories_icon_length CHECK (char_length(icon) BETWEEN 1 AND 16),
  CONSTRAINT report_categories_scope_valid CHECK (scope IN ('civic', 'security', 'both')),
  CONSTRAINT report_categories_sort_order_nonnegative CHECK (sort_order >= 0)
);

-- statement-breakpoint
DROP TRIGGER IF EXISTS report_categories_set_updated_at ON report_categories;

-- statement-breakpoint
CREATE TRIGGER report_categories_set_updated_at
BEFORE UPDATE ON report_categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text NOT NULL DEFAULT (
    'D' ||
    to_char(timezone('America/Sao_Paulo', CURRENT_TIMESTAMP), 'YYYY') ||
    '-' ||
    lpad(nextval('report_protocol_sequence')::text, 3, '0')
  ),
  visitor_id uuid NOT NULL,
  category_slug text NOT NULL REFERENCES report_categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  scope text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  address text NOT NULL,
  region text,
  latitude double precision,
  longitude double precision,
  is_anonymous boolean NOT NULL DEFAULT true,
  reporter_name text NOT NULL,
  reporter_email text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  vote_count integer NOT NULL DEFAULT 0,
  resolution_note text,
  resolved_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz,
  CONSTRAINT reports_protocol_unique UNIQUE (protocol),
  CONSTRAINT reports_protocol_format CHECK (protocol ~ '^D[0-9]{4}-[0-9]{3,}$'),
  CONSTRAINT reports_scope_valid CHECK (scope IN ('civic', 'security')),
  CONSTRAINT reports_title_length CHECK (char_length(title) BETWEEN 3 AND 160),
  CONSTRAINT reports_description_length CHECK (char_length(description) BETWEEN 10 AND 2000),
  CONSTRAINT reports_address_length CHECK (char_length(address) BETWEEN 3 AND 240),
  CONSTRAINT reports_region_length CHECK (region IS NULL OR char_length(region) BETWEEN 2 AND 80),
  CONSTRAINT reports_coordinates_together CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CONSTRAINT reports_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT reports_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT reports_always_anonymous CHECK (is_anonymous = true),
  CONSTRAINT reports_reporter_name_length CHECK (char_length(btrim(reporter_name)) BETWEEN 2 AND 120),
  CONSTRAINT reports_reporter_email_length CHECK (
    char_length(reporter_email) BETWEEN 3 AND 254
    AND reporter_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ),
  CONSTRAINT reports_status_valid CHECK (status IN ('open', 'in_review', 'resolved', 'rejected')),
  CONSTRAINT reports_priority_valid CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT reports_vote_count_nonnegative CHECK (vote_count >= 0),
  CONSTRAINT reports_resolution_note_length CHECK (resolution_note IS NULL OR char_length(resolution_note) <= 1000),
  CONSTRAINT reports_resolved_state_consistent CHECK ((status = 'resolved') = (resolved_at IS NOT NULL)),
  CONSTRAINT reports_version_positive CHECK (version > 0),
  CONSTRAINT reports_timestamps_ordered CHECK (
    updated_at >= created_at
    AND (resolved_at IS NULL OR resolved_at >= created_at)
    AND (deleted_at IS NULL OR deleted_at >= created_at)
  )
);

-- statement-breakpoint
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_name text;

-- statement-breakpoint
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_email text;

-- statement-breakpoint
UPDATE reports
SET is_anonymous = true
WHERE is_anonymous IS DISTINCT FROM true;

-- statement-breakpoint
UPDATE reports
SET reporter_name = 'Morador não informado (registro legado)'
WHERE reporter_name IS NULL
   OR char_length(btrim(reporter_name)) NOT BETWEEN 2 AND 120;

-- statement-breakpoint
UPDATE reports
SET reporter_email = 'legado+' || lower(regexp_replace(protocol, '[^a-zA-Z0-9]+', '-', 'g')) || '@comuniapp.local'
WHERE reporter_email IS NULL
   OR char_length(reporter_email) NOT BETWEEN 3 AND 254
   OR reporter_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$';

-- statement-breakpoint
ALTER TABLE reports ALTER COLUMN reporter_name SET NOT NULL;

-- statement-breakpoint
ALTER TABLE reports ALTER COLUMN reporter_email SET NOT NULL;

-- statement-breakpoint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_always_anonymous;

-- statement-breakpoint
ALTER TABLE reports ADD CONSTRAINT reports_always_anonymous
  CHECK (is_anonymous = true);

-- statement-breakpoint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_name_length;

-- statement-breakpoint
ALTER TABLE reports ADD CONSTRAINT reports_reporter_name_length
  CHECK (char_length(btrim(reporter_name)) BETWEEN 2 AND 120);

-- statement-breakpoint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_email_length;

-- statement-breakpoint
ALTER TABLE reports ADD CONSTRAINT reports_reporter_email_length
  CHECK (
    char_length(reporter_email) BETWEEN 3 AND 254
    AND reporter_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  );

-- statement-breakpoint
CREATE OR REPLACE FUNCTION validate_report_category_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  category_scope text;
  category_active boolean;
BEGIN
  SELECT scope, active
  INTO category_scope, category_active
  FROM report_categories
  WHERE slug = NEW.category_slug;

  IF category_scope IS NULL THEN
    RAISE EXCEPTION 'Unknown report category: %', NEW.category_slug
      USING ERRCODE = '23503';
  END IF;

  IF NOT category_active THEN
    RAISE EXCEPTION 'Inactive report category: %', NEW.category_slug
      USING ERRCODE = '23514';
  END IF;

  IF category_scope <> 'both' AND category_scope <> NEW.scope THEN
    RAISE EXCEPTION 'Category % is not available for scope %', NEW.category_slug, NEW.scope
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

-- statement-breakpoint
DROP TRIGGER IF EXISTS reports_validate_category_scope ON reports;

-- statement-breakpoint
CREATE TRIGGER reports_validate_category_scope
BEFORE INSERT OR UPDATE OF category_slug, scope ON reports
FOR EACH ROW
EXECUTE FUNCTION validate_report_category_scope();

-- statement-breakpoint
DROP TRIGGER IF EXISTS reports_set_updated_at ON reports;

-- statement-breakpoint
CREATE TRIGGER reports_set_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS report_votes (
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id, visitor_id)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  changed_by text NOT NULL DEFAULT 'system',
  visible_to_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT report_status_history_from_status_valid CHECK (
    from_status IS NULL OR from_status IN ('open', 'in_review', 'resolved', 'rejected')
  ),
  CONSTRAINT report_status_history_to_status_valid CHECK (
    to_status IN ('open', 'in_review', 'resolved', 'rejected')
  ),
  CONSTRAINT report_status_history_transition_changes CHECK (from_status IS NULL OR from_status <> to_status),
  CONSTRAINT report_status_history_note_length CHECK (note IS NULL OR char_length(note) <= 1000),
  CONSTRAINT report_status_history_actor_length CHECK (char_length(changed_by) BETWEEN 1 AND 254)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS report_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  data bytea NOT NULL,
  mime_type text NOT NULL,
  byte_size integer GENERATED ALWAYS AS (octet_length(data)) STORED,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT report_media_one_per_report UNIQUE (report_id),
  CONSTRAINT report_media_type_valid CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT report_media_size_valid CHECK (octet_length(data) BETWEEN 1 AND 1048576),
  CONSTRAINT report_media_file_name_length CHECK (file_name IS NULL OR char_length(file_name) BETWEEN 1 AND 180)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS directory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  summary text,
  address text,
  phone text,
  hours text,
  icon text NOT NULL,
  color text NOT NULL,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  latitude double precision,
  longitude double precision,
  active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  created_by text,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at timestamptz,
  CONSTRAINT directory_entries_kind_name_unique UNIQUE (kind, name),
  CONSTRAINT directory_entries_kind_valid CHECK (kind IN ('public_service', 'ngo')),
  CONSTRAINT directory_entries_category_length CHECK (char_length(category) BETWEEN 2 AND 60),
  CONSTRAINT directory_entries_name_length CHECK (char_length(name) BETWEEN 2 AND 160),
  CONSTRAINT directory_entries_summary_length CHECK (summary IS NULL OR char_length(summary) <= 600),
  CONSTRAINT directory_entries_address_length CHECK (address IS NULL OR char_length(address) BETWEEN 3 AND 240),
  CONSTRAINT directory_entries_public_address_required CHECK (kind <> 'public_service' OR address IS NOT NULL),
  CONSTRAINT directory_entries_phone_length CHECK (phone IS NULL OR char_length(phone) BETWEEN 3 AND 30),
  CONSTRAINT directory_entries_hours_length CHECK (hours IS NULL OR char_length(hours) <= 120),
  CONSTRAINT directory_entries_icon_length CHECK (char_length(icon) BETWEEN 1 AND 16),
  CONSTRAINT directory_entries_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT directory_entries_coordinates_together CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CONSTRAINT directory_entries_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT directory_entries_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT directory_entries_sort_order_nonnegative CHECK (sort_order >= 0),
  CONSTRAINT directory_entries_version_positive CHECK (version > 0),
  CONSTRAINT directory_entries_timestamps_ordered CHECK (
    updated_at >= created_at
    AND (archived_at IS NULL OR archived_at >= created_at)
  )
);

-- statement-breakpoint
DROP TRIGGER IF EXISTS directory_entries_set_updated_at ON directory_entries;

-- statement-breakpoint
CREATE TRIGGER directory_entries_set_updated_at
BEFORE UPDATE ON directory_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id text PRIMARY KEY,
  label text NOT NULL,
  phone_digits text NOT NULL,
  icon text NOT NULL,
  description text NOT NULL,
  color text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT emergency_contacts_id_format CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT emergency_contacts_phone_digits_unique UNIQUE (phone_digits),
  CONSTRAINT emergency_contacts_phone_digits_format CHECK (phone_digits ~ '^[0-9]{3,15}$'),
  CONSTRAINT emergency_contacts_label_length CHECK (char_length(label) BETWEEN 2 AND 80),
  CONSTRAINT emergency_contacts_icon_length CHECK (char_length(icon) BETWEEN 1 AND 16),
  CONSTRAINT emergency_contacts_description_length CHECK (char_length(description) BETWEEN 2 AND 160),
  CONSTRAINT emergency_contacts_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT emergency_contacts_sort_order_nonnegative CHECK (sort_order >= 0)
);

-- statement-breakpoint
DROP TRIGGER IF EXISTS emergency_contacts_set_updated_at ON emergency_contacts;

-- statement-breakpoint
CREATE TRIGGER emergency_contacts_set_updated_at
BEFORE UPDATE ON emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'manager',
  active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  session_version integer NOT NULL DEFAULT 1,
  last_login_at timestamptz,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_users_email_length CHECK (char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT admin_users_email_normalized CHECK (email = lower(btrim(email))),
  CONSTRAINT admin_users_email_format CHECK (
    email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ),
  CONSTRAINT admin_users_password_hash_length CHECK (char_length(password_hash) BETWEEN 64 AND 512),
  CONSTRAINT admin_users_role_valid CHECK (role IN ('owner', 'manager')),
  CONSTRAINT admin_users_session_version_positive CHECK (session_version > 0)
);

-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_unique_idx
  ON admin_users (lower(email));

-- statement-breakpoint
DROP TRIGGER IF EXISTS admin_users_set_updated_at ON admin_users;

-- statement-breakpoint
CREATE TRIGGER admin_users_set_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  request_id uuid,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_audit_log_actor_length CHECK (char_length(actor_email) BETWEEN 3 AND 254),
  CONSTRAINT admin_audit_log_action_length CHECK (char_length(action) BETWEEN 2 AND 80),
  CONSTRAINT admin_audit_log_entity_type_length CHECK (char_length(entity_type) BETWEEN 2 AND 80),
  CONSTRAINT admin_audit_log_entity_id_length CHECK (char_length(entity_id) BETWEEN 1 AND 180)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS rate_limits (
  fingerprint text NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (fingerprint, action, window_start),
  CONSTRAINT rate_limits_fingerprint_format CHECK (fingerprint ~ '^[0-9A-Fa-f]{64}$'),
  CONSTRAINT rate_limits_action_length CHECK (char_length(action) BETWEEN 2 AND 80),
  CONSTRAINT rate_limits_request_count_positive CHECK (request_count > 0),
  CONSTRAINT rate_limits_window_valid CHECK (expires_at > window_start)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_public_feed_idx
  ON reports (scope, status, created_at DESC, id)
  WHERE deleted_at IS NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_category_feed_idx
  ON reports (category_slug, created_at DESC, id)
  WHERE deleted_at IS NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_region_status_idx
  ON reports (region, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_visitor_idx
  ON reports (visitor_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_resolved_at_idx
  ON reports (resolved_at DESC)
  WHERE status = 'resolved' AND deleted_at IS NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_map_idx
  ON reports (longitude, latitude, created_at DESC)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND deleted_at IS NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS report_votes_visitor_idx
  ON report_votes (visitor_id, created_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS report_status_history_report_idx
  ON report_status_history (report_id, created_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS directory_entries_public_idx
  ON directory_entries (kind, category, sort_order, name)
  WHERE active = true AND archived_at IS NULL;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS directory_entries_tags_idx
  ON directory_entries USING gin (tags);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS emergency_contacts_public_idx
  ON emergency_contacts (sort_order, label)
  WHERE active = true;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS admin_users_active_idx
  ON admin_users (active, role, created_at);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx
  ON admin_audit_log (actor_email, created_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS admin_audit_log_entity_idx
  ON admin_audit_log (entity_type, entity_id, created_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx
  ON rate_limits (expires_at);
