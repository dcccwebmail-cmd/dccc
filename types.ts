
export interface SocialLinks {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  email?: string;
  youtube?: string;
}

export interface HeroData {
  hero_title: string;
  hero_subtitle: string;
  background_type: "image" | "video";
  background_url: string;
  cta_primary_text: string;
  cta_primary_link: string;
  cta_secondary_text: string;
  cta_secondary_link: string;
}

export interface AboutSection {
  title: string;
  description: string;
  image_url: string;
}

export interface AboutData {
  about_short: string;
  preview_image_url: string;
  preview_title: string;
  founded_year: number;
  vision_tagline: string;
  sections: AboutSection[];
  total_members: number;
  total_departments: number;

  prizes_won: number;
}

export interface Department {
  id: string;
  name: string;
  short_description: string;
  icon_url: string; // Using string for icon component name
  full_description: string;
  key_points?: string[];
  order: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  display_date: string;
  start_date: string; // ISO format string
  end_date: string; // ISO format string
  banner_url: string;
  segments: { 
    name: string; 
    winners?: {
      champion?: string;
      runner_up?: string;
      second_runner_up?: string;
    }; 
  }[];
  status: 'upcoming' | 'past';
  registration_link?: string;
  more_buttons?: { text: string; link: string; }[];
  venue?: string;
  guest?: { name: string; title: string; };
  stats: {
    attendees: string;
    competitions: number;
    days: number;
  };
}

export interface Moderator {
  id: string;
  name: string;
  designation: string;
  image_url?: string;
  quote: string;
  socials: SocialLinks;
  role: 'Convenor' | 'Moderator';
}

export interface Executive {
  id: string;
  name: string;
  dccc_id?: string;
  phone?: string;
  position: string;
  image_url?: string;
  department: string;
  bio: string;
  year: number;
  panel_type: 'Presidency' | 'Secretariat' | 'Executive';
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  religion?: 'Islam' | 'Hinduism' | 'Buddhism' | 'Christianity' | 'Other';
  socials: SocialLinks;
}

export interface FooterData {
  footer_about: string;
  socials: SocialLinks;
  contact_email: string;
  contact_phone: string;
  address: string;
  copyright_text: string;
}

export interface PaymentMethod {
  id: string;
  name: string; // Bkash, Nagad
  number: string;
  accountType: string; // Personal, Merchant
  instructions: string;
  imageUrl?: string;
  videoUrl?: string;
  isActive: boolean;
}

export interface EmailConfig {
    subject: string;
    body: string;
}

// Brevo (Sendinblue) Configuration
export interface BrevoConfig {
    apiKey: string;
    senderName: string;
    senderEmail: string;
}

// Coordinate configuration for a field on the ID card
export interface IdCardField {
    x: number;
    y: number;
    fontSize: number;
    color: string; // Hex code
    align: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
}

export interface IdCardConfig {
    backgroundImageUrl: string;
    width: number;  // mm
    height: number; // mm
    customFontData?: string; // Base64 string of TTF file
    customFontName?: string; // Name of the uploaded file
    fields: {
        name?: IdCardField;
        id?: IdCardField;
        roll?: IdCardField;
        phone?: IdCardField;
        blood_group?: IdCardField;
        photo?: { x: number; y: number; width: number; height: number }; // Special config for photo
    };
}

export interface JoinContent {
  description: string;
  regFee: string;
  paymentMethods: PaymentMethod[];
  supportWhatsapp?: string;
  supportFacebook?: string;
  emailConfig?: EmailConfig;
  brevoConfig?: BrevoConfig;
  idCardConfig?: IdCardConfig;
  currentSessionYear?: string; // e.g. "25" for 2025-2026 session
}

export interface ThemeColorSet {
  background: string;
  text_primary: string;
  text_secondary: string;
  accent: string;
  accent_hover: string;
  accent_text: string;
  card_bg: string;
  border_color: string;
}

export interface ThemeColors {
  light: ThemeColorSet;
  dark: ThemeColorSet;
}

export interface DCCCData {
  hero: HeroData;
  about: AboutData;
  departments: Department[];
  events: Event[];
  moderators: Moderator[];
  executives: Executive[];
  footer: FooterData;
  join: JoinContent;
  themeColors: ThemeColors;
}

export interface JoinRequest {
  id?: string;
  personal: { 
    name_bn: string;
    name_en: string;
    email: string;
    dob: string; 
    gender: string;
    father_name: string;
    mother_name: string;
    image_url: string;
    booth?: string;
  };
  academic: { 
    section: string; // Renamed from branch
    roll: string; // 13 digits
    prev_institute: string;
    blood_group: string;
    session?: string; // Kept for interface compatibility
  };
  contact: { 
    phone: string; 
    whatsapp: string;
    present_address: string; 
    permanent_address: string; 
  };
  preferences: { 
    first_choice: string; 
    second_choice: string; 
    reason: string; 
  };
  skills: { 
    experience: string; 
    hobbies: string; 
    skills: string; 
  };
  socials: { 
    facebook: string; 
    instagram: string; 
    linkedin: string; 
  };
  payment: {
    method?: string; // Bkash/Nagad for online
    trx_id?: string; // For online
    dccc_id?: string; // For offline (Form No)
  };
  meta: {
    reg_type: 'new' | 'offline' | null;
  };
  status: 'pending' | 'approved' | 'rejected';
  assignedId?: string; // Field to store the final approved ID
  submitted_at: string;
}
