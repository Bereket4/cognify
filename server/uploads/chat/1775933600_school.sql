-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 06, 2026 at 11:36 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `school`
--

-- --------------------------------------------------------

--
-- Table structure for table `attachments`
--

CREATE TABLE `attachments` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT 'general',
  `title` varchar(255) DEFAULT 'Untitled',
  `content` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notes`
--

INSERT INTO `notes` (`id`, `project_id`, `user_id`, `type`, `title`, `content`, `created_at`, `updated_at`) VALUES
(1, NULL, 1, 'general', 'New Note', 'his;akaflka', '2026-04-06 15:27:43', '2026-04-06 15:30:47'),
(2, 1, 1, 'general', 'study bro', 'hi', '2026-04-06 15:30:52', '2026-04-06 15:31:15'),
(4, 2, 2, 'general', 'New Note', '', '2026-04-06 15:49:11', '2026-04-06 15:49:11'),
(5, 4, 4, 'general', 'Agri nursery', 'this is a test ', '2026-04-06 16:53:23', '2026-04-06 20:39:26'),
(6, NULL, 5, 'general', 'Research: If You Don&#039;t Understand Quantum Physics, Try This!', '[VIDEO LINK](https://www.youtube.com/watch?v=Usu9xZfabPM)\n\nThumbnail: https://i.ytimg.com/vi/Usu9xZfabPM/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLChmytRCbR14eQcUNF653buLjwMTQ\n\nDescription: A simple and clear ...\n\nRecommended by Nexus AI for topic: Quantum Physics', '2026-04-06 21:14:38', '2026-04-06 21:14:38'),
(7, NULL, 4, 'general', 'Research: Quantum Physics, Explained Slowly | The Sleepy Scientist', '[VIDEO LINK](https://www.youtube.com/watch?v=KrejHlq-O9A)\n\nThumbnail: https://i.ytimg.com/vi/KrejHlq-O9A/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAGx16GTquW6tJhuOA9uKc9RTpiWA\n\nDescription: Tonight on The Sleepy Scientist, we\'re diving gently into the mysterious world of ...\n\nRecommended by Nexus AI for topic: quantum', '2026-04-06 21:14:45', '2026-04-06 21:14:45'),
(8, NULL, 5, 'general', 'Research: Is Gravity the Hidden Key to Quantum Physics? | World Science Festival', '[VIDEO LINK](https://www.youtube.com/watch?v=16kzFN0SWYg)\n\nThumbnail: https://i.ytimg.com/vi/16kzFN0SWYg/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBz6SedB0wzeqARHxtWISZXUpwIBg\n\nDescription: Leading ...\n\nRecommended by Nexus AI for topic: Quantum Physics', '2026-04-06 21:14:59', '2026-04-06 21:14:59'),
(9, NULL, 5, 'general', 'Research: A Brief History of Quantum Mechanics - with Sean Carroll', '[VIDEO LINK](https://www.youtube.com/watch?v=5hVmeOCJjOU)\n\nThumbnail: https://i.ytimg.com/vi/5hVmeOCJjOU/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLANUXNDqoPVG8fW6u3XGylKfuOs3Q\n\nDescription: The mysterious world of ...\n\nRecommended by Nexus AI for topic: Quantum Physics', '2026-04-06 21:15:42', '2026-04-06 21:15:42'),
(10, NULL, 5, 'general', 'Research: How Quantum Physics Explains the Nature of Reality | Sleep-Inducing Science', '[VIDEO LINK](https://www.youtube.com/watch?v=KELriDAtqio)\n\nThumbnail: https://i.ytimg.com/vi/KELriDAtqio/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDvv6q3_6Lh2G5L0OlFzBwzqhp6YQ\n\nDescription: Let the mysteries of the ...\n\nRecommended by Nexus AI for topic: Quantum Mechanics', '2026-04-06 21:18:30', '2026-04-06 21:18:30');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `read_status` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `user_id`, `name`, `description`, `created_at`) VALUES
(1, 1, 'stud', NULL, '2026-04-06 15:27:37'),
(2, 2, 'study', NULL, '2026-04-06 15:40:38'),
(3, 2, 'name', NULL, '2026-04-06 16:27:59'),
(4, 4, 'study', NULL, '2026-04-06 16:52:40');

-- --------------------------------------------------------

--
-- Table structure for table `subtasks`
--

CREATE TABLE `subtasks` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('pending','completed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(20) DEFAULT '#6B7280'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `user_id`, `name`, `color`) VALUES
(1, 4, 'Critical', '#ef4444'),
(2, 4, 'In Progress', '#6366f1'),
(3, 4, 'Research', '#10b981'),
(4, 4, 'Brainstorm', '#f59e0b'),
(5, 4, 'Architecture', '#8b5cf6'),
(6, 5, 'Critical', '#ef4444'),
(7, 5, 'In Progress', '#6366f1'),
(8, 5, 'Research', '#10b981'),
(9, 5, 'Brainstorm', '#f59e0b'),
(10, 5, 'Architecture', '#8b5cf6');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','in-progress','completed') DEFAULT 'pending',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `recurring_type` enum('none','daily','weekly','monthly') DEFAULT 'none',
  `deadline` datetime DEFAULT NULL,
  `list_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `project_id`, `title`, `description`, `status`, `priority`, `recurring_type`, `deadline`, `list_order`, `created_at`) VALUES
