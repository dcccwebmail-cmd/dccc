import React, { useState, Fragment, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Moderator, Executive } from '../types';
import Accordion from '../components/ui/Accordion';
import PanelMemberCard from '../components/PanelMemberCard';
import PanelistModal from '../components/PanelistModal';
import PanelsPageSkeleton from '../components/skeletons/PanelsPageSkeleton';
import PageTitle from '../components/PageTitle';

const executiveDepartmentOrder = [
    "Wordspace",
    "Musica",
    "Artstation",
    "Timbre",
    "Finance & Marketing",
    "Human Resource Management",
    "Department of IT",
    "Film School & Photography"
];

const panelTypeOrder = ['Presidency', 'Secretariat', 'Executive'];

/**
 * Sorts an array of executive members based on a predefined hierarchy:
 * 1. By Panel Type (Presidency > Secretariat > Executive).
 * 2. Within 'Presidency' type, by specific position order.
 * 3. Within 'Executive' type, by a custom department order.
 * 4. As a fallback, alphabetically by name.
 */
const sortExecutives = (executives: Executive[]): Executive[] => {
    return [...executives].sort((a, b) => {
        // Sort by panel type first
        const typeIndexA = panelTypeOrder.indexOf(a.panel_type);
        const typeIndexB = panelTypeOrder.indexOf(b.panel_type);
        if (typeIndexA !== typeIndexB) return typeIndexA - typeIndexB;

        // If both are Presidency, sort by specific position
        if (a.panel_type === 'Presidency') {
            const presidencyOrder = ['President', 'Vice President', 'General Secretary'];
            const posA = presidencyOrder.indexOf(a.position);
            const posB = presidencyOrder.indexOf(b.position);
            // If both positions are in the order array, sort by it
            if (posA > -1 && posB > -1) {
                return posA - posB;
            }
        }
        
        // If both are Executive, sort by department
        if (a.panel_type === 'Executive') {
            const deptIndexA = executiveDepartmentOrder.indexOf(a.department);
            const deptIndexB = executiveDepartmentOrder.indexOf(b.department);
            // Push items not in the order list to the end
            const finalIndexA = deptIndexA === -1 ? Infinity : deptIndexA;
            const finalIndexB = deptIndexB === -1 ? Infinity : deptIndexB;
            if (finalIndexA !== finalIndexB) return finalIndexA - finalIndexB;
        }

        // Fallback to alphabetical name sort
        return a.name.localeCompare(b.name);
    });
};


const PanelsPage: React.FC = () => {
    const { data, loading } = useData();
    const [selectedStudent, setSelectedStudent] = useState<Executive | null>(null);

    const {
        convenor,
        moderators,
        currentYear,
        presidencyPanel,
        secretariatPanel,
        executiveMembers,
        pastPanelsByYear,
    } = useMemo(() => {
        if (!data) return { convenor: null, moderators: [], currentYear: 0, presidencyPanel: [], secretariatPanel: [], executiveMembers: [], pastPanelsByYear: {} };

        const allExecutives = data.executives || [];
        
        // Determine the most recent panel year by finding the maximum year in the data.
        const currentYear = allExecutives.length > 0 
            ? Math.max(...allExecutives.map(e => e.year))
            : new Date().getFullYear();
        
        const allModerators = data.moderators || [];
        const convenor = allModerators.find(m => m.role === 'Convenor') || null;
        const otherModerators = allModerators.filter(m => m.role !== 'Convenor');

        const currentExecutives = allExecutives.filter(e => e.year === currentYear);
        const sortedCurrentExecutives = sortExecutives(currentExecutives);
        
        const presidencyPanel = sortedCurrentExecutives.filter(e => e.panel_type === 'Presidency');
        const secretariatPanel = sortedCurrentExecutives.filter(e => e.panel_type === 'Secretariat');
        const executiveMembers = sortedCurrentExecutives.filter(e => e.panel_type === 'Executive');

        const pastExecutives = allExecutives.filter(e => e.year < currentYear);
        const pastPanelsByYear = pastExecutives.reduce((acc, exec) => {
            (acc[exec.year] = acc[exec.year] || []).push(exec);
            return acc;
        }, {} as Record<number, Executive[]>);

        // Sort members within each past year
        for (const year in pastPanelsByYear) {
            pastPanelsByYear[year] = sortExecutives(pastPanelsByYear[year]);
        }

        return { convenor, moderators: otherModerators, currentYear, presidencyPanel, secretariatPanel, executiveMembers, pastPanelsByYear };
    }, [data]);


    const handleSelectStudent = (member: Executive) => {
        setSelectedStudent(member);
    };

    if (loading) {
        return <PanelsPageSkeleton />;
    }

    const teachersPanelContent = (
      <div className="flex flex-col items-center gap-10 max-w-5xl mx-auto">
        {convenor && (
          <div className="w-full flex justify-center">
            <div className="w-full sm:w-auto sm:max-w-[230px]">
              <PanelMemberCard member={convenor} />
            </div>
          </div>
        )}
        {moderators.length > 0 && (
          <div className="w-full">
            <Accordion title="Moderators">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {moderators.map(mod => (
                        <PanelMemberCard key={mod.id} member={mod} />
                    ))}
                </div>
            </Accordion>
          </div>
        )}
      </div>
    );

    const PanelSection: React.FC<{title: string; members: Executive[]; gridClass?: string;}> = ({ title, members, gridClass }) => (
        <div className="mb-16">
            <h3 className="text-xl md:text-2xl font-semibold text-text-secondary text-center mb-10">{title}</h3>
            <div className={`grid ${gridClass || 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-6`}>
                {members.map(exec => (
                    <PanelMemberCard key={exec.id} member={exec} onClick={() => handleSelectStudent(exec)} />
                ))}
            </div>
        </div>
    );

    return (
        <Fragment>
            <PageTitle title="Our Panel | Dhaka College Cultural Club" />
            <PanelistModal member={selectedStudent} onClose={() => setSelectedStudent(null)} />
            <div className="pt-28">
                <section className="text-center pb-16 px-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary">Our Panel</h1>
                    <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">
                        Meet the guiding mentors and the dedicated student leaders who steer our club.
                    </p>
                </section>

                <section className="py-16 px-4">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-dccc-red text-center mb-12">Teachers Panel</h2>
                        {teachersPanelContent}
                    </div>
                </section>
                
                <section className="py-16 px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-16">Students Panel ({currentYear})</h2>
                    <div className="max-w-5xl mx-auto">
                        {presidencyPanel.length > 0 && <PanelSection title="Presidency Panel" members={presidencyPanel} gridClass="grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3" />}
                        {secretariatPanel.length > 0 && <PanelSection title="Secretariat Panel" members={secretariatPanel} />}
                        {executiveMembers.length > 0 && <PanelSection title="Executive Members" members={executiveMembers} />}
                    </div>
                </section>

                <section className="py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-dccc-red text-center mb-10">Past Panels</h2>
                         {Object.keys(pastPanelsByYear).sort((a, b) => Number(b) - Number(a)).map(year => (
                            <Accordion key={year} title={`Panel of ${year}`}>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {pastPanelsByYear[Number(year)].map(exec => (
                                        <PanelMemberCard key={exec.id} member={exec} onClick={() => handleSelectStudent(exec)} />
                                    ))}
                                </div>
                            </Accordion>
                        ))}
                    </div>
                </section>
            </div>
        </Fragment>
    );
};

export default PanelsPage;
