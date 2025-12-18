// Боковая панель навигации для всех страниц (кроме login/profile)
// Вкладки: Вход, Регистрация + роль‑зависимые ссылки

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { supabaseUrl, supabaseKey } from './supabase-config.js';

const supabase = createClient(supabaseUrl, supabaseKey);

function createSidebarShell() {
  // Если уже есть — не дублируем
  if (document.querySelector('.app-sidebar')) return null;

  const aside = document.createElement('aside');
  aside.className = 'app-sidebar';

  aside.innerHTML = `
    <div class="app-sidebar__user" id="sidebarUser">
      <span class="app-sidebar__user-name">Гость</span>
    </div>

    <nav class="app-sidebar__nav" aria-label="Основная навигация">
      <div class="app-sidebar__links" data-sidebar-links>
        <!-- сюда подставляются ссылки -->
      </div>
    </nav>
  `;

  document.body.appendChild(aside);

  return aside;
}

function renderLinks(linksContainer, items) {
  linksContainer.innerHTML = items.map(item => `
    <a 
      href="${item.href}" 
      class="app-sidebar__link"
      ${item.id ? `data-link-id="${item.id}"` : ''}
    >
      ${item.icon ? `<i class="fa-solid ${item.icon} app-sidebar__icon"></i>` : ''}
      <span>${item.label}</span>
    </a>
  `).join('');
}

function attachToggle(aside, backdrop) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'btn btn-outline-light app-sidebar-toggle';
  toggle.setAttribute('aria-label', 'Меню навигации');

  toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

  function handleToggleClick() {
    const isOpen = aside.classList.toggle('is-open');
    document.body.classList.toggle('sidebar-open', isOpen);
    if (backdrop) {
      backdrop.classList.toggle('is-visible', isOpen);
    }
  }

  toggle.addEventListener('click', handleToggleClick);

  // Пытаемся поставить кнопку после имени/выхода
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn && logoutBtn.closest('.container, header, nav, .admin-header')) {
    logoutBtn.insertAdjacentElement('afterend', toggle);
    return;
  }

  // Для главной: ставим в обёртку справа (рядом с authSection), чтобы не теряться при перерисовке
  const headerRight = document.getElementById('headerRight');
  if (headerRight) {
    headerRight.appendChild(toggle);
    return;
  }

  // Фоллбек: просто в правую часть первого navbar/контейнера
  const navbarRight = document.querySelector('.navbar .container, .navbar');
  if (navbarRight) {
    navbarRight.appendChild(toggle);
  }
}

async function initSidebar() {
  const aside = createSidebarShell();
  if (!aside) return;

  let backdrop = document.querySelector('.app-sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'app-sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  // Клик по фону закрывает сайдбар
  backdrop.addEventListener('click', () => {
    aside.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    document.body.classList.remove('sidebar-open');
  });

  attachToggle(aside, backdrop);

  const linksContainer = aside.querySelector('[data-sidebar-links]');
  const userEl = document.getElementById('sidebarUser');

  // Проверяем, находимся ли мы на index.html
  const isIndexPage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/');

  // Базовые ссылки для гостя
  const guestLinks = [
    { id: 'login', label: 'Вход', href: 'login.html', icon: 'fa-right-to-bracket' },
    { id: 'register', label: 'Регистрация', href: 'login.html#register', icon: 'fa-user-plus' }
  ];

  // Добавляем "Главная" только если не на index.html
  if (!isIndexPage) {
    guestLinks.unshift({ id: 'home', label: 'Главная', href: 'index.html', icon: 'fa-house' });
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      userEl.innerHTML = `
        <span class="app-sidebar__user-label">Вы не вошли</span>
        <span class="app-sidebar__user-name">Гость</span>
      `;
      renderLinks(linksContainer, guestLinks);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', session.user.id)
      .maybeSingle();

    const fullName = profile?.full_name?.trim() || session.user.email;
    const firstName = fullName.split(' ')[0] || fullName;
    const role = (profile?.role || 'reader').toLowerCase();

    userEl.innerHTML = `
      <span class="app-sidebar__user-label">Вы вошли как</span>
      <span class="app-sidebar__user-name">${firstName}</span>
      <span class="app-sidebar__user-role">${role === 'admin' ? 'Администратор' :
        role === 'author' ? 'Автор' :
        role === 'reviewer' ? 'Рецензент' : 'Читатель'}</span>
    `;

    const items = [];

    // Добавляем "Главная" только если не на index.html
    if (!isIndexPage) {
      items.push({ id: 'home', label: 'Главная', href: 'index.html', icon: 'fa-house' });
    }

    if (role === 'author') {
      items.push({ id: 'author-dashboard', label: 'Мои статьи', href: 'dashboard.html', icon: 'fa-file-pen' });
    }

    if (role === 'admin') {
      items.push(
        { id: 'admin-panel', label: 'Админ-панель', href: 'admin.html', icon: 'fa-gauge-high' }
      );
    }

    if (role === 'reviewer') {
      items.push({ id: 'review-panel', label: 'Оценка статей', href: 'review.html', icon: 'fa-clipboard-check' });
    }

    // Общие ссылки для всех залогиненных
    items.push(
      { id: 'profile', label: 'Профиль', href: 'profile.html', icon: 'fa-id-card' },
      { id: 'logout', label: 'Выйти', href: '#logout', icon: 'fa-arrow-right-from-bracket' }
    );

    renderLinks(linksContainer, items);

    // Обработчик выхода
    const logoutLink = linksContainer.querySelector('[data-link-id="logout"]');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await supabase.auth.signOut();
        } finally {
          location.href = 'login.html';
        }
      });
    }
  } catch (err) {
    console.error('Ошибка инициализации боковой панели:', err);
    // В случае ошибки показываем гостевые ссылки
    renderLinks(linksContainer, guestLinks);
  }
}

// Инициализируем после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}


