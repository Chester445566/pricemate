import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DetailsPage from './pages/DetailsPage';
import ResultPage from './pages/ResultPage';
import { EstimateProvider } from './context/EstimateContext';
import { ThemeProvider } from './context/ThemeContext';
import { CounterProvider } from './context/CounterContext';
import Header from './components/Header';

export default function App() {
  return (
    <ThemeProvider>
      <CounterProvider>
        <EstimateProvider>
          <div className="bg-white dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-200">
            <div className="container mx-auto max-w-lg p-4">
              <HashRouter>
                <Header />
                <main className="mt-6">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/details" element={<DetailsPage />} />
                    <Route path="/result/:id" element={<ResultPage />} />
                  </Routes>
                </main>
              </HashRouter>
            </div>
          </div>
        </EstimateProvider>
      </CounterProvider>
    </ThemeProvider>
  );
}