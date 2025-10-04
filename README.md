# Shop Admin - Multi-User Inventory Management System

A modern inventory management system with user authentication, built with React frontend and Hono backend.

## Features

- **User Authentication**: Secure login/registration with password hashing
- **Multi-User Support**: Each user has their own isolated data
- **Product Management**: Add, edit, and manage products with barcode scanning
- **Source Management**: Manage suppliers/vendors
- **Sales Tracking**: Record transactions and track sales
- **Price Management**: Bulk price updates by category, source, or selection
- **Barcode Scanning**: Real-time barcode scanning for quick product lookup

## Database Schema

The system uses the following tables with user isolation:

- `users` - User authentication
- `source` - Suppliers/vendors (user-specific)
- `product` - Inventory items (user-specific)
- `transactions` - Sales records (user-specific)
- `transaction_item` - Individual items in transactions (user-specific)

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Database Setup**
   - Run the SQL schema from `backend/database-schema.sql` in your database
   - The system is designed to work with Cloudflare D1, but can be adapted for other SQLite databases

3. **Start the Backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API URL**
   - Update the `API_BASE_URL` in `frontend/src/api.js` to match your backend URL
   - Default is set to `http://localhost:8787`

3. **Start the Frontend**
   ```bash
   npm run dev
   ```

## Usage

1. **First Time Setup**
   - Open the application in your browser
   - Click "Sign up" to create a new account
   - Enter a username and password (minimum 6 characters)

2. **Adding Sources**
   - Go to the "Sources" tab
   - Click "Add Source" to add suppliers/vendors
   - Fill in the source details (name is required)

3. **Adding Products**
   - Go to the "Products" tab
   - Click "Add Product" to add new inventory items
   - Use the barcode scanner or manually enter barcode
   - Fill in product details including price, quantity, and source

4. **Managing Inventory**
   - View all products in the Products tab
   - Edit product details by clicking the edit button
   - Use filters to find specific products
   - Select multiple products for bulk operations

5. **Sales**
   - Go to the "Sell" tab
   - Scan or enter barcodes to add products to the sale
   - Adjust quantities as needed
   - Complete the sale to record the transaction

6. **Price Management**
   - Go to the "Edit Price" tab
   - Select products by category, source, or individually
   - Apply price changes by amount or percentage
   - Update prices in bulk

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **User Isolation**: Each user can only access their own data
- **Input Validation**: Both frontend and backend validation
- **SQL Injection Protection**: Parameterized queries throughout

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Products
- `GET /api/products/list` - List all products (user-specific)
- `GET /api/products/findByBarcode` - Find product by barcode
- `POST /api/products/addProduct` - Add new product
- `POST /api/products/addOrIncrease` - Add or increase product quantity
- `PUT /api/products/update` - Update product
- `POST /api/products/sell` - Record sale transaction

### Sources
- `GET /api/sources/list` - List all sources (user-specific)
- `POST /api/sources/addSource` - Add new source
- `PUT /api/sources/updateSource` - Update source
- `DELETE /api/sources/deleteSource` - Delete source

## Technology Stack

- **Frontend**: React, Vite, CSS3
- **Backend**: Hono (Node.js framework)
- **Database**: SQLite (Cloudflare D1 compatible)
- **Authentication**: bcryptjs for password hashing
- **Barcode Scanning**: react-qr-barcode-scanner

## Development

The application is structured as follows:

```
shopApp/
├── backend/
│   ├── controllers/     # API route handlers
│   ├── routes/         # Route definitions
│   ├── server.js       # Main server file
│   └── database-schema.sql
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── api.js      # API utility functions
│   │   └── UserContext.jsx # Authentication context
│   └── public/         # Static assets
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
