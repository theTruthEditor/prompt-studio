CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  nickname   VARCHAR(50)  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE prompts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(id),
  title       VARCHAR(200) NOT NULL,
  body        TEXT         NOT NULL,
  is_favorite BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE prompt_tags (
  prompt_id INTEGER NOT NULL REFERENCES prompts(id),
  tag_id    INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (prompt_id, tag_id)
);