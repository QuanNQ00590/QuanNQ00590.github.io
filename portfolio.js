/**
 * portfolio.js - FULLY SYNCED WITH INDEX.HTML
 * - Filter + Search + Sort
 * - Hover → show "View Project" button (same as index)
 * - Click → open link in new tab
 */

document.addEventListener('DOMContentLoaded', function () {
    const items = document.querySelectorAll('.portfolio-item');
    const filters = document.querySelectorAll('.filter-btn');
    const search = document.getElementById('portfolioSearch');
    const sort = document.getElementById('portfolioSort');
    const empty = document.getElementById('emptyState');

    // === HOVER + CLICK BEHAVIOR ===
    items.forEach(item => {
        const overlay = item.querySelector('.portfolio-item-overlay');
        const button = overlay?.querySelector('.btn-view-details');
        const link = item.getAttribute('data-item-link');
        const hasValidLink = link && link.trim() !== '' && link !== '#';

        if (!hasValidLink) {
            if (overlay) overlay.style.display = 'none';
            item.style.cursor = 'default';
            return;
        }

        item.style.cursor = 'pointer';

        // Hover
        item.addEventListener('mouseenter', () => {
            overlay.style.opacity = '1';
            item.style.transform = 'translateY(-6px)';
            item.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
        });

        item.addEventListener('mouseleave', () => {
            overlay.style.opacity = '0';
            item.style.transform = '';
            item.style.boxShadow = '';
        });

        // Click card
        item.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(link, '_blank', 'noopener,noreferrer');
        });

        // Click button
        if (button) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(link, '_blank', 'noopener,noreferrer');
                       });
        }
    });

    // === FILTER + SEARCH + SORT ===
    filters.forEach(btn => btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
    }));

    search.addEventListener('input', debounce(applyFilters, 300));
    sort.addEventListener('change', applyFilters);

    function applyFilters() {
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const filter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
        const query = search.value.trim().toLowerCase();
        const order = sort.value;

        let hasVisible = false;

        document.querySelectorAll('.portfolio-category').forEach(cat => {
            const grid = cat.querySelector('.portfolio-grid');
            const catItems = Array.from(grid.querySelectorAll('.portfolio-item'));
            let visibleInCat = [];

            catItems.forEach(item => {
                const rawTags = item.getAttribute('data-tags') || '';
                const tagsArray = rawTags
                    .split(',')
                    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'));

                const title = item.querySelector('.portfolio-item-title')?.textContent.toLowerCase() || '';
                const desc = item.querySelector('.portfolio-item-description')?.textContent.toLowerCase() || '';

                const matchesFilter = filter === 'all' || tagsArray.includes(filter);
                const matchesSearch = !query || 
                    title.includes(query) || 
                    desc.includes(query) ||
                    tagsArray.some(tag => tag.includes(query));

                if (matchesFilter && matchesSearch) {
                    visibleInCat.push(item);
                }
            });

            // Sort
            if (order === 'title-asc') {
                visibleInCat.sort((a, b) => {
                    const A = a.querySelector('.portfolio-item-title')?.textContent || '';
                    const B = b.querySelector('.portfolio-item-title')?.textContent || '';
                    return A.localeCompare(B);
                });
            } else if (order === 'title-desc') {
                visibleInCat.sort((a, b) => {
                    const A = a.querySelector('.portfolio-item-title')?.textContent || '';
                    const B = b.querySelector('.portfolio-item-title')?.textContent || '';
                    return B.localeCompare(A);
                });
            }

            catItems.forEach(item => {
                item.style.display = visibleInCat.includes(item) ? '' : 'none';
            });

            visibleInCat.forEach((item, idx) => {
                item.style.order = idx;
                grid.appendChild(item);
            });

            const shouldShow = visibleInCat.length > 0;
            cat.style.display = shouldShow ? '' : 'none';
            if (shouldShow) hasVisible = true;
        });

        empty.style.display = hasVisible ? 'none' : 'block';
    }

    function debounce(fn, wait) {
        let t;
        return () => { clearTimeout(t); t = setTimeout(fn, wait); };
    }

    applyFilters();
});