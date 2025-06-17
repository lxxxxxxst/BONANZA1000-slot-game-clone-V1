// === ДОБАВЛЕНО: массивы множителей и картинок бомб ===
const bombMultipliers = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100, 1000];
const bombImages = {
  2: 'img2/bomb1.png',
  3: 'img2/bomb1.png',
  4: 'img2/bomb1.png',
  5: 'img2/bomb2.png',
  6: 'img2/bomb2.png',
  8: 'img2/bomb2.png',
  10: 'img2/bomb3.png',
  12: 'img2/bomb3.png',
  15: 'img2/bomb3.png',
  20: 'img2/bomb4.png',
  25: 'img2/bomb4.png',
  50: 'img2/bomb4.png',
  100: 'img2/bomb4.png',
  1000: 'img2/bomb4.png',
};

const symbols = [
  'img/aple.png', 'img/banana.png', 'img/konFIL.png', 'img/konSIN.png',
  'img/konZEL.png', 'img/melon.png', 'img/vinog.png', 'img/persik.png', 'img/heart.png'
];
// const bomb = 'img/bomb.png'; // УДАЛЕНО

const ROWS = 5;
const COLS = 6;
let BET = 1000;

const game = document.getElementById('game');
const playBtn = document.getElementById('play');
const balanceEl = document.getElementById('balance');
const popup = document.getElementById('popup');
const balanceValueEl = document.querySelector('#balance .balance-value');
const winAmountEl = document.getElementById('win-amount');

let balance = 10000;
let isPlaying = false;

function initEmptyGrid() {
  game.innerHTML = '';
  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    game.appendChild(cell);
  }
}

function generateField() {
  const grid = new Array(ROWS * COLS).fill(null);
  const allSymbols = symbols.filter(s => true); // bomb уже не используется
  const chosen = allSymbols[Math.floor(Math.random() * allSymbols.length)];

  const indices = [];
  while (indices.length < 9) {
    const idx = Math.floor(Math.random() * grid.length);
    if (!indices.includes(idx)) indices.push(idx);
  }

  for (const idx of indices) {
    grid[idx] = chosen;
  }

  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) {
      let sym;
      do {
        sym = allSymbols[Math.floor(Math.random() * allSymbols.length)];
      } while (sym === chosen);
      grid[i] = sym;
    }
  }

  let bombIndex = -1;
  if (Math.random() < 0.4) {
    const free = grid.map((v, i) => i).filter(i => grid[i] !== chosen);
    bombIndex = free[Math.floor(Math.random() * free.length)];
    // grid[bombIndex] = bomb; // ЗАМЕНЕНО:
    const randomMultiplier = bombMultipliers[Math.floor(Math.random() * bombMultipliers.length)];
    grid[bombIndex] = {
      type: 'bomb',
      multiplier: randomMultiplier,
      img: bombImages[randomMultiplier]
    };
  }

  return { grid, bombIndex };
}

function extractSymbolName(path) {
  const filename = path.split('/').pop();
  return filename.replace('.png', '');
}

function countSymbols(grid) {
  const counts = {};
  for (const sym of grid) {
    // === Исправлено: поддержка объектов-бомб ===
    if (typeof sym === 'object' && sym.type === 'bomb') continue;
    if (typeof sym === 'string') {
      counts[sym] = (counts[sym] || 0) + 1;
    }
  }
  return counts;
}

function getWinIndices(grid, symbol) {
  // === Исправлено: поддержка объектов-бомб ===
  return grid.map((s, i) => (typeof s === 'string' && s === symbol ? i : -1)).filter(i => i !== -1);
}

function findWinningSymbol(counts) {
  for (const sym in counts) {
    if (counts[sym] >= 8) return sym;
  }
  return null;
}

function showWinPopup(amount) {
  popup.textContent = `+${amount}`;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 1500);
}

