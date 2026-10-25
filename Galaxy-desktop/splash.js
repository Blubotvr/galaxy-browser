// Galaxy splash messages: 1,000+ funny lines, built from hand-written parts.
(function (g) {
  const S = [
    'A confused astronaut', 'Your cat', 'The Moon', 'Pluto', 'A rogue satellite', 'An alien intern',
    'Mars', 'A sentient black hole', 'Captain Whiskers', 'The Milky Way', 'A space hamster',
    'A very polite comet', 'Your future self', 'A grumpy asteroid', 'The Sun', 'A tiny robot',
    'A time-traveling toaster', 'The International Space Potato', 'A lost satellite', 'Saturn',
    'An overconfident rocket', 'A retired meteor', 'A shy nebula', 'The Galactic Council',
    'A moon-dwelling goat', 'An unpaid space wizard', 'A sleepy supernova', 'A space raccoon',
    'Jupiter', 'A suspiciously calm alien', 'A cosmic hot dog', 'Uncle Zorp', 'A haunted space station',
    'An interstellar tourist', 'The Big Bang', 'A moody wormhole', 'A pigeon in a spacesuit',
    'A gravity-defying llama', 'The ghost of a comet', 'Your Wi-Fi router',
  ];
  const V = [
    'is googling', 'just discovered', 'accidentally ordered', 'refuses to explain', 'is arguing with',
    'wrote a strongly worded letter to', 'is secretly in love with', 'borrowed and never returned',
    'is asking everyone about', 'is training for a fight with', 'filed a complaint about',
    'got lost looking for', "won't stop talking about", 'is trying to sell you', 'has strong opinions about',
    'is hiding from', 'just invented', 'is knitting a sweater for', 'is taking a selfie with',
    'left a one-star review of', 'is writing a novel about', 'is afraid of', 'stole', 'is doing yoga with',
    'is baking', 'is teaching a class on', 'is building a shrine to', 'wants to speak to the manager of',
    'is racing', 'is adopting', 'is moonlighting as', 'challenged', 'is whispering sweet nothings to',
    'is pretending not to know about', 'is writing a theme song for',
  ];
  const O = [
    'the meaning of Wi-Fi', 'a lost sock from 1987', 'free pizza', 'your browser history',
    'the last slice of pizza', 'a left-handed screwdriver', 'an extremely small hat',
    'the secret to a perfect grilled cheese', 'a dramatically overpriced coffee', 'the concept of Mondays',
    'a haunted spreadsheet', 'your Wi-Fi password', 'a banana with trust issues', 'the great sandwich debate',
    'a suspiciously large rubber duck', 'the last cookie', 'an unreasonably fast snail',
    'a pocket-sized black hole', 'a mysterious glowing taco', "the world's saddest violin",
    'a cloud shaped like a sock', 'the nearest all-you-can-eat buffet', 'an invisible bicycle',
    'the dog that ate the homework', 'a very serious pillow', "somebody's missing umbrella", 'the number 42',
    'a polite bag of chips', 'a moon made of cheese', 'a tax form written in emoji', 'a self-folding laundry pile',
    'the world record for longest nap', 'a cosmic game of rock-paper-scissors', 'a sentient houseplant',
    'the last working pen',
  ];
  const BV = [
    'Bribing', 'Untangling', 'Feeding', 'Calibrating', 'Waking up', 'Charging', 'Negotiating with',
    'Warming up', 'Inflating', 'Tickling', 'Politely asking', 'Counting', 'Reasoning with', 'Convincing',
    'Cleaning', 'Rebooting', 'Alphabetizing', 'Teaching', 'Consulting', 'Applauding',
  ];
  const BO = [
    'the search hamsters', 'the cosmic spaghetti', "the Moon's customer service", 'the space llamas',
    'the internet gnomes', 'the star-sorting robots', 'the quantum cheese', 'the wormhole plumbers',
    'the sleepy satellites', 'the asteroid accountants', 'the galactic librarians', 'the rocket squirrels',
    'the nebula baristas', 'the comet couriers', 'the dark matter', 'the laser kittens', 'the alien interns',
    'the tiny astronauts', 'the lost socks of the universe', 'the orbiting pizzas', 'the cosmic hamster wheel',
    'the gravity gremlins', 'the moon cows', 'the pocket planets', 'the star-spangled sandwiches',
  ];
  const FIXED = [
    'Search the universe. Snacks not included.', 'Houston, we have a question.',
    'Ask the stars. They are very bad at spelling.', "I'm not lost, I'm just exploring the cosmos.",
    "In space, nobody can hear you click 'I'm Feeling Lucky'.", 'Warning: may contain traces of stardust.',
    'One small search for you, one giant leap for your curiosity.', 'Type something. The aliens are watching.',
    'Seeking intelligent life. Starting with this search bar.', 'This bar runs on dark matter and good vibes.',
    'Mission control says: have you tried typing?', 'Gravity is just a suggestion in here.',
    'Searching faster than a caffeinated comet.', 'No planets were harmed in the making of this search.',
    'Beam me up a good recipe.', 'Warp speed ahead. Please keep your hands inside the browser.',
    "Don't panic. Bring a towel. Also, search something.", 'Ctrl+Alt+Defeat the void.',
    'The cake is a lie, but the search results are real.', 'Insert coin to continue exploring.',
    'Looking for aliens? Try the fridge first.', 'Spaceship status: mostly operational.',
    'Fun fact: this bar has never met a black hole it did not like.', 'Press Enter to leave the atmosphere.',
    'Powered by hamsters in tiny spacesuits.', 'Please do not feed the asteroids.',
    'Your search has been approved by Mission Control and one very smug cat.',
    'Currently orbiting your next great idea.', 'Plot twist: the universe is also just a search bar.',
    'Roses are red, space is a vacuum, type something already.',
  ];

  const total = S.length * V.length * O.length + BV.length * BO.length + FIXED.length;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  let last = '';

  function make() {
    const r = Math.random();
    if (r < 0.06) return pick(FIXED);
    if (r < 0.25) return pick(BV) + ' ' + pick(BO) + '...';
    return pick(S) + ' ' + pick(V) + ' ' + pick(O) + '.';
  }
  function next() {
    let m = make();
    for (let i = 0; i < 5 && m === last; i++) m = make();
    last = m;
    return m;
  }
  g.GalaxySplash = { next, total };
})(window);
