// Main JavaScript for DATAPROTECT Platform

(function() {
    // Initialize Vanta.js background
    let vantaEffect;
    function initVanta() {
        if (vantaEffect) return;
        const heroEl = document.getElementById('vanta-hero');
        if (!heroEl) return;
        
        vantaEffect = VANTA.CLOUDS({
            el: "#vanta-hero",
            backgroundAlpha: 1.0,
            backgroundColor: 0x000000,
            cloudColor: 11609638,
            cloudShadowColor: 0x000000,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            mouseControls: true,
            mouseEase: true,
            scale: 3.0,
            scaleMobile: 12.0,
            skyColor: 0x000000,
            speed: 3.0,
            sunColor: 0x000000,
            sunGlareColor: 0x000000,
            sunlightColor: 0x000000,
            touchControls: true
        });
    }

    // Reveal on scroll animation
    function initRevealAnimation() {
        const els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
            els.forEach(function(el) { io.observe(el); });
        } else {
            els.forEach(function(el) { el.classList.add('in'); });
        }
    }

    // Update navigation based on auth status
    function updateNavigation() {
        const navActions = document.getElementById('nav-actions');
        if (!navActions) return;

        if (api.isAuthenticated()) {
            const user = api.getCurrentUser();
            navActions.innerHTML = `
                <div class="user-menu">
                    <div class="user-avatar" title="${user.username}">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
                <button class="btn btn-ghost" onclick="handleLogout()">Logout</button>
            `;
        } else {
            navActions.innerHTML = `
                <a class="btn btn-ghost" href="login.html">Sign in</a>
                <a class="btn btn-primary" href="register.html">Get started</a>
            `;
        }
    }

    // Load categories
    async function loadCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        try {
            const data = await api.getCategories();
            const categories = data.categories || [];

            if (categories.length === 0) {
                grid.innerHTML = '<p class="muted">No categories available</p>';
                return;
            }

            grid.innerHTML = categories.map(cat => `
                <div class="tile reveal" onclick="window.location.href='category.html?slug=${cat.slug}'">
                    <div class="tile-icon"><i class="fas ${cat.icon || 'fa-folder'}"></i></div>
                    <div class="tile-title">${cat.name}</div>
                    <div class="tile-desc">${cat.description || ''}</div>
                    <div class="tile-count">${cat.challenge_count || 0} challenges</div>
                </div>
            `).join('');

            initRevealAnimation();
        } catch (error) {
            console.error('Error loading categories:', error);
            grid.innerHTML = '<p class="muted">Failed to load categories</p>';
        }
    }

    // Load trending challenges
    async function loadTrendingChallenges() {
        const grid = document.getElementById('challenges-grid');
        if (!grid) return;

        try {
            const data = await api.getChallenges();
            const challenges = (data.challenges || []).slice(0, 8); // Top 8

            if (challenges.length === 0) {
                grid.innerHTML = '<p class="muted">No challenges available</p>';
                return;
            }

            grid.innerHTML = challenges.map(ch => {
                const difficultyClass = ch.difficulty === 'Easy' ? 'badge-easy' : 
                                       ch.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard';
                return `
                    <article class="card reveal" onclick="window.location.href='challenge.html?id=${ch.id}'" style="cursor: pointer;">
                        <div class="title">${ch.title}</div>
                        <div class="meta">
                            <span class="badge ${difficultyClass}">${ch.difficulty}</span>
                            ${ch.points} points
                        </div>
                        <p style="color:var(--muted); font-size:14px">${ch.description.substring(0, 100)}...</p>
                    </article>
                `;
            }).join('');

            initRevealAnimation();
        } catch (error) {
            console.error('Error loading challenges:', error);
            grid.innerHTML = '<p class="muted">Failed to load challenges</p>';
        }
    }

    // Load leaderboard
    async function loadLeaderboard() {
        const tbody = document.querySelector('#leaderboard-table tbody');
        if (!tbody) return;

        try {
            const data = await api.getLeaderboard(10);
            const leaderboard = data.leaderboard || [];

            if (leaderboard.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="muted">No players yet</td></tr>';
                return;
            }

            tbody.innerHTML = leaderboard.map((player, index) => {
                const rank = index + 1;
                const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
                return `
                    <tr>
                        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                        <td><strong>${player.username}</strong></td>
                        <td>${player.total_points || 0}</td>
                        <td>${player.challenges_solved || 0}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="muted">Failed to load leaderboard</td></tr>';
        }
    }

    // Global logout function
    window.handleLogout = function() {
        api.logout();
        window.location.href = 'index.html';
    };

    // Initialize on page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initVanta();
        updateNavigation();
        loadCategories();
        loadTrendingChallenges();
        loadLeaderboard();
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            initVanta();
            updateNavigation();
            loadCategories();
            loadTrendingChallenges();
            loadLeaderboard();
        });
    }

    // Cleanup on unload
    window.addEventListener('unload', function() {
        if (vantaEffect && vantaEffect.destroy) vantaEffect.destroy();
    });
})();
