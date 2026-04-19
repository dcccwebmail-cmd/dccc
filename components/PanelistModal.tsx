import React from 'react';
import { Executive } from '../types';
import { Facebook, Instagram, Linkedin } from './icons/SocialIcons';

interface PanelistModalProps {
    member: Executive | null;
    onClose: () => void;
}

const DEFAULT_EXEC_IMG = 'https://ik.imagekit.io/dccc/136881058_208a907c-e2ee-4386-ae78-0d15ed274338.svg';

const PanelistModal: React.FC<PanelistModalProps> = ({ member, onClose }) => {
    if (!member) return null;

    const imgSrc = member.image_url || DEFAULT_EXEC_IMG;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-up"
            style={{animationDuration: '300ms'}}
            onClick={onClose}
        >
            <div 
                className="bg-card-bg backdrop-blur-xl border border-border-color rounded-2xl shadow-2xl max-w-sm w-full m-4 overflow-hidden relative transform transition-all duration-300 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 text-text-secondary hover:text-text-primary bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full p-1 z-10 transition-colors">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="p-6 flex flex-col items-center">
                    <img src={imgSrc} alt={member.name} className="w-32 h-32 rounded-full object-cover border-4 border-border-color shadow-lg" />
                    <div className="text-center mt-4">
                        <h2 className="text-2xl font-bold text-text-primary">{member.name}</h2>
                        <p className="text-accent font-semibold mt-1">{member.position}</p>
                        {member.department && <p className="text-text-secondary text-sm">{member.department}</p>}
                    </div>
                </div>
                
                <div className="px-6 pb-6 text-left border-t border-border-color">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                        {member.dccc_id && member.dccc_id !== 'DCCC-' && <>
                            <div className="font-semibold text-text-secondary">DCCC ID:</div>
                            <div>{member.dccc_id}</div>
                        </>}
                        {member.phone && <>
                            <div className="font-semibold text-text-secondary">Phone:</div>
                            <div>{member.phone}</div>
                        </>}
                        <div className="font-semibold text-text-secondary">Year:</div>
                        <div>{member.year}</div>
                        {member.blood_group && <>
                            <div className="font-semibold text-text-secondary">Blood Group:</div>
                            <div>{member.blood_group}</div>
                        </>}
                        {member.religion && <>
                            <div className="font-semibold text-text-secondary">Religion:</div>
                            <div>{member.religion}</div>
                        </>}
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed mt-4">{member.bio || "No bio available."}</p>
                </div>

                {(member.socials.facebook || member.socials.instagram || member.socials.linkedin) && (
                    <div className="px-6 py-3 border-t border-border-color bg-black/5 dark:bg-black/20 flex justify-center space-x-4">
                        {member.socials.facebook && <a href={member.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors"><Facebook /></a>}
                        {member.socials.instagram && <a href={member.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors"><Instagram /></a>}
                        {member.socials.linkedin && <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors"><Linkedin /></a>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanelistModal;