async function animateDropColumns(field) {
  const cells = game.querySelectorAll('.cell');
  const columns = [];

  for (let col = 0; col < COLS; col++) {
    columns[col] = [];
    for (let row = 0; row < ROWS; row++) {
      const idx = row * COLS + col;
      columns[col].push(cells[idx]);
    }
  }

  for (let col = 0; col < COLS; col++) {
    columns[col].forEach((cell, row) => {
      const item = field[row * COLS + col];
      let src = typeof item === 'string' ? item : item.img;
      const img = new Image();
      img.src = src;
      img.style.opacity = '1';
      img.style.width = '85%';
      img.style.height = '85%';
      img.style.transition = 'none';
      img.style.transform = 'translateY(-120vh)';
      cell.innerHTML = '';
      cell.appendChild(img);

      // --- АНИМАЦИЯ множителя бомбы ---
      if (typeof item !== 'string' && item.type === 'bomb') {
        const label = document.createElement('div');
        label.textContent = `x${item.multiplier}`;
        label.className = 'bomb-mult-label';
        // Центрируем по центру бомбы (точно по центру .cell)
        label.style.left = '50%';
        label.style.top = '50%';
        label.style.transform = 'translate(-50%, -50%) scale(0.5)';
        label.style.opacity = '0';
        cell.appendChild(label);

        setTimeout(() => {
          label.style.transition = 'opacity 0.18s, transform 0.38s cubic-bezier(.7,1.7,.5,1.1)';
          label.style.opacity = '1';
          label.style.transform = 'translate(-50%, -50%) scale(1.18)';
          setTimeout(() => {
            label.style.transform = 'translate(-50%, -50%) scale(1)';
          }, 180);
        }, 180 + row * 30);
      }

      setTimeout(() => {
        img.style.transition = '';
        img.classList.add('fruit-bounce-drop');
        img.style.transform = '';
        img.addEventListener('animationend', () => {
          img.classList.remove('fruit-bounce-drop');
        }, { once: true });
      }, 50 + row * 30);
    });

    await new Promise(r => setTimeout(r, 80));
  }

  await new Promise(r => setTimeout(r, 500));
}

async function animateFlyOutColumns() {
  const cells = game.querySelectorAll('.cell');
  const columns = [];

  for (let col = 0; col < COLS; col++) {
    columns[col] = [];
    for (let row = 0; row < ROWS; row++) {
      const idx = row * COLS + col;
      columns[col].push(cells[idx]);
    }
  }

  for (let col = 0; col < COLS; col++) {
    columns[col].forEach((cell, row) => {
      const img = cell.querySelector('img');
      if (!img) return;
      img.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
      img.style.opacity = '0';
      img.style.transform = 'translateY(150%)';
    });

    await new Promise(r => setTimeout(r, 80));
  }

  await new Promise(r => setTimeout(r, 500));
}

// Карта: тип бомбы -> {label: 'nice', img: 'img3/nice.png'} и т.д.
const bombLabelMap = {
  'bomb1': { img: 'img3/nice.png' },
  'bomb2': { img: 'img3/mega.png' },
  'bomb3': { img: 'img3/superb.png' },
  'bomb4': { img: 'img3/sensational.png' }
};

// Определить тип бомбы по картинке
function getBombType(imgPath) {
  if (!imgPath) return 'bomb1';
  if (imgPath.includes('bomb1')) return 'bomb1';
  if (imgPath.includes('bomb2')) return 'bomb2';
  if (imgPath.includes('bomb3')) return 'bomb3';
  if (imgPath.includes('bomb4')) return 'bomb4';
  return 'bomb1';
}

