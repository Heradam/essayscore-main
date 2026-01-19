import React from 'react';
import AdminPage from './AdminPage.jsx';

const AdminTeachersPage = ({ onLogout }) => (
    <AdminPage onLogout={onLogout} view="teachers" />
);

export default AdminTeachersPage;
