import React from 'react';
import TeacherPage from './TeacherPage.jsx';

const TeacherManagePage = ({ onLogout, role }) => (
    <TeacherPage onLogout={onLogout} role={role} view="manage" />
);

export default TeacherManagePage;
