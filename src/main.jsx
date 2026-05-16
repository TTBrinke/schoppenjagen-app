import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Dit onderdeel koppelt de React-code aan het 'root' element in je index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  <App />
  </React.StrictMode>,
)

// Registreer de Service Worker (zorgt ervoor dat de app op je startscherm gezet kan worden)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker registratie mislukt: ', err);
    });
  });
}
