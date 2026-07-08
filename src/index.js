import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './Inicio/inicio';
import SignUp from './sign-up/sign-up';
import Estudiante from './Estudiante/estudiante';
import Encargado from './Encargado/encargado';
import reportWebVitals from './reportWebVitals';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/estudiante" element={<Estudiante />} />
        <Route path="/encargado" element={<Encargado />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
