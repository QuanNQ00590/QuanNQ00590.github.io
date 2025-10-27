document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle?.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Project modal (index.html only)
    const modal = document.getElementById('projectModal');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalImage = document.getElementById('modalImage');
    const modalDescription = document.getElementById('modalDescription');
    const modalTags = document.getElementById('modalTags');

    // === PROJECT CARD BEHAVIOR (INDEX.HTML) ===
    document.querySelectorAll('.project-card').forEach(card => {
        const link = card.getAttribute('data-link');
        const hasValidLink = link && link.trim() !== '' && link !== '#';
        const overlay = card.querySelector('.project-overlay');
        const button = overlay?.querySelector('.btn-view');

        if (hasValidLink) {
            card.style.cursor = 'pointer';

            // Click card → open link
            card.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(link, '_blank', 'noopener,noreferrer');
            });

            // Hover
            card.addEventListener('mouseenter', () => {
                overlay.style.opacity = '1';
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
            });

            card.addEventListener('mouseleave', () => {
                overlay.style.opacity = '0';
                card.style.transform = '';
                card.style.boxShadow = '';
            });

            // Button click
            if (button) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.open(link, '_blank', 'noopener,noreferrer');
                });
            }
        } else {
            // No link → open modal
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const img = card.querySelector('img');
                const title = card.querySelector('.project-title').textContent;
                const desc = card.querySelector('.project-description').textContent;
                const tags = card.querySelectorAll('.project-tags .tag');

                modalTitle.textContent = title;
                modalImage.src = img.src;
                modalImage.alt = title;
                modalDescription.textContent = desc;
                modalTags.innerHTML = '';
                tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tag';
                    span.textContent = tag.textContent;
                    modalTags.appendChild(span);
                });

                modal.style.display = 'flex';
            });
        }
    });

    // Close modal
    modalClose?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
});