import request from 'supertest';
import app from '../../src/app.js';
import { Activity } from '../../src/models/Activity.js';
import { Booking } from '../../src/models/Booking.js';
import { Operator } from '../../src/models/Operator.js';
import { Review } from '../../src/models/Review.js';
import { SupportMessage } from '../../src/models/SupportMessage.js';
import { User } from '../../src/models/User.js';

export const password = 'Password123';

let bookingSequence = 1;

export const futureDate = (days = 14) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export async function createUser(overrides = {}) {
  return User.create({
    email: overrides.role === 'admin' ? 'admin@example.com' : `user-${Date.now()}-${Math.random()}@example.com`,
    fullName: 'Test Traveler',
    password,
    phone: '9800000000',
    role: 'user',
    status: 'active',
    ...overrides,
  });
}

export async function loginUser(user, plainPassword = password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: plainPassword });

  return response.body.token;
}

export async function createOperator(overrides = {}) {
  return Operator.create({
    companyName: `Himalayan Test Operator ${Date.now()} ${Math.random()}`,
    insuranceAvailable: true,
    languages: ['English', 'Nepali'],
    licenseNumber: `NTA-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    location: 'Pokhara',
    responseRate: 96,
    safetyScore: 94,
    status: 'active',
    yearsExperience: 8,
    ...overrides,
  });
}

export async function createActivity({ operator, overrides = {} } = {}) {
  const selectedOperator = operator ?? (await createOperator());

  return Activity.create({
    bestSeason: ['October', 'November'],
    description: 'A guided adventure experience with verified safety checks and operator pricing.',
    difficulty: 'Moderate',
    district: 'Kaski',
    duration: '1 day',
    featured: true,
    gallery: [{ alt: 'Adventure in Nepal', url: '/uploads/activities/test.jpg' }],
    operatorPrices: [
      {
        currency: 'NPR',
        includedServices: ['Guide', 'Safety equipment'],
        operator: selectedOperator._id,
        packageName: 'Standard package',
        price: 9500,
      },
    ],
    province: 'Gandaki',
    riskLevel: 'Medium',
    safetyScore: 92,
    status: 'active',
    title: `Paragliding Test ${Date.now()} ${Math.random()}`,
    ...overrides,
  });
}

export async function createBooking({
  activity,
  bookingStatus = 'awaiting_payment',
  operator,
  paymentStatus = 'unpaid',
  totalPrice = 19000,
  user,
} = {}) {
  const selectedUser = user ?? (await createUser());
  const selectedOperator = operator ?? (await createOperator());
  const selectedActivity =
    activity ??
    (await createActivity({
      operator: selectedOperator,
    }));

  bookingSequence += 1;

  return Booking.create({
    activity: selectedActivity._id,
    bookingReference: `SAB-TEST-${Date.now()}-${bookingSequence}`,
    bookingStatus,
    date: futureDate(),
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '9811111111',
      relationship: 'Family',
    },
    extras: [],
    operator: selectedOperator._id,
    paymentStatus,
    totalPrice,
    travellers: {
      count: 2,
      email: selectedUser.email,
      leadName: selectedUser.fullName,
      phone: selectedUser.phone,
    },
    user: selectedUser._id,
  });
}

export async function createReview({ activity, operator, user, overrides = {} } = {}) {
  const review = await Review.create({
    activity: activity._id,
    comment: 'Excellent guide and clear safety briefing.',
    operator: operator._id,
    rating: 5,
    safetyRating: 5,
    status: 'published',
    user: user._id,
    ...overrides,
  });

  return review;
}

export async function createSupportMessage(overrides = {}) {
  return SupportMessage.create({
    category: 'booking',
    email: 'support-user@example.com',
    message: 'I need help understanding my booking request.',
    name: 'Support User',
    phone: '9800000000',
    status: 'open',
    subject: 'Booking help',
    ...overrides,
  });
}

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
