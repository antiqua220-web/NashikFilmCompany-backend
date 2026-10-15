import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Project } from './models/Project.js';
import { ShootSchedule } from './models/ShootSchedule.js';
import { Task } from './models/Task.js';
import { Activity } from './models/Activity.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // Clear existing data cleanly to establish fresh production state
    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await ShootSchedule.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});

    console.log('[Seed] Creating Nashik Film Company users...');

    // 1. Create Boss
    const boss = await User.create({
      name: 'Vikramaditya Shinde',
      email: 'boss@nashikfilm.com',
      password: 'Password123!',
      role: 'boss',
      department: 'Executive & Direction',
      designation: 'Managing Director & Executive Producer',
      phone: '+91 98230 45678',
      bio: 'Leading Nashik Film Company with 15+ years producing acclaimed Marathi and Hindi cinema, documentaries, and boutique commercials.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      status: 'available',
    });

    // 2. Create Crew Members (Employees)
    const empArjun = await User.create({
      name: 'Arjun Rathi',
      email: 'arjun.dop@nashikfilm.com',
      password: 'Password123!',
      role: 'employee',
      department: 'Cinematography & Camera',
      designation: 'Director of Photography (DoP)',
      phone: '+91 98221 11223',
      bio: 'Arri Certified Cinematographer specializing in anamorphic lenses and dynamic natural lighting.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      status: 'on-set',
      emergencyContact: 'Kavita Rathi (+91 98221 99887)',
    });

    const empPriya = await User.create({
      name: 'Priya Deshmukh',
      email: 'priya.sound@nashikfilm.com',
      password: 'Password123!',
      role: 'employee',
      department: 'Sound & Audio',
      designation: 'Lead Sound Recordist & Mixer',
      phone: '+91 98222 33445',
      bio: 'National Award-nominated sound designer with extensive location multi-track recording expertise.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      status: 'available',
      emergencyContact: 'Sunil Deshmukh (+91 98222 11009)',
    });

    const empRohit = await User.create({
      name: 'Rohit Verma',
      email: 'rohit.art@nashikfilm.com',
      password: 'Password123!',
      role: 'employee',
      department: 'Art & Production Design',
      designation: 'Head Production Designer',
      phone: '+91 98223 55667',
      bio: 'Architect turned film designer with 8 years crafting authentic historical and rustic Maharashtra film sets.',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      status: 'available',
      emergencyContact: 'Meena Verma (+91 98223 88776)',
    });

    const empNeha = await User.create({
      name: 'Neha Kulkarni',
      email: 'neha.edit@nashikfilm.com',
      password: 'Password123!',
      role: 'employee',
      department: 'Editing & Post-Production',
      designation: 'Lead Colorist & Offline Editor',
      phone: '+91 98224 77889',
      bio: 'DaVinci Resolve certified colorist with a penchant for high-contrast cinematic film grain aesthetics.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      status: 'available',
      emergencyContact: 'Ramesh Kulkarni (+91 98224 44332)',
    });

    const empKabir = await User.create({
      name: 'Kabir Patil',
      email: 'kabir.ad@nashikfilm.com',
      password: 'Password123!',
      role: 'employee',
      department: 'Production & Logistics',
      designation: '1st Assistant Director (1st AD)',
      phone: '+91 98225 99001',
      bio: 'Set operations maestro ensuring call sheets, talent transit, and shot schedules run with clockwork precision.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      status: 'on-set',
      emergencyContact: 'Sheetal Patil (+91 98225 66554)',
    });

    console.log('[Seed] Users created successfully.');

    // 3. Create Projects
    console.log('[Seed] Creating Projects...');

    const prjGodavari = await Project.create({
      title: 'Godavari: Whispers of the River',
      code: 'NFC-2026-GDV',
      type: 'Feature Film',
      synopsis: 'An evocative drama set against the backdrop of the Godavari river and the ancient ghats of Nashik, tracking an estranged family reuniting for a momentous ritual.',
      clientOrStudio: 'Nashik Film Company Originals',
      status: 'production',
      budget: 45000000, // 4.5 Cr
      spent: 21500000,
      currency: 'INR',
      primaryLocation: 'Nashik Ghats, Gangapur Dam & Trimbak',
      startDate: new Date('2026-09-01'),
      targetWrapDate: new Date('2026-11-20'),
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      assignedCrew: [
        { user: empArjun._id, roleTitle: 'Director of Photography' },
        { user: empPriya._id, roleTitle: 'Sound Recordist' },
        { user: empRohit._id, roleTitle: 'Production Designer' },
        { user: empKabir._id, roleTitle: '1st Assistant Director' },
        { user: empNeha._id, roleTitle: 'DIT / Offline Editor' },
      ],
      createdBy: boss._id,
      tags: ['Feature', 'Drama', 'Flagship', '4K Anamorphic'],
    });

    const prjMonsoon = await Project.create({
      title: 'Monsoon in Nashik (Music Video)',
      code: 'NFC-2026-MNS',
      type: 'Music Video',
      synopsis: 'A high-energy romantic pop single shot entirely across mist-covered Sula vineyards and rain-slicked scenic highway passes.',
      clientOrStudio: 'Zee Music / NFC Records',
      status: 'pre-production',
      budget: 3500000, // 35 Lakhs
      spent: 850000,
      currency: 'INR',
      primaryLocation: 'Sula Vineyards & York Winery Estate',
      startDate: new Date('2026-10-25'),
      targetWrapDate: new Date('2026-11-05'),
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      assignedCrew: [
        { user: empArjun._id, roleTitle: 'Director of Photography' },
        { user: empRohit._id, roleTitle: 'Set Stylist' },
        { user: empKabir._id, roleTitle: 'Floor AD' },
      ],
      createdBy: boss._id,
      tags: ['Music Video', 'Rain Rig', 'Commercial'],
    });

    const prjHeritage = await Project.create({
      title: 'Vines & Heritage: The Nashik Chronicles',
      code: 'NFC-2026-VHR',
      type: 'Documentary',
      synopsis: 'A 4-part docuseries exploring the 2,000-year evolution of Nashik from ancient pilgrimage sanctuary to the premier wine capital of India.',
      clientOrStudio: 'National Geographic / Hotstar',
      status: 'post-production',
      budget: 7500000,
      spent: 6900000,
      currency: 'INR',
      primaryLocation: 'Pandavleni Caves & Dindori Valley',
      startDate: new Date('2026-06-15'),
      targetWrapDate: new Date('2026-10-30'),
      coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      assignedCrew: [
        { user: empNeha._id, roleTitle: 'Lead Colorist & Conformist' },
        { user: empPriya._id, roleTitle: 'Sound Post Supervisor' },
      ],
      createdBy: boss._id,
      tags: ['Docuseries', '4K HDR', 'Streaming'],
    });

    const prjCommercial = await Project.create({
      title: 'Nashik Valley Gold: Autumn Vintage',
      code: 'NFC-2026-NVG',
      type: 'Commercial',
      synopsis: 'Luxury TV commercial showcasing harvest celebrations, oak aging barrels, and premium reserve bottles.',
      clientOrStudio: 'Vallonné Vineyards & Hospitality',
      status: 'wrapped',
      budget: 2400000,
      spent: 2320000,
      currency: 'INR',
      primaryLocation: 'Igatpuri Hills & Sanjegaon Winery',
      startDate: new Date('2026-08-01'),
      targetWrapDate: new Date('2026-09-15'),
      coverImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
      assignedCrew: [
        { user: empArjun._id, roleTitle: 'Cinematographer' },
        { user: empNeha._id, roleTitle: 'Editor' },
      ],
      createdBy: boss._id,
      tags: ['Commercial', 'Wine', 'Slow Motion Phantom'],
    });

    console.log('[Seed] Projects created successfully.');

    // 4. Create Shoot Schedules / Call Sheets
    console.log('[Seed] Creating Shoot Schedules & Call Sheets...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(0, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    nextWeek.setHours(0, 0, 0, 0);

    const scheduleDay12 = await ShootSchedule.create({
      project: prjGodavari._id,
      dayNumber: 12,
      title: 'Sunrise River Crossing & Boat Confrontation',
      date: tomorrow,
      callTime: '05:00 AM',
      firstShotTime: '06:15 AM',
      estimatedWrapTime: '05:30 PM',
      locationName: 'Gangapur Dam Backwaters - Point 3',
      locationAddress: 'Gangapur Village Road, near MTDC Boating Club, Nashik 422222',
      googleMapsUrl: 'https://maps.google.com/?q=Gangapur+Dam+Nashik',
      scenes: [
        {
          sceneNumber: 'Sc 24',
          heading: 'EXT. RIVER BANK - DAWN',
          dayNight: 'DAWN',
          description: 'Dev and Ananya arrive at the wooden ferry landing in dense fog.',
          cast: 'Dev (Lead), Ananya (Lead), 8 BG Fisherfolk',
          pages: '2 3/8',
        },
        {
          sceneNumber: 'Sc 25',
          heading: 'EXT. WOODEN BOAT - DAY',
          dayNight: 'DAY',
          description: 'Heated argument mid-river. Camera on stabilized gimbal rig from safety chase boat.',
          cast: 'Dev, Ananya',
          pages: '3 1/8',
        },
        {
          sceneNumber: 'Sc 26A',
          heading: 'EXT. OLD GHAT JETTY - SUNSET',
          dayNight: 'DUSK',
          description: 'Golden hour drone establishing shots and docking sequence.',
          cast: 'Dev',
          pages: '1/2',
        },
      ],
      weatherNotes: 'Early morning fog clearance at 6:40 AM. Winds 8 km/h. Sunset at 6:18 PM. Golden hour from 5:35 PM to 6:12 PM.',
      cateringNotes: 'Hot tea, coffee & breakfast at 5:00 AM Call. Packed hot lunches at 1:15 PM on pontoon barge.',
      hospitalNearest: 'Apollo Hospital, Gangapur Road, Nashik (+91 253 2345678). First aid kit on standby in Line Producer van.',
      requiredCrew: [
        { user: empArjun._id, specialCallTime: '04:45 AM', instructions: 'Prep underwater housing & splash bags for Alexa Mini LF' },
        { user: empPriya._id, specialCallTime: '05:00 AM', instructions: 'Wireless water-resistant lavaliers on Dev and Ananya + hydrophone mic' },
        { user: empKabir._id, specialCallTime: '04:30 AM', instructions: 'Safety briefing for boat operators and life-jacket sign-off' },
        { user: empRohit._id, specialCallTime: '05:00 AM', instructions: 'Verify weathered fisherman nets and vintage wooden oar props' },
      ],
      directorNotes: 'Maintain intimate framing. Do not overpower the scene with drone coverage until scene 26A.',
      status: 'scheduled',
      createdBy: boss._id,
    });

    const scheduleDay13 = await ShootSchedule.create({
      project: prjGodavari._id,
      dayNumber: 13,
      title: 'Night Torchlit Festival at Trimbak Foothills',
      date: dayAfter,
      callTime: '04:30 PM',
      firstShotTime: '06:00 PM',
      estimatedWrapTime: '03:30 AM',
      locationName: 'Trimbakeshwar Heritage Forest Clearing',
      locationAddress: 'Brahmagiri Hill Base, Trimbakeshwar, Nashik District 422212',
      googleMapsUrl: 'https://maps.google.com/?q=Trimbakeshwar+Nashik',
      scenes: [
        {
          sceneNumber: 'Sc 31',
          heading: 'EXT. FOREST CLEARING - NIGHT',
          dayNight: 'NIGHT',
          description: 'Traditional drum ritual with 40 torches and folk musicians.',
          cast: 'Dev, Grandfather, 30 Dhol Tasha Performers',
          pages: '4',
        },
      ],
      weatherNotes: 'Night temperature dropping to 14°C. Wind calm. Fog possible after midnight.',
      cateringNotes: 'Dinner buffet at 9:30 PM. Midnight coffee and warm soup rotation every hour.',
      hospitalNearest: 'Trimbak Rural Civil Hospital (+91 2594 233222)',
      requiredCrew: [
        { user: empArjun._id, specialCallTime: '04:00 PM', instructions: 'Rig low-light Cooke anamorphic primes and smoke haze machines' },
        { user: empPriya._id, specialCallTime: '04:30 PM', instructions: 'Multi-mic setup for live acoustic dhol drums' },
        { user: empKabir._id, specialCallTime: '04:00 PM', instructions: 'Coordinate fire marshal permits for open flames and torches' },
      ],
      directorNotes: 'Atmospheric and heavy shadows. Rely heavily on practical flame sources.',
      status: 'scheduled',
      createdBy: boss._id,
    });

    const scheduleMonsoonDay1 = await ShootSchedule.create({
      project: prjMonsoon._id,
      dayNumber: 1,
      title: 'Vineyard Rain Dance Sequence',
      date: nextWeek,
      callTime: '07:00 AM',
      firstShotTime: '08:30 AM',
      estimatedWrapTime: '06:00 PM',
      locationName: 'Sula Vineyards - Greek Amphitheatre',
      locationAddress: 'Gat 36/2, Govardhan Village, Off Gangapur-Savargaon Road, Nashik 422222',
      scenes: [
        {
          sceneNumber: 'Chorus 1',
          heading: 'EXT. AMPHITHEATRE - DAY (RAIN)',
          dayNight: 'DAY',
          description: 'Lead duo dance routine with 20 background dancers under rain curtain.',
          cast: 'Rohan & Tara (Singers/Dancers)',
          pages: 'Music Track 01',
        },
      ],
      weatherNotes: 'Overcast skies. Rain cranes and water tankers booked on site.',
      cateringNotes: 'Continental breakfast buffet provided by Little Italy at Sula.',
      hospitalNearest: 'Suyash Hospital, Mumbai Naka, Nashik',
      requiredCrew: [
        { user: empArjun._id, specialCallTime: '06:30 AM', instructions: 'Phantom Flex4K 1000fps camera prep for slow-mo water drops' },
        { user: empKabir._id, specialCallTime: '06:15 AM', instructions: 'Choreography rehearsals and safety mats on stone floor' },
      ],
      directorNotes: 'High energy, vibrant color saturation, dramatic water splash highlights.',
      status: 'scheduled',
      createdBy: boss._id,
    });

    console.log('[Seed] Shoot Schedules created successfully.');

    // 5. Create Tasks
    console.log('[Seed] Creating Tasks with role assignments...');

    const task1 = await Task.create({
      project: prjGodavari._id,
      title: 'Calibrate Alexa Mini LF & Water Housing for River Shoot',
      description: 'Check pressure seals, clean optical glass ports, and ensure wireless focus transmitter signal penetrates water splash shield.',
      category: 'Camera & Lenses',
      assignedTo: empArjun._id,
      assignedBy: boss._id,
      priority: 'urgent',
      status: 'in_progress',
      dueDate: tomorrow,
      scheduleDay: scheduleDay12._id,
      checklist: [
        { text: 'Check O-rings and apply silicone grease', isCompleted: true },
        { text: 'Pressure test housing tank without camera body', isCompleted: true },
        { text: 'Mount 35mm & 50mm Anamorphic lenses and test focus ring travel', isCompleted: false },
        { text: 'Check spare high-capacity V-mount batteries', isCompleted: false },
      ],
      completionNotes: 'Housing pressure test passed. Testing focus motor calibration this afternoon.',
      statusHistory: [
        { status: 'todo', changedBy: boss._id, changedAt: new Date(Date.now() - 48 * 3600 * 1000), note: 'Task created' },
        { status: 'in_progress', changedBy: empArjun._id, changedAt: new Date(Date.now() - 12 * 3600 * 1000), note: 'Started housing seal inspection' },
      ],
    });

    const task2 = await Task.create({
      project: prjGodavari._id,
      title: 'Setup Hydrophones & Multi-Track Lavs for Wooden Boat',
      description: 'Prepare waterproof transmitters with latex condoms/sleeves for actors Dev and Ananya in case of splash. Mount underwater mic to record natural water hull acoustics.',
      category: 'Sound & Recording',
      assignedTo: empPriya._id,
      assignedBy: boss._id,
      priority: 'high',
      status: 'todo',
      dueDate: tomorrow,
      scheduleDay: scheduleDay12._id,
      checklist: [
        { text: 'Waterproof 4x Sennheiser SK 6000 transmitters', isCompleted: false },
        { text: 'Prep DPA 4060 waterproof mic capsules', isCompleted: false },
        { text: 'Pack Aquarian H2a Hydrophone with 20m cable', isCompleted: true },
      ],
      statusHistory: [
        { status: 'todo', changedBy: boss._id, changedAt: new Date(Date.now() - 24 * 3600 * 1000), note: 'Assigned for Day 12 river sequence' },
      ],
    });

    const task3 = await Task.create({
      project: prjGodavari._id,
      title: 'Inspect & Age Vintage Boat Props & Oars',
      description: 'Deliver the 2 vintage wooden fishing boats to Gangapur pier. Ensure distressed paint matches 1980s look and check buoyancy certificates.',
      category: 'Art & Props',
      assignedTo: empRohit._id,
      assignedBy: boss._id,
      priority: 'high',
      status: 'completed',
      dueDate: new Date(Date.now() - 4 * 3600 * 1000),
      scheduleDay: scheduleDay12._id,
      checklist: [
        { text: 'Distress boat hull with aged teak stain', isCompleted: true },
        { text: 'Deliver boats to MTDC pier dock master', isCompleted: true },
        { text: 'Life vests hidden beneath false bench seats', isCompleted: true },
      ],
      completionNotes: 'Boats moored safely at MTDC Pier 2. Dockmaster signed clearance.',
      statusHistory: [
        { status: 'todo', changedBy: boss._id, changedAt: new Date(Date.now() - 72 * 3600 * 1000), note: 'Assigned' },
        { status: 'in_progress', changedBy: empRohit._id, changedAt: new Date(Date.now() - 36 * 3600 * 1000), note: 'Applying weathered textures' },
        { status: 'completed', changedBy: empRohit._id, changedAt: new Date(Date.now() - 4 * 3600 * 1000), note: 'Both boats inspected on water' },
      ],
    });

    const task4 = await Task.create({
      project: prjGodavari._id,
      title: 'Confirm Police & Irrigation Dept River Permits',
      description: 'Obtain stamped clearance for motorized camera pursuit boat on Gangapur backwaters and drone flight permit within 2km radius.',
      category: 'Location & Permits',
      assignedTo: empKabir._id,
      assignedBy: boss._id,
      priority: 'urgent',
      status: 'completed',
      dueDate: tomorrow,
      scheduleDay: scheduleDay12._id,
      checklist: [
        { text: 'District Magistrate NOC collected', isCompleted: true },
        { text: 'Irrigation department lake permit fees paid', isCompleted: true },
        { text: 'Local rescue divers and lifeguard team booked', isCompleted: true },
      ],
      completionNotes: 'All permits stamped and physically in production vehicle briefcase.',
      statusHistory: [
        { status: 'todo', changedBy: boss._id, changedAt: new Date(Date.now() - 96 * 3600 * 1000), note: 'Created' },
        { status: 'completed', changedBy: empKabir._id, changedAt: new Date(Date.now() - 8 * 3600 * 1000), note: 'Permits received from Collector Office' },
      ],
    });

    const task5 = await Task.create({
      project: prjHeritage._id,
      title: 'Color Grade Episode 2: "Caves to Vines"',
      description: 'Conform raw Red Monstro 8K footage to Aces CC color space. Warm film print emulation for 1920s heritage archival sections.',
      category: 'Post-Production & Editing',
      assignedTo: empNeha._id,
      assignedBy: boss._id,
      priority: 'medium',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      checklist: [
        { text: 'Shot matching across cave interiors and sunlit vines', isCompleted: true },
        { text: 'HDR10 pass and metadata mastering', isCompleted: false },
        { text: 'Export ProRes 4444 XQ master for QC check', isCompleted: false },
      ],
      completionNotes: 'Caves sequence graded. Working on the golden sunset vineyard transition.',
      statusHistory: [
        { status: 'todo', changedBy: boss._id, changedAt: new Date(Date.now() - 48 * 3600 * 1000), note: 'Assigned' },
        { status: 'in_progress', changedBy: empNeha._id, changedAt: new Date(Date.now() - 20 * 3600 * 1000), note: 'Started Episode 2 DaVinci project' },
      ],
    });

    const task6 = await Task.create({
      project: prjMonsoon._id,
      title: 'Book 30,000L Water Tankers & High-Pressure Rain Heads',
      description: 'Confirm water supply with Nashik Municipal tankers for Sula Amphitheatre shoot. Ensure water is clean and filtered to avoid eye irritation for talent.',
      category: 'Production & Travel',
      assignedTo: empKabir._id,
      assignedBy: boss._id,
      priority: 'high',
      status: 'review',
      dueDate: nextWeek,
      scheduleDay: scheduleMonsoonDay1._id,
      checklist: [
        { text: 'Contract with Godavari Water Supply Co for 3x 10,000L tankers', isCompleted: true },
        { text: 'Test 4x rain heads with special effects technician', isCompleted: true },
        { text: 'Arrange tarps for floor sound insulation', isCompleted: true },
      ],
      completionNotes: 'Water tankers booked for 6:00 AM delivery. Ready for boss signoff.',
      statusHistory: [
        { status: 'todo', changedBy: boss._id, changedAt: new Date(Date.now() - 72 * 3600 * 1000), note: 'Assigned' },
        { status: 'in_progress', changedBy: empKabir._id, changedAt: new Date(Date.now() - 36 * 3600 * 1000), note: 'Negotiated with vendor' },
        { status: 'review', changedBy: empKabir._id, changedAt: new Date(Date.now() - 2 * 3600 * 1000), note: 'Awaiting producer final review' },
      ],
    });

    const task7 = await Task.create({
      project: prjGodavari._id,
      title: 'Lighting Rig: Forest Night Clearings (Day 13)',
      description: 'Rig 2x 18K ARRI HMI balloons on 60ft cranes to simulate moonlight canopy over Trimbak forest.',
      category: 'Lighting & Electrical',
      assignedTo: empArjun._id,
      assignedBy: boss._id,
      priority: 'high',
      status: 'blocked',
      dueDate: dayAfter,
      scheduleDay: scheduleDay13._id,
      checklist: [
        { text: 'Procure 125 KVA silent diesel generator', isCompleted: true },
        { text: 'Test helium balloon flight stability in forest canopy', isCompleted: false },
      ],
      completionNotes: 'Blocked: Forest department crane access road requires clearing of fallen tree branch.',
      statusHistory: [
        { status: 'todo', changedBy: boss._id, changedAt: new Date(Date.now() - 36 * 3600 * 1000), note: 'Created' },
        { status: 'blocked', changedBy: empArjun._id, changedAt: new Date(Date.now() - 5 * 3600 * 1000), note: 'Road blocked by fallen branch near Brahmagiri base' },
      ],
    });

    console.log('[Seed] Tasks created successfully.');

    // 6. Create Live Activity Audit Logs
    console.log('[Seed] Generating live activity logs...');
    await Activity.create([
      {
        project: prjGodavari._id,
        user: boss._id,
        action: 'PROJECT_APPROVED',
        title: 'Production Phase Greenlit',
        details: 'Godavari feature film enters production with ₹4.5 Cr budget.',
      },
      {
        project: prjGodavari._id,
        user: boss._id,
        action: 'CALL_SHEET_PUBLISHED',
        title: 'Call Sheet #12 Published',
        details: 'Day 12: Sunrise River Crossing scheduled at Gangapur Dam Backwaters.',
      },
      {
        project: prjGodavari._id,
        user: empKabir._id,
        action: 'TASK_STATUS_CHANGED',
        title: 'Permits Verified & Stamped',
        details: 'District Magistrate NOC and water rescue diver contracts finalized.',
      },
      {
        project: prjHeritage._id,
        user: empNeha._id,
        action: 'TASK_STATUS_CHANGED',
        title: 'Color Grade Started',
        details: 'Episode 2 conforming in DaVinci Resolve.',
      },
      {
        project: prjGodavari._id,
        user: empArjun._id,
        action: 'TASK_STATUS_CHANGED',
        title: 'Camera Seal Tested',
        details: 'Alexa Mini LF underwater housing passed 5-meter depth test.',
      },
    ]);

    console.log('[Seed] ==========================================');
    console.log('[Seed] ✨ Database successfully seeded with real production data!');
    console.log('[Seed] 🏢 Studio: Nashik Film Company');
    console.log('[Seed] 👑 Boss Login:');
    console.log('[Seed]    Email: boss@nashikfilm.com');
    console.log('[Seed]    Password: Password123!');
    console.log('[Seed] 🎬 Employee Logins:');
    console.log('[Seed]    Arjun (DoP): arjun.dop@nashikfilm.com / Password123!');
    console.log('[Seed]    Priya (Sound): priya.sound@nashikfilm.com / Password123!');
    console.log('[Seed]    Rohit (Art): rohit.art@nashikfilm.com / Password123!');
    console.log('[Seed]    Neha (Editor): neha.edit@nashikfilm.com / Password123!');
    console.log('[Seed]    Kabir (1st AD): kabir.ad@nashikfilm.com / Password123!');
    console.log('[Seed] ==========================================');

    await mongoose.disconnect();
    console.log('[Seed] Disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