// Новый показ анимации надписи после взрыва бомбы с затемнением и заменой фона и скрытием заголовка
function showBombLabelAnim(bombImgPath) {
  const darken = document.getElementById('darken-bg');
  const labelDiv = document.getElementById('bomb-label-anim');
  const labelImg = document.getElementById('bomb-label-img');
  let bgDiv = document.getElementById('bomb-bg-img3');
  let titleDiv = document.querySelector('div[style*="title1.png"]');
  let titleWas = false;

  // Скрываем заголовок (если есть)
  if (titleDiv) {
    titleDiv.style.visibility = 'hidden';
    titleWas = true;
  }

  // --- background теперь меньше на 25% (768x432), но расположение по центру (top: 50%) ---
  if (!bgDiv) {
    bgDiv = document.createElement('div');
    bgDiv.id = 'bomb-bg-img3';
    bgDiv.style.position = 'fixed';
    bgDiv.style.left = '50%';
    bgDiv.style.top = '50%'; // вернули по центру
    bgDiv.style.width = '768px';
    bgDiv.style.height = '432px';
    bgDiv.style.transform = 'translate(-50%, -50%)';
    bgDiv.style.zIndex = '10000';
    bgDiv.style.background = "url('img3/background.png') center center / contain no-repeat";
    bgDiv.style.pointerEvents = 'none';
    document.body.appendChild(bgDiv);
  } else {
    bgDiv.style.display = 'block';
    bgDiv.style.width = '768px';
    bgDiv.style.height = '432px';
    bgDiv.style.top = '50%'; // вернули по центру
  }

  // Определяем тип бомбы
  const bombType = getBombType(bombImgPath);
  const labelInfo = bombLabelMap[bombType];
  if (!labelInfo) return;

  // --- надпись в 3 раза больше (ширина 510px), для sensational — на 15% больше и ниже на 11px, для nice/mega — на 15% меньше ---
  labelImg.src = labelInfo.img;
  labelImg.style.opacity = '0';
  labelImg.style.animation = 'none';
  labelImg.style.position = 'fixed';
  labelImg.style.left = '50%';
  if (bombType === 'bomb4') {
    // sensational: больше на 15% и ниже на 11px
    labelImg.style.top = 'calc(50% + 11px)';
    labelImg.style.width = '586.5px'; // 510 * 1.15
  } else if (bombType === 'bomb1' || bombType === 'bomb2') {
    // nice и mega: меньше на 15%
    labelImg.style.top = '50%';
    labelImg.style.width = '433.5px'; // 510 * 0.85
  } else {
    // остальные (superb)
    labelImg.style.top = '50%';
    labelImg.style.width = '510px';
  }
  labelImg.style.transform = 'translate(-50%, -50%)';
  labelImg.style.zIndex = '10001';
  labelImg.style.height = 'auto';

  // --- Анимация: 4 раза "отдаляется-приближается" ---
  // Добавляем CSS-анимацию динамически
  if (!document.getElementById('bomb-bounce-keyframes')) {
    const style = document.createElement('style');
    style.id = 'bomb-bounce-keyframes';
    style.innerHTML = `
@keyframes bombLabelBounce {
  0%   { transform: translate(-50%, -50%) scale(1); }
  8%   { transform: translate(-50%, -50%) scale(0.82);}
  16%  { transform: translate(-50%, -50%) scale(1.18);}
  25%  { transform: translate(-50%, -50%) scale(1);}
  33%  { transform: translate(-50%, -50%) scale(0.82);}
  41%  { transform: translate(-50%, -50%) scale(1.18);}
  50%  { transform: translate(-50%, -50%) scale(1);}
  58%  { transform: translate(-50%, -50%) scale(0.82);}
  66%  { transform: translate(-50%, -50%) scale(1.18);}
  75%  { transform: translate(-50%, -50%) scale(1);}
  83%  { transform: translate(-50%, -50%) scale(0.82);}
  91%  { transform: translate(-50%, -50%) scale(1.18);}
  100% { transform: translate(-50%, -50%) scale(1);}
}
    `;
    document.head.appendChild(style);
  }

  void labelImg.offsetWidth;
  labelDiv.style.display = 'flex';
  labelDiv.style.zIndex = '10001';
  darken.classList.add('show');
  setTimeout(() => {
    labelImg.style.animation = 'bombLabelBounce 1.4s cubic-bezier(.7,1.7,.5,1.1)';
    labelImg.style.opacity = '';
  }, 10);

  setTimeout(() => {
    labelDiv.style.display = 'none';
    darken.classList.remove('show');
    // Убираем фон и возвращаем заголовок
    if (bgDiv) bgDiv.style.display = 'none';
    if (titleDiv && titleWas) {
      titleDiv.style.visibility = '';
    }
    // Сброс позиции labelImg
    labelImg.style.position = '';
    labelImg.style.left = '';
    labelImg.style.top = '';
    labelImg.style.transform = '';
    labelImg.style.zIndex = '';
    labelImg.style.width = '';
    labelImg.style.height = '';
    labelImg.style.animation = '';
  }, 1700);
}

