import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Activity } from '../models/Activity.js';
import { Booking } from '../models/Booking.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { Notification } from '../models/Notification.js';
import { Operator } from '../models/Operator.js';
import { Review } from '../models/Review.js';
import { SupportMessage } from '../models/SupportMessage.js';
import { User } from '../models/User.js';
import { Wishlist } from '../models/Wishlist.js';
import { recalculateActivityMetrics } from '../services/activityService.js';

const users = [
  {
    fullName: 'System Administrator',
    email: 'admin@smartadventure.com',
    password: 'Admin123',
    phone: '+977-9800000001',
    role: 'admin',
    nationality: 'Nepali',
    preferredLanguage: 'English',
  },
  {
    fullName: 'Ayush KC',
    email: 'user@smartadventure.com',
    password: 'User1234',
    phone: '+977-9800000002',
    role: 'user',
    nationality: 'Nepali',
    preferredLanguage: 'English',
    emergencyContact: {
      name: 'Family Contact',
      phone: '+977-9800000099',
      relationship: 'Family',
    },
  },
];

const operators = [
  {
    companyName: 'Pokhara Sky Adventures',
    licenseNumber: 'NTA-PKR-1001',
    location: 'Lakeside, Pokhara',
    safetyScore: 94,
    responseRate: 98,
    yearsExperience: 12,
    languages: ['English', 'Nepali', 'Hindi'],
    insuranceAvailable: true,
  },
  {
    companyName: 'Himalayan Jump Nepal',
    licenseNumber: 'NTA-SIN-2024',
    location: 'Bhotekoshi, Sindhupalchok',
    safetyScore: 91,
    responseRate: 95,
    yearsExperience: 10,
    languages: ['English', 'Nepali'],
    insuranceAvailable: true,
  },
  {
    companyName: 'Everest Trail Experts',
    licenseNumber: 'NTA-KTM-3007',
    location: 'Thamel, Kathmandu',
    safetyScore: 96,
    responseRate: 97,
    yearsExperience: 18,
    languages: ['English', 'Nepali', 'French'],
    insuranceAvailable: true,
  },
  {
    companyName: 'Trishuli River Crew',
    licenseNumber: 'NTA-CHI-4110',
    location: 'Charaudi, Dhading',
    safetyScore: 89,
    responseRate: 93,
    yearsExperience: 9,
    languages: ['English', 'Nepali'],
    insuranceAvailable: true,
  },
  {
    companyName: 'Annapurna Zipline Co.',
    licenseNumber: 'NTA-PKR-5190',
    location: 'Sarangkot, Pokhara',
    safetyScore: 92,
    responseRate: 96,
    yearsExperience: 8,
    languages: ['English', 'Nepali', 'Chinese'],
    insuranceAvailable: true,
  },
  {
    companyName: 'Jalberi Canyon Guides',
    licenseNumber: 'NTA-KAV-6220',
    location: 'Jalberi, Sindhupalchok',
    safetyScore: 88,
    responseRate: 91,
    yearsExperience: 7,
    languages: ['English', 'Nepali'],
    insuranceAvailable: true,
  },
  {
    companyName: 'Valley Bike Guides',
    licenseNumber: 'NTA-BIKE-031',
    location: 'Nagarkot, Bhaktapur',
    safetyScore: 92,
    responseRate: 94,
    yearsExperience: 9,
    languages: ['English', 'Nepali'],
    insuranceAvailable: true,
  },
  {
    companyName: 'Pokhara Heli Services',
    licenseNumber: 'CAAN-HEL-214',
    location: 'Pokhara Airport, Kaski',
    safetyScore: 98,
    responseRate: 96,
    yearsExperience: 14,
    languages: ['English', 'Nepali', 'Hindi'],
    insuranceAvailable: true,
  },
];

const gallery = {
  paragliding: '/images/paragliding.jpg',
  bungee: '/images/bungee.jpeg',
  trekking: '/images/everest-base-camp.jpeg',
  rafting: '/images/rafting.jpeg',
  zipline: '/images/zipline.jpg',
  canyoning: '/images/canyoning.jpeg',
  biking: '/images/biking.jpeg',
  heli: '/images/heli.jpeg',
};

const createActivities = (createdOperators) => {
  const byLicense = Object.fromEntries(createdOperators.map((operator) => [operator.licenseNumber, operator]));

  return [
    {
      title: 'Paragliding over Fewa Lake',
      description:
        'Fly above Pokhara with sweeping views of Fewa Lake, Sarangkot, and the Annapurna range with licensed tandem pilots.',
      province: 'Gandaki',
      district: 'Kaski',
      difficulty: 'Easy',
      duration: '30 minutes',
      safetyScore: 94,
      riskLevel: 'Medium',
      bestSeason: ['September-November', 'March-May'],
      featured: true,
      gallery: [{ url: gallery.paragliding, alt: 'Paragliding above Pokhara and Fewa Lake' }],
      operatorPrices: [
        {
          operator: byLicense['NTA-PKR-1001']._id,
          packageName: 'Standard tandem flight',
          price: 9500,
          currency: 'NPR',
          includedServices: ['Pilot briefing', 'Safety equipment', 'Transport from Lakeside'],
        },
      ],
    },
    {
      title: 'Bungee Jumping at Bhotekoshi',
      description:
        'Experience a high suspension bridge jump over the Bhotekoshi gorge with trained jump masters and inspected equipment.',
      province: 'Bagmati',
      district: 'Sindhupalchok',
      difficulty: 'Challenging',
      duration: '1 day',
      safetyScore: 91,
      riskLevel: 'High',
      bestSeason: ['October-December', 'February-May'],
      featured: true,
      gallery: [{ url: gallery.bungee, alt: 'Bungee bridge above Bhotekoshi river' }],
      operatorPrices: [
        {
          operator: byLicense['NTA-SIN-2024']._id,
          packageName: 'Bridge bungee package',
          price: 12500,
          currency: 'NPR',
          includedServices: ['Jump briefing', 'Harness', 'Certificate', 'Return transport'],
        },
      ],
    },
    {
      title: 'Everest Base Camp Trek',
      description:
        'Trek through the Khumbu region toward Everest Base Camp with acclimatization planning, local guides, and lodge support.',
      province: 'Koshi',
      district: 'Solukhumbu',
      difficulty: 'Extreme',
      duration: '14 days',
      safetyScore: 96,
      riskLevel: 'High',
      bestSeason: ['March-May', 'September-November'],
      featured: true,
      gallery: [{ url: gallery.trekking, alt: 'Everest region trekking route' }],
      operatorPrices: [
        {
          operator: byLicense['NTA-KTM-3007']._id,
          packageName: 'Guided lodge trek',
          price: 145000,
          currency: 'NPR',
          includedServices: ['Guide', 'Permits', 'Domestic flight assistance', 'Lodge coordination'],
        },
      ],
    },
    {
      title: 'Trishuli River Rafting',
      description:
        'Navigate class II-III rapids on the Trishuli River with experienced river guides and riverside lunch included.',
      province: 'Bagmati',
      district: 'Dhading',
      difficulty: 'Moderate',
      duration: '1 day',
      safetyScore: 89,
      riskLevel: 'Medium',
      bestSeason: ['September-November', 'March-June'],
      gallery: [{ url: gallery.rafting, alt: 'Rafting on a Nepal river' }],
      operatorPrices: [
        {
          operator: byLicense['NTA-CHI-4110']._id,
          packageName: 'Day rafting package',
          price: 4500,
          currency: 'NPR',
          includedServices: ['Helmet', 'Life jacket', 'Guide', 'Lunch'],
        },
      ],
    },
    {
      title: 'Sarangkot Zipline',
      description:
        'Ride one of Nepal’s most scenic ziplines from Sarangkot with mountain views, harness briefing, and operator transfer.',
      province: 'Gandaki',
      district: 'Kaski',
      difficulty: 'Easy',
      duration: '2 hours',
      safetyScore: 92,
      riskLevel: 'Low',
      bestSeason: ['Year-round'],
      gallery: [{ url: gallery.zipline, alt: 'Zipline experience in Pokhara' }],
      operatorPrices: [
        {
          operator: byLicense['NTA-PKR-5190']._id,
          packageName: 'Zipline ride',
          price: 7500,
          currency: 'NPR',
          includedServices: ['Harness', 'Helmet', 'Safety briefing', 'Pickup from Lakeside'],
        },
      ],
    },
    {
      title: 'Jalberi Canyoning',
      description:
        'Descend waterfalls and natural rock formations with certified canyoning guides, ropes, helmets, and wetsuits.',
      province: 'Bagmati',
      district: 'Sindhupalchok',
      difficulty: 'Challenging',
      duration: '1 day',
      safetyScore: 88,
      riskLevel: 'High',
      bestSeason: ['March-June', 'September-November'],
      gallery: [{ url: gallery.canyoning, alt: 'Canyoning waterfall descent in Nepal' }],
      operatorPrices: [
        {
          operator: byLicense['NTA-KAV-6220']._id,
          packageName: 'Full day canyoning',
          price: 9000,
          currency: 'NPR',
          includedServices: ['Guide', 'Wetsuit', 'Ropes', 'Helmet', 'Lunch'],
        },
      ],
    },
    {
      title: 'Nagarkot Mountain Biking',
      description:
        'Ride from Nagarkot through forest roads, terraced villages, and Kathmandu Valley viewpoints with guide support, bike checks, and trail briefing.',
      province: 'Bagmati',
      district: 'Bhaktapur',
      difficulty: 'Moderate',
      duration: '5-6 hours',
      safetyScore: 92,
      riskLevel: 'Medium',
      bestSeason: ['October-May'],
      gallery: [{ url: gallery.biking, alt: 'Mountain biking on a Himalayan trail' }],
      operatorPrices: [
        {
          operator: byLicense['NTA-BIKE-031']._id,
          packageName: 'Guided mountain biking route',
          price: 5900,
          currency: 'NPR',
          includedServices: ['Mountain bike', 'Helmet', 'Cycling guide', 'Repair kit'],
        },
      ],
    },
    {
      title: 'Mardi Himal Helicopter Tour',
      description:
        'Take a scenic helicopter flight from Pokhara toward Mardi Himal viewpoints with aviation safety checks, weather-based departure decisions, and mountain landing views where permitted.',
      province: 'Gandaki',
      district: 'Kaski',
      difficulty: 'Easy',
      duration: '1.5-2 hours',
      safetyScore: 98,
      riskLevel: 'Medium',
      bestSeason: ['October-April'],
      gallery: [{ url: gallery.heli, alt: 'Helicopter tour in the Annapurna region' }],
      operatorPrices: [
        {
          operator: byLicense['CAAN-HEL-214']._id,
          packageName: 'Mardi Himal scenic flight',
          price: 42000,
          currency: 'NPR',
          includedServices: ['Pilot briefing', 'Airport transfer', 'Weather check', 'Window seat rotation'],
        },
      ],
    },
  ];
};

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Operator.deleteMany({}),
    Activity.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Wishlist.deleteMany({}),
    SupportMessage.deleteMany({}),
    Notification.deleteMany({}),
    NewsletterSubscription.deleteMany({}),
  ]);

  const createdUsers = await User.create(users);
  const createdOperators = await Operator.create(operators);
  const createdActivities = await Activity.create(createActivities(createdOperators));

  const demoUser = createdUsers.find((user) => user.role === 'user');

  await Review.create(
    createdActivities.slice(0, 4).map((activity, index) => ({
      user: demoUser._id,
      activity: activity._id,
      operator: activity.operatorPrices[0].operator,
      rating: [5, 4, 5, 4][index],
      safetyRating: [5, 5, 4, 4][index],
      comment:
        'Clear pricing, professional communication, and a safety briefing that made the experience easy to trust.',
      status: 'published',
    })),
  );

  await Promise.all(createdActivities.map((activity) => recalculateActivityMetrics(activity._id)));

  console.log('Seed completed successfully.');
  console.log('Admin: admin@smartadventure.com / Admin123');
  console.log('User: user@smartadventure.com / User1234');

  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
