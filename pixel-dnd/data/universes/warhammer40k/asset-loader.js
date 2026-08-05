const MANIFEST_URL = '/data/universes/warhammer40k/generated-batch-001.json';

export async function loadWarhammerAssetBatch() {
  const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Не удалось загрузить ассеты Warhammer: ${response.status}`);
  return response.json();
}

export function createWarhammerAssetElement(asset, manifest) {
  if (!asset) throw new Error('Ассет не указан');
  const element = document.createElement('div');
  element.className = 'wh40k-generated-asset';
  element.dataset.assetKey = asset.asset_key;
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', asset.title_ru || asset.asset_key);

  if (asset.render_mode === 'direct') {
    element.style.backgroundImage = `url("${asset.url}")`;
    element.style.backgroundSize = 'contain';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundPosition = 'center';
    element.style.aspectRatio = '1 / 1';
    return element;
  }

  const [x1, y1, x2, y2] = asset.sheet_crop;
  const scaleX = manifest.sheet.display_width / manifest.sheet.source_width;
  const scaleY = manifest.sheet.display_height / manifest.sheet.source_height;
  const width = Math.max(1, Math.round((x2 - x1) * scaleX));
  const height = Math.max(1, Math.round((y2 - y1) * scaleY));

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.backgroundImage = `url("${manifest.sheet.url}")`;
  element.style.backgroundRepeat = 'no-repeat';
  element.style.backgroundSize = `${manifest.sheet.display_width}px ${manifest.sheet.display_height}px`;
  element.style.backgroundPosition = `${-Math.round(x1 * scaleX)}px ${-Math.round(y1 * scaleY)}px`;
  element.style.imageRendering = 'pixelated';
  return element;
}

export async function findWarhammerAsset(assetKey) {
  const manifest = await loadWarhammerAssetBatch();
  const asset = manifest.assets.find(item => item.asset_key === assetKey);
  return asset ? { asset, manifest } : null;
}