// Показать анимацию взрыва бомбы с затемнением фона и задержкой перед надписью
function showBombExplosion(delay = 0) {
  const explosion = document.getElementById('bomb-explosion');
  const darken = document.getElementById('darken-bg');
  explosion.style.display = 'flex';
  darken.classList.add('show');
  // Перезапуск flare
  const flare = explosion.querySelector('.bomb-flare');
  flare.style.animation = 'none';
  void flare.offsetWidth;
  flare.style.animation = '';
  // Скрыть надпись перед показом
  const x1000 = explosion.querySelector('.bomb-x1000');
  x1000.style.opacity = '0';
  x1000.style.animation = 'none';
  void x1000.offsetWidth;
  // Перезапуск контейнера
  explosion.classList.remove('show');
  void explosion.offsetWidth;
  explosion.classList.add('show');
  // Показать надпись с задержкой после падения новой конфеты
  setTimeout(() => {
    x1000.style.animation = '';
    x1000.style.opacity = '';
  }, delay + 250); // увеличили задержку на 250мс

  setTimeout(() => {
    explosion.classList.remove('show');
    explosion.style.display = 'none';
    darken.classList.remove('show');
  }, 2200 + delay + 250);
}

// Показать анимацию взрыва бомбы в ячейке (fade+scale)
function showBombExplosionInCell(cell) {
  const explosion = document.getElementById('bomb-explosion-img');
  const rect = cell.getBoundingClientRect();
  const parentRect = game.getBoundingClientRect();
  // Позиционируем по центру ячейки
  explosion.style.left = (rect.left - parentRect.left + rect.width/2 - 60) + 'px';
  explosion.style.top = (rect.top - parentRect.top + rect.height/2 - 60) + 'px';
  explosion.style.display = 'block';
  explosion.style.opacity = '1';
  explosion.style.transform = 'scale(0.7)';
  explosion.style.transition = 'none';

  // Запускаем анимацию
  setTimeout(() => {
    explosion.style.transition = 'opacity 0.5s, transform 0.5s';
    explosion.style.opacity = '0';
    explosion.style.transform = 'scale(1.5)';
  }, 10);

  // Скрываем после анимации
  setTimeout(() => {
    explosion.style.display = 'none';
    explosion.style.opacity = '1';
    explosion.style.transform = 'scale(0.7)';
    explosion.style.transition = 'none';
  }, 510);
}

async function animateBombExplodeAndDropNew(bombIndex) {
  const cell = game.querySelector(`.cell[data-index='${bombIndex}']`);
  if (!cell) return;
  const img = cell.querySelector('img');
  if (!img) return;
  // Удаляем множитель сразу при взрыве
  const label = cell.querySelector('.bomb-mult-label');
  if (label) label.remove();

  // --- Сохраняем путь к бомбе для надписи ---
  const bombImgPath = img.src;

  // Анимация исчезновения бомбы
  img.style.transition = 'transform 0.4s cubic-bezier(.7,1.7,.5,1.1), opacity 0.4s cubic-bezier(.7,1.7,.5,1.1)';
  img.style.transform = 'scale(2.2) rotate(25deg)';
  img.style.opacity = '0';
  await new Promise(r => setTimeout(r, 400));
  const newSym = symbols[Math.floor(Math.random() * symbols.length)];
  const newImg = new Image();
  newImg.src = newSym;
  newImg.style.opacity = '1';
  newImg.style.width = '85%';
  newImg.style.height = '85%';
  newImg.style.transition = 'none';
  newImg.style.transform = 'translateY(-120vh)';
  cell.innerHTML = '';
  cell.appendChild(newImg);

  setTimeout(() => {
    newImg.style.transition = '';
    newImg.classList.add('fruit-bounce-drop');
    newImg.style.transform = '';
    newImg.addEventListener('animationend', () => {
      newImg.classList.remove('fruit-bounce-drop');
    }, { once: true });
  }, 10);

  // --- Показываем надпись после взрыва бомбы ---
  showBombLabelAnim(bombImgPath);

  await new Promise(r => setTimeout(r, 400));
}

