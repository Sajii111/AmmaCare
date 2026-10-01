// Sample answers used when DEMO_MODE=true in .env.
// They let you see how every result looks without a working Gemini key.
// The website shows a "Sample result" banner on these.

const SAMPLES = {
  check: {
    food: 'Pol sambol',
    description: 'Fresh coconut, chilli, onion and lime',
    verdict: 'healthy',
    score: 7,
    highlights: [
      { name: 'Dietary fibre', dvPercent: 18 },
      { name: 'Healthy fats', dvPercent: 22 },
      { name: 'Vitamin C', dvPercent: 15 }
    ],
    summary: 'Pol sambol gives good energy and fibre. It suits pregnant mothers when made fresh, but eat it in moderation to avoid heartburn.',
    cautions: [
      'High chilli content can trigger heartburn',
      'Make it fresh to avoid bacterial contamination',
      'Watch the salt and Maldive fish content'
    ],
    betterChoices: ['Gotukola sambol', 'Less-chilli pol sambol with extra lime', 'Carrot sambol'],
    stageTip: 'In the second trimester, pair it with dhal or fish so your meal also gives iron and protein.',
    portion: '2 to 3 tablespoons with a meal'
  },

  nutrition: {
    food: 'Kiribath',
    description: 'Milk rice made with coconut milk',
    portionGrams: 100,
    nutrients: [
      { name: 'Energy', amount: 205, unit: 'kcal', perGram: 2.05, dailyNeedPercent: 9 },
      { name: 'Protein', amount: 3.5, unit: 'g', perGram: 0.035, dailyNeedPercent: 5 },
      { name: 'Carbohydrate', amount: 32, unit: 'g', perGram: 0.32, dailyNeedPercent: 9 },
      { name: 'Fat', amount: 7.2, unit: 'g', perGram: 0.072, dailyNeedPercent: 11 },
      { name: 'Fibre', amount: 0.6, unit: 'g', perGram: 0.006, dailyNeedPercent: 2 },
      { name: 'Iron', amount: 0.6, unit: 'mg', perGram: 0.006, dailyNeedPercent: 2 },
      { name: 'Calcium', amount: 20, unit: 'mg', perGram: 0.2, dailyNeedPercent: 2 },
      { name: 'Folate', amount: 6, unit: 'mcg', perGram: 0.06, dailyNeedPercent: 1 }
    ],
    outlook: [
      { label: 'Days 1-2', tone: 'positive', title: 'Steady, filling energy', text: 'Coconut milk gives easy energy and fats that keep you full through a busy morning.' },
      { label: 'Day 3', tone: 'negative', title: 'Missing iron and fibre', text: 'Kiribath is low in iron and fibre. Eating it every day without protein can cause quick blood sugar rises and mild constipation.' }
    ],
    pros: ['Easy to digest when you feel sick', 'Good source of quick energy', 'Coconut fats help you absorb vitamins A, D and E'],
    cons: ['Very low in iron, folate and fibre', 'White rice raises blood sugar quickly', 'Coconut milk adds saturated fat'],
    safeAmount: 'About 100 to 150 g (1 to 2 pieces) a day, with a protein side',
    tip: 'Pair your kiribath with a boiled egg, fish ambul thiyal or mung beans to add protein and iron.'
  },

  activities: {
    week: 20,
    trimester: 2,
    babyDevelopment: 'Your baby is about the length of a banana and can hear sounds from outside. Hair, nails and taste buds are forming.',
    bodyChanges: 'Your bump is clearly showing and you may feel the first flutters of movement. Backache and leg cramps can begin.',
    activities: [
      { name: 'Morning walk', duration: '20 to 30 minutes', benefit: 'Keeps blood sugar steady and helps sleep. Walk before 8 am to avoid the heat.' },
      { name: 'Prenatal yoga', duration: '15 minutes', benefit: 'Gentle stretches ease back pain and improve balance as your bump grows.' },
      { name: 'Pelvic floor exercises', duration: '3 sets of 10 a day', benefit: 'Strengthens the muscles that support your bladder and help in labour.' },
      { name: 'Deep breathing', duration: '5 minutes, twice a day', benefit: 'Calms the mind and prepares you for breathing in labour.' }
    ],
    avoid: ['Lying flat on your back for long periods', 'Lifting heavy buckets of water or gas cylinders', 'Exercising in the midday heat'],
    nutritionFocus: ['Sprats (haal masso) for calcium', 'Mukunuwenna with lime for iron', 'Curd or milk once a day'],
    selfCare: 'Sleep on your left side with a pillow between your knees and rest your feet up in the evening.',
    warningSigns: ['Vaginal bleeding or leaking fluid', 'Severe headache or blurred vision', 'Dizziness or chest pain during exercise', 'Regular painful tightenings'],
    clinicReminder: 'Around this time many mothers have their anomaly scan. Take your pregnancy record to every visit.'
  }
};

function demoAnswer(kind) {
  return JSON.parse(JSON.stringify(SAMPLES[kind] || SAMPLES.check));
}

module.exports = { demoAnswer };
