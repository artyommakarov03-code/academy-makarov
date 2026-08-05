(() => {
  const endpoint = 'https://kxlvdhofagbseytqqegm.supabase.co/functions/v1/game-asset?key=';
  const manifestIndex = '/data/universes/warhammer40k/generated-index.json';
  const image = key => endpoint + encodeURIComponent(key);
  let batches = [];

  async function loadBatches() {
    if (batches.length) return batches;
    const indexResponse = await fetch(manifestIndex, { cache: 'no-cache' });
    if (!indexResponse.ok) throw new Error(`Не загружен индекс Warhammer: ${indexResponse.status}`);
    const index = await indexResponse.json();
    batches = await Promise.all(index.manifests.map(async url => {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Не загружен манифест ${url}: ${response.status}`);
      return response.json();
    }));
    return batches;
  }

  function installStyles() {
    if (document.getElementById('wh40k-loader-style')) return;
    const style = document.createElement('style');
    style.id = 'wh40k-loader-style';
    style.textContent = `
      body.wh40k-preview{--accent:#8f2928;--accent-2:#d4ad5a;background:radial-gradient(circle at 80% 0,rgba(124,29,29,.22),transparent 34%),#07090d}
      .wh40k-nav{color:#efc66d!important}
      .wh40k-gallery{grid-column:1/-1;margin-top:12px;background:#090d13;border:1px solid #443a30;padding:12px}
      .wh40k-gallery-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.wh40k-gallery-head h2{margin:0;color:#efc66d;font-size:16px}.wh40k-gallery-head small{color:#9aa3b5}.wh40k-gallery-head a{color:#14100a;background:#d4ad5a;padding:7px 10px;text-decoration:none;font-weight:800;border-radius:4px}
      .wh40k-batch-label{grid-column:1/-1;color:#efc66d;border-bottom:1px solid #3a322a;padding:8px 2px 5px;font-size:11px}
      .wh40k-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.wh40k-card{background:#0c1119;border:1px solid #343d4d;padding:7px;color:#e7eaf0;text-align:left;cursor:pointer;overflow:hidden}.wh40k-card:hover{border-color:#d4ad5a;transform:translateY(-1px)}.wh40k-card-preview{display:block;width:100%;aspect-ratio:16/10;position:relative;overflow:hidden;background:#05070a;margin-bottom:7px}.wh40k-card-preview img{position:absolute;max-width:none;image-rendering:auto}.wh40k-card-preview img.direct{inset:0;width:100%;height:100%;object-fit:cover}.wh40k-card b{display:block;font-size:9px}.wh40k-card em{display:block;color:#818b9a;font-size:8px;font-style:normal;margin-top:3px}
      .wh40k-loading{grid-column:1/-1;color:#9aa3b5;padding:20px;text-align:center;border:1px dashed #343d4d}
      .wh40k-creator{position:fixed;inset:auto 18px 18px auto;z-index:20;background:#241317;border:1px solid #d4ad5a;color:#f2d28c;padding:10px 14px;cursor:pointer;box-shadow:0 8px 30px #000}.wh40k-creator-panel{position:fixed;right:18px;bottom:62px;z-index:21;width:min(380px,calc(100vw - 36px));background:#090d13;border:1px solid #d4ad5a;padding:12px;display:none}.wh40k-creator-panel.open{display:block}.wh40k-creator-panel h3{margin:0 0 10px;color:#efc66d}.wh40k-cheats{display:grid;grid-template-columns:1fr 1fr;gap:7px}.wh40k-cheats button{background:#17131a;border:1px solid #5d4532;color:#e7eaf0;padding:9px;cursor:pointer}
      @media(max-width:1050px){.wh40k-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.wh40k-grid{grid-template-columns:1fr}.wh40k-gallery-head{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function createPreview(asset, batch) {
    const preview = document.createElement('span');
    preview.className = 'wh40k-card-preview';
    const img = document.createElement('img');
    img.alt = asset.title_ru || asset.asset_key;
    img.loading = 'lazy';

    if (asset.render_mode === 'direct' && asset.url) {
      img.src = asset.url;
      img.className = 'direct';
      preview.appendChild(img);
      return preview;
    }

    const crop = asset.sheet_crop;
    if (!crop) {
      img.src = batch.sheet.url;
      img.className = 'direct';
      preview.appendChild(img);
      return preview;
    }

    const [x1, y1, x2, y2] = crop;
    const containerWidth = 260;
    const containerHeight = 163;
    const scale = Math.max(containerWidth / (x2 - x1), containerHeight / (y2 - y1));
    img.src = batch.sheet.url;
    img.style.width = `${batch.sheet.source_width * scale}px`;
    img.style.height = `${batch.sheet.source_height * scale}px`;
    img.style.left = `${-x1 * scale}px`;
    img.style.top = `${-y1 * scale}px`;
    preview.appendChild(img);
    return preview;
  }

  async function renderGallery(section) {
    const grid = section.querySelector('.wh40k-grid');
    grid.innerHTML = '<div class="wh40k-loading">Загружаю манифесты и изображения…</div>';
    try {
      const loaded = await loadBatches();
      grid.innerHTML = '';
      for (const batch of loaded) {
        const label = document.createElement('div');
        label.className = 'wh40k-batch-label';
        const first = batch.prompt_range?.[0] || batch.assets[0]?.prompt_number || 1;
        const last = batch.prompt_range?.[1] || batch.assets.at(-1)?.prompt_number || batch.generated_count;
        label.textContent = `ПАРТИЯ ${first}–${last} · ${batch.assets.length} АССЕТОВ`;
        grid.appendChild(label);
        for (const asset of batch.assets) {
          const card = document.createElement('button');
          card.className = 'wh40k-card';
          card.appendChild(createPreview(asset, batch));
          const title = document.createElement('b');
          title.textContent = asset.title_ru || asset.asset_key;
          const meta = document.createElement('em');
          meta.textContent = `Промпт ${asset.prompt_number ?? '—'} · ${asset.category || 'ассет'}`;
          card.append(title, meta);
          card.addEventListener('click', () => window.open(batch.sheet.url, '_blank', 'noopener'));
          grid.appendChild(card);
        }
      }
      const total = loaded.reduce((sum, batch) => sum + batch.assets.length, 0);
      section.querySelector('[data-wh40k-count]').textContent = `${total} ассетов · ${loaded.length} партии · Supabase`;
    } catch (error) {
      console.error(error);
      grid.innerHTML = '<div class="wh40k-loading">Не удалось загрузить каталог. Проверьте Supabase и повторное развёртывание сайта.</div>';
    }
  }

  function addGallery() {
    if (document.getElementById('wh40kGallery')) return;
    const main = document.querySelector('.main-content') || document.querySelector('main');
    if (!main) return;
    const section = document.createElement('section');
    section.id = 'wh40kGallery';
    section.className = 'wh40k-gallery';
    section.hidden = true;
    section.innerHTML = `<div class="wh40k-gallery-head"><div><small>ПРЕДСОЗДАННЫЕ АССЕТЫ</small><h2>Мрачная галактика · библиотека движка</h2></div><div><small data-wh40k-count>Загрузка…</small> <a href="/warhammer-assets.html">Полный каталог</a></div></div><div class="wh40k-grid"></div>`;
    main.appendChild(section);
    renderGallery(section);
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
    panel.innerHTML = `<h3>Архитектор сектора</h3><div class="wh40k-cheats"><button>Восстановить отряд</button><button>Открыть карту</button><button>Вызвать босса</button><button>Изменить бросок</button><button>Аватар Примарха</button><button>Аватар Императора</button></div><p style="color:#aab1bf;font-size:9px">Команды пока работают как интерфейс прототипа; серверные права подключаются отдельно.</p>`;
    button.onclick = () => panel.classList.toggle('open');
    panel.querySelectorAll('button').forEach(item => item.onclick = () => {
      const toast = document.querySelector('#toast');
      if (toast) { toast.textContent = `Команда создателя: ${item.textContent}`; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800); }
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
    if (map) { map.style.backgroundImage = `linear-gradient(rgba(5,7,11,.25),rgba(5,7,11,.48)),url('${image('wh40k_maps')}')`; map.style.backgroundSize = 'cover'; map.style.backgroundPosition = 'center'; }
    const gallery = document.getElementById('wh40kGallery');
    if (gallery) { gallery.hidden = false; gallery.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    const creator = document.getElementById('wh40kCreatorButton');
    if (creator) creator.hidden = false;
  }

  function mount() {
    installStyles();
    addGallery();
    installCreator();
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