// Функция для анимации выпадения новых символов и повторной проверки выигрыша
async function handleWinCascade(winIndices) {
  for (const i of winIndices) {
    const cell = game.querySelector(`.cell[data-index='${i}']`);
    const newSym = symbols[Math.floor(Math.random() * symbols.length)];
    const img = new Image();
    img.src = newSym;
    img.style.opacity = '1';
    img.style.width = '85%';
    img.style.height = '85%';
    img.style.transition = 'none';
    img.style.transform = 'translateY(-120vh)';
    cell.innerHTML = '';
    cell.appendChild(img);

    setTimeout(() => {
      img.style.transition = '';
      img.classList.add('fruit-bounce-drop');
      img.style.transform = '';
      img.addEventListener('animationend', () => {
        img.classList.remove('fruit-bounce-drop');
      }, { once: true });
    }, 50);
  }
  await new Promise(r => setTimeout(r, 400));
}

// Показать красивую анимацию выигрыша над фруктом (только цифры)
function showFruitWinPopup(cell, amount) {
  const popup = document.createElement('div');
  popup.className = 'fruit-win-popup';
  popup.textContent = `+${amount.toLocaleString('ru-RU')}`;
  cell.appendChild(popup);

  setTimeout(() => {
    popup.classList.add('show');
  }, 10);

  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => cell.removeChild(popup), 400);
  }, 1200);
}

// Получить координаты центра баланса
function getBalanceCenter() {
  const balance = document.getElementById('balance');
  const rect = balance.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

// Анимация "перелета" цифры к балансу (цифра летит поверх всего)
function animateFruitWinToBalance(cell, amount) {
  return new Promise(resolve => {
    // Получаем стартовые координаты popup относительно окна
    const cellRect = cell.getBoundingClientRect();
    const startX = cellRect.left + cellRect.width / 2;
    const startY = cellRect.top + cellRect.height * 0.4;

    // Получаем координаты баланса
    const balanceCenter = getBalanceCenter();

    // Создаем popup и добавляем в body
    const popup = document.createElement('div');
    popup.className = 'fruit-win-popup';
    popup.textContent = `+${amount.toLocaleString('ru-RU')}`;
    popup.style.position = 'fixed';
    popup.style.left = `${startX}px`;
    popup.style.top = `${startY}px`;
    popup.style.transform = 'translate(-50%, 0) scale(1)';
    popup.style.opacity = '1';
    popup.style.pointerEvents = 'none';
    popup.style.zIndex = 99999;
    document.body.appendChild(popup);

    // Появление и bounce
    popup.classList.add('show');
    setTimeout(() => {
      popup.classList.remove('show');
      // Запускаем анимацию полета к балансу
      popup.classList.add('fly');
      // Гиперболическая траектория: вверх и к балансу
      const dx = balanceCenter.x - startX;
      const dy = balanceCenter.y - startY;
      popup.style.transform = `translate(calc(-50% + ${dx}px), ${dy - 60}px) scale(0.7)`;
      popup.style.opacity = '0.2';
    }, 700);

    // После завершения анимации удаляем popup
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
      resolve();
    }, 1550);
  });
}

// Красивая анимация увеличения баланса
function animateBalanceIncrease(oldValue, newValue) {
  const el = balanceValueEl;
  const duration = 700;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const val = Math.round(oldValue + (newValue - oldValue) * t);
    el.textContent = val.toLocaleString('ru-RU');
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = newValue.toLocaleString('ru-RU');
    }
  }
  requestAnimationFrame(step);
  // Вспышка баланса
  el.style.transition = 'color 0.2s, text-shadow 0.2s';
  el.style.color = '#fffbe6';
  el.style.textShadow = '0 0 30px #fffbe6, 0 0 60px #ffb300, 0 2px 0 #000';
  setTimeout(() => {
    el.style.color = '';
    el.style.textShadow = '';
  }, 400);
}

