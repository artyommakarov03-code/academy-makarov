import { supabase } from './supabase';

export function avatarPublicUrl(path, version = '') {
  if (!path) return '';
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  if (!data?.publicUrl) return '';
  return version ? `${data.publicUrl}?v=${encodeURIComponent(version)}` : data.publicUrl;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать изображение.'));
    };
    image.src = url;
  });
}

export async function prepareAvatarFile(file) {
  if (!file) throw new Error('Файл не выбран.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Поддерживаются JPG, PNG и WebP.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Исходное изображение не должно превышать 8 МБ.');
  }

  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const side = Math.min(sourceWidth, sourceHeight);
  const sourceX = Math.max(0, (sourceWidth - side) / 2);
  const sourceY = Math.max(0, (sourceHeight - side) / 2);
  const size = Math.min(512, side);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Браузер не поддерживает обработку изображения.');
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
  if (!blob) throw new Error('Не удалось подготовить аватар.');
  if (blob.size > 2 * 1024 * 1024) throw new Error('Готовый аватар превышает 2 МБ.');

  return new File([blob], 'avatar.webp', { type: 'image/webp' });
}
