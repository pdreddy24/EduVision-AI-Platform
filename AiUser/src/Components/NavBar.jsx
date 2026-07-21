import { createElement, useState } from "react";
import { Home, LogOut, Menu, MessageCircleQuestion, UploadCloud, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { authService } from "../../services/Auth/AuthForm/authServices";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/qa", label: "Document Q&A", icon: MessageCircleQuestion },
  { to: "/profile", label: "Profile", icon: User },
];

function NavigationLink({ link, onClick, mobile = false }) {
  return <Link to={link.to} onClick={onClick} className={mobile ? "flex items-center gap-2 rounded px-3 py-2 text-indigo-900 hover:bg-indigo-50" : "flex items-center gap-2 rounded px-3 py-2 text-sm text-indigo-900 hover:bg-indigo-50"}>
    {createElement(link.icon, { size: mobile ? 17 : 16 })}{link.label}
  </Link>;
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  async function logout() { await authService.logout(); }
  return <nav className="w-full border-b bg-white shadow-sm">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <Link to="/dashboard" className="text-lg font-bold text-indigo-900">EduVision</Link>
      <div className="hidden items-center gap-2 md:flex">
        {links.map((link) => <NavigationLink key={link.to} link={link} />)}
        <button onClick={logout} className="flex items-center gap-2 rounded bg-indigo-900 px-3 py-2 text-sm text-white"><LogOut size={16} />Logout</button>
      </div>
      <button onClick={() => setOpen((value) => !value)} className="rounded p-2 text-indigo-900 md:hidden" aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <div className="space-y-1 border-t px-4 py-3 md:hidden">
      {links.map((link) => <NavigationLink key={link.to} link={link} mobile onClick={() => setOpen(false)} />)}
      <button onClick={logout} className="flex w-full items-center gap-2 rounded bg-indigo-900 px-3 py-2 text-white"><LogOut size={17} />Logout</button>
    </div>}
  </nav>;
}
