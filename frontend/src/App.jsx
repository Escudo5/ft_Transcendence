import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Catalogo from './components/Catalogo';
import CrearCarta from './components/CrearCarta';

function App() {
  return (
    <Router>
      <Routes>
        {/* Si entras a la raíz http://localhost:5173/, te redirige automáticamente a /home */}
        <Route path="/" element={<Navigate to="/home" />} />
        
        {/* Definición de las rutas del frontend */}
        <Route path="/home" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/crear" element={<CrearCarta />} />
      </Routes>
    </Router>
  );
}

export default App;