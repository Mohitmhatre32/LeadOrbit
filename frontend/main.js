
import { fetchWithAuth, clearTokens } from './api.js';

const THEME_STORAGE_KEY = 'theme';

export function getTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', value);
    document.documentElement.setAttribute('data-bs-theme', value);
    document.documentElement.style.colorScheme = value;
}

export function setTheme(theme) {
    const value = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, value);
    document.documentElement.classList.add('theme-transition');
    applyTheme(value);
    window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
    }, 300);
}

function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) {
        return;
    }

    themeToggle.checked = getTheme() === 'dark';
    themeToggle.addEventListener('change', () => {
        setTheme(themeToggle.checked ? 'dark' : 'light');
    });
}

applyTheme(getTheme());

function setActiveNavLink() {
    const pathname = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Skip if no nav links found (e.g., on login/register pages)
    if (navLinks.length === 0) return;
    
    // Remove active class from all links
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Determine which nav link should be active based on current page
    let activeHref = '/dashboard.html'; // default
    
    // Use regex to match page names more precisely
    if (/campaign-builder\.html/i.test(pathname)) {
        // Campaign builder should highlight Campaigns link
        activeHref = '/campaigns.html';
    } else if (/dashboard\.html/i.test(pathname)) {
        activeHref = '/dashboard.html';
    } else if (/leads\.html/i.test(pathname)) {
        activeHref = '/leads.html';
    } else if (/campaigns\.html/i.test(pathname)) {
        activeHref = '/campaigns.html';
    } else if (/analytics\.html/i.test(pathname)) {
        activeHref = '/analytics.html';
    } else if (/settings\.html/i.test(pathname)) {
        activeHref = '/settings.html';
    }
    
    // Find and highlight the matching nav link
    const activeLink = document.querySelector(`a.nav-link[href="${activeHref}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Set active link when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setActiveNavLink);
} else {
    // DOM is already loaded (for dynamic navigation)
    setActiveNavLink();
}

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();

    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
        return;
    }

    try {
        const res = await fetchWithAuth('/auth/me/');
        if (!res.ok) throw new Error();

        const userData = await res.json();

        const userDisplays = document.querySelectorAll('.user-display-name');
        userDisplays.forEach(el => el.textContent = userData.email);

        const orgDisplays = document.querySelectorAll('.org-display-name');
        orgDisplays.forEach(el => {
            if (userData.organization) el.textContent = userData.organization.name;
        });

        const profileEmail = document.getElementById('profile-email');
        const profileRole = document.getElementById('profile-role');
        if (profileEmail) profileEmail.value = userData.email || '';
        if (profileRole) profileRole.value = userData.role || 'ADMIN';

        const geminiKeyInput = document.getElementById('gemini-api-key');
        const aiPersonalizationToggle = document.getElementById('enable-ai-personalization');
        const orgNameInput = document.getElementById('org-name');
        const orgIdInput = document.getElementById('org-id');

        if (userData.organization) {
            if (orgNameInput) orgNameInput.value = userData.organization.name || '';
            if (orgIdInput) orgIdInput.value = userData.organization.id || '';
            if (geminiKeyInput) geminiKeyInput.value = userData.organization.gemini_api_key || '';
            if (aiPersonalizationToggle) {
                aiPersonalizationToggle.checked = userData.organization.enable_ai_personalization !== false;
            }
        }

    } catch (e) {
        console.error('Error loading user profile:', e);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearTokens();
            window.location.href = '/login.html';
        });
    }
});
