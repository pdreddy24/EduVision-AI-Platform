import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Forms/Signup";
import Login from "./Forms/Login";
import Dashboard from "./Pages/Dashboard";
import ProfileForm from "./Pages/Profile";
import UploadPage from "./Pages/Upload";
import NavBar from "./Components/NavBar";
import Home from "./Pages/Home";
import UploadPublic from "./Pages/UploadPublic";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
	const token = localStorage.getItem('access_token');
	return (
		<BrowserRouter>
			{token && <NavBar />}
			<Routes>
				<Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Home />} />
				<Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <Signup />} />
				<Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />

				{/* public trial upload for unauthenticated users */}
				<Route path="/trial" element={token ? <Navigate to="/dashboard" replace /> : <UploadPublic />} />
				{/* protected routes: only available when authenticated */}
				<Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" replace />} />
				<Route path="/profile" element={token ? <ProfileForm /> : <Navigate to="/" replace />} />
				<Route path="/upload" element={token ? <UploadPage /> : <Navigate to="/" replace />} />
			</Routes>
			{/* Toast container for in-app notifications */}
			<ToastContainer
				position="top-right"
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
			/>
		</BrowserRouter>
	);
}