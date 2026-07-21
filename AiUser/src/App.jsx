import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Forms/Signup";
import Login from "./Forms/Login";
import Dashboard from "./Pages/Dashboard";
import ProfileForm from "./Pages/Profile";
import UploadPage from "./Pages/Upload";
import DocumentParser from "./Pages/DocumentParser";
import DocumentQA from "./Pages/DocumentQA";
import NavBar from "./Components/NavBar";
import Home from "./Pages/Home";
import UploadPublic from "./Pages/UploadPublic";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const token = localStorage.getItem("access_token");
  const protectedPage = (component) => token ? component : <Navigate to="/" replace />;
  return <BrowserRouter>
    {token && <NavBar />}
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/trial" element={token ? <Navigate to="/dashboard" replace /> : <UploadPublic />} />
      <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
      <Route path="/profile" element={protectedPage(<ProfileForm />)} />
      <Route path="/upload" element={protectedPage(<DocumentParser />)} />
      <Route path="/qa" element={protectedPage(<DocumentQA />)} />
      <Route path="/summarize" element={protectedPage(<UploadPage />)} />
    </Routes>
    <ToastContainer position="top-right" autoClose={5000} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
  </BrowserRouter>;
}
