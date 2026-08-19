# FreshCard
# FreshCart - Modern Grocery Store

FreshCart is a premium, modern e-commerce application for groceries, built with React (Vite) on the frontend and Node.js (Express) with MongoDB on the backend. It features dynamic product listing, a shopping cart drawer, Razorpay payment gateway integration, order tracking, an admin dashboard, user roles, and category management.

## Project Structure

text
grocery-api/
├── backend/            # Express REST API
│   ├── src/
│   │   ├── config/      # Database & Passport settings
│   │   ├── controllers/ # Request controllers (product, category, order, etc.)
│   │   ├── middlewares/ # Auth & Multer file upload middlewares
│   │   ├── models/      # MongoDB schemas (Product, Category, Order, User)
│   │   ├── routes/      # Router routes
│   │   └── services/    # Integration services (Cloudinary)
│   └── server.js        # Backend entrypoint
│
└── frontend/           # React Single Page App (Vite)
    ├── src/
    │   ├── api/         # Axios API connection
    │   ├── components/  # Reusable elements (Navbar, CartDrawer)
    │   ├── context/     # State stores (Auth, Cart)
    │   ├── pages/       # Layouts (Home, Admin, Login, Orders)
    │   └── App.jsx      # Frontend router mapping


---

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   
2. Install dependencies:
   ```bash
   npm install
   
3. Create a `.env` file in the `backend/` root directory and add the following:
   ```env
   PORT=5002
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   FRONTEND_URL=http://localhost:5174
   BACKEND_URL=http://localhost:5002
   
   # Optional: Cloudinary configurations (leave empty to use local storage fallback)
   CLOUD_NAME=your_cloudinary_name
   API_KEY=your_cloudinary_api_key
   API_SECRET=your_cloudinary_api_secret

   # Optional: Razorpay details
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   
4. Start the backend server:
   ```bash
   npm start
   

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   
2. Install dependencies:
   ```bash
   npm install
   
3. Create a `.env` file in the `frontend/` root directory:
   ```env
   VITE_API_URL=http://localhost:5002/api
   
4. Start the frontend development server:
   ```bash
   npm run dev
   
   Open the browser URL (usually `http://localhost:5173` or `http://localhost:5174`) indicated in the console.

---

