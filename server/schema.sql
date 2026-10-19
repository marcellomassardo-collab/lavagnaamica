-- Database del catalogo comune. Nessun dato degli alunni: solo insegnanti, esercizi, stelle e segnalazioni.

CREATE TABLE IF NOT EXISTS insegnanti (
  id       TEXT PRIMARY KEY,              -- identificativo dell'account Google
  email    TEXT NOT NULL UNIQUE,          -- non viene mai mostrata
  nome     TEXT NOT NULL DEFAULT '',      -- nome pubblico scelto dall'insegnante, può restare vuoto
  creato   INTEGER NOT NULL,
  bloccato INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessioni (
  impronta   TEXT PRIMARY KEY,            -- impronta del gettone: il gettone vero resta sul dispositivo
  insegnante TEXT NOT NULL,
  scade      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS esercizi (
  id           TEXT PRIMARY KEY,
  autore       TEXT NOT NULL,
  contenuto    TEXT NOT NULL,
  titolo       TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  gioco        TEXT NOT NULL,
  stato        TEXT NOT NULL DEFAULT 'nuovo',   -- nuovo, pubblico, nascosto
  approvazioni INTEGER NOT NULL DEFAULT 0,
  stelle_somma INTEGER NOT NULL DEFAULT 0,
  stelle_voti  INTEGER NOT NULL DEFAULT 0,
  creato       INTEGER NOT NULL,
  aggiornato   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS esercizi_stato ON esercizi (stato, aggiornato);
CREATE INDEX IF NOT EXISTS esercizi_autore ON esercizi (autore);

CREATE TABLE IF NOT EXISTS approvazioni (
  esercizio  TEXT NOT NULL,
  insegnante TEXT NOT NULL,
  PRIMARY KEY (esercizio, insegnante)
);

CREATE TABLE IF NOT EXISTS stelle (
  esercizio  TEXT NOT NULL,
  insegnante TEXT NOT NULL,
  voto       INTEGER NOT NULL,
  PRIMARY KEY (esercizio, insegnante)
);

CREATE TABLE IF NOT EXISTS segnalazioni (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  esercizio   TEXT NOT NULL,
  motivo      TEXT NOT NULL,
  insegnante  TEXT,                       -- vuoto se chi segnala non ha un account
  dispositivo TEXT,                       -- numero a caso salvato sul dispositivo, per contare una volta sola
  rete        TEXT NOT NULL,              -- impronta della rete, cambia ogni giorno: serve solo a frenare gli abusi
  creato      INTEGER NOT NULL,
  chiusa      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS segnalazioni_esercizio ON segnalazioni (esercizio, chiusa);
CREATE INDEX IF NOT EXISTS segnalazioni_rete ON segnalazioni (rete, creato);
