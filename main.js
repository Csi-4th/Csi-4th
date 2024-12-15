import gsap from 'https://cdn.skypack.dev/gsap';
import ScrollTrigger from 'https://cdn.skypack.dev/gsap/ScrollTrigger';

const {
  to,
  set,
  registerPlugin,
  utils: { snap, toArray },
} = gsap;

registerPlugin(ScrollTrigger);

// المصفوفة التي تحتوي على بيانات الصور والعناوين
const cardsData = [
  { title: 'Card 1', image: 'https://via.placeholder.com/300x400/FF0000/FFFFFF' },
  { title: 'Card 2', image: 'https://via.placeholder.com/300x400/00FF00/FFFFFF' },
  { title: 'Card 3', image: 'https://via.placeholder.com/300x400/0000FF/FFFFFF' },
  { title: 'Card 4', image: 'https://via.placeholder.com/300x400/FFFF00/FFFFFF' },
  { title: 'Card 5', image: 'https://via.placeholder.com/300x400/FF00FF/FFFFFF' },
];

// DOM References
const NEXT = document.querySelector('.gallery__next');
const PREV = document.querySelector('.gallery__prev');
const GALLERY = document.querySelector('.gallery');

// إنشاء الكروت من المصفوفة
const createCards = (data) => {
  const galleryContent = document.createElement('div');
  galleryContent.classList.add('gallery__content');
  data.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card');
    cardEl.innerHTML = `
      <div class="card__image">
        <img src="${card.image}" alt="${card.title}" />
      </div>
      <h3 class="card__title">${card.title}</h3>
    `;
    galleryContent.appendChild(cardEl);
  });
  GALLERY.appendChild(galleryContent);
};

// استدعاء الدالة لإضافة الكروت
createCards(cardsData);

// تأثير الصوت
const AUDIO = {
  WHOOSH: new Audio('https://assets.codepen.io/605876/whoosh-two.'),
};

AUDIO.WHOOSH.volume = 0.5;

const playWhoosh = () => {
  AUDIO.WHOOSH.currentTime = 0;
  AUDIO.WHOOSH.play();
};

// بناء التكرار الحلقي
const BUILD_LOOP = (CARDS, SPACING) => {
  const OVERLAP = Math.ceil(1 / SPACING);
  const START = CARDS.length * SPACING + 0.5;
  const LOOP_TIME = (CARDS.length + OVERLAP) * SPACING + 1;
  const RAW = gsap.timeline({ paused: true });
  const LOOP = gsap.timeline({
    paused: true,
    repeat: -1,
    onRepeat() {
      this._time === this._dur && (this._tTime += this._dur - 0.01);
    },
  });

  const L = CARDS.length + OVERLAP * 2;
  let time = 0;

  gsap.set(CARDS, { xPercent: 5000, opacity: 0, scale: 0 });

  for (let i = 0; i < L; i++) {
    const index = i % CARDS.length;
    const item = CARDS[index];
    time = i * SPACING;

    RAW.fromTo(
      item,
      { opacity: 0 },
      {
        opacity: 1,
        delay: 0.25,
        duration: 0.25,
        yoyo: true,
        ease: 'none',
        repeat: 1,
        immediateRender: false,
      },
      time
    )
      .fromTo(
        item,
        { scale: 0 },
        {
          scale: 1,
          zIndex: 100,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: 'none',
          immediateRender: false,
          onStart: () => {
            playWhoosh();
          },
        },
        time
      )
      .fromTo(
        item,
        { xPercent: 250 },
        { xPercent: -250, duration: 1, ease: 'none', immediateRender: false },
        time
      );

    i <= CARDS.length && LOOP.add('label' + i, time);
  }

  RAW.time(START);
  LOOP.to(RAW, {
    time: LOOP_TIME,
    duration: LOOP_TIME - START,
    ease: 'none',
  }).fromTo(
    RAW,
    { time: OVERLAP * SPACING + 1 },
    {
      time: START,
      duration: START - (OVERLAP * SPACING + 1),
      immediateRender: false,
      ease: 'none',
    }
  );

  return LOOP;
};

let iteration = 0;
const SPACING = 0.2;
const CARD_SNAP = snap(SPACING);
const CARDS = toArray('.card');
const LOOP = BUILD_LOOP(CARDS, SPACING);

// Scrub the playhead loop
const SCRUB = to(LOOP, {
  totalTime: 0,
  duration: 0.5,
  ease: 'power3',
  paused: true,
});

let TRIGGER;

const wrapForward = () => {
  iteration++;
  TRIGGER.wrapping = true;
  TRIGGER.scroll(TRIGGER.start + 1);
};

const wrapBackward = () => {
  iteration--;
  if (iteration < 0) {
    iteration = 9;
    LOOP.totalTime(LOOP.totalTime() + LOOP.duration() * 10);
  }
  TRIGGER.wrapping = true;
  TRIGGER.scroll(TRIGGER.end - 1);
};

TRIGGER = ScrollTrigger.create({
  start: 0,
  end: '+=3000',
  horizontal: false,
  pin: '.gallery',
  onUpdate: (self) => {
    if (self.progress === 1 && self.direction > 0 && !self.wrapping) {
      wrapForward(self);
    } else if (self.progress < 1e-5 && self.direction < 0 && !self.wrapping) {
      wrapBackward(self);
    } else {
      SCRUB.vars.totalTime = CARD_SNAP(
        (iteration + self.progress) * LOOP.duration()
      );
      SCRUB.invalidate().restart();
      self.wrapping = false;
    }
  },
});

NEXT.addEventListener('click', () => {
  SCRUB_TO(SCRUB.vars.totalTime + SPACING);
});
PREV.addEventListener('click', () => {
  SCRUB_TO(SCRUB.vars.totalTime - SPACING);
});
