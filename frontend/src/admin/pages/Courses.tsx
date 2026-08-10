import React, { useState } from 'react';
import CourseList from '../components/CourseList';
import CourseBuilder from '../components/CourseBuilder';
import { MockDB } from '../../services/MockDB';
import { useDB } from '../../hooks/useDB';

export default function Courses() {
  const db = useDB();
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const handleSave = (course: any) => {
    if (course.id) {
      MockDB.updateItem('courses', course.id, course);
    } else {
      MockDB.addItem('courses', course);
    }
    setEditingCourse(null);
  };

  const handleDuplicate = (course: any) => {
    const duplicated = { 
      ...course, 
      id: undefined, 
      name: `${course.name} (Copy)`,
      code: `${course.code}-COPY`,
      status: 'Draft' 
    };
    MockDB.addItem('courses', duplicated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action is irreversible.')) {
      MockDB.deleteItem('courses', id);
    }
  };

  return (
    <>
      <CourseList 
        onEdit={setEditingCourse} 
        onDuplicate={handleDuplicate} 
        onDelete={handleDelete} 
      />
      
      {editingCourse && (
        <CourseBuilder 
          initialData={editingCourse} 
          onClose={() => setEditingCourse(null)} 
          onSave={handleSave} 
        />
      )}
    </>
  );
}
