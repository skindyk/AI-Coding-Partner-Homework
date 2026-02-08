'use strict';

const { create: createDemon, RITUAL_TYPES } = require('./Demon');
const { SIN_CATEGORIES } = require('./Offering');

/**
 * Helper to check if a transaction hour is in range (respects AM/PM boundaries)
 */
function isHourInRange(timestamp, startHour, endHour) {
  const hour = new Date(timestamp).getHours();
  if (startHour <= endHour) {
    return hour >= startHour && hour < endHour;
  }
  // Wraps around midnight (e.g., 23:00 to 04:00)
  return hour >= startHour || hour < endHour;
}

const demons = [
  // 1. Vogue-Zul - VANITY + expensive
  createDemon({
    name: 'Vogue-Zul',
    title: 'The Demon of Vanity',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.VANITY && offering.amount > 5000;
    },
    ritualType: RITUAL_TYPES.MANTRA,
    ritualConfig: {
      targetString: 'I am not my fabric',
      repetitions: 30
    },
    punishmentMessage: 'VOGUE-ZUL demands you face your vanity! Type the sacred mantra 30 times!'
  }),

  // 2. Gluttonous Rex - GLUTTONY at late night
  createDemon({
    name: 'Gluttonous Rex',
    title: 'The Demon of Gluttony',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.GLUTTONY && isHourInRange(offering.timestamp, 1, 4);
    },
    ritualType: RITUAL_TYPES.MATH,
    ritualConfig: {
      difficulty: 2,
      problemCount: 3
    },
    punishmentMessage: 'GLUTTONOUS REX grinds his teeth! Solve these arithmetic problems to satiate him!'
  }),

  // 3. Uber-Lich - SLOTH cheap
  createDemon({
    name: 'Uber-Lich',
    title: 'The Demon of Sloth',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.SLOTH && offering.amount < 1500;
    },
    ritualType: RITUAL_TYPES.WAIT,
    ritualConfig: {
      durationSeconds: 300
    },
    punishmentMessage: 'UBER-LICH has cursed you to wait! You must sit in silence for 5 minutes.'
  }),

  // 4. Latte-Lucifer - GLUTTONY coffee expensive
  createDemon({
    name: 'Latte-Lucifer',
    title: 'The Demon of Caffeine Addiction',
    triggerFn: (offering, history) => {
      const isCoffee = offering.description.toLowerCase().includes('coffee');
      return isCoffee && offering.amount > 600;
    },
    ritualType: RITUAL_TYPES.MANTRA,
    ritualConfig: {
      targetString: 'It is just bean water',
      repetitions: 10
    },
    punishmentMessage: 'LATTE-LUCIFER hisses! Recite the truth about your bean water addiction!'
  }),

  // 5. Sub-Succubus - LUST 5th transaction
  createDemon({
    name: 'Sub-Succubus',
    title: 'The Demon of Lust',
    triggerFn: (offering, history) => {
      const lustCount = history.filter(o => o.category === SIN_CATEGORIES.LUST).length;
      return offering.category === SIN_CATEGORIES.LUST && lustCount >= 4;
    },
    ritualType: RITUAL_TYPES.WAIT,
    ritualConfig: {
      durationSeconds: 60
    },
    punishmentMessage: 'SUB-SUCCUBUS emerges! Meditate for 60 seconds before you may proceed.'
  }),

  // 6. Amazonian Imp - GREED late night
  createDemon({
    name: 'Amazonian Imp',
    title: 'The Demon of Nocturnal Greed',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.GREED && isHourInRange(offering.timestamp, 23, 24);
    },
    ritualType: RITUAL_TYPES.MATH,
    ritualConfig: {
      difficulty: 3,
      problemCount: 1
    },
    punishmentMessage: 'The AMAZONIAN IMP cackles in the darkness! Solve this fiendish puzzle!'
  }),

  // 7. Stream-O-Phobia - LUST expensive
  createDemon({
    name: 'Stream-O-Phobia',
    title: 'The Demon of Streaming Services',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.LUST && offering.amount > 1500;
    },
    ritualType: RITUAL_TYPES.SHAME,
    ritualConfig: {
      message: 'Name a book you have not read'
    },
    punishmentMessage: 'STREAM-O-PHOBIA demands you name a book you swore to read but never did!'
  }),

  // 8. Hoard-Wraith - Very expensive transaction
  createDemon({
    name: 'Hoard-Wraith',
    title: 'The Demon of Excess',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.GLUTTONY && offering.amount > 20000;
    },
    ritualType: RITUAL_TYPES.MANTRA,
    ritualConfig: {
      targetString: 'List every item',
      repetitions: 1
    },
    punishmentMessage: 'HOARD-WRAITH materialises! You must list every item you purchased!'
  }),

  // 9. Penny-Poltergeist - Amount ends in .99
  createDemon({
    name: 'Penny-Poltergeist',
    title: 'The Demon of Psychological Pricing',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.GREED && offering.amount % 100 === 99;
    },
    ritualType: RITUAL_TYPES.MATH,
    ritualConfig: {
      difficulty: 1,
      problemCount: 5
    },
    punishmentMessage: 'PENNY-POLTERGEIST clangs its coins! Five simple calculations await!'
  }),

  // 10. Debt-Diablo - Interest-related
  createDemon({
    name: 'Debt-Diablo',
    title: 'The Demon of Interest Payments',
    triggerFn: (offering, history) => {
      return offering.category === SIN_CATEGORIES.WRATH && offering.description.toLowerCase().includes('interest');
    },
    ritualType: RITUAL_TYPES.MANTRA,
    ritualConfig: {
      targetString: 'I am a slave to APR',
      repetitions: 50
    },
    punishmentMessage: 'DEBT-DIABLO rises from the abyss! Face your financial servitude!'
  })
];

module.exports = demons;
