import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4 flex gap-4">
      <Link to="/" className="font-bold">
        RaftLab
      </Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/studio">Studio</Link>
      <Link to="/replay">Replay</Link>
      <Link to="/analytics">Analytics</Link>
      <Link to="/settings">Settings</Link>
    </header>
  );
}
