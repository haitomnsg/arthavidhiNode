# ArthaVidhi - Comprehensive Billing & Management Solution

ArthaVidhi is a modern, full-stack web application designed to simplify billing, inventory, and business management for small to medium-sized enterprises. Built with Next.js and a powerful backend, it provides an intuitive, tab-based interface for managing key business operations efficiently.

<img width="1918" height="905" alt="artha" src="https://github.com/user-attachments/assets/650ef4b7-6c03-4293-9ad5-fed7004b0b7f" />

---

## ✨ Features

-   **Dashboard:** At-a-glance overview of key business metrics like total revenue, bills paid, and recent transactions.
-   **Sales Management:** Create, view, print, and manage professional, VAT-compliant invoices with custom discounts.
-   **Quotation Management:** Easily generate and manage client quotations before converting them to bills.
-   **Product & Inventory:** Add products with images, categorize them, and track stock levels.
-   **Purchase Management:** Record purchases from suppliers, which automatically updates inventory counts.
-   **Expense Tracking:** Log and categorize all business expenses to maintain accurate financial records.
-   **Employee Attendance:** A simple system to manage daily employee clock-in and clock-out times.
-   **Advanced Reporting:** Generate and download detailed PDF reports for Sales, Purchases, Expenses, and Profit & Loss for any date range.
-   **Secure Authentication:** Robust user registration and login system.
-   **Multi-Tab Interface:** A dynamic, multi-tab dashboard that allows you to keep multiple pages (e.g., "Create Bill", "Find Bill") open simultaneously for a seamless workflow.
-   **Customization:** Configure company details (name, address, PAN/VAT) that automatically appear on all documents.

---

## 🛠️ Technologies Used

-   **Frontend:**
    -   [Next.js](https://nextjs.org/) (with App Router)
    -   [React](https://reactjs.org/)
    -   [TypeScript](https://www.typescriptlang.org/)
    -   [Tailwind CSS](https://tailwindcss.com/)
    -   [ShadCN UI](https://ui.shadcn.com/) (for beautiful, accessible components)
-   **Backend:**
    -   [Next.js API Routes & Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
-   **Database:**
    -   [MySQL](https://www.mysql.com/)
-   **PDF Generation:**
    -   [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
-   **AI (Optional/Future):**
    -   [Google Genkit](https://firebase.google.com/docs/genkit)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A running MySQL database instance.

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/arthavidhi.git
    cd arthavidhi
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Create a new file named `.env` in the root of your project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and add your MySQL database connection string:
    ```
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
    Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your actual database credentials.

4.  **Set up the database schema:**
    Connect to your MySQL database and run the SQL commands located in the `database.sql` file (or individual table creation scripts if provided) to set up the required tables.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application should now be running at [http://localhost:3000](http://localhost:3000).

---

## 📄 Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Creates a production-ready build of the application.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the code for errors and style issues.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
