# Venue Allocation System

A comprehensive web application for managing college venue bookings.

## Tech Stack
- **Frontend**: React (Vite), Vanilla CSS
- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB

## Features
- **User Roles**: Admin & User
- **Bookings**: Users can book venues (with conflict checking)
- **Admin**: Manage venues and bookings
- **UI**: Soft, modern aesthetic

## Installation

1. **Clone the repository** (if applicable)

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Start the server
   npm start
   ```
   *Note*: Ensure MongoDB is running locally on port 27017.

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   # Start the development server
   npm run dev
   ```

4. **Seed Data (Optional)**
   To populate the database with sample venues:
   ```bash
   cd server
   node seed.js
   ```

## Usage
- Register a new account.
- Login as a user to book venues.
- **Admin Access**:
  - The system defaults registered users to 'user'. 
  - To make an admin, you can manually update the database or use a separate registration flow (not permitted by default UI for security).
  - *Tip*: For testing, you can modify `authController.js` to accept a role or manually change the role in MongoDB Compass.
  - Or, register a user with username `admin` (if logic was added, currently manual).
  
  **Quick Admin Test**: Modifying the `role` directly in MongoDB is the standard way. 
  Alternatively, you can temporarily change `authController.js` line 12 to `const newRole = role || 'user';` to allow passing role in registration.

## Credits
Built for College Venue Allocation project.
