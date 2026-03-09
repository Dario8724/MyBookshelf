CREATE DATABASE MyBookshelf;
USE MyBookshelf;

-- =========================
-- USER
-- =========================
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255)
);

-- =========================
-- BOOK
-- =========================
CREATE TABLE book (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    description TEXT,
    author VARCHAR(255),
    cover VARCHAR(255),
    language VARCHAR(50),
    publication_year YEAR,
    publisher VARCHAR(255)
);

-- =========================
-- GENRE
-- =========================
CREATE TABLE genre (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- =========================
-- BOOK_GENRE
-- =========================
CREATE TABLE book_genre (
    book_id INT NOT NULL,
    genre_id INT NOT NULL,

    PRIMARY KEY (book_id, genre_id),

    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genre(genre_id) ON DELETE CASCADE
);

-- =========================
-- USER_BOOK
-- =========================
CREATE TABLE user_book (
    user_book_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    status ENUM('read','reading','want_to_read') NOT NULL,
    favorite BOOLEAN DEFAULT FALSE,

    UNIQUE(user_id, book_id),

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
    review_text TEXT NOT NULL,
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
    score DECIMAL(2,1) NOT NULL CHECK (score >= 1 AND score <= 5),

    UNIQUE(user_id, book_id),

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- =========================
-- READING_GOAL
-- =========================
CREATE TABLE reading_goal (
    reading_goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_book_id INT,
    goal_type VARCHAR(50) NOT NULL,
    target_value INT NOT NULL,
    start_date DATE,
    end_date DATE,

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user_book_id) REFERENCES user_book(user_book_id) ON DELETE SET NULL
);

-- =========================
-- ACHIEVEMENT
-- =========================
CREATE TABLE achievement (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    condition_type VARCHAR(50),
    condition_value INT
);

-- =========================
-- USER_ACHIEVEMENT
-- =========================
CREATE TABLE user_achievement (
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,

    PRIMARY KEY (user_id, achievement_id),

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievement(achievement_id) ON DELETE CASCADE
);

-- =========================
-- FOLLOW
-- =========================
CREATE TABLE follow (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,

    PRIMARY KEY (follower_id, following_id),

    FOREIGN KEY (follower_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES user(user_id) ON DELETE CASCADE,

    CHECK (follower_id <> following_id)
);

-- =========================
-- POST
-- =========================
CREATE TABLE post (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT,
    review_id INT,
    content TEXT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE SET NULL,
    FOREIGN KEY (review_id) REFERENCES review(review_id) ON DELETE SET NULL
);

-- =========================
-- POST_LIKE
-- =========================
CREATE TABLE post_like (
    post_id INT NOT NULL,
    user_id INT NOT NULL,

    PRIMARY KEY (post_id, user_id),

    FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- POST_COMMENT
-- =========================
CREATE TABLE post_comment (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,

    FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- CLUB
-- =========================
CREATE TABLE club (
    club_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    FOREIGN KEY (created_by) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- CLUB_MEMBER
-- =========================
CREATE TABLE club_member (
    club_member_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin','member') DEFAULT 'member',

    UNIQUE(club_id, user_id),

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- =========================
-- CLUB_MESSAGE
-- =========================
CREATE TABLE club_message (
    club_message_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,

    FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);