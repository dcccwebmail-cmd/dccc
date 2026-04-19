import React from 'react';
import { Moderator, Executive } from '../types';

type PanelMember = Moderator | Executive;

const isStudent = (member: PanelMember): member is Executive => 'position' in member;

interface PanelMemberCardProps {
    member: PanelMember;
    onClick?: () => void;
}

const PanelMemberCard: React.FC<PanelMemberCardProps> = ({ member, onClick }) => {
    const getTitle = (m: PanelMember): string => {
        if ('position' in m) { // Executive
            if (m.department && m.panel_type === 'Executive') {
                return `${m.department} - ${m.position}`;
            }
            return m.position;
        }
        if ('designation' in m) { // Convenor or Moderator
            return m.designation;
        }
        return '';
    };
    
    const isExec = isStudent(member);
    const DEFAULT_EXEC_IMG = 'https://ik.imagekit.io/dccc/136881058_208a907c-e2ee-4386-ae78-0d15ed274338.svg';
    const DEFAULT_MOD_IMG = 'https://ik.imagekit.io/dccc/6769264_60111.svg';
    const defaultImg = isExec ? DEFAULT_EXEC_IMG : DEFAULT_MOD_IMG;
    const imgSrc = member.image_url || defaultImg;


    const title = getTitle(member);
    const cardContent = (
         <div className="bg-card-bg backdrop-blur-md rounded-2xl overflow-hidden shadow-lg h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-black/20 dark:hover:shadow-black/30 border border-border-color">
            <div className="relative h-full">
                <img src={imgSrc} alt={member.name} className="w-full h-full object-cover aspect-[3/4]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-3 text-white w-full">
                    <h3 className="font-bold text-base truncate">{member.name}</h3>
                    <p className="text-xs opacity-90 uppercase truncate">{title}</p>
                </div>
            </div>
        </div>
    );
    
    if (isStudent(member) && onClick) {
        return <button onClick={onClick} className="w-full h-full text-left">{cardContent}</button>
    }

    return cardContent;
};

export default PanelMemberCard;