// Красивая анимация увеличения выигрыша
function animateWinIncrease(oldValue, newValue) {
  const el = winAmountEl;
  const duration = 600;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const val = Math.round(oldValue + (newValue - oldValue) * t);
    el.textContent = val.toLocaleString('ru-RU');
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = newValue.toLocaleString('ru-RU');
    }
  }
  requestAnimationFrame(step);
  el.style.transition = 'color 0.2s, text-shadow 0.2s';
  el.style.color = '#fffbe6';
  el.style.textShadow = '0 0 30px #fffbe6, 0 0 60px #ffb300, 0 2px 0 #000';
  setTimeout(() => {
    el.style.color = '';
    el.style.textShadow = '';
  }, 400);
}

// Основной игровой цикл с поддержкой каскадов выигрышей
playBtn.addEventListener('click', async () => {
  if (isPlaying) return;
  // --- Если есть не переведённый выигрыш, сразу переводим его на баланс ---
  if (winAmountEl.textContent && Number(winAmountEl.textContent.replace(/\s/g, '')) > 0) {
    const winVal = Number(winAmountEl.textContent.replace(/\s/g, ''));
    animateBalanceIncrease(balance, balance + winVal);
    balance += winVal;
    winAmountEl.textContent = '0';
  }

  if (balance < BET) {
    alert('Недостаточно средств!');
    return;
  }

  isPlaying = true;

  // Списываем ставку сразу при нажатии кнопки
  balance -= BET;
  balanceValueEl.textContent = balance.toLocaleString('ru-RU');

  // Сброс выигрыша
  let winAmount = 0;
  winAmountEl.textContent = '0';

  const cells = game.querySelectorAll('.cell');
  if (cells.length > 0 && cells[0].firstChild) {
    await animateFlyOutColumns();
  }

  initEmptyGrid();
  const { grid, bombIndex } = generateField();
  await animateDropColumns(grid);

  let payout = 0;
  let currentGrid = [...grid];
  let cascade = true;
  let fruitWinPromises = [];
  let bombMultiplier = 1;

  // Каскадные выигрыши
  while (cascade) {
    const counts = countSymbols(currentGrid);
    const winSymbol = findWinningSymbol(counts);
    const winIndices = winSymbol ? getWinIndices(currentGrid, winSymbol) : [];
    cascade = false;

    if (winSymbol) {
      cascade = true;
      const symbolName = extractSymbolName(winSymbol);

      // Выигрыш с каждого фрукта
      const coeff = 3 + (counts[winSymbol] - 8);
      const fruitWin = BET * coeff / winIndices.length;

      // Сначала показываем popup и собираем промисы перелета
      fruitWinPromises = await Promise.all(winIndices.map(i => {
        return new Promise(res => {
          const cell = game.querySelector(`.cell[data-index='${i}']`);
          const frameCount = 6;
          let current = 0;

          const img = document.createElement('img');
          img.src = winSymbol;
          img.className = 'jump-once';
          img.style.width = '85%';
          img.style.height = '85%';
          cell.innerHTML = '';
          cell.appendChild(img);

          // Анимация popup и перелет к панели выигрыша
          animateFruitWinToBalance(cell, Math.round(fruitWin)).then(res);

          setTimeout(() => {
            img.className = '';
            img.src = `anim/${symbolName}_0.png`;

            function nextFrame() {
              current++;
              if (current >= frameCount) {
                cell.innerHTML = '';
                return;
              }
              img.src = `anim/${symbolName}_${current}.png?ver=${Date.now()}`;
              setTimeout(nextFrame, 40);
            }

            nextFrame();
          }, 400);
        });
      }));

      await handleWinCascade(winIndices);

      // === КОПИРУЕМ СТРУКТУРУ ПОЛЯ (с учетом бомб) ===
      currentGrid = Array.from(game.querySelectorAll('.cell')).map(cell => {
        const img = cell.querySelector('img');
        // ищем новый стиль множителя бомбы
        const label = cell.querySelector('.bomb-mult-label');
        if (label && label.textContent.startsWith('x')) {
          const multiplier = parseInt(label.textContent.slice(1));
          return {
            type: 'bomb',
            multiplier,
            img: bombImages[multiplier]
          };
        }
        // Исправлено: если img есть, ищем путь в symbols, иначе null
        if (img) {
          // Находим соответствие по имени файла, чтобы не было путаницы с абсолютным путем
          const found = symbols.find(sym => img.src.includes(sym.replace('img/', '')));
          return found || null;
        }
        return null;
      });

      // === Добавляем выигрыш в панель выигрыша ===
      const oldWin = winAmount;
      winAmount += Math.round(BET * coeff);
      animateWinIncrease(oldWin, winAmount);
    }
  }

  // Бомба только один раз за спин
  if (bombIndex >= 0) {
    // Получаем множитель бомбы
    const bombObj = grid[bombIndex];
    let multiplier = 1000;
    // let bombImgPath = '';
    if (typeof bombObj === 'object' && bombObj.type === 'bomb') {
      multiplier = bombObj.multiplier;
      // bombImgPath = bombObj.img;
    }
    await animateBombExplodeAndDropNew(bombIndex);
    bombMultiplier = multiplier;
    // Применяем множитель к выигрышу
    if (winAmount > 0) {
      const oldWin = winAmount;
      winAmount = winAmount * bombMultiplier;
      animateWinIncrease(oldWin, winAmount);
    } else {
      winAmount = BET * bombMultiplier;
      animateWinIncrease(0, winAmount);
    }
  }

  // После всех анимаций переводим выигрыш на баланс
  if (winAmount > 0) {
    const oldBalance = balance;
    // Ждем, пока все popup долетят до панели выигрыша
    await Promise.all(fruitWinPromises);
    showWinPopup(winAmount);
    // --- МГНОВЕННОЕ зачисление выигрыша на баланс ---
    animateBalanceIncrease(oldBalance, oldBalance + Number(winAmountEl.textContent.replace(/\s/g, '')));
    balance += Number(winAmountEl.textContent.replace(/\s/g, ''));
    winAmountEl.textContent = '0';
    winAmount = 0;
  } else {
    balanceValueEl.textContent = balance.toLocaleString('ru-RU');
    winAmountEl.textContent = '0';
    winAmount = 0;
  }

  isPlaying = false;
});

