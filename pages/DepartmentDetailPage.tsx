import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Department, Executive } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import * as Icons from '../components/icons/DepartmentIcons';
import PanelMemberCard from '../components/PanelMemberCard';
import PanelistModal from '../components/PanelistModal';
import { SparklesIcon } from '../components/icons/MiscIcons';
import DepartmentDetailPageSkeleton from '../components/skeletons/DepartmentDetailPageSkeleton';
import PageTitle from '../components/PageTitle';


const iconMap: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  BookOpen: Icons.BookOpen,
  Palette: Icons.Palette,
  Music: Icons.Music,
  Theater: Icons.Theater,
  Camera: Icons.Camera,
  Code: Icons.Code,
  TrendingUp: Icons.TrendingUp,
  Users: Icons.Users,
  Briefcase: Icons.Briefcase,
};

const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useData();
  const [department, setDepartment] = useState<Department | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Executive | null>(null);

  useEffect(() => {
    if (data?.departments && id) {
      const foundDept = data.departments.find(d => d.id === id);
      setDepartment(foundDept || null);
    }
  }, [id, data]);

  const members = useMemo(() => {
    if (!data?.executives || !department || !data.executives.length) return [];
    
    const latestYear = Math.max(...data.executives.map(e => e.year));
    const currentYearExecutives = data.executives.filter(e => e.year === latestYear);

    if (department.name === "Department of IT") {
        return currentYearExecutives.filter(e => e.position === "IT Secretary");
    }
    if (department.name === "Finance & Marketing") {
        return currentYearExecutives.filter(e => e.position === "Financial Secretary");
    }
    
    return currentYearExecutives.filter(e => e.department === department.name);
  }, [data, department]);


  if (loading) {
      return <DepartmentDetailPageSkeleton />;
  }

  if (!department) {
    return <div className="text-center p-12 pt-24">Department not found.</div>;
  }
  
  const IconComponent = iconMap[department.icon_url];

  return (
    <>
      <PageTitle title={`${department.name} | DCCC Departments`} />
      <PanelistModal member={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <div className="pt-28">
        <SectionWrapper>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                {IconComponent && <IconComponent className="w-12 h-12 text-accent" />}
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary">{department.name}</h1>
            </div>

            {department.key_points && department.key_points.length > 0 && (
              <div className="mb-12">
                <div className="bg-card-bg backdrop-blur-md border border-border-color p-8 rounded-lg">
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Key Activities</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {department.key_points.map((point, index) => (
                      <li key={index} className="flex items-start text-text-secondary">
                          <SparklesIcon className="w-5 h-5 mr-3 text-accent mt-1 flex-shrink-0" />
                          <span>{point}</span>
                      </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mb-12">
              <div className="bg-card-bg backdrop-blur-md border border-border-color p-8 rounded-lg">
                  <h2 className="text-2xl font-bold text-text-primary mb-4">About the Department</h2>
                  <p className="text-lg text-text-secondary whitespace-pre-line">{department.full_description}</p>
              </div>
            </div>
          </div>
        </SectionWrapper>

        {members.length > 0 && (
          <SectionWrapper>
            <h2 className="text-3xl font-bold text-text-primary text-center mb-10">Department Leaders</h2>
            <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
              {members.map(member => (
                <div key={member.id} className="w-[calc(50%-0.75rem)] md:w-auto md:max-w-[240px]">
                  <PanelMemberCard member={member} onClick={() => setSelectedStudent(member)} />
                </div>
              ))}
            </div>
          </SectionWrapper>
        )}

        <div className="pb-16 text-center space-y-4 md:space-y-0 md:space-x-4">
             <Link to="/panels" className="inline-block bg-accent text-accent-text font-semibold py-3 px-8 rounded-full hover:bg-accent-hover transition-transform transform hover:scale-105 duration-300">
                See Full Panel
            </Link>
             <Link to="/departments" className="inline-block bg-transparent border-2 border-accent text-accent font-semibold py-3 px-8 rounded-full hover:bg-accent hover:text-accent-text transition-all duration-300 transform hover:scale-105">
                &larr; Back to all departments
            </Link>
        </div>
      </div>
    </>
  );
};

export default DepartmentDetailPage;