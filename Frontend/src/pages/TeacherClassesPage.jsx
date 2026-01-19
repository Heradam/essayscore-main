import React from 'react';
import TeacherPage from './TeacherPage.jsx';

const TeacherClassesPage = ({ onLogout, role }) => (
    <TeacherPage onLogout={onLogout} role={role} view="classes" />
);

export default TeacherClassesPage;
