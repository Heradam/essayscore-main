import React from 'react';
import AdminPage from './AdminPage.jsx';

const AdminUsersPage = ({ onLogout }) => (
    <AdminPage onLogout={onLogout} view="users" />
);

export default AdminUsersPage;
