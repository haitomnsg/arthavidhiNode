-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 28, 2026 at 11:09 AM
-- Server version: 11.4.9-MariaDB
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `wadaconn_arthavidhi`
--

-- --------------------------------------------------------

--
-- Table structure for table `Attendance`
--

CREATE TABLE `Attendance` (
  `id` int(11) NOT NULL,
  `employeeId` int(11) NOT NULL,
  `date` date NOT NULL,
  `entryTime` datetime(3) DEFAULT NULL,
  `exitTime` datetime(3) DEFAULT NULL,
  `status` enum('Present','Absent','OnLeave') NOT NULL,
  `remarks` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Bill`
--

CREATE TABLE `Bill` (
  `id` int(11) NOT NULL,
  `invoiceNumber` varchar(191) NOT NULL,
  `clientName` varchar(191) NOT NULL,
  `clientAddress` text NOT NULL,
  `clientPhone` varchar(191) NOT NULL,
  `clientPanNumber` varchar(191) DEFAULT NULL,
  `billDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('Pending','Paid','Overdue') NOT NULL DEFAULT 'Pending',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` int(11) NOT NULL,
  `clientVatNumber` varchar(191) DEFAULT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `BillItem`
--

CREATE TABLE `BillItem` (
  `id` int(11) NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(191) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `billId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Company`
--

CREATE TABLE `Company` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `panNumber` varchar(191) DEFAULT NULL,
  `vatNumber` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Employee`
--

CREATE TABLE `Employee` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(191) NOT NULL,
  `position` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Expense`
--

CREATE TABLE `Expense` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `category` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Product`
--

CREATE TABLE `Product` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `photoUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ProductCategory`
--

CREATE TABLE `ProductCategory` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Purchase`
--

CREATE TABLE `Purchase` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `supplierName` varchar(191) NOT NULL,
  `supplierAddress` varchar(191) DEFAULT NULL,
  `supplierPhone` varchar(191) DEFAULT NULL,
  `supplierBillNumber` varchar(191) NOT NULL,
  `purchaseDate` datetime(3) NOT NULL,
  `remarks` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PurchaseItem`
--

CREATE TABLE `PurchaseItem` (
  `id` int(11) NOT NULL,
  `purchaseId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `rate` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Quotation`
--

CREATE TABLE `Quotation` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `quotationNumber` varchar(191) NOT NULL,
  `clientName` varchar(191) NOT NULL,
  `clientAddress` text NOT NULL,
  `clientPhone` varchar(191) NOT NULL,
  `clientPanNumber` varchar(191) DEFAULT NULL,
  `clientVatNumber` varchar(191) DEFAULT NULL,
  `quotationDate` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `QuotationItem`
--

CREATE TABLE `QuotationItem` (
  `id` int(11) NOT NULL,
  `quotationId` int(11) NOT NULL,
  `description` text NOT NULL,
  `quantity` double NOT NULL,
  `unit` varchar(191) NOT NULL,
  `rate` double NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `id` int(11) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Attendance`
--
ALTER TABLE `Attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Attendance_employeeId_date_key` (`employeeId`,`date`);

--
-- Indexes for table `Bill`
--
ALTER TABLE `Bill`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Bill_invoiceNumber_key` (`invoiceNumber`),
  ADD KEY `Bill_userId_fkey` (`userId`);

--
-- Indexes for table `BillItem`
--
ALTER TABLE `BillItem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `BillItem_billId_fkey` (`billId`);

--
-- Indexes for table `Company`
--
ALTER TABLE `Company`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Company_userId_key` (`userId`);

--
-- Indexes for table `Employee`
--
ALTER TABLE `Employee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Employee_userId_idx` (`userId`);

--
-- Indexes for table `Expense`
--
ALTER TABLE `Expense`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Expense_userId_idx` (`userId`);

--
-- Indexes for table `Product`
--
ALTER TABLE `Product`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `categoryId` (`categoryId`);

--
-- Indexes for table `ProductCategory`
--
ALTER TABLE `ProductCategory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ProductCategory_userId_name_key` (`userId`,`name`);

--
-- Indexes for table `Purchase`
--
ALTER TABLE `Purchase`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `PurchaseItem`
--
ALTER TABLE `PurchaseItem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchaseId` (`purchaseId`),
  ADD KEY `productId` (`productId`);

--
-- Indexes for table `Quotation`
--
ALTER TABLE `Quotation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `quotationNumber` (`quotationNumber`),
  ADD KEY `Quotation_userId_idx` (`userId`);

--
-- Indexes for table `QuotationItem`
--
ALTER TABLE `QuotationItem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `QuotationItem_quotationId_idx` (`quotationId`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Attendance`
--
ALTER TABLE `Attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Bill`
--
ALTER TABLE `Bill`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `BillItem`
--
ALTER TABLE `BillItem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Company`
--
ALTER TABLE `Company`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Employee`
--
ALTER TABLE `Employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Expense`
--
ALTER TABLE `Expense`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Product`
--
ALTER TABLE `Product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ProductCategory`
--
ALTER TABLE `ProductCategory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Purchase`
--
ALTER TABLE `Purchase`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `PurchaseItem`
--
ALTER TABLE `PurchaseItem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Quotation`
--
ALTER TABLE `Quotation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `QuotationItem`
--
ALTER TABLE `QuotationItem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Attendance`
--
ALTER TABLE `Attendance`
  ADD CONSTRAINT `Attendance_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Bill`
--
ALTER TABLE `Bill`
  ADD CONSTRAINT `Bill_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `BillItem`
--
ALTER TABLE `BillItem`
  ADD CONSTRAINT `BillItem_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `Bill` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Company`
--
ALTER TABLE `Company`
  ADD CONSTRAINT `Company_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `Product`
--
ALTER TABLE `Product`
  ADD CONSTRAINT `Product_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Product_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `ProductCategory` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `ProductCategory`
--
ALTER TABLE `ProductCategory`
  ADD CONSTRAINT `ProductCategory_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Purchase`
--
ALTER TABLE `Purchase`
  ADD CONSTRAINT `Purchase_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PurchaseItem`
--
ALTER TABLE `PurchaseItem`
  ADD CONSTRAINT `PurchaseItem_ibfk_1` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PurchaseItem_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `QuotationItem`
--
ALTER TABLE `QuotationItem`
  ADD CONSTRAINT `QuotationItem_ibfk_1` FOREIGN KEY (`quotationId`) REFERENCES `Quotation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