// --- Система изменения ставки ---
const betBtn = document.getElementById('bet-settings-btn');
const betModalBg = document.getElementById('bet-modal-bg');
const betModalClose = document.getElementById('bet-modal-close');
const betSlider = document.getElementById('bet-slider');
const betInput = document.getElementById('bet-input');
const betApplyBtn = document.getElementById('bet-apply-btn');
const betAmountLabel = document.getElementById('bet-amount-label');

function openBetModal() {
  betSlider.value = BET;
  betInput.value = BET;
  betModalBg.classList.add('show');
  betInput.focus();
}
function closeBetModal() {
  betModalBg.classList.remove('show');
}
betBtn.addEventListener('click', openBetModal);
betModalClose.addEventListener('click', closeBetModal);
betModalBg.addEventListener('click', (e) => {
  if (e.target === betModalBg) closeBetModal();
});

betSlider.addEventListener('input', () => {
  betInput.value = betSlider.value;
});
betInput.addEventListener('input', () => {
  let val = parseInt(betInput.value) || 100;
  if (val < 100) val = 100;
  if (val > 19000) val = 19000;
  val = Math.round(val / 100) * 100;
  betInput.value = val;
  betSlider.value = val;
});

betApplyBtn.addEventListener('click', () => {
  let val = parseInt(betInput.value) || 100;
  if (val < 100) val = 100;
  if (val > 19000) val = 19000;
  val = Math.round(val / 100) * 100;
  BET = val;
  betAmountLabel.textContent = BET;
  closeBetModal();
});

initEmptyGrid();
