import { DCCCData } from '../types';
import { firebaseConfig } from './firebaseConfig';

declare global {
    interface Window { firebase: any; }
}

let app: any = null;

// This check ensures we don't crash if firebase isn't loaded or config is bad.
if (window.firebase && typeof window.firebase.initializeApp === 'function' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_")) {
    try {
        app = window.firebase.apps.length 
            ? window.firebase.app() 
            : window.firebase.initializeApp(firebaseConfig);
    } catch(e) {
        console.error("Error initializing Firebase:", e);
        app = null; // Ensure app is null on error
    }
} else {
    console.warn("Firebase SDK not loaded or config is invalid. Running in offline mode.");
}

export const db = app ? app.firestore() : null;
export const auth = app ? app.auth() : null;
// Storage removed as per request


const currentYear = new Date().getFullYear();

// This is the default data for seeding the database or for fallback in admin.
export const initialData: DCCCData = {
  themeColors: {
    light: {
      background: '#f8fafc',
      text_primary: '#0f172a',
      text_secondary: '#475569',
      accent: '#3b82f6',
      accent_hover: '#2563eb',
      accent_text: '#ffffff',
      card_bg: 'rgba(255, 255, 255, 0.6)',
      border_color: 'rgba(0, 0, 0, 0.1)',
    },
    dark: {
      background: '#0f172a',
      text_primary: '#e2e8f0',
      text_secondary: '#94a3b8',
      accent: '#3b82f6',
      accent_hover: '#60a5fa',
      accent_text: '#ffffff',
      card_bg: 'rgba(30, 41, 59, 0.5)',
      border_color: 'rgba(255, 255, 255, 0.1)',
    },
  },
  hero: {
    hero_title: "Dhaka College\nCultural Club",
    hero_subtitle: "Where Creativity Meets Legacy. Join us to explore the vibrant world of culture, art, and performance.",
    background_type: "image",
    background_url: "https://picsum.photos/1920/1080?grayscale&blur=2",
    cta_primary_text: "Explore Club",
    cta_primary_link: "#about",
    cta_secondary_text: "Join DCCC",
    cta_secondary_link: "mailto:join@dccc.com",
  },
  about: {
    about_short: "Founded with the vision to foster cultural activities and creative expression, DCCC has been a cornerstone of student life at Dhaka College. We are a community of artists, thinkers, and performers dedicated to enriching the campus atmosphere.",
    preview_image_url: "https://picsum.photos/800/600?random=1",
    preview_title: "A Legacy of Creativity and Culture",
    founded_year: 2005,
    vision_tagline: "Nurturing Talent, Celebrating Culture.",
    total_members: 150,
    total_departments: 8,
    prizes_won: 50,
    sections: [
      {
        title: "Our Humble Beginnings",
        description: "Dhaka College Cultural Club (DCCC) stands as a testament to the vibrant cultural heritage of Dhaka College. Established in 2005, our club has been at the forefront of promoting artistic and intellectual pursuits among students.",
        image_url: "https://picsum.photos/800/600?random=10"
      },
      {
        title: "A Platform for Expression",
        description: "From organizing large-scale cultural festivals to intimate workshops, we provide a platform for students to discover their talents, collaborate with peers, and create meaningful experiences. Our journey is one of passion, dedication, and a relentless pursuit of excellence in every cultural endeavor.",
        image_url: "https://picsum.photos/800/600?random=11"
      },
      {
        title: "Our Vision for the Future",
        description: "We believe in nurturing the next generation of cultural leaders and ambassadors, continuing to shape the future of arts and culture on campus and beyond.",
        image_url: "https://picsum.photos/800/600?random=12"
      }
    ]
  },
  departments: [
    // Cultural Province
    { id: "wordspace", name: "Wordspace", short_description: "The literary hub for writers, poets, and orators.", icon_url: "BookOpen", full_description: "Wordspace is dedicated to the literary arts. We host poetry slams, creative writing workshops, debates, and public speaking sessions to empower students with the art of expression.", key_points: ["Poetry Slams", "Creative Writing Workshops", "Debates & Recitation", "Public Speaking Sessions"], order: 1 },
    { id: "musica", name: "Musica", short_description: "The sound of DCCC, for vocalists and instrumentalists.", icon_url: "Music", full_description: "Musica unites all music lovers on campus. We organize musical evenings, band performances, and training sessions for various instruments and vocal styles.", key_points: ["Vocal Training", "Instrument Workshops", "Band Performances", "Musical Evenings"], order: 2 },
    { id: "artstation", name: "Artstation", short_description: "A canvas for painters, sculptors, and visual artists.", icon_url: "Palette", full_description: "Artstation is the visual arts wing of DCCC. It's a space for students to explore painting, sketching, digital art, and sculpture, culminating in exhibitions and art camps.", key_points: ["Painting & Sketching", "Digital Art Workshops", "Sculpture Classes", "Art Exhibitions"], order: 3 },
    { id: "timbre", name: "Timbre", short_description: "The stage for actors and performers.", icon_url: "Theater", full_description: "Timbre is the theatre and performance department. It focuses on stage plays, street drama, and acting workshops, bringing powerful stories to life.", key_points: ["Stage Plays", "Street Drama (Nattadal)", "Acting Workshops", "Performance Arts"], order: 4 },
    { id: "film-school", name: "Film School & Photography", short_description: "Capturing moments and telling stories through lenses.", icon_url: "Camera", full_description: "This department is for aspiring filmmakers and photographers. We cover everything from scriptwriting and cinematography to post-production and photojournalism.", key_points: ["Cinematography", "Photojournalism", "Scriptwriting", "Post-Production Workshops"], order: 5 },
    // Technical & Management
    { id: "hrm", name: "Human Resource Management", short_description: "Building and managing the DCCC family.", icon_url: "Briefcase", full_description: "The HRM department is responsible for recruitment, member engagement, and maintaining a positive and collaborative environment within the club.", key_points: ["Member Recruitment", "Engagement Activities", "Team Building", "Club Governance"], order: 6 },
    { id: "it", name: "Department of IT", short_description: "The digital backbone of the club.", icon_url: "Code", full_description: "The IT department manages the club's digital presence, from website development to social media campaigns and tech support for events.", key_points: ["Web Development", "Social Media Management", "Graphic Design", "Event Tech Support"], order: 7 },
    { id: "finance-marketing", name: "Finance & Marketing", short_description: "Strategizing the growth and reach of DCCC.", icon_url: "TrendingUp", full_description: "This team handles sponsorships, budgeting, and promotional strategies to ensure the club's events and activities are successful and well-funded.", key_points: ["Sponsorship Management", "Budgeting & Finance", "Marketing Campaigns", "Public Relations"], order: 8 },
  ],
  events: [
    { 
      id: "cultural-gala-2024", 
      title: "Annual Cultural Gala 2024", 
      description: "Our flagship event of the year, the Annual Cultural Gala, is a spectacular showcase of talent from all departments. Join us for an unforgettable evening of music, dance, drama, art, and literary performances that celebrate the rich cultural tapestry of our institution.", 
      display_date: "October 26, 2024", 
      start_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // Approx 20 days from now for countdown
      end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours duration
      banner_url: "https://picsum.photos/1200/600?random=5", 
      segments: [{name: "Folk Music"}, {name: "Recitation"}, {name: "Classical Dance"}, {name: "Stage Play"}, {name: "Photography Exhibition"}], 
      status: "upcoming",
      registration_link: "#",
      more_buttons: [
        { text: "View Event Schedule", link: "#" },
        { text: "Meet the Performers", link: "#" }
      ],
      venue: "Dhaka College Auditorium",
      guest: { name: "Prof. Dr. A. K. M. Halim", title: "Chief Guest" },
      stats: { attendees: "1000+", competitions: 15, days: 1 } 
    },
    { 
      id: "writers-workshop-2024", 
      title: "Writer's Workshop: Pen & Paper", 
      description: "A comprehensive workshop for aspiring writers, covering everything from creative writing techniques to modern storytelling. Led by renowned authors and poets, this is a must-attend for all literary enthusiasts.",
      display_date: "November 15, 2024", 
      start_date: "2024-11-15T04:00:00.000Z",
      end_date: "2024-11-15T11:00:00.000Z",
      banner_url: "https://picsum.photos/1200/600?random=6", 
      segments: [{name: "Poetry Session"}, {name: "Short Story Crafting"}, {name: "Interactive Q&A"}],
      status: "upcoming",
      registration_link: "#",
      venue: "DCCC Club Room, Dhaka College",
      stats: { attendees: "100+", competitions: 3, days: 1 } 
    },
    { 
      id: "spring-fest-2024", 
      title: "Spring Fest 2024", 
      description: "A vibrant celebration of spring with music, dance, and art. The festival brought together students from all departments to showcase their talents and celebrate the new season. It featured multiple stages, food stalls, and art installations, creating a lively atmosphere on campus.", 
      display_date: "March 15-16, 2024", 
      start_date: "2024-03-15T04:00:00.000Z",
      end_date: "2024-03-16T16:00:00.000Z",
      banner_url: "https://picsum.photos/1200/600?random=2", 
      segments: [
        {name: "Folk Music", winners: { champion: "Nabil Ahmed", runner_up: "Sadia Islam" } }, 
        {name: "Recitation", winners: { champion: "Anika Tabassum" } }, 
        {name: "Classical Dance", winners: { champion: "Shreya Karmakar", runner_up: "Amit Hasan", second_runner_up: "Priya Roy" } }
      ], 
      status: "past",
      more_buttons: [
        { text: "View Photo Gallery", link: "#" },
        { text: "Watch Highlights", link: "#" }
      ],
      stats: { attendees: "500+", competitions: 12, days: 2 } 
    },
    { 
      id: "film-gala-2024", 
      title: "Annual Film Gala", 
      description: "Showcasing the best short films by our talented members, judged by industry professionals. The gala concluded with an awards ceremony recognizing outstanding work in various categories.", 
      display_date: "May 22, 2024", 
      start_date: "2024-05-22T12:00:00.000Z",
      end_date: "2024-05-22T16:00:00.000Z",
      banner_url: "https://picsum.photos/1200/600?random=3", 
      segments: [
        {name: "Best Director", winners: { champion: "Rahim Ali" }}, 
        {name: "Best Cinematography", winners: { champion: "Saima Khan" }}, 
        {name: "Audience Choice", winners: { champion: "The Last Leaf" }}
      ], 
      status: "past",
      stats: { attendees: "200+", competitions: 5, days: 1 } 
    },
    { 
      id: "art-exhibition-2023", 
      title: "Art Exhibition 'Canvas'", 
      description: "A display of stunning artworks from DCCC Artstation members, ranging from traditional paintings to modern digital art. The exhibition ran for three days and attracted art lovers from across the city.", 
      display_date: "December 1-3, 2023", 
      start_date: "2023-12-01T04:00:00.000Z",
      end_date: "2023-12-03T14:00:00.000Z",
      banner_url: "https://picsum.photos/1200/600?random=4", 
      segments: [
        {name: "Best Painting", winners: { champion: "Zarif Islam" }}, 
        {name: "Best Sculpture", winners: { champion: "Farhana Yasmin" }}, 
        {name: "Innovation in Art", winners: { champion: "Rifat Hossain" }}
      ], 
      status: "past",
      stats: { attendees: "1000+", competitions: 0, days: 3 } 
    },
  ],
  moderators: [
    { id: "conv1", name: "Prof. Dr. A. K. M. Halim", designation: "Convenor, Dhaka College Cultural Club", image_url: "https://i.imgur.com/rO9yC9G.png", quote: "Guiding the cultural torchbearers of tomorrow.", socials: { email: "halim.akm@dc.edu", linkedin: "#" }, role: "Convenor" },
    { id: "mod1", name: "Prof. Monira Begum", designation: "Head of Sociology Department", image_url: "https://i.imgur.com/rO9yC9G.png", quote: "Culture is the widening of the mind and of the spirit.", socials: { email: "monira@dc.edu", linkedin: "#" }, role: "Moderator" },
    { id: "mod2", name: "Adnan Hossain", designation: "Assistant Professor, English", quote: "Creativity is intelligence having fun.", socials: { email: "adnan@dc.edu", linkedin: "#" }, role: "Moderator" },
    { id: "mod3", name: "Khohinur Akter", designation: "Lecturer, English", image_url: "https://i.imgur.com/rO9yC9G.png", quote: "Art enables us to find ourselves and lose ourselves at the same time.", socials: { email: "khohinur@dc.edu", linkedin: "#" }, role: "Moderator" },
    { id: "mod4", name: "Shrabani Dhar", designation: "Assistant Professor, Management", image_url: "https://i.imgur.com/rO9yC9G.png", quote: "The principle of true art is not to portray, but to evoke.", socials: { email: "shrabani@dc.edu", linkedin: "#" }, role: "Moderator" },
  ],
  executives: [
    // Present Panel - Main Roles
    { id: "exe1", name: "Sadikul Islam", dccc_id: "DCCC-2024001", phone: "01712345678", position: "President", image_url: "https://i.imgur.com/j8jCpfq.png", department: "", bio: "Leading with a passion for cultural innovation and student engagement.", year: currentYear, panel_type: 'Presidency', blood_group: 'O+', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe2", name: "Md. Shahu Arafa Raiyan", dccc_id: "DCCC-2024002", phone: "01812345678", position: "General Secretary", image_url: "https://i.imgur.com/j8jCpfq.png", department: "", bio: "As the organizational backbone of the club, Raiyan ensures all activities run smoothly.", year: currentYear, panel_type: 'Presidency', blood_group: 'A+', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe3", name: "Millat Morsalin Tanim Ba...", position: "Vice President", department: "", bio: "Supporting the President's vision, Millat focuses on strategic initiatives.", year: currentYear, panel_type: 'Presidency', blood_group: 'B+', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe4", name: "Arafat Rahman", position: "Operating Secretary", image_url: "https://i.imgur.com/j8jCpfq.png", department: "", bio: "Arafat is the master of logistics, overseeing the execution of events.", year: currentYear, panel_type: 'Secretariat', blood_group: 'AB+', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe5", name: "Hemayetul Islam Fardeen", position: "Joint Secretary", image_url: "https://i.imgur.com/j8jCpfq.png", department: "", bio: "Working closely with the General Secretary, Fardeen assists in administrative tasks.", year: currentYear, panel_type: 'Secretariat', blood_group: 'O-', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe6", name: "Sadid Hasan Dhurbok", position: "IT Secretary", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Department of IT", bio: "The tech whiz of the club, Sadid manages DCCC's digital presence.", year: currentYear, panel_type: 'Secretariat', blood_group: 'A-', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe7", name: "Tahosin Ahamed Somo", position: "Financial Secretary", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Finance & Marketing", bio: "Tahosin is in charge of the club's financial health.", year: currentYear, panel_type: 'Secretariat', blood_group: 'B-', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },

    // Present Panel - Executive Members
    { id: "exe8", name: "Jubawer Roshid Jim", position: "Executive", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Film School & Photography", bio: "A passionate storyteller through the lens.", year: currentYear, panel_type: 'Executive', blood_group: 'Unknown', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe9", name: "Zakareya Sani", position: "Executive", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Human Resource Management", bio: "Sani is dedicated to building a strong and engaged community within the club.", year: currentYear, panel_type: 'Executive', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe10", name: "Md. Shihab Ahammed", position: "Executive", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Musica", bio: "A talented musician, Shihab helps organize Musica's events and workshops.", year: currentYear, panel_type: 'Executive', religion: 'Islam', socials: { facebook: "#", instagram: "#" } },
    { id: "exe11", name: "Md Saidul Islam", position: "Executive", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Wordspace", bio: "A proactive member contributing to various club activities.", year: currentYear, panel_type: 'Executive', religion: 'Islam', socials: { facebook: "#", instagram: "#" } },
    { id: "exe12", name: "Murshed Nasif", position: "Executive", department: "Film School & Photography", bio: "Nasif brings his keen eye for detail to the photography wing.", year: currentYear, panel_type: 'Executive', religion: 'Islam', socials: { facebook: "#", instagram: "#" } },
    { id: "exe13", name: "MD. Ashfaq Zaman", position: "Executive", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Timbre", bio: "An energetic executive member involved in event management.", year: currentYear, panel_type: 'Executive', religion: 'Islam', socials: { facebook: "#", instagram: "#" } },
    { id: "exe14", name: "Utsa Barai", position: "Executive", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Artstation", bio: "Utsa's artistic flair enriches Artstation.", year: currentYear, panel_type: 'Executive', religion: 'Hinduism', socials: { facebook: "#", instagram: "#" } },
    { id: "exe15", name: "Junayed Ahmed Fahim", position: "Executive", image_url: "https://i.imgur.com/j8jCpfq.png", department: "Artstation", bio: "Fahim is a creative force in Artstation.", year: currentYear, panel_type: 'Executive', religion: 'Islam', socials: { facebook: "#", instagram: "#" } },

    // Past Panel
    { id: "exe22", name: "Rohan Khan", position: "President", image_url: "https://i.imgur.com/j8jCpfq.png", department: "", bio: "Visionary leader who set a new standard for creative projects.", year: currentYear - 1, panel_type: 'Presidency', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
    { id: "exe23", name: "Ayesha Siddika", position: "General Secretary", image_url: "https://i.imgur.com/j8jCpfq.png", department: "", bio: "A highly organized leader who streamlined club operations.", year: currentYear - 1, panel_type: 'Presidency', religion: 'Islam', socials: { facebook: "#", instagram: "#", linkedin: "#" } },
  ],
  footer: {
    footer_about: "Dhaka College Cultural Club is a hub of creativity, fostering talent and celebrating the rich cultural tapestry of our institution.",
    socials: { facebook: "#", instagram: "#", youtube: "#", linkedin: "#", email: "mailto:info@dccc.com" },
    contact_email: "info@dccc.com",
    contact_phone: "+880 123 456 789",
    address: "Dhaka College, New Market, Dhaka-1205",
    copyright_text: `© ${new Date().getFullYear()} Dhaka College Cultural Club. All Rights Reserved.`,
  },
  join: {
    description: `<h3>ঢাকা কলেজ কালচারাল ক্লাবের প্রতিপাদ্য</h3><p>অন্যান্য প্রাতিষ্ঠানিক শিক্ষাঙ্গনের সংগঠনগুলো থেকে ঢাকা কলেজ কালচারাল ক্লাবের দূরদর্শিতা ভিন্ন পথে প্রসারিত। পর্যাপ্ত সাংস্কৃতিক চর্চা প্রতিষ্ঠায় ক্লাবের মূল লক্ষ্য—সদস্যদের জীবন ও মানবিকতার আদর্শে যত্নশীল করার পথে পরবর্তীতে আসতে পারে সভ্য সামাজিক বিপ্লব।</p><h3>কার্যক্রম</h3><p>গত ২০২২-২৩-২৪ শিক্ষাবর্ষে জাতীয় ও আন্তর্জাতিক পর্যায় মিলিয়ে বিশটিরও বেশি উল্লেখযোগ্য অর্জনের স্রোত যেন ২৪-২৫ শিক্ষাবর্ষেও থেমে যায়নি। লেখনী, চিত্রাঙ্কন, ফটোগ্রাফি সহ বিভিন্ন বিভাগে জাতীয় পর্যায়ে আসে একাধিক অর্জন, যা প্রমাণ করে— শেখার জন্য ঢাকা কলেজ কালচারাল ক্লাব একটি প্রতিষ্ঠিত মঞ্চ, যেখানে দেশজ সংস্কৃতিসহ আধুনিকতায় সমান তাল মিলিয়ে এবং সদস্যদের আগ্রহ প্রাধান্য দিয়ে প্রতিটা ডিপার্টমেন্ট এবং প্রজেক্টগুলো সাজানো হয়।</p>`,
    regFee: "100 BDT",
    paymentMethods: [
      {
        id: "bkash",
        name: "bKash",
        accountType: "Personal",
        number: "01XXXXXXXXX",
        instructions: "<ol><li>Go to bKash Menu by dialing *247#</li><li>Choose 'Send Money'</li><li>Enter the Receiver Number</li><li>Enter Amount (100)</li><li>Enter Reference (DCCC)</li><li>Enter PIN to confirm</li></ol>",
        isActive: true
      },
      {
        id: "nagad",
        name: "Nagad",
        accountType: "Personal",
        number: "01XXXXXXXXX",
        instructions: "<ol><li>Go to Nagad Menu by dialing *167#</li><li>Choose 'Send Money'</li><li>Enter the Receiver Number</li><li>Enter Amount (100)</li><li>Enter Reference (DCCC)</li><li>Enter PIN to confirm</li></ol>",
        isActive: true
      }
    ],
    supportWhatsapp: "https://wa.me/8801XXXXXXXXX",
    supportFacebook: "https://m.me/dccc"
  }
};

// Provides a shell of the data structure with empty values.
// This is used as a fallback when Firestore is empty to prevent crashes.
export const emptyData: DCCCData = {
  themeColors: initialData.themeColors, // Theme should always have a default
  hero: { hero_title: "", hero_subtitle: "", background_type: "image", background_url: "", cta_primary_text: "", cta_primary_link: "", cta_secondary_text: "", cta_secondary_link: "" },
  about: { about_short: "", preview_image_url: "", preview_title: "", founded_year: 0, vision_tagline: "", sections: [], total_members: 0, total_departments: 0, prizes_won: 0 },
  departments: [],
  events: [],
  moderators: [],
  executives: [],
  footer: { footer_about: "", socials: {}, contact_email: "", contact_phone: "", address: "", copyright_text: "" },
  join: { description: "", regFee: "100 BDT", paymentMethods: [], supportWhatsapp: "", supportFacebook: "" },
};