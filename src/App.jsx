import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import RentalDetail from './pages/RentalDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import RatedRentals from './pages/RatedRentals';
import Navbar from './components/NavBar';
import About from './pages/About';
import Profile from './pages/Profile';
import AOS from 'aos';
import 'aos/dist/aos.css';


AOS.init();


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/rental/:id" element={<RentalDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rated" element={<RatedRentals />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}