// ==========================================
// ROTEIRISTA v2.0 - Empire Mode SaaS
// Mobile First + Gamification + AI Integration
// ==========================================

/* ==========================================
   DATA MANAGER - Enhanced with Gamification
   ========================================== */
class DataManager {
    constructor() {
        this.channels = this.loadData('channels', []);
        this.videos = this.loadData('videos', []);
        this.prompts = this.loadData('prompts', []);
        this.settings = this.loadData('settings', {
            youtubeApiKey: '',
            geminiApiKey: ''
        });
    }

    loadData(key, defaultValue) {
        try {
            const data = localStorage.getItem(`roteirista_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return defaultValue;
        }
    }

    saveChannels() {
        localStorage.setItem('roteirista_channels', JSON.stringify(this.channels));
    }

    saveVideos() {
        localStorage.setItem('roteirista_videos', JSON.stringify(this.videos));
    }

    savePrompts() {
        localStorage.setItem('roteirista_prompts', JSON.stringify(this.prompts));
    }

    saveSettings() {
        localStorage.setItem('roteirista_settings', JSON.stringify(this.settings));
    }

    // Channel CRUD
    addChannel(name, avatar = '') {
        const channel = {
            id: Date.now().toString(),
            name: name.trim(),
            avatar: avatar,
            createdAt: new Date().toISOString()
        };
        this.channels.push(channel);
        this.saveChannels();
        return channel;
    }

    getChannel(id) {
        return this.channels.find(c => c.id === id);
    }

    deleteChannel(id) {
        this.videos = this.videos.filter(v => v.channelId !== id);
        this.saveVideos();
        this.channels = this.channels.filter(c => c.id !== id);
        this.saveChannels();
    }

    // Video CRUD
    addVideo(video) {
        video.id = Date.now().toString();
        video.createdAt = new Date().toISOString();
        video.checklist = video.checklist || {
            script: false,
            audio: false,
            thumb: false,
            edit: false,
            upload: false
        };
        video.stage = this.calculateStage(video);
        this.videos.push(video);
        this.saveVideos();
        return video;
    }

    updateVideo(id, updates) {
        const index = this.videos.findIndex(v => v.id === id);
        if (index !== -1) {
            this.videos[index] = { ...this.videos[index], ...updates };
            this.videos[index].stage = this.calculateStage(this.videos[index]);
            this.saveVideos();
            return this.videos[index];
        }
        return null;
    }

    updateChecklist(id, checklistKey, value) {
        const video = this.getVideo(id);
        if (video) {
            if (!video.checklist) {
                video.checklist = {
                    script: false,
                    audio: false,
                    thumb: false,
                    edit: false,
                    upload: false
                };
            }
            video.checklist[checklistKey] = value;
            return this.updateVideo(id, { checklist: video.checklist });
        }
        return null;
    }

    deleteVideo(id) {
        this.videos = this.videos.filter(v => v.id !== id);
        this.saveVideos();
    }

    getVideo(id) {
        return this.videos.find(v => v.id === id);
    }

    calculateStage(video) {
        const checklist = video.checklist || {};
        const completed = [
            checklist.script,
            checklist.audio,
            checklist.thumb,
            checklist.edit,
            checklist.upload
        ].filter(Boolean).length;

        if (checklist.upload) return 'postado';
        if (completed >= 3) return 'finalizado';
        if (completed >= 1) return 'producao';
        return 'planejamento';
    }

    getProgress(video) {
        const checklist = video.checklist || {};
        const total = 5;
        const completed = [
            checklist.script,
            checklist.audio,
            checklist.thumb,
            checklist.edit,
            checklist.upload
        ].filter(Boolean).length;
        return Math.round((completed / total) * 100);
    }

    getChannelVideos(channelId) {
        return this.videos.filter(v => v.channelId === channelId);
    }

    getMetrics() {
        const metrics = {
            planejamento: 0,
            producao: 0,
            finalizado: 0,
            postado: 0
        };

        this.videos.forEach(video => {
            if (metrics.hasOwnProperty(video.stage)) {
                metrics[video.stage]++;
            }
        });

        return metrics;
    }

    // Prompts CRUD
    addPrompt(prompt) {
        prompt.id = Date.now().toString();
        prompt.createdAt = new Date().toISOString();
        this.prompts.push(prompt);
        this.savePrompts();
        return prompt;
    }

    deletePrompt(id) {
        this.prompts = this.prompts.filter(p => p.id !== id);
        this.savePrompts();
    }

    // Gamification - Count posted videos
    getPostedVideosCount() {
        return this.videos.filter(v => v.stage === 'postado').length;
    }
}

/* ==========================================
   GAMIFICATION MANAGER - Empire Mode
   ========================================== */
class GamificationManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentLevel = null;
    }

    // Calculate level based on posted videos
    calculateLevel(postedCount) {
        if (postedCount >= 100) return { name: 'Lenda', badge: '💎', color: '#60a5fa', min: 100, max: 999 };
        if (postedCount >= 50) return { name: 'Expert', badge: '⭐', color: '#f59e0b', min: 50, max: 99 };
        if (postedCount >= 10) return { name: 'Produtor', badge: '🏅', color: '#a855f7', min: 10, max: 49 };
        return { name: 'Iniciante', badge: '🔰', color: '#94a3b8', min: 0, max: 9 };
    }

    // Update badge UI
    updateBadge() {
        const postedCount = this.dataManager.getPostedVideosCount();
        const level = this.calculateLevel(postedCount);
        const previousLevel = this.currentLevel;

        // Update UI elements
        const badgeIcon = document.getElementById('badgeIcon');
        const badgeLevel = document.getElementById('badgeLevel');
        const badgeVideos = document.getElementById('badgeVideos');
        const xpFill = document.getElementById('xpFill');

        if (badgeIcon) badgeIcon.textContent = level.badge;
        if (badgeLevel) {
            badgeLevel.textContent = level.name;
            badgeLevel.style.color = level.color;
        }
        if (badgeVideos) badgeVideos.textContent = `${postedCount}/${level.max} vídeos`;

        // Calculate progress within current level
        const progressInLevel = postedCount - level.min;
        const levelRange = level.max - level.min;
        const progressPercent = Math.min(100, (progressInLevel / levelRange) * 100);

        if (xpFill) {
            xpFill.style.width = `${progressPercent}%`;
            xpFill.style.background = `linear-gradient(90deg, ${level.color}, ${level.color}dd)`;
        }

        // Check for level up
        if (previousLevel && previousLevel.name !== level.name) {
            this.showLevelUpCelebration(level);
        }

        this.currentLevel = level;
    }

    // Show level up celebration
    showLevelUpCelebration(newLevel) {
        const toast = document.getElementById('levelUpToast');
        const title = document.getElementById('levelUpTitle');
        const message = document.getElementById('levelUpMessage');

        if (!toast) return;

        title.textContent = `Subiu de Nível! ${newLevel.badge}`;
        message.textContent = `Você alcançou o nível ${newLevel.name}!`;

        toast.style.display = 'block';
        toast.style.animation = 'levelUpBounce 0.6s ease-out';

        // Trigger confetti effect
        this.triggerConfetti();

        // Hide after 4 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 4000);
    }

    // Simple confetti effect
    triggerConfetti() {
        const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#60a5fa'];
        const confettiCount = 30;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-10px';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.opacity = '0.8';
                confetti.style.borderRadius = '50%';
                confetti.style.zIndex = '10000';
                confetti.style.pointerEvents = 'none';
                confetti.style.animation = 'confetti 3s ease-out forwards';

                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 3000);
            }, i * 50);
        }
    }
}

/* ==========================================
   GEMINI SERVICE - AI Integration
   ========================================== */
class GeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    }

    // Optimize video title
    async optimizeTitle(currentTitle) {
        if (!this.apiKey) {
            throw new Error('Gemini API Key não configurada');
        }

        const prompt = `Você é um especialista em títulos virais para YouTube. Analise o título "${currentTitle}" e sugira 3 versões otimizadas para maximizar CTR (Click-Through Rate). Use técnicas como:
- Curiosidade e gatilhos emocionais
- Números e listas
- Palavras poderosas
- Promessa de valor clara

Responda APENAS com as 3 sugestões, uma por linha, sem numeração ou formatação extra.`;

        try {
            const response = await fetch(
                `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                }
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return text.trim();
        } catch (error) {
            console.error('Gemini Title Optimization Error:', error);
            throw error;
        }
    }

    // Analyze thumbnail
    async analyzeThumbnail(base64Image) {
        if (!this.apiKey) {
            throw new Error('Gemini API Key não configurada');
        }

        // Remove data URI prefix if present
        const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

        const prompt = `Analise esta thumbnail de vídeo do YouTube. Avalie:
1. Qualidade visual (cores, contraste, nitidez)
2. Legibilidade do texto (se houver)
3. Apelo emocional
4. Potencial de CTR (Click-Through Rate)

Dê uma nota de 0-10 e forneça 3 sugestões práticas de melhoria.`;

        try {
            const response = await fetch(
                `${this.baseURL}/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: imageData
                                    }
                                }
                            ]
                        }]
                    })
                }
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return text.trim();
        } catch (error) {
            console.error('Gemini Thumbnail Analysis Error:', error);
            throw error;
        }
    }
}

/* ==========================================
   YOUTUBE SERVICE - Channel Hunter
   ========================================== */
class YouTubeService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    // Calculate viral score
    calculateViralScore(views, subscribers) {
        if (subscribers === 0) return 0;
        return (views / subscribers).toFixed(2);
    }

    // Search channels with viral score
    async searchChannels(query) {
        if (!this.apiKey) {
            throw new Error('YouTube API Key não configurada');
        }

        try {
            // First: Search for videos
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const publishedAfter = thirtyDaysAgo.toISOString();

            const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?` +
                `part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&` +
                `order=viewCount&videoDuration=medium&publishedAfter=${publishedAfter}&key=${this.apiKey}`
            );

            if (!searchResponse.ok) {
                throw new Error('Search API request failed');
            }

            const searchData = await searchResponse.json();

            if (!searchData.items || searchData.items.length === 0) {
                return [];
            }

            // Get video IDs
            const videoIds = searchData.items.map(item => item.id.videoId).join(',');

            // Second: Get video statistics
            const statsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?` +
                `part=statistics&id=${videoIds}&key=${this.apiKey}`
            );

            if (!statsResponse.ok) {
                throw new Error('Stats API request failed');
            }

            const statsData = await statsResponse.json();

            // Third: Get channel details for each video
            const channelIds = searchData.items.map(item => item.snippet.channelId).join(',');
            const channelsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?` +
                `part=statistics&id=${channelIds}&key=${this.apiKey}`
            );

            if (!channelsResponse.ok) {
                throw new Error('Channels API request failed');
            }

            const channelsData = await channelsResponse.json();

            // Combine data
            const results = searchData.items.map((item, index) => {
                const stats = statsData.items?.[index]?.statistics || {};
                const channelStats = channelsData.items?.find(
                    ch => ch.id === item.snippet.channelId
                )?.statistics || {};

                const views = parseInt(stats.viewCount || 0);
                const subscribers = parseInt(channelStats.subscriberCount || 1);
                const viralScore = this.calculateViralScore(views, subscribers);

                return {
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    channelTitle: item.snippet.channelTitle,
                    channelId: item.snippet.channelId,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    publishedAt: item.snippet.publishedAt,
                    views: views,
                    subscribers: subscribers,
                    viralScore: parseFloat(viralScore)
                };
            });

            // Sort by viral score (highest first)
            results.sort((a, b) => b.viralScore - a.viralScore);

            return results;
        } catch (error) {
            console.error('YouTube Channel Hunter Error:', error);
            throw error;
        }
    }
}

/* ==========================================
   UI MANAGER - Enhanced v2.0
   ========================================== */
class UIManager {
    constructor(dataManager, gamificationManager) {
        this.dataManager = dataManager;
        this.gamificationManager = gamificationManager;
        this.currentPage = 'dashboard';
        this.selectedChannel = null;
        this.currentVideoId = null;
        this.geminiService = null;
        this.youtubeService = null;

        this.init();
    }

    init() {
        this.setupServices();
        this.setupBottomBar();
        this.setupMobileMenu();
        this.setupChannelModal();
        this.setupVideoModal();
        this.setupThumbnailUpload();
        this.setupAudioUpload();
        this.setupGeminiFeatures();
        this.setupChannelHunter();
        this.setupSettings();
        this.renderChannelsList();
        this.gamificationManager.updateBadge();
        this.navigateTo('home');
    }

    setupServices() {
        const geminiKey = this.dataManager.settings.geminiApiKey;
        const youtubeKey = this.dataManager.settings.youtubeApiKey;

        if (geminiKey) {
            this.geminiService = new GeminiService(geminiKey);
        }
        if (youtubeKey) {
            this.youtubeService = new YouTubeService(youtubeKey);
        }
    }

    /* ==========================================
       BOTTOM BAR NAVIGATION
       ========================================== */
    setupBottomBar() {
        // Bottom bar navigation
        document.querySelectorAll('.bottom-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo(item.dataset.page);
            });
        });

        // Bottom "Novo" button
        const btnBottomAdd = document.getElementById('btnBottomAdd');
        if (btnBottomAdd) {
            btnBottomAdd.addEventListener('click', () => {
                if (this.selectedChannel) {
                    this.openVideoModal();
                } else {
                    this.showToast('Selecione um canal primeiro', 'error');
                    this.toggleMobileMenu();
                }
            });
        }

        // Bottom "Canais" button
        const btnBottomMenu = document.getElementById('btnBottomMenu');
        if (btnBottomMenu) {
            btnBottomMenu.addEventListener('click', () => {
                this.navigateTo('canais');
            });
        }
    }

    /* ==========================================
       MOBILE MENU
       ========================================== */
    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Close on backdrop click
        if (sidebar) {
            document.addEventListener('click', (e) => {
                if (window.innerWidth < 1024 &&
                    sidebar.classList.contains('mobile-open') &&
                    !sidebar.contains(e.target) &&
                    !e.target.closest('#mobileMenuToggle') &&
                    !e.target.closest('#btnBottomMenu')) {
                    this.toggleMobileMenu();
                }
            });
        }
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            const isOpen = sidebar.classList.toggle('mobile-open');
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
            document.body.style.overflow = '';
        }
    }

    /* ==========================================
       NAVIGATION
       ========================================== */
    navigateTo(page) {
        this.currentPage = page;

        // Update bottom bar active state
        document.querySelectorAll('.bottom-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page visibility
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `${page}-page`);
        });

        this.closeMobileMenu();
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        switch (this.currentPage) {
            case 'home':
                this.renderHome();
                break;
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'canais':
                this.renderCanaisPage();
                break;
            case 'hunter':
                // Hunter page is mostly static
                break;
            case 'config':
                this.renderSettings();
                break;
        }
    }

    /* ==========================================
       HOME PAGE
       ========================================== */
    renderHome() {
        // Render channels grid on home
        this.renderHomeChannels();

        // Render production metrics
        const metrics = this.dataManager.getMetrics();
        document.getElementById('homePlanning').textContent = metrics.planejamento;
        document.getElementById('homeProduction').textContent = metrics.producao;
        document.getElementById('homeReady').textContent = metrics.finalizado;
        document.getElementById('homePosted').textContent = metrics.postado;

        // Setup quick actions
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.nav;
                if (page) this.navigateTo(page);
            });
        });

        // Setup home create channel button
        const btnHomeCriarCanal = document.getElementById('btnHomeCriarCanal');
        if (btnHomeCriarCanal) {
            btnHomeCriarCanal.replaceWith(btnHomeCriarCanal.cloneNode(true));
            const newBtn = document.getElementById('btnHomeCriarCanal');
            newBtn.addEventListener('click', () => this.openChannelModal());
        }
    }

    renderHomeChannels() {
        const container = document.getElementById('homeChannelsGrid');
        if (!container) return;

        const channels = this.dataManager.channels;

        if (channels.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📺</div>
                    <p>Nenhum canal criado ainda.<br>Comece criando seu primeiro canal!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = channels.map(channel => {
            const videos = this.dataManager.getChannelVideos(channel.id);
            const totalVideos = videos.length;
            const postedVideos = videos.filter(v => v.stage === 'postado').length;

            const avatarContent = channel.avatar
                ? `<img src="${channel.avatar}" alt="${this.escapeHtml(channel.name)}">`
                : '📺';

            return `
                <div class="home-channel-card" data-channel-id="${channel.id}">
                    <div class="home-channel-avatar">
                        ${avatarContent}
                    </div>
                    <div class="home-channel-info">
                        <div class="home-channel-name">${this.escapeHtml(channel.name)}</div>
                        <div class="home-channel-stats">${totalVideos} vídeos • ${postedVideos} postados</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners
        container.querySelectorAll('.home-channel-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectChannel(card.dataset.channelId);
            });
        });
    }

    /* ==========================================
       CHANNEL MODAL
       ========================================== */
    setupChannelModal() {
        const btnAddChannel = document.getElementById('btnAddChannel');
        const btnCriarCanalMobile = document.getElementById('btnCriarCanalMobile');
        const btnCloseChannel = document.getElementById('btnCloseChannelModal');
        const btnCancelChannel = document.getElementById('btnCancelChannelModal');
        const btnSaveChannel = document.getElementById('btnSaveChannel');

        if (btnAddChannel) {
            btnAddChannel.addEventListener('click', () => {
                this.openChannelModal();
            });
        }

        if (btnCriarCanalMobile) {
            btnCriarCanalMobile.addEventListener('click', () => {
                this.openChannelModal();
            });
        }

        if (btnCloseChannel) {
            btnCloseChannel.addEventListener('click', () => {
                this.closeChannelModal();
            });
        }

        if (btnCancelChannel) {
            btnCancelChannel.addEventListener('click', () => {
                this.closeChannelModal();
            });
        }

        if (btnSaveChannel) {
            btnSaveChannel.addEventListener('click', () => {
                this.saveChannel();
            });
        }

        // Enter key to save
        const channelName = document.getElementById('channelName');
        if (channelName) {
            channelName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveChannel();
                }
            });
        }

        // Avatar upload
        const btnSelectAvatar = document.getElementById('btnSelectAvatar');
        const btnRemoveAvatar = document.getElementById('btnRemoveAvatar');
        const avatarInput = document.getElementById('channelAvatarInput');

        if (btnSelectAvatar) {
            btnSelectAvatar.addEventListener('click', () => {
                avatarInput?.click();
            });
        }

        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleChannelAvatar(file);
            });
        }

        if (btnRemoveAvatar) {
            btnRemoveAvatar.addEventListener('click', () => {
                this.clearChannelAvatar();
            });
        }
    }

    handleChannelAvatar(file) {
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            this.showToast('Imagem muito grande! Max: 2MB', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showToast('Arquivo deve ser uma imagem', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayChannelAvatar(e.target.result);
            this.showToast('Avatar carregado!', 'success');
        };
        reader.onerror = () => {
            this.showToast('Erro ao carregar imagem', 'error');
        };
        reader.readAsDataURL(file);
    }

    displayChannelAvatar(base64) {
        const img = document.getElementById('channelAvatarImage');
        const placeholder = document.getElementById('channelAvatarPlaceholder');
        const btnRemove = document.getElementById('btnRemoveAvatar');

        if (img) {
            img.src = base64;
            img.style.display = 'block';
        }
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        if (btnRemove) {
            btnRemove.style.display = 'inline-flex';
        }
    }

    clearChannelAvatar() {
        const img = document.getElementById('channelAvatarImage');
        const placeholder = document.getElementById('channelAvatarPlaceholder');
        const btnRemove = document.getElementById('btnRemoveAvatar');
        const input = document.getElementById('channelAvatarInput');

        if (img) {
            img.src = '';
            img.style.display = 'none';
        }
        if (placeholder) {
            placeholder.style.display = 'block';
        }
        if (btnRemove) {
            btnRemove.style.display = 'none';
        }
        if (input) {
            input.value = '';
        }
    }

    openChannelModal() {
        const modal = document.getElementById('channelModal');
        const input = document.getElementById('channelName');

        if (input) input.value = '';
        this.clearChannelAvatar();

        if (modal) {
            modal.classList.add('active');
            setTimeout(() => input?.focus(), 100);
        }
    }

    closeChannelModal() {
        const modal = document.getElementById('channelModal');
        if (modal) modal.classList.remove('active');
    }

    saveChannel() {
        const name = document.getElementById('channelName')?.value.trim();

        if (!name) {
            this.showToast('Digite um nome para o canal', 'error');
            return;
        }

        // Get avatar if uploaded
        const avatarImg = document.getElementById('channelAvatarImage');
        const avatar = avatarImg && avatarImg.src && avatarImg.src.startsWith('data:')
            ? avatarImg.src
            : '';

        const channel = this.dataManager.addChannel(name, avatar);
        this.showToast(`Canal "${name}" criado!`, 'success');
        this.closeChannelModal();
        this.renderChannelsList();

        // Update pages
        if (this.currentPage === 'canais') {
            this.renderCanaisPage();
        } else if (this.currentPage === 'home') {
            this.renderHomeChannels();
        }

        this.selectChannel(channel.id);
    }

    deleteChannel(channelId) {
        const channel = this.dataManager.getChannel(channelId);
        if (!channel) return;

        const videosCount = this.dataManager.getChannelVideos(channelId).length;
        const message = videosCount > 0
            ? `Excluir "${channel.name}" e seus ${videosCount} vídeo(s)?`
            : `Excluir canal "${channel.name}"?`;

        if (!confirm(message)) return;

        this.dataManager.deleteChannel(channelId);
        this.showToast('Canal excluído', 'success');

        if (this.selectedChannel === channelId) {
            this.selectedChannel = null;
        }

        this.renderChannelsList();

        // Update canais page if we're on it, otherwise update dashboard
        if (this.currentPage === 'canais') {
            this.renderCanaisPage();
        } else {
            this.renderDashboard();
        }
    }

    selectChannel(channelId) {
        this.selectedChannel = channelId;
        this.renderChannelsList();
        this.navigateTo('dashboard');
    }

    renderChannelsList() {
        const container = document.getElementById('channelsList');
        if (!container) return;

        const channels = this.dataManager.channels;

        if (channels.length === 0) {
            container.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: #64748b; font-size: 0.875rem;">
                    Nenhum canal ainda.<br>Clique no + acima
                </div>
            `;
            return;
        }

        container.innerHTML = channels.map(channel => `
            <div class="channel-item ${this.selectedChannel === channel.id ? 'active' : ''}" data-channel-id="${channel.id}">
                <div class="channel-item-content">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                    </svg>
                    <span class="channel-item-name">${this.escapeHtml(channel.name)}</span>
                </div>
                <button class="btn-delete-channel" data-channel-id="${channel.id}" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add listeners
        container.querySelectorAll('.channel-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.btn-delete-channel')) return;
                this.selectChannel(item.dataset.channelId);
            });
        });

        container.querySelectorAll('.btn-delete-channel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChannel(btn.dataset.channelId);
            });
        });
    }

    /* ==========================================
       CANAIS PAGE
       ========================================== */
    renderCanaisPage() {
        const container = document.getElementById('canaisGrid');
        if (!container) return;

        const channels = this.dataManager.channels;

        if (channels.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📺</div>
                    <p>Nenhum canal criado ainda.<br>Clique no botão acima para criar seu primeiro canal!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = channels.map(channel => {
            const videos = this.dataManager.getChannelVideos(channel.id);
            const totalVideos = videos.length;
            const postedVideos = videos.filter(v => v.stage === 'postado').length;

            const avatarContent = channel.avatar
                ? `<img src="${channel.avatar}" alt="${this.escapeHtml(channel.name)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:0.75rem;">`
                : '<span style="margin-right:0.75rem;">📺</span>';

            return `
                <div class="canal-card ${this.selectedChannel === channel.id ? 'active' : ''}" data-channel-id="${channel.id}">
                    <div class="canal-card-header">
                        <div class="canal-card-name" style="display:flex;align-items:center;">
                            ${avatarContent}
                            ${this.escapeHtml(channel.name)}
                        </div>
                        <button class="btn-icon btn-delete-channel" data-channel-id="${channel.id}" title="Excluir canal">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="canal-card-stats">
                        <div class="canal-stat">
                            <span class="canal-stat-value">${totalVideos}</span>
                            <span class="canal-stat-label">Total</span>
                        </div>
                        <div class="canal-stat">
                            <span class="canal-stat-value">${postedVideos}</span>
                            <span class="canal-stat-label">Postados</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners to select channel
        container.querySelectorAll('.canal-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-delete-channel')) return;
                this.selectChannel(card.dataset.channelId);
            });
        });

        // Add delete listeners
        container.querySelectorAll('.btn-delete-channel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChannel(btn.dataset.channelId);
            });
        });
    }

    /* ==========================================
       DASHBOARD
       ========================================== */
    renderDashboard() {
        const metrics = this.dataManager.getMetrics();

        // Update metrics cards
        const metricCards = {
            'metricPlanning': metrics.planejamento,
            'metricProduction': metrics.producao,
            'metricReady': metrics.finalizado,
            'metricPosted': metrics.postado
        };

        Object.entries(metricCards).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        // Show/hide "Novo Vídeo" button based on selected channel
        const btnNovoVideo = document.getElementById('btnNovoVideo');
        const dashboardTitle = document.getElementById('dashboardTitle');
        const dashboardSubtitle = document.getElementById('dashboardSubtitle');

        if (this.selectedChannel) {
            const channel = this.dataManager.getChannel(this.selectedChannel);
            if (channel) {
                if (btnNovoVideo) btnNovoVideo.style.display = 'inline-flex';
                if (dashboardTitle) dashboardTitle.textContent = `📺 ${channel.name}`;
                if (dashboardSubtitle) dashboardSubtitle.textContent = 'Gerencie os vídeos deste canal';
            }
        } else {
            if (btnNovoVideo) btnNovoVideo.style.display = 'none';
            if (dashboardTitle) dashboardTitle.textContent = 'Dashboard';
            if (dashboardSubtitle) dashboardSubtitle.textContent = 'Selecione um canal para começar';
        }

        this.renderVideos();
    }

    renderVideos() {
        const container = document.getElementById('videosList');
        if (!container) return;

        let videos = this.selectedChannel
            ? this.dataManager.getChannelVideos(this.selectedChannel)
            : this.dataManager.videos;

        // Sort by creation date (newest first)
        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const count = document.getElementById('videosCount');
        if (count) count.textContent = `${videos.length} ${videos.length === 1 ? 'vídeo' : 'vídeos'}`;

        if (videos.length === 0) {
            if (this.selectedChannel) {
                // Tem canal selecionado mas sem vídeos - mostrar botão grande
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎬</div>
                        <h3 style="color: var(--slate-200); margin-bottom: 0.5rem;">Canal sem vídeos</h3>
                        <p style="margin-bottom: 2rem;">Comece criando seu primeiro vídeo para este canal!</p>
                        <button class="btn btn-primary btn-lg" id="btnCriarPrimeiroVideo" style="font-size: 1.125rem;">
                            <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                            </svg>
                            Criar Primeiro Vídeo
                        </button>
                    </div>
                `;
                // Add listener to the button
                setTimeout(() => {
                    const btn = document.getElementById('btnCriarPrimeiroVideo');
                    if (btn) {
                        btn.addEventListener('click', () => this.openVideoModal());
                    }
                }, 0);
            } else {
                // Nenhum canal selecionado
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎬</div>
                        <p>Nenhum vídeo ainda.<br>Selecione um canal na barra lateral ou crie um novo!</p>
                    </div>
                `;
            }
            return;
        }

        container.innerHTML = videos.map(video => this.renderVideoCard(video)).join('');

        // Add click listeners
        container.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openVideoModal(card.dataset.id);
            });
        });

        // Checkbox listeners
        container.querySelectorAll('.checklist-item input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const videoId = checkbox.closest('.video-card').dataset.id;
                const checkKey = checkbox.dataset.check;
                this.updateCheckbox(videoId, checkKey, checkbox.checked);
            });
        });
    }

    renderVideoCard(video) {
        const progress = this.dataManager.getProgress(video);
        const checklist = video.checklist || {};
        const channel = this.dataManager.getChannel(video.channelId);
        const channelName = channel ? channel.name : 'Sem canal';

        const statusLabels = {
            planejamento: '📋 Planejamento',
            producao: '🎬 Produção',
            finalizado: '✅ Finalizado',
            postado: '🚀 Postado'
        };

        return `
            <div class="video-card status-${video.stage}" data-id="${video.id}">
                <div class="video-card-header">
                    <div>
                        <div class="video-title">${this.escapeHtml(video.title)}</div>
                        <div class="video-channel">📺 ${this.escapeHtml(channelName)}</div>
                    </div>
                    <div class="video-status status-${video.stage}">
                        ${statusLabels[video.stage]}
                    </div>
                </div>
                <div class="video-progress-bar">
                    <div class="video-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="video-checklist">
                    <label class="checklist-item ${checklist.script ? 'completed' : ''}">
                        <input type="checkbox" data-check="script" ${checklist.script ? 'checked' : ''}>
                        <span>📝 Roteiro</span>
                    </label>
                    <label class="checklist-item ${checklist.audio ? 'completed' : ''}">
                        <input type="checkbox" data-check="audio" ${checklist.audio ? 'checked' : ''}>
                        <span>🎙️ Áudio</span>
                    </label>
                    <label class="checklist-item ${checklist.thumb ? 'completed' : ''}">
                        <input type="checkbox" data-check="thumb" ${checklist.thumb ? 'checked' : ''}>
                        <span>📷 Thumb</span>
                    </label>
                    <label class="checklist-item ${checklist.edit ? 'completed' : ''}">
                        <input type="checkbox" data-check="edit" ${checklist.edit ? 'checked' : ''}>
                        <span>✂️ Edição</span>
                    </label>
                    <label class="checklist-item ${checklist.upload ? 'completed' : ''}">
                        <input type="checkbox" data-check="upload" ${checklist.upload ? 'checked' : ''}>
                        <span>☁️ Upload</span>
                    </label>
                </div>
            </div>
        `;
    }

    updateCheckbox(videoId, checkKey, value) {
        const previousPostedCount = this.dataManager.getPostedVideosCount();

        this.dataManager.updateChecklist(videoId, checkKey, value);

        const newPostedCount = this.dataManager.getPostedVideosCount();

        // Check if a video was just marked as posted (upload checkbox)
        if (checkKey === 'upload' && value && newPostedCount > previousPostedCount) {
            this.gamificationManager.updateBadge();
        }

        this.renderDashboard();
        this.showToast('Status atualizado!', 'success');
    }

    /* ==========================================
       VIDEO MODAL (Super Modal)
       ========================================== */
    setupVideoModal() {
        const btnClose = document.getElementById('btnCloseModal');
        const btnCancel = document.getElementById('btnCancelModal');
        const btnSave = document.getElementById('btnSaveVideo');
        const btnDelete = document.getElementById('btnDeleteVideo');
        const btnCopyScript = document.getElementById('btnCopyScript');

        if (btnClose) btnClose.addEventListener('click', () => this.closeVideoModal());
        if (btnCancel) btnCancel.addEventListener('click', () => this.closeVideoModal());
        if (btnSave) btnSave.addEventListener('click', () => this.saveVideo());
        if (btnDelete) btnDelete.addEventListener('click', () => this.deleteVideo());
        if (btnCopyScript) btnCopyScript.addEventListener('click', () => this.copyScript());

        const btnConvertSRT = document.getElementById('btnConvertSRT');
        if (btnConvertSRT) btnConvertSRT.addEventListener('click', () => this.convertScriptToSRT());

        // Script word count & duration
        const scriptInput = document.getElementById('videoScript');
        if (scriptInput) {
            scriptInput.addEventListener('input', () => {
                this.updateScriptStats();
            });
        }
    }

    updateScriptStats() {
        const script = document.getElementById('videoScript')?.value || '';
        const words = script.trim().split(/\s+/).filter(w => w.length > 0).length;
        const duration = Math.ceil(words / 150); // ~150 words per minute

        const wordCount = document.getElementById('scriptWordCount');
        const durationEl = document.getElementById('scriptDuration');

        if (wordCount) wordCount.textContent = `${words} palavras`;
        if (durationEl) durationEl.textContent = `~${duration}min`;
    }

    openVideoModal(videoId = null) {
        const modal = document.getElementById('videoModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('btnDeleteVideo');

        if (videoId) {
            // Edit mode
            const video = this.dataManager.getVideo(videoId);
            this.currentVideoId = videoId;
            if (modalTitle) modalTitle.textContent = 'Editar Vídeo';
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';

            document.getElementById('videoTitle').value = video.title || '';
            document.getElementById('videoDescription').value = video.description || '';
            document.getElementById('videoScript').value = video.script || '';

            if (video.thumbnail) {
                this.displayThumbnailPreview(video.thumbnail);
            } else {
                this.clearThumbnail();
            }

            if (video.audioFile) {
                this.displayAudioPlayer(video.audioFile);
            } else {
                this.clearAudio();
            }
        } else {
            // Create mode
            if (!this.selectedChannel) {
                this.showToast('Selecione um canal primeiro', 'error');
                return;
            }

            this.currentVideoId = null;
            if (modalTitle) modalTitle.textContent = 'Novo Vídeo';
            if (deleteBtn) deleteBtn.style.display = 'none';

            document.getElementById('videoTitle').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoScript').value = '';
            this.clearThumbnail();
            this.clearAudio();
        }

        this.updateScriptStats();
        if (modal) modal.classList.add('active');
    }

    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        if (modal) modal.classList.remove('active');
        this.currentVideoId = null;
    }

    saveVideo() {
        if (!this.selectedChannel) {
            this.showToast('Selecione um canal primeiro', 'error');
            return;
        }

        const title = document.getElementById('videoTitle')?.value.trim();

        if (!title) {
            this.showToast('Digite um título para o vídeo', 'error');
            return;
        }

        const thumbnailImg = document.getElementById('thumbnailImage');
        const thumbnail = thumbnailImg?.src && thumbnailImg.src.startsWith('data:')
            ? thumbnailImg.src
            : '';

        const audioPlayer = document.getElementById('audioPlayer');
        const audioFile = audioPlayer?.src && audioPlayer.src.startsWith('data:')
            ? audioPlayer.src
            : '';

        const videoData = {
            channelId: this.selectedChannel,
            title,
            description: document.getElementById('videoDescription')?.value.trim() || '',
            script: document.getElementById('videoScript')?.value.trim() || '',
            thumbnail,
            audioFile
        };

        if (this.currentVideoId) {
            this.dataManager.updateVideo(this.currentVideoId, videoData);
            this.showToast('Vídeo atualizado!', 'success');
        } else {
            this.dataManager.addVideo(videoData);
            this.showToast('Vídeo criado!', 'success');
        }

        this.closeVideoModal();
        this.renderDashboard();
    }

    deleteVideo() {
        if (!confirm('Excluir este vídeo?')) return;

        this.dataManager.deleteVideo(this.currentVideoId);
        this.showToast('Vídeo excluído', 'success');
        this.closeVideoModal();
        this.renderDashboard();
        this.gamificationManager.updateBadge();
    }

    copyScript() {
        const script = document.getElementById('videoScript')?.value.trim();
        if (!script) {
            this.showToast('Roteiro vazio', 'error');
            return;
        }

        navigator.clipboard.writeText(script).then(() => {
            this.showToast('Roteiro copiado!', 'success');
        }).catch(() => {
            this.showToast('Erro ao copiar', 'error');
        });
    }

    convertScriptToSRT() {
        const script = document.getElementById('videoScript')?.value.trim();
        if (!script) {
            this.showToast('Roteiro vazio', 'error');
            return;
        }

        const videoTitle = document.getElementById('videoTitle')?.value.trim() || 'roteiro';

        // Divide o roteiro em linhas/parágrafos
        const lines = script.split('\n').filter(line => line.trim().length > 0);

        // Configurações para geração do SRT
        const secondsPerLine = 5; // Cada linha dura aproximadamente 5 segundos
        let srtContent = '';
        let currentTime = 0;

        lines.forEach((line, index) => {
            const sequenceNumber = index + 1;
            const startTime = this.formatSRTTime(currentTime);
            const endTime = this.formatSRTTime(currentTime + secondsPerLine);

            srtContent += `${sequenceNumber}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${line.trim()}\n\n`;

            currentTime += secondsPerLine;
        });

        // Criar e baixar arquivo SRT
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Arquivo SRT baixado!', 'success');
    }

    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    /* ==========================================
       THUMBNAIL UPLOAD
       ========================================== */
    setupThumbnailUpload() {
        const dropzone = document.getElementById('thumbnailDropzone');
        const input = document.getElementById('thumbnailInput');
        const btnRemove = document.getElementById('btnRemoveThumbnail');

        if (!dropzone || !input) return;

        dropzone.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleThumbnailFile(file);
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleThumbnailFile(file);
            }
        });

        if (btnRemove) {
            btnRemove.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearThumbnail();
            });
        }
    }

    handleThumbnailFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showToast('Imagem muito grande! Max: 5MB', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showToast('Arquivo deve ser uma imagem', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayThumbnailPreview(e.target.result);
            this.showToast('Thumbnail carregada!', 'success');
        };
        reader.onerror = () => {
            this.showToast('Erro ao carregar imagem', 'error');
        };
        reader.readAsDataURL(file);
    }

    displayThumbnailPreview(base64) {
        const dropzone = document.getElementById('thumbnailDropzone');
        const preview = document.getElementById('thumbnailPreview');
        const img = document.getElementById('thumbnailImage');

        if (img) img.src = base64;
        if (dropzone) dropzone.style.display = 'none';
        if (preview) preview.style.display = 'block';
    }

    clearThumbnail() {
        const dropzone = document.getElementById('thumbnailDropzone');
        const preview = document.getElementById('thumbnailPreview');
        const img = document.getElementById('thumbnailImage');
        const input = document.getElementById('thumbnailInput');

        if (img) img.src = '';
        if (input) input.value = '';
        if (dropzone) dropzone.style.display = 'flex';
        if (preview) preview.style.display = 'none';
    }

    /* ==========================================
       AUDIO UPLOAD
       ========================================== */
    setupAudioUpload() {
        const input = document.getElementById('audioInput');
        const btnRemoveAudio = document.getElementById('btnRemoveAudio');

        if (input) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleAudioFile(file);
            });
        }

        if (btnRemoveAudio) {
            btnRemoveAudio.addEventListener('click', () => {
                this.clearAudio();
                this.showToast('Áudio removido', 'success');
            });
        }
    }

    handleAudioFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            this.showToast('Áudio muito grande! Max: 50MB', 'error');
            return;
        }

        // Aceitar formatos específicos de áudio
        const validTypes = [
            'audio/mpeg',        // MP3
            'audio/mp3',         // MP3 (alternativo)
            'audio/wav',         // WAV
            'audio/wave',        // WAV (alternativo)
            'audio/x-wav',       // WAV (alternativo)
            'audio/x-m4a',       // M4A
            'audio/mp4',         // M4A (alternativo)
            'audio/ogg',         // OGG
            'audio/aac',         // AAC
            'audio/x-aac'        // AAC (alternativo)
        ];

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'aac'];

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            this.showToast('Formato não suportado! Use: MP3, WAV, M4A, OGG ou AAC', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayAudioPlayer(e.target.result);
            this.showToast(`Áudio carregado! (${file.name})`, 'success');
        };
        reader.onerror = () => {
            this.showToast('Erro ao carregar áudio', 'error');
        };
        reader.readAsDataURL(file);
    }

    displayAudioPlayer(base64) {
        const player = document.getElementById('audioPlayer');
        const container = document.getElementById('audioPlayerContainer');

        if (player) {
            player.src = base64;
        }
        if (container) {
            container.style.display = 'block';
        }
    }

    clearAudio() {
        const player = document.getElementById('audioPlayer');
        const container = document.getElementById('audioPlayerContainer');
        const input = document.getElementById('audioInput');

        if (player) {
            player.src = '';
        }
        if (container) {
            container.style.display = 'none';
        }
        if (input) {
            input.value = '';
        }
    }

    /* ==========================================
       GEMINI AI FEATURES
       ========================================== */
    setupGeminiFeatures() {
        const btnOptimize = document.getElementById('btnOptimizeTitle');
        const btnAnalyze = document.getElementById('btnAnalyzeThumb');

        if (btnOptimize) {
            btnOptimize.addEventListener('click', () => this.optimizeTitle());
        }

        if (btnAnalyze) {
            btnAnalyze.addEventListener('click', () => this.analyzeThumbnail());
        }
    }

    async optimizeTitle() {
        if (!this.geminiService) {
            this.showToast('Configure a Gemini API Key primeiro!', 'error');
            this.navigateTo('config');
            return;
        }

        const titleInput = document.getElementById('videoTitle');
        const currentTitle = titleInput?.value.trim();

        if (!currentTitle) {
            this.showToast('Digite um título primeiro', 'error');
            return;
        }

        const btn = document.getElementById('btnOptimizeTitle');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Otimizando...';
        }

        try {
            const suggestions = await this.geminiService.optimizeTitle(currentTitle);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="ai-icon">✨</span> Otimizar Título com IA';
            }

            // Show suggestions in alert (could be a modal in production)
            const message = `Sugestões de Títulos Otimizados:\n\n${suggestions}\n\nDeseja usar a primeira sugestão?`;
            if (confirm(message)) {
                const firstSuggestion = suggestions.split('\n')[0].trim();
                if (titleInput) titleInput.value = firstSuggestion;
                this.showToast('Título atualizado!', 'success');
            }
        } catch (error) {
            console.error('Optimize title error:', error);
            this.showToast('Erro ao otimizar título', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="ai-icon">✨</span> Otimizar Título com IA';
            }
        }
    }

    async analyzeThumbnail() {
        if (!this.geminiService) {
            this.showToast('Configure a Gemini API Key primeiro!', 'error');
            this.navigateTo('config');
            return;
        }

        const img = document.getElementById('thumbnailImage');
        const thumbnail = img?.src;

        if (!thumbnail || !thumbnail.startsWith('data:')) {
            this.showToast('Carregue uma thumbnail primeiro', 'error');
            return;
        }

        const btn = document.getElementById('btnAnalyzeThumb');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Analisando...';
        }

        try {
            const analysis = await this.geminiService.analyzeThumbnail(thumbnail);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="ai-icon">🔍</span> Analisar Thumbnail com IA';
            }

            // Show analysis
            alert(`Análise da Thumbnail:\n\n${analysis}`);
            this.showToast('Análise concluída!', 'success');
        } catch (error) {
            console.error('Analyze thumbnail error:', error);
            this.showToast('Erro ao analisar thumbnail', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="ai-icon">🔍</span> Analisar Thumbnail com IA';
            }
        }
    }

    /* ==========================================
       CHANNEL HUNTER
       ========================================== */
    setupChannelHunter() {
        const btnSearch = document.getElementById('btnHunterSearch');

        if (btnSearch) {
            btnSearch.addEventListener('click', () => this.searchChannelHunter());
        }
    }

    async searchChannelHunter() {
        if (!this.youtubeService) {
            this.showToast('Configure a YouTube API Key primeiro!', 'error');
            this.navigateTo('config');
            return;
        }

        const query = document.getElementById('hunterQuery')?.value.trim();

        if (!query) {
            this.showToast('Digite uma palavra-chave', 'error');
            return;
        }

        const resultsContainer = document.getElementById('hunterResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:#64748b;">🔍 Buscando canais...</p>';
        }

        const btn = document.getElementById('btnHunterSearch');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Buscando...';
        }

        try {
            const results = await this.youtubeService.searchChannels(query);

            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg> Buscar Canais';
            }

            if (results.length === 0) {
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:#64748b;">Nenhum resultado encontrado</p>';
                }
                return;
            }

            if (resultsContainer) {
                resultsContainer.innerHTML = results.map(result => `
                    <div class="hunter-result-card">
                        <div class="hunter-result-header">
                            <img src="${result.thumbnail}" alt="Thumb" class="hunter-result-thumb">
                            <div class="hunter-result-info">
                                <h4 class="hunter-result-title">${this.escapeHtml(result.title)}</h4>
                                <p class="hunter-result-channel">📺 ${this.escapeHtml(result.channelTitle)}</p>
                                <p class="hunter-result-date">📅 ${new Date(result.publishedAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <div class="hunter-result-stats">
                            <div class="hunter-stat">
                                <span class="hunter-stat-label">👁️ Views</span>
                                <span class="hunter-stat-value">${this.formatNumber(result.views)}</span>
                            </div>
                            <div class="hunter-stat">
                                <span class="hunter-stat-label">👥 Inscritos</span>
                                <span class="hunter-stat-value">${this.formatNumber(result.subscribers)}</span>
                            </div>
                            <div class="hunter-stat hunter-viral-score">
                                <span class="hunter-stat-label">🔥 Score Viral</span>
                                <span class="hunter-stat-value">${result.viralScore}</span>
                            </div>
                        </div>
                        <a href="https://youtube.com/watch?v=${result.videoId}" target="_blank" class="btn btn-primary" style="width:100%;margin-top:1rem;">
                            Ver no YouTube →
                        </a>
                    </div>
                `).join('');
            }

            this.showToast(`${results.length} resultados encontrados!`, 'success');
        } catch (error) {
            console.error('Channel Hunter error:', error);
            this.showToast('Erro na busca. Verifique sua API Key', 'error');
            if (resultsContainer) {
                resultsContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:#ef4444;">⚠️ Erro ao buscar. Verifique sua API Key nas configurações.</p>';
            }
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg> Buscar Canais';
            }
        }
    }

    /* ==========================================
       SETTINGS
       ========================================== */
    setupSettings() {
        const btnSaveYT = document.getElementById('btnSaveYouTubeKey');
        const btnSaveGemini = document.getElementById('btnSaveGeminiKey');
        const btnClearData = document.getElementById('btnClearData');

        if (btnSaveYT) {
            btnSaveYT.addEventListener('click', () => this.saveYouTubeKey());
        }

        if (btnSaveGemini) {
            btnSaveGemini.addEventListener('click', () => this.saveGeminiKey());
        }

        if (btnClearData) {
            btnClearData.addEventListener('click', () => this.clearAllData());
        }
    }

    renderSettings() {
        const ytInput = document.getElementById('youtubeApiKey');
        const geminiInput = document.getElementById('geminiApiKey');

        if (ytInput) ytInput.value = this.dataManager.settings.youtubeApiKey || '';
        if (geminiInput) geminiInput.value = this.dataManager.settings.geminiApiKey || '';
    }

    saveYouTubeKey() {
        const apiKey = document.getElementById('youtubeApiKey')?.value.trim();

        if (!apiKey) {
            this.showToast('Digite uma API Key válida', 'error');
            return;
        }

        this.dataManager.settings.youtubeApiKey = apiKey;
        this.dataManager.saveSettings();
        this.youtubeService = new YouTubeService(apiKey);
        this.showToast('YouTube API Key salva!', 'success');
    }

    saveGeminiKey() {
        const apiKey = document.getElementById('geminiApiKey')?.value.trim();

        if (!apiKey) {
            this.showToast('Digite uma API Key válida', 'error');
            return;
        }

        this.dataManager.settings.geminiApiKey = apiKey;
        this.dataManager.saveSettings();
        this.geminiService = new GeminiService(apiKey);
        this.showToast('Gemini API Key salva!', 'success');
    }

    clearAllData() {
        if (confirm('ATENÇÃO! Isso irá apagar TODOS os dados. Tem certeza?')) {
            localStorage.clear();
            location.reload();
        }
    }

    /* ==========================================
       UTILITIES
       ========================================== */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 0.9375rem;
            font-weight: 500;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

/* ==========================================
   INITIALIZE APPLICATION
   ========================================== */
const dataManager = new DataManager();
const gamificationManager = new GamificationManager(dataManager);
const app = new UIManager(dataManager, gamificationManager);

console.log('🚀 Roteirista v2.0 - Empire Mode');
console.log('✅ Mobile First + Gamification + AI Integration');
