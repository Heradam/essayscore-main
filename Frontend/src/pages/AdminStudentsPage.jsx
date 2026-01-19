import React from 'react';
import AdminPage from './AdminPage.jsx';

const AdminStudentsPage = ({ onLogout }) => (
    <AdminPage onLogout={onLogout} view="students" />
);

export default AdminStudentsPage;
