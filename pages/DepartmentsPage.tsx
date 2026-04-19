import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Department } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import * as Icons from '../components/icons/DepartmentIcons';
import DepartmentsPageSkeleton from '../components/skeletons/DepartmentsPageSkeleton';
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

const DepartmentCard: React.FC<{ department: Department }> = ({ department }) => {
  const IconComponent = iconMap[department.icon_url];
  return (
    <Link
      to={`/departments/${department.id}`}
      className="block group p-8 bg-card-bg backdrop-blur-md rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-black/20 dark:hover:shadow-black/40 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden border border-border-color"
    >
      <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-br from-transparent via-accent/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <div className="flex-shrink-0 mb-6 w-16 h-16 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-text group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
          {IconComponent && <IconComponent className="w-8 h-8" />}
        </div>
        <div className="flex-grow">
          <h3 className="mb-2 text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">{department.name}</h3>
          <p className="text-text-secondary text-base leading-relaxed">{department.short_description}</p>
        </div>
        <div className="mt-8">
          <span className="font-semibold text-accent opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 inline-block">
            Explore Department &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
};


const DepartmentsPage: React.FC = () => {
  const { data, loading } = useData();
  const departments = data?.departments || [];

  if (loading) {
    return <DepartmentsPageSkeleton />;
  }

  return (
    <div>
      <PageTitle title="Our Departments | Dhaka College Cultural Club" />
      <div className="pt-24">
        <section className="py-16 md:py-20 text-center">
          <div className="max-w-3xl mx-auto px-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight">Our Departments</h1>
            <p className="mt-4 text-lg md:text-xl text-text-secondary">
              The creative and administrative divisions that power our club. Each wing is a universe of its own, dedicated to nurturing talent and pushing boundaries.
            </p>
          </div>
        </section>
      </div>

      <SectionWrapper className="!pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments
              .sort((a, b) => a.order - b.order)
              .map(dept => (
                <DepartmentCard key={dept.id} department={dept} />
            ))}
        </div>
      </SectionWrapper>
    </div>
  );
};

export default DepartmentsPage;