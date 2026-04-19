import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Facebook, Instagram, Youtube, Mail, Linkedin } from './icons/SocialIcons';

const SocialLink: React.FC<{ href: string; children: React.ReactNode; label: string }> = ({ href, children, label }) => (
  <a 
    href={href} 
    className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 shadow-md hover:bg-accent text-text-secondary dark:text-slate-300 hover:text-white transition-all duration-300 flex items-center justify-center transform hover:scale-110"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span className="sr-only">{label}</span>
    {children}
  </a>
);


const Footer: React.FC = () => {
  const { data } = useData();
  const footerData = data?.footer;

  if (!footerData) {
    return null; // Or a loading skeleton
  }

  const currentYear = new Date().getFullYear();
  // Replace any 4-digit number with the current year to ensure it's always up-to-date
  const dynamicCopyrightText = footerData.copyright_text.replace(/\d{4}/, currentYear.toString());

  return (
    <footer className="text-text-secondary">
      <div className="max-w-screen-xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <img src="https://ik.imagekit.io/dccc/clg-club.png" className="h-12 mx-auto mb-6" alt="DCCC Logo" />
        <p className="max-w-2xl mx-auto mb-8">
          {footerData.footer_about}
        </p>
        <div className="flex justify-center items-center space-x-4 mb-8">
          {footerData.socials.facebook && <SocialLink href={footerData.socials.facebook} label="Facebook"><Facebook /></SocialLink>}
          {footerData.socials.instagram && <SocialLink href={footerData.socials.instagram} label="Instagram"><Instagram /></SocialLink>}
          {footerData.socials.linkedin && <SocialLink href={footerData.socials.linkedin} label="LinkedIn"><Linkedin /></SocialLink>}
          {footerData.socials.youtube && <SocialLink href={footerData.socials.youtube} label="YouTube"><Youtube /></SocialLink>}
          {footerData.socials.email && <SocialLink href={footerData.socials.email} label="Email"><Mail /></SocialLink>}
        </div>
        <div className="text-sm mb-8 space-y-2 md:space-y-0 md:space-x-6 md:flex md:justify-center">
            <a href={`mailto:${footerData.contact_email}`} className="hover:underline">{footerData.contact_email}</a>
            <span className="hidden md:inline">|</span>
            <a href={`tel:${footerData.contact_phone.replace(/\s/g, '')}`} className="hover:underline block md:inline">{footerData.contact_phone}</a>
            <span className="hidden md:inline">|</span>
            <p className="block md:inline">{footerData.address}</p>
        </div>
        <div className="pt-8 mt-4 border-t border-border-color text-sm">
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
                <p>{dynamicCopyrightText}</p>
                <span className="hidden md:inline">•</span>
                <Link to="/admin" className="hover:text-accent transition-colors">Admin Panel</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;