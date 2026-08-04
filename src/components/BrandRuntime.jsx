import { useEffect } from 'react';

const replacements = [
  ['Академия Макарова', 'Новые Знания'],
  ['Академии Макарова', 'Новых Знаний'],
  ['Академию Макарова', 'Новые Знания'],
  ['Академией Макарова', 'Новыми Знаниями'],
  ['Преподаватель Академии', 'Преподаватель Новых Знаний'],
  ['Загружаю Академию', 'Загружаю Новые Знания'],
  ['аккаунта Академии', 'аккаунта «Новых Знаний»'],
  ['личную академию', 'личную среду обучения']
];

function replaceText(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    let text = node.nodeValue;
    for (const [from, to] of replacements) text = text.replaceAll(from, to);
    if (text !== node.nodeValue) node.nodeValue = text;
  }

  root.querySelectorAll?.('.brand-symbol').forEach((element) => {
    if (element.textContent.trim() === 'АМ') element.textContent = 'НЗ';
  });

  root.querySelectorAll?.('.brand-lockup').forEach((element) => {
    const title = element.querySelector('b');
    const subtitle = element.querySelector('span');
    if (title) title.textContent = 'Новые Знания';
    if (subtitle) subtitle.textContent = 'by Макаров';
  });
}

export default function BrandRuntime() {
  useEffect(() => {
    document.title = 'Новые Знания — by Макаров';
    replaceText(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) replaceText(node);
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) replaceText(node.parentElement);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
