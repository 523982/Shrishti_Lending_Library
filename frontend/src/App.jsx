import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import { AuthProvider } from './context/AuthContext';
import BookList from './pages/BookList';
import BookDetailsPage from './pages/BookDetailsPage';
import HomePage from './components/HomePage';
import Community from './components/Community'; // Assuming Community is in components
import ProtectedRoute from './components/ProtectedRoute';
import BookActionsPage from './pages/BookActions';
import AddCustomerPage from './pages/AddCustomerPage';
import AddCommunityPage from './pages/AddCommunityPage';
import './App.css';

// A simple placeholder for the home page
//const HomePage = () => <div className="page-container"><h1>Welcome to Shrishti Lending Library!</h1><p>Browse our collection to find your next favorite book.</p></div>;

function App() {
  return (
    <AuthProvider>
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BookList />} />
            <Route path="/books/:bookId" element={<BookDetailsPage />} />
            <Route path="/community" element={<Community />} />
                        {/* Protected Admin Routes */}
                        <Route element={<ProtectedRoute />}>
                        <Route path="/admin/books" element={<BookActionsPage />} />
              <Route path="/admin/add-customer" element={<AddCustomerPage />} />
              <Route path="/admin/add-community" element={<AddCommunityPage />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  </AuthProvider>
);
}

export default App;