BEGIN;

-- Generic trigger to keep updated_at current.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT whatsapp_sessions_user_phone_key UNIQUE (user_id, phone_number)
);

CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_status_check CHECK (status IN ('open', 'pending', 'closed', 'archived')),
  CONSTRAINT conversations_priority_check CHECK (priority BETWEEN 0 AND 5)
);

CREATE TRIGGER set_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message_text TEXT,
  media_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_from_bot BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT messages_sender_type_check CHECK (sender_type IN ('contact', 'user', 'bot', 'system'))
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT knowledge_base_question_unique UNIQUE (user_id, question)
);

CREATE TABLE IF NOT EXISTS ai_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.70,
  max_tokens INTEGER,
  system_prompt TEXT,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ai_settings_temperature_check CHECK (temperature >= 0 AND temperature <= 2),
  CONSTRAINT ai_settings_max_tokens_check CHECK (max_tokens IS NULL OR max_tokens > 0),
  CONSTRAINT ai_settings_user_provider_unique UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS quick_replies (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message_text TEXT NOT NULL,
  category TEXT,
  CONSTRAINT quick_replies_user_title_unique UNIQUE (user_id, title)
);

-- Supporting indexes for performant lookups.
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user_id ON whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone_number ON whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_user_status ON conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(user_id, contact_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_priority ON conversations(priority);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp ON messages(conversation_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_from_bot ON messages(is_from_bot);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_category ON knowledge_base(user_id, category);
CREATE INDEX IF NOT EXISTS idx_ai_settings_user_id ON ai_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_user_category ON quick_replies(user_id, category);

COMMIT;
