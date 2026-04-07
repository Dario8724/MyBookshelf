CREATE DATABASE MyBookshelf;
USE MyBookshelf;

-- =========================
-- USER
-- =========================
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    bio VARCHAR(160)
);

-- =========================
-- BOOK
-- =========================
CREATE TABLE book (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    google_id VARCHAR(50) UNIQUE,
    description TEXT,
    author VARCHAR(255),
    cover TEXT,
    language VARCHAR(50),
    publication_year YEAR,
    publisher VARCHAR(255)
);

-- =========================
-- GENRE
-- =========================
CREATE TABLE genre (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE book_genre (
    book_id INT,
    genre_id INT,
    PRIMARY KEY (book_id, genre_id),
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genre(genre_id) ON DELETE CASCADE
);

-- =========================
-- USER BOOK (reading list)
-- =========================
CREATE TABLE user_book (
    user_book_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    status ENUM('reading','completed','want_to_read'),
    favorite BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (user_id, book_id),

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- =========================
-- REVIEW
-- =========================
CREATE TABLE review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    review_text TEXT,
    has_spoiler BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- =========================
-- RATING
-- =========================
CREATE TABLE rating (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    score DECIMAL(2,1) CHECK (score >= 1 AND score <= 5),

    UNIQUE (user_id, book_id),

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- =========================
-- READING GOALS
-- =========================
CREATE TABLE reading_goal (
    reading_goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    goal_type VARCHAR(50),
    target_value INT,
    start_date DATE,
    end_date DATE,

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- ACHIEVEMENTS
-- =========================
CREATE TABLE achievement (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    condition_type VARCHAR(50),
    condition_value INT
);

CREATE TABLE user_achievement (
    user_id INT,
    achievement_id INT,
    PRIMARY KEY (user_id, achievement_id),

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievement(achievement_id) ON DELETE CASCADE
);

-- =========================
-- FOLLOW SYSTEM
-- =========================
CREATE TABLE follow (
    follower_id INT,
    following_id INT,

    PRIMARY KEY (follower_id, following_id),

    FOREIGN KEY (follower_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- POSTS
-- =========================
CREATE TABLE post (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    review_id INT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES review(review_id) ON DELETE SET NULL
);

CREATE TABLE post_like (
    post_id INT,
    user_id INT,

    PRIMARY KEY (post_id, user_id),

    FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

CREATE TABLE post_comment (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    user_id INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- CLUB
-- =========================
CREATE TABLE club (
    club_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    FOREIGN KEY (created_by) REFERENCES user(user_id)
);

-- =========================
-- CLUB MEMBER
-- =========================
CREATE TABLE club_member (
    club_member_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    user_id INT,
    role ENUM('admin','moderator','member') DEFAULT 'member',

    UNIQUE (club_id, user_id),

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- CLUB CHAT
-- =========================
CREATE TABLE club_message (
    club_message_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    user_id INT,
    message TEXT,

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- CLUB TOP BOOKS (BIO)
-- =========================
CREATE TABLE club_top_book (
    club_id INT,
    book_id INT,
    position INT CHECK (position BETWEEN 1 AND 5),

    PRIMARY KEY (club_id, position),

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- =========================
-- CLUB LIBRARY (books read together)
-- =========================
CREATE TABLE club_library (
    club_library_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    book_id INT,
    added_by INT,
    added_date DATE,

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES user(user_id)
);

-- =========================
-- CLUB READING VOTE
-- =========================
CREATE TABLE club_reading_vote (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    title VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status ENUM('open','closed') DEFAULT 'open',

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE
);

CREATE TABLE club_reading_vote_option (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    vote_id INT,
    book_id INT,
    suggested_by INT,

    FOREIGN KEY (vote_id) REFERENCES club_reading_vote(vote_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE,
    FOREIGN KEY (suggested_by) REFERENCES user(user_id)
);

CREATE TABLE club_reading_vote_user (
    vote_id INT,
    option_id INT,
    user_id INT,

    PRIMARY KEY (vote_id, user_id),

    FOREIGN KEY (vote_id) REFERENCES club_reading_vote(vote_id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES club_reading_vote_option(option_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- CLUB READING SESSION
-- =========================
CREATE TABLE club_reading_session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    book_id INT,
    start_date DATE,
    end_date DATE,
    status ENUM('active','completed'),

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- =========================
-- CLUB SEASON (ranking reset)
-- =========================
CREATE TABLE club_season (
    season_id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATE,
    end_date DATE
);

CREATE TABLE club_ranking (
    ranking_id INT AUTO_INCREMENT PRIMARY KEY,
    season_id INT,
    club_id INT,
    points INT DEFAULT 0,

    UNIQUE (season_id, club_id),

    FOREIGN KEY (season_id) REFERENCES club_season(season_id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_book_title ON book(title);
CREATE INDEX idx_review_book ON review(book_id);
CREATE INDEX idx_rating_book ON rating(book_id);
CREATE INDEX idx_club_location ON club(latitude, longitude);