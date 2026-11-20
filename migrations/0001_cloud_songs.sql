CREATE TABLE songs (
  library_id TEXT NOT NULL,
  song_id TEXT NOT NULL,
  song_json TEXT,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (library_id, song_id)
);

CREATE INDEX songs_library_updated ON songs (library_id, updated_at DESC);
