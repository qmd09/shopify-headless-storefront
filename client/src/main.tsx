import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import client from './apollo/client';
import { CartProvider } from './context/CartContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import TicketsPage from './pages/TicketsPage';
import ApiExplorerPage from './pages/ApiExplorerPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:handle" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/order-confirm" element={<OrderConfirmPage />} />
                <Route path="/admin/tickets" element={<TicketsPage />} />
                <Route path="/api-explorer" element={<ApiExplorerPage />} />
                <Route path="/book-service" element={<BookingPage />} />
                <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </ApolloProvider>
  </React.StrictMode>
);
