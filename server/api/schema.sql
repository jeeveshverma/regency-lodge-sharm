-- Regency Royal Sharm: reservation requests, rooms, photos, settings. MySQL / MariaDB, utf8mb4.
-- Every statement is CREATE TABLE IF NOT EXISTS, so running the file again changes nothing.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  k VARCHAR(60) PRIMARY KEY,
  v MEDIUMTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_ar VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  desc_ar TEXT NOT NULL,
  desc_en TEXT NOT NULL,
  facilities_ar TEXT NOT NULL,
  facilities_en TEXT NOT NULL,
  adults TINYINT UNSIGNED NOT NULL DEFAULT 2,
  children TINYINT UNSIGNED NOT NULL DEFAULT 2,
  price_ro INT UNSIGNED NOT NULL,
  price_bb INT UNSIGNED NOT NULL,
  price_hb INT UNSIGNED NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- room_id NULL: the "Have a look around" wall. Otherwise the photo belongs to that room.
CREATE TABLE IF NOT EXISTS photos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NULL,
  file VARCHAR(80) NOT NULL,
  cap_ar VARCHAR(200) NOT NULL DEFAULT '',
  cap_en VARCHAR(200) NOT NULL DEFAULT '',
  wide TINYINT(1) NOT NULL DEFAULT 0,
  sort INT NOT NULL DEFAULT 0,
  KEY by_room (room_id, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(12) NOT NULL UNIQUE,
  room_id INT UNSIGNED NULL,
  room_ar VARCHAR(120) NOT NULL,
  room_en VARCHAR(120) NOT NULL,
  d_in DATE NOT NULL,
  d_out DATE NOT NULL,
  rooms TINYINT UNSIGNED NOT NULL,
  plan VARCHAR(4) NOT NULL,
  nights SMALLINT UNSIGNED NOT NULL,
  rate INT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  phone_key VARCHAR(20) NOT NULL,
  email VARCHAR(190) NOT NULL DEFAULT '',
  adults TINYINT UNSIGNED NOT NULL,
  children TINYINT UNSIGNED NOT NULL,
  bed VARCHAR(10) NOT NULL,
  arrival VARCHAR(10) NOT NULL,
  pay VARCHAR(10) NOT NULL,
  note TEXT NOT NULL,
  lang VARCHAR(2) NOT NULL DEFAULT 'ar',
  status VARCHAR(12) NOT NULL DEFAULT 'pending',
  hotel_note TEXT NOT NULL,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  paid_at DATETIME NULL,
  pay_token VARCHAR(40) NOT NULL,
  paymob_txn VARCHAR(40) NOT NULL DEFAULT '',
  ip VARCHAR(45) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  decided_at DATETIME NULL,
  KEY by_status (status, created_at),
  KEY by_phone (phone_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every email the system tried to send, so a failed one shows in the dashboard.
CREATE TABLE IF NOT EXISTS mail_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sent_to VARCHAR(190) NOT NULL,
  subject VARCHAR(250) NOT NULL,
  ok TINYINT(1) NOT NULL,
  error VARCHAR(500) NOT NULL DEFAULT '',
  at DATETIME NOT NULL,
  KEY by_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per counted action (request sent, login tried), for rate limits.
CREATE TABLE IF NOT EXISTS throttle (
  k VARCHAR(90) NOT NULL,
  at DATETIME NOT NULL,
  KEY by_k (k, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