(1, 1, 1, 'study chemo', 'read', 'completed', 'medium', 'none', NULL, 0, '2026-04-06 15:31:37'),
(2, 2, NULL, 'study chemo', 'reading is good', 'pending', 'medium', 'none', NULL, 0, '2026-04-06 15:35:07'),
(3, 2, 2, 'reading', NULL, 'completed', 'medium', 'none', NULL, 0, '2026-04-06 16:19:03'),
(4, 2, 2, 'test', NULL, 'completed', 'medium', 'none', NULL, 0, '2026-04-06 16:36:35'),
(5, 4, 4, 'chemo', NULL, 'completed', 'medium', 'none', NULL, 0, '2026-04-06 16:52:57'),
(6, 4, 4, 'reading agriculture', 'studying for the coming test', 'completed', 'high', 'daily', '2026-04-06 15:37:00', 0, '2026-04-06 20:38:48'),
(7, 5, NULL, 'Task 1', '', 'completed', 'medium', 'none', NULL, 0, '2026-04-06 20:55:13');

-- --------------------------------------------------------

--
-- Table structure for table `task_tags`
--

CREATE TABLE `task_tags` (
  `task_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `task_tags`
--

INSERT INTO `task_tags` (`task_id`, `tag_id`) VALUES
(6, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','admin') DEFAULT 'student',
  `avatarUrl` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_active_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `streak_count` int(11) DEFAULT 0,
  `last_streak_update` date DEFAULT NULL,
  `achievement_points` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `avatarUrl`, `created_at`, `last_active_at`, `streak_count`, `last_streak_update`, `achievement_points`) VALUES
(1, 'john', 'john@gmail.com', '$2y$10$FsdSKMOHoe/alInukmk/Zu1epEDQPBj37/znEXCT0eVeL7Kp.e6m2', 'student', NULL, '2026-04-06 15:27:06', '2026-04-06 16:56:41', 1, '2026-04-06', 50),
(2, 'beka', 'bekytadese@gmail.com', '$2y$10$Ni7XW/I6g2IExx/8bKl3seVn2QuyOY4IQYISBOCmlcYMxd7cZ3qTO', 'student', 'server/uploads/avatar_2_1775489640.jpg', '2026-04-06 15:32:23', '2026-04-06 17:02:07', 1, '2026-04-06', 50),
(3, 'admin', 'admin@gmail.com', '$2y$10$3Uvy4xMHbNE85KEUGVn0m.fjZASlyAwOjnf0U3UuGhlYX25JunjOm', 'admin', NULL, '2026-04-06 16:05:12', '2026-04-06 16:47:03', 0, NULL, 0),
(4, 'chanew', 'chanew@gmail.com', '$2y$10$kLLtuTwGeSs8tFaF8Z8Veerq/m5EuPvfKrI8yuhd8utsczZy7N0ci', 'student', 'server/uploads/avatar_4_1775508617.jpg', '2026-04-06 16:46:45', '2026-04-06 21:35:28', 1, '2026-04-06', 150),
(5, 'Test User', 'test@example.com', '$2y$10$WTmEGiIuY1376KSXjdrBLOzyL7v74fVNuXh7mlSRm8SfqcppK3A0W', 'student', NULL, '2026-04-06 20:54:27', '2026-04-06 21:23:27', 1, '2026-04-06', 50);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `subtasks`
--
ALTER TABLE `subtasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `task_tags`
--
ALTER TABLE `task_tags`
  ADD PRIMARY KEY (`task_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attachments`
--
ALTER TABLE `attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `subtasks`
--
ALTER TABLE `subtasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attachments`
--
ALTER TABLE `attachments`
  ADD CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subtasks`
--
ALTER TABLE `subtasks`
  ADD CONSTRAINT `subtasks_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tags`
--
ALTER TABLE `tags`
  ADD CONSTRAINT `tags_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_tags`
--
ALTER TABLE `task_tags`
  ADD CONSTRAINT `task_tags_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
