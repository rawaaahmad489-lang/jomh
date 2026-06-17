

//import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./router/AppRouter";
import AuthProvider from "./core/auth/AuthProvider";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import "./i18n";
import { CartProvider }   from "./core/context/CartContext";








ReactDOM.createRoot(document.getElementById("root")).render(
  <CartProvider>  <BrowserRouter>

    <AuthProvider>
    
      <AppRouter />
    </AuthProvider>
   
  </BrowserRouter> </CartProvider>

  
);