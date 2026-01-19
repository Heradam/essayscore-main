import React from 'react';
import TeacherPage from './TeacherPage.jsx';

const TeacherHistoryPage = ({ onLogout, role }) => (
    <TeacherPage onLogout={onLogout} role={role} view="history" />
);

export default TeacherHistoryPage;
