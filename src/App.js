import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversations";
import ConversationShow from "./pages/ConversationShow";
import Organization from "./pages/Organization";
import Tasks from "./pages/Tasks";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/conversations"      element={<PrivateRoute><Conversations /></PrivateRoute>} />
        <Route path="/conversations/:id"  element={<PrivateRoute><ConversationShow /></PrivateRoute>} />
        <Route path="/organization"       element={<PrivateRoute><Organization /></PrivateRoute>} />
        <Route path="/tasks"              element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

