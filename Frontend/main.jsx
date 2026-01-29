import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './index.css';

// ----------------------------------------------------
// 1. 导入 Frontend/src/pages 中创建的页面组件
// ----------------------------------------------------
import HomePage from './src/pages/HomePage.jsx';
import LoginPage from './src/pages/LoginPage.jsx';
import RegisterPage from './src/pages/RegisterPage.jsx';
import ForgotPasswordPage from './src/pages/ForgotPasswordPage.jsx';
import TeacherClassesPage from './src/pages/TeacherClassesPage.jsx';
import TeacherManagePage from './src/pages/TeacherManagePage.jsx';
import TeacherHistoryPage from './src/pages/TeacherHistoryPage.jsx';
import InvitePage from './src/pages/InvitePage.jsx';
import AdminDashboardPage from './src/pages/AdminDashboardPage.jsx';
import AdminStudentsPage from './src/pages/AdminStudentsPage.jsx';
import AdminTeachersPage from './src/pages/AdminTeachersPage.jsx';
import AdminUsersPage from './src/pages/AdminUsersPage.jsx';
import AdminPointsPage from './src/pages/AdminPointsPage.jsx';
import AdminLLMPage from './src/pages/AdminLLMPage.jsx';
import ChangePasswordPage from './src/pages/ChangePasswordPage.jsx';
import InviteSignupPage from './src/pages/InviteSignupPage.jsx';
import StudentHistoryPage from './src/pages/StudentHistoryPage.jsx';
import StudentClassPage from './src/pages/StudentClassPage.jsx';
import StudentInviteCenterPage from './src/pages/StudentInviteCenterPage.jsx';
import StudentPointsPage from './src/pages/StudentPointsPage.jsx';

// ----------------------------------------------------
// 2. 路由守卫组件 (ProtectedRoute)
// ----------------------------------------------------
const ProtectedRoute = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login" replace />;
    }
    return children;
};

const MustChangeGuard = ({ children, mustChange }) => {
    if (mustChange) {
        return <Navigate to="/change-password" replace />;
    }
    return children;
};

const RoleRoute = ({ children, isAuthenticated, role, allowed }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (!allowed.includes(role)) {
        return <Navigate to="/" replace />;
    }
    return children;
};

const decodeJwtPayload = (token) => {
    if (!token) {
        return null;
    }
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(json);
    } catch (error) {
        return null;
    }
};

// ----------------------------------------------------
// 3. 主应用组件 (App)
// ----------------------------------------------------
const App = () => {
    // State to store the username (string)
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('authUser');
        const token = localStorage.getItem('authToken');
        return storedUser && token ? storedUser : null;
    });
    const [role, setRole] = useState(() => {
        const storedRole = localStorage.getItem('authRole');
        if (storedRole) {
            return storedRole;
        }
        const token = localStorage.getItem('authToken');
        const payload = decodeJwtPayload(token);
        return payload?.role || null;
    });
    const [mustChange, setMustChange] = useState(() => {
        return localStorage.getItem('authMustChange') === 'true';
    });
    const isAuthenticated = !!user;

    // Login callback: expects a username string from LoginPage
    const handleLogin = useCallback((username, nextRole, nextMustChange) => {
        setUser(username);
        localStorage.setItem('authUser', username);
        setRole(nextRole || null);
        if (nextRole) {
            localStorage.setItem('authRole', nextRole);
        } else {
            localStorage.removeItem('authRole');
        }
        setMustChange(!!nextMustChange);
        localStorage.setItem('authMustChange', nextMustChange ? 'true' : 'false');
    }, []);

    // Logout callback: clears user state
    const handleLogout = useCallback(() => {
        setUser(null);
        setRole(null);
        setMustChange(false);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authRole');
        localStorage.removeItem('authMustChange');
    }, []);

    return (
        <div className="bg-white min-h-screen font-sans">
            <main className="flex-grow"> 
                <Routes>
                    
                    {/* Protected Route: '/' 路径现在是受保护的核心功能页面 */}
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <HomePage username={user} role={role} onLogout={handleLogout} />
                                </MustChangeGuard>
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Public Routes */}
                    {/* LoginPage 现在需要传递 handleLogin 方法 */}
                    <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/invite/:code" element={<InvitePage />} />
                    <Route path="/invite/signup/:code" element={<InviteSignupPage />} />
                    <Route
                        path="/history"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <StudentHistoryPage role={role} onLogout={handleLogout} />
                                </MustChangeGuard>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/class"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <StudentClassPage role={role} onLogout={handleLogout} />
                                </MustChangeGuard>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/invite-center"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <StudentInviteCenterPage role={role} onLogout={handleLogout} />
                                </MustChangeGuard>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/points"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <StudentPointsPage role={role} onLogout={handleLogout} />
                                </MustChangeGuard>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/change-password"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <ChangePasswordPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['teacher', 'admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <Navigate to="/teacher/classes" replace />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/teacher/classes"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['teacher', 'admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <TeacherClassesPage onLogout={handleLogout} role={role} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/teacher/manage"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['teacher', 'admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <TeacherManagePage onLogout={handleLogout} role={role} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/teacher/history"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['teacher', 'admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <TeacherHistoryPage onLogout={handleLogout} role={role} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <Navigate to="/admin/dashboard" replace />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <AdminDashboardPage onLogout={handleLogout} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/admin/students"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <AdminStudentsPage onLogout={handleLogout} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/admin/teachers"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <AdminTeachersPage onLogout={handleLogout} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <AdminUsersPage onLogout={handleLogout} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/admin/points"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <AdminPointsPage onLogout={handleLogout} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/admin/llm"
                        element={
                            <RoleRoute isAuthenticated={isAuthenticated} role={role} allowed={['admin']}>
                                <MustChangeGuard mustChange={mustChange}>
                                    <AdminLLMPage onLogout={handleLogout} />
                                </MustChangeGuard>
                            </RoleRoute>
                        }
                    />
                    
                    {/* 如果用户已登录并尝试访问 /login，则重定向到 / */}
                    <Route path="/login" element={
                        isAuthenticated 
                            ? <Navigate to="/" replace /> 
                            : <LoginPage onLogin={handleLogin} />
                    } />
                    
                    {/* Catch-all route for 404 Not Found */}
                    <Route path="*" element={
                        <div className="text-center pt-32 max-w-7xl mx-auto"> 
                            <h1 className="text-8xl text-red-500 font-extrabold">404</h1>
                            <p className="text-2xl text-gray-600 mt-4">页面未找到</p>
                        </div>
                    } />
                </Routes>
            </main>
        </div>
    );
};

// ----------------------------------------------------
// 4. 应用启动
// ----------------------------------------------------
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Root element with ID 'root' not found in the HTML.");
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
);
