(() => {
  const endpoint = 'https://kxlvdhofagbseytqqegm.supabase.co/functions/v1/game-asset?key=';
  const assets = [
    ['wh40k_engine_overview', 'Обзор движка'],
    ['wh40k_races', 'Расы и происхождения'],
    ['wh40k_classes', 'Классы и роли'],
    ['wh40k_maps', 'Карты локаций'],
    ['wh40k_effects', 'Боевые эффекты'],
  ];
  const image = key => endpoint + encodeURIComponent(key);

  function installStyles() {
    if (document.getElementById('wh40k-loader-style')) return;
    const style = document.createElement('style');
    style.id = 'wh40k-loader-style';
    style.textContent = `
      body.wh40k-preview{--accent:#8f2928;--accent-2:#d4ad5a;background:radial-gradient(circle at 80% 0,rgba(124,29,29,.22),transparent 34%),#07090d}
      .wh40k-nav{color:#efc66d!important}
      .wh40k-gallery{grid-column:1/-1;margin-top:12px;background:#090d13;border:1px solid #443a30;padding:10px}
      .wh40k-gallery-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.wh40k-gallery-head h2{margin:0;color:#efc66d;font-size:16px}.wh40k-gallery-head small{color:#9aa3b5}
      .wh40k-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.wh40k-card{background:#0c1119;border:1px solid #343d4d;padding:7px;color:#e7eaf0;text-align:left;cursor:pointer}.wh40k-card:hover{border-color:#d4ad5a;transform:translateY(-1px)}.wh40k-card img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;image-rendering:pixelated;background:#05070a;margin-bottom:7px}.wh40k-card b{font-size:9px}
      .wh40k-creator{position:fixed;inset:auto 18px 18px auto;z-index:20;background:#241317;border:1px solid #d4ad5a;color:#f2d28c;padding:10px 14px;cursor:pointer;box-shadow:0 8px 30px #000}.wh40k-creator-panel{position:fixed;right:18px;bottom:62px;z-index:21;width:min(380px,calc(100vw - 36px));background:#090d13;border:1px solid #d4ad5a;padding:12px;display:none}.wh40k-creator-panel.open{display:block}.wh40k-creator-panel h3{margin:0 0 10px;color:#efc66d}.wh40k-cheats{display:grid;grid-template-columns:1fr 1fr;gap:7px}.wh40k-cheats button{background:#17131a;border:1px solid #5d4532;color:#e7eaf0;padding:9px;cursor:pointer}
      @media(max-width:1050px){.wh40k-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.wh40k-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function addGallery() {
    if (document.getElementById('wh40kGallery')) return;
    const main = document.querySelector('.main-content') || document.querySelector('main');
    if (!main) return;
    const section = document.createElement('section');
    section.id = 'wh40kGallery';
    section.className = 'wh40k-gallery';
    section.hidden = true;
    section.innerHTML = `<div class="wh40k-gallery-head"><div><small>ПРЕДСОЗДАННЫЕ АССЕТЫ</small><h2>Мрачная галактика · пакет 1</h2></div><small>Загружено из Supabase</small></div><div class="wh40k-grid"></div>`;
    const grid = section.querySelector('.wh40k-grid');
    assets.forEach(([key,title]) => {
      const card = document.createElement('button');
      card.className = 'wh40k-card';
      card.innerHTML = `<img src="${image(key)}" loading="lazy" alt="${title}"><b>${title}</b>`;
      card.addEventListener('click', () => window.open(image(key), '_blank', 'noopener'));
      grid.appendChild(card);
    });
    main.appendChild(section);
  }

  function installCreator() {
    if (document.getElementById('wh40kCreatorButton')) return;
    const button = document.createElement('button');
    button.id = 'wh40kCreatorButton';
    button.className = 'wh40k-creator';
    button.textContent = '✹ Режим создателя';
    button.hidden = true;
    const panel = document.createElement('div');
    panel.className = 'wh40k-creator-panel';
    panel.innerHTML = `<h3>Архитектор сектора</h3><div class="wh40k-cheats"><button>Восстановить отряд</button><button>Открыть карту</button><button>Вызвать босса</button><button>Изменить бросок</button><button>Аватар Примарха</button><button>Аватар Императора</button></div><p style="color:#aab1bf;font-size:9px">Пока команды работают как интерфейс прототипа; серверные права будут подключены отдельным модулем.</p>`;
    button.onclick = () => panel.classList.toggle('open');
    panel.querySelectorAll('button').forEach(item => item.onclick = () => {
      const toast = document.querySelector('#toast');
      if (toast) { toast.textContent = `Команда создателя: ${item.textContent}`; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1800); }
    });
    document.body.append(panel, button);
  }

  function activate() {
    document.body.classList.add('wh40k-preview');
    const title = document.querySelector('#campaignTitle');
    const subtitle = document.querySelector('#campaignSubtitle');
    const art = document.querySelector('#campaignArt');
    const location = document.querySelector('#locationTitle');
    const map = document.querySelector('#mapViewport');
    if (title) title.textContent = 'Пепел сектора Аврелия';
    if (subtitle) subtitle.textContent = 'Кампания #1 · Сигнал из города-улья';
    if (art) art.style.background = `linear-gradient(90deg,rgba(0,0,0,.08),rgba(0,0,0,.56)),url('${image('wh40k_engine_overview')}') center/cover`;
    if (location) location.textContent = 'Город-улей Аврелия';
    if (map) { map.style.backgroundImage = `linear-gradient(rgba(5,7,11,.25),rgba(5,7,11,.48)),url('${image('wh40k_maps')}')`; map.style.backgroundSize='cover'; map.style.backgroundPosition='center'; }
    const gallery = document.getElementById('wh40kGallery');
    if (gallery) { gallery.hidden = false; gallery.scrollIntoView({behavior:'smooth',block:'start'}); }
    const creator = document.getElementById('wh40kCreatorButton');
    if (creator) creator.hidden = false;
  }

  function mount() {
    installStyles(); addGallery(); installCreator();
    const nav = document.querySelector('.main-nav');
    if (nav && !document.getElementById('wh40kNav')) {
      const button = document.createElement('button');
      button.id = 'wh40kNav';
      button.className = 'nav-item wh40k-nav';
      button.innerHTML = '☠ <span>Мрачная галактика</span>';
      button.addEventListener('click', activate);
      nav.appendChild(button);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
