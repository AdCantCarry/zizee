import { marked } from 'marked';

export class UIManager {
  constructor(appElement, knowledgeStore, zizeeEngine) {
    this.app = appElement;
    this.knowledgeStore = knowledgeStore;
    this.zizeeEngine = zizeeEngine;
    this.currentTab = 'chat';
    this.isDarkMode = true;
    this.currentChatAttachment = null;
    this.selectedAgent = 'smart'; // 'smart' | 'speed' | 'deep' | 'news' | 'global'
    
    this.chatHistory = [
      {
        sender: 'zizee',
        text: `Chào bạn! Mình là **Zizee** - Trợ Lý AI Đa Năng của bạn! 🚀

Hệ thống của mình tích hợp **5 Động cơ AI chuyên môn** để hỗ trợ bạn trong mọi lĩnh vực:
- 🌟 **Zizee Smart** (Gemini / Groq): Trợ lý thông minh giải đáp mọi thắc mắc, viết lách và sáng tạo nội dung.
- ⚡ **Zizee Speed** (Groq Llama 3.3 70B): Trợ lý siêu tốc phân tích dữ liệu, tóm tắt tài liệu lớn trong 1 giây.
- 🧠 **Zizee DeepReason** (DeepSeek R1 / AIML): Trợ lý tư duy sâu giải quyết bài toán phức tạp & lập luận logic.
- 📰 **Zizee News** (NewsAPI): Điểm tin thời sự real-time & chuyển thành bài viết truyền thông.
- 🌍 **Zizee Global** (RestCountries): Tra cứu thông tin mọi quốc gia, địa lý & quốc kỳ thế giới.

Bạn cần Zizee hỗ trợ công việc gì hôm nay?`
      }
    ];

    this.renderMainLayout();
    this.attachEventListeners();
    this.updateKnowledgeUI();
    this.loadNewsFeed();
  }

  renderMainLayout() {
    const keys = this.zizeeEngine.getApiKeys();

    this.app.innerHTML = `
      <!-- TOP HEADER NAVBAR -->
      <header class="glass-header">
        <div class="header-nav">
          <div class="brand-badge">
            <div class="brand-logo">z</div>
            <div class="brand-title">
              <h1>Zizee AI Assistant</h1>
              <div class="brand-subtitle">
                <span class="status-dot"></span>
                <span>Trợ Lý Cá Nhân Thông Minh Đa Mô Hình</span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div class="agent-status-pill" style="background: var(--color-primary-light); border: 1px solid var(--color-primary-border); padding: 6px 14px; border-radius: var(--radius-sm); font-size: 0.82rem; color: var(--color-primary); display: flex; align-items: center; gap: 6px; font-weight: 600;">
              <span>🤖 5 AI Engines:</span>
              <span style="color: #10b981;">● Sẵn sàng</span>
            </div>

            <button id="openApiKeyModalBtn" class="btn btn-secondary" style="display:flex; align-items:center; gap:8px; font-size:0.85rem;" title="Cấu hình API Keys">
              <span>🔑 Cấu Hình API Keys</span>
            </button>
            <button id="themeToggleBtn" class="btn btn-secondary" title="Đổi giao diện">
              <span id="themeIcon">🌙</span>
            </button>
            <button id="resetDataBtn" class="btn btn-secondary" title="Đặt lại dữ liệu ban đầu">
              <span>🔄 Reset</span>
            </button>
          </div>
        </div>
      </header>

      <!-- MAIN CONTAINER -->
      <div class="layout-container">
        <!-- SIDEBAR NAVIGATION -->
        <aside class="sidebar glass-panel" style="margin: 16px; padding: 16px; border-radius: var(--radius-lg); height: calc(100vh - 102px); display: flex; flex-direction: column; justify-content: space-between; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="padding: 8px 12px; font-size: 0.75rem; font-weight: 700; color: var(--text-dim); letter-spacing: 0.05em; text-transform: uppercase;">
              CHỨC NĂNG CHÍNH
            </div>

            <button class="nav-item active" data-tab="chat">
              <span style="display:flex; align-items:center; gap:10px;">💬 <strong>Trợ Lý Chat AI</strong></span>
            </button>

            <button class="nav-item" data-tab="news">
              <span style="display:flex; align-items:center; gap:10px;">📰 <strong>Điểm Tin Thời Sự</strong></span>
            </button>

            <button class="nav-item" data-tab="countries">
              <span style="display:flex; align-items:center; gap:10px;">🌍 <strong>Tra Cứu Quốc Tế</strong></span>
            </button>

            <button class="nav-item" data-tab="training">
              <span style="display:flex; align-items:center; gap:10px;">🎓 <strong>Bộ Nhớ & Dạy AI</strong></span>
            </button>

            <button class="nav-item" data-tab="templates">
              <span style="display:flex; align-items:center; gap:10px;">📜 <strong>Studio Soạn Thảo</strong></span>
            </button>
          </div>

          <!-- SIDEBAR FOOTER CARD -->
          <div style="background: var(--color-primary-light); border: 1px solid var(--color-primary-border); padding: 14px; border-radius: var(--radius-md); font-size: 0.82rem; margin-top: 16px;">
            <div style="font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">🧠 Bộ Nhớ Kiến Thức</div>
            <div style="color: var(--text-muted); font-size: 0.78rem;" id="sidebarMemoryText">
              Đã sẵn sàng học tài liệu của bạn.
            </div>
          </div>
        </aside>

        <!-- MAIN WORKSPACE -->
        <main class="workspace" style="padding: 16px 16px 16px 0; display: flex; flex-direction: column;">
          
          <!-- TAB 1: CHAT WITH ZIZEE MULTI-AGENT -->
          <section id="tab-chat" class="tab-content active" style="height: 100%; padding: 0;">
            <div class="glass-panel chat-container" style="display:flex; flex-direction:column; height:100%;">
              
              <!-- ELEGANT AGENT SELECTOR BAR -->
              <div class="agent-selector-bar" style="padding: 12px 16px; background: var(--bg-input); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <span>🎯 ĐỘNG CƠ AI DÙNG TRẢ LỜI:</span>
                </div>

                <div class="agent-buttons-grid" style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="agent-btn active" data-agent="smart" title="Smart AI General Purpose">
                    🌟 <strong>Zizee Smart</strong>
                  </button>
                  <button class="agent-btn" data-agent="speed" title="Superfast Groq Llama 3.3">
                    ⚡ <strong>Zizee Speed</strong> <small>(Groq 70B)</small>
                  </button>
                  <button class="agent-btn" data-agent="deep" title="Deep Logic Reasoner">
                    🧠 <strong>Zizee DeepReason</strong>
                  </button>
                  <button class="agent-btn" data-agent="news" title="NewsAPI Intelligence">
                    📰 <strong>Zizee News</strong>
                  </button>
                  <button class="agent-btn" data-agent="global" title="RestCountries World Info">
                    🌍 <strong>Zizee Global</strong>
                  </button>
                </div>
              </div>

              <!-- CHAT MESSAGES STREAM -->
              <div class="chat-messages" id="chatMessages"></div>

              <!-- CHAT INPUT AREA -->
              <div class="chat-input-wrapper">
                <div class="quick-chips">
                  <button class="chip-btn" data-prompt="Viết một bài đăng Facebook/Fanpage thu hút về chủ đề Chuyển đổi số">📢 Bài đăng Fanpage/Facebook</button>
                  <button class="chip-btn" data-prompt="Viết email gửi khách hàng cảm ơn và hẹn lịch trao đổi công việc">✉️ Soạn Email chuyên nghiệp</button>
                  <button class="chip-btn" data-prompt="Cập nhật những điểm tin công nghệ và AI nổi bật mới nhất">📰 Tin tức công nghệ mới nhất</button>
                  <button class="chip-btn" data-prompt="Tra cứu thông tin tổng quan đất nước Nhật Bản">🌍 Tra cứu Nhật Bản</button>
                </div>

                <!-- FILE ATTACHMENT BADGE PREVIEW -->
                <div id="chatAttachmentBadge" style="display: none; margin-bottom: 8px; padding: 6px 12px; background: var(--color-primary-light); border: 1px solid var(--color-primary-border); border-radius: var(--radius-md); font-size: 0.82rem; color: var(--color-primary); align-items: center; justify-content: space-between;">
                  <span style="display: flex; align-items: center; gap: 6px;">
                    📄 <strong id="chatAttachmentName">CV_2886.pdf</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(Zizee sẽ phân tích tệp này trong câu trả lời)</span>
                  </span>
                  <button type="button" id="removeChatAttachmentBtn" style="background: none; border: none; color: #ef4444; font-weight: 700; cursor: pointer; padding: 0 4px;">✕ Hủy</button>
                </div>

                <form id="chatForm" class="chat-input-box">
                  <input type="file" id="chatFileInput" accept=".pdf,.docx,.txt,.md,.json,.csv" style="display: none;" />
                  <button type="button" class="btn btn-secondary" id="attachFileBtn" title="📎 Đính kèm tệp văn bản (PDF, Word, TXT...)" style="padding: 10px 14px; font-size: 1.1rem; border-radius: var(--radius-md);">
                    📎
                  </button>
                  <input type="text" id="chatInput" placeholder="Nhập câu hỏi hoặc nhấn 📎 đính kèm file để Zizee hỗ trợ..." autocomplete="off" />
                  <button type="submit" class="btn btn-primary" style="padding: 10px 20px;">
                    <span>Gửi</span> 🚀
                  </button>
                </form>
              </div>
            </div>
          </section>

          <!-- TAB 2: NEWSAPI PRESS INTELLIGENCE -->
          <section id="tab-news" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                <div>
                  <h2 style="font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    📰 ĐIỂM TIN THỜI SỰ REAL-TIME (NewsAPI)
                  </h2>
                  <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
                    Cập nhật tin tức xã hội, công nghệ, kinh tế nóng hổi và biến thành nội dung chia sẻ truyền thông với 1-click.
                  </p>
                </div>

                <div style="display: flex; gap: 8px;">
                  <input type="text" id="newsSearchInput" placeholder="Nhập từ khóa tìm tin..." style="padding: 8px 14px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-main); font-size: 0.88rem; min-width: 240px;" />
                  <button class="btn btn-primary" id="btnSearchNews">🔍 Tìm Tin</button>
                </div>
              </div>

              <!-- NEWS FEED GRID -->
              <div id="newsGrid" class="news-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-top: 20px;">
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 30px;">⚡ Đang tải các điểm tin mới nhất...</div>
              </div>
            </div>
          </section>

          <!-- TAB 3: RESTCOUNTRIES GLOBAL INTELLIGENCE -->
          <section id="tab-countries" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <div style="margin-bottom: 20px;">
                <h2 style="font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                  🌍 TRA CỨU QUỐC TẾ & ĐỊA LÝ THẾ GIỚI (RestCountries API)
                </h2>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
                  Tra cứu thông tin quốc gia, thủ đô, dân số, tiền tệ, quốc kỳ và tạo bản tóm tắt địa lý với AI.
                </p>
              </div>

              <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <input type="text" id="countrySearchInput" placeholder="Nhập tên quốc gia (Ví dụ: Việt Nam, Japan, USA, France, Germany...)" style="flex: 1; min-width: 260px; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-main); font-family: inherit;" />
                <button class="btn btn-primary" id="btnSearchCountry">🌍 Tra Cứu</button>
              </div>

              <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="chip-btn country-quick-btn" data-country="Vietnam">🇻🇳 Việt Nam</button>
                <button class="chip-btn country-quick-btn" data-country="Japan">🇯🇵 Nhật Bản</button>
                <button class="chip-btn country-quick-btn" data-country="United States">🇺🇸 Hoa Kỳ</button>
                <button class="chip-btn country-quick-btn" data-country="France">🇫🇷 Pháp</button>
                <button class="chip-btn country-quick-btn" data-country="South Korea">🇰🇷 Hàn Quốc</button>
                <button class="chip-btn country-quick-btn" data-country="United Kingdom">🇬🇧 Anh Quốc</button>
                <button class="chip-btn country-quick-btn" data-country="Germany">🇩🇪 Đức</button>
              </div>

              <div id="countryResultBox"></div>
            </div>
          </section>

          <!-- TAB 4: DẠY AI -->
          <section id="tab-training" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div>
                  <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 10px;">
                    🎓 BỘ NHỚ & DẠY ZIZEE
                  </h2>
                  <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                    Tải tệp văn bản, tài liệu, quy trình (PDF, DOCX, TXT, MD, JSON, CSV) để Zizee ghi nhớ và trả lời câu hỏi dựa trên tài liệu của bạn.
                  </p>
                </div>
              </div>

              <!-- STATS OVERVIEW -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value" id="statDocCount">0</div>
                  <div class="stat-label">Tài Liệu Đã Học</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value" id="statKbSize">0 KB</div>
                  <div class="stat-label">Dung Lượng Bộ Nhớ</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value" style="color: var(--color-primary);">Active</div>
                  <div class="stat-label">Động Cơ AI</div>
                </div>
              </div>

              <!-- DROPZONE FILE UPLOADER -->
              <div id="dropzone" class="dropzone">
                <div class="dropzone-icon">📥</div>
                <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 6px;">Kéo & Thả tệp văn bản vào đây để DẠY Zizee</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">Hỗ trợ định dạng: <strong>.PDF, .DOCX, .TXT, .MD, .JSON, .CSV</strong> (Đọc trực tiếp 100% ở Client-side)</p>
                <input type="file" id="fileInput" accept=".pdf,.docx,.txt,.md,.json,.csv" style="display: none;" />
                <button type="button" class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                  📂 Chọn Tệp Từ Máy Tính
                </button>
              </div>

              <!-- UPLOAD PROGRESS NOTIFICATION -->
              <div id="uploadStatus" style="display: none; margin-top: 16px; padding: 14px; background: var(--color-primary-light); border: 1px solid var(--color-primary-border); border-radius: var(--radius-md); font-weight: 600; color: var(--color-primary); align-items: center; gap: 10px;">
                <span class="status-dot"></span>
                <span id="uploadStatusText">Zizee đang đọc tệp và trích xuất thông tin...</span>
              </div>

              <!-- LEARNED KNOWLEDGE BASE LIST -->
              <div style="margin-top: 36px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <h3 style="font-size: 1.15rem; font-weight: 700;">📚 KHO TÀI LIỆU ZIZEE ĐÃ ĐƯỢC NẠP</h3>
                  
                  <div style="display: flex; gap: 10px;">
                    <input type="text" id="searchKbInput" placeholder="Tìm kiếm tài liệu đã nạp..." style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: var(--radius-sm); color: var(--text-main); font-size: 0.85rem;" />
                  </div>
                </div>

                <div id="knowledgeGrid" class="knowledge-grid"></div>
              </div>

            </div>
          </section>

          <!-- TAB 5: STUDIO SOẠN THẢO VĂN BẢN DA NANG -->
          <section id="tab-templates" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 8px;">📜 STUDIO SOẠN THẢO VĂN BẢN & NỘI DUNG</h2>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                Tự động tạo mẫu văn bản theo yêu cầu và xuất tệp Word (.doc) chuẩn khổ giấy A4.
              </p>

              <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="btn btn-primary" id="btnGenDocTotrinh">📜 Mẫu Tờ Trình / Đề Xuất</button>
                <button class="btn btn-secondary" id="btnGenDocThongbao">📢 Mẫu Thông Báo / Thông Tin</button>
                <button class="btn btn-secondary" id="btnGenDocCongvan">✉️ Mẫu Thư Ngỏ / Công Văn</button>
              </div>

              <div id="docPreviewContainer"></div>
            </div>
          </section>

        </main>
      </div>

      <!-- MULTI-API KEYS CONFIG MODAL -->
      <div id="apiKeyModal" class="modal-backdrop" style="display: none;">
        <div class="modal-box glass-panel" style="max-width: 620px; width: 92%; padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--color-primary-border); position: relative; max-height: 90vh; overflow-y: auto;">
          <button id="closeApiKeyModalBtn" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);">✕</button>
          <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; display: flex; align- items: center; gap: 8px;">
            🔑 Quản Lý 5 API Keys Của Bạn
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 18px;">
            Hệ thống đã tích hợp sẵn tất cả các API Keys của bạn. Bạn có thể kiểm tra hoặc cập nhật lại bên dưới:
          </p>

          <div class="key-field-group" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px;">
            
            <!-- 1. GROQ (SUPERFAST WORKING) -->
            <div class="key-item-card" style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-weight: 700; font-size: 0.85rem;">⚡ Groq API Key (Zizee Speed Llama 3.3 70B):</label>
                <button type="button" class="btn btn-secondary btn-test-single" data-provider="groq" style="padding: 3px 10px; font-size: 0.76rem;">⚡ Kiểm Tra</button>
              </div>
              <input type="password" id="keyInput_groq" placeholder="Nhập Groq Key..." value="${keys.groq || ''}" style="width: 100%; padding: 8px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main); font-family: monospace; font-size: 0.85rem;" />
              <div id="testStatus_groq" style="font-size: 0.78rem; margin-top: 4px; display: none;"></div>
            </div>

            <!-- 2. GEMINI -->
            <div class="key-item-card" style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-weight: 700; font-size: 0.85rem;">🌟 Google Gemini API Key (Zizee Smart):</label>
                <button type="button" class="btn btn-secondary btn-test-single" data-provider="gemini" style="padding: 3px 10px; font-size: 0.76rem;">⚡ Kiểm Tra</button>
              </div>
              <input type="password" id="keyInput_gemini" placeholder="AIzaSy..." value="${keys.gemini || ''}" style="width: 100%; padding: 8px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main); font-family: monospace; font-size: 0.85rem;" />
              <div id="testStatus_gemini" style="font-size: 0.78rem; margin-top: 4px; display: none;"></div>
            </div>

            <!-- 3. NEWSAPI -->
            <div class="key-item-card" style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-weight: 700; font-size: 0.85rem;">📰 NewsAPI Key (Zizee News Điểm Tin):</label>
                <button type="button" class="btn btn-secondary btn-test-single" data-provider="news" style="padding: 3px 10px; font-size: 0.76rem;">⚡ Kiểm Tra</button>
              </div>
              <input type="password" id="keyInput_news" placeholder="Key newsapi..." value="${keys.news || ''}" style="width: 100%; padding: 8px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main); font-family: monospace; font-size: 0.85rem;" />
              <div id="testStatus_news" style="font-size: 0.78rem; margin-top: 4px; display: none;"></div>
            </div>

            <!-- 4. RESTCOUNTRIES -->
            <div class="key-item-card" style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-weight: 700; font-size: 0.85rem;">🌍 RestCountries API Key (Zizee Global):</label>
                <button type="button" class="btn btn-secondary btn-test-single" data-provider="restcountries" style="padding: 3px 10px; font-size: 0.76rem;">⚡ Kiểm Tra</button>
              </div>
              <input type="password" id="keyInput_restcountries" placeholder="rc_live_..." value="${keys.restcountries || ''}" style="width: 100%; padding: 8px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main); font-family: monospace; font-size: 0.85rem;" />
              <div id="testStatus_restcountries" style="font-size: 0.78rem; margin-top: 4px; display: none;"></div>
            </div>

            <!-- 5. AIMLAPI -->
            <div class="key-item-card" style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-weight: 700; font-size: 0.85rem;">🧠 AIMLAPI Key (Zizee DeepReason):</label>
                <button type="button" class="btn btn-secondary btn-test-single" data-provider="aiml" style="padding: 3px 10px; font-size: 0.76rem;">⚡ Kiểm Tra</button>
              </div>
              <input type="password" id="keyInput_aiml" placeholder="Key aimlapi..." value="${keys.aiml || ''}" style="width: 100%; padding: 8px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main); font-family: monospace; font-size: 0.85rem;" />
              <div id="testStatus_aiml" style="font-size: 0.78rem; margin-top: 4px; display: none;"></div>
            </div>

          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="modalSaveAllKeysBtn" class="btn btn-primary" style="padding: 10px 20px;">
              💾 Lưu Tất Cả Keys
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderChatMessages();
  }

  attachEventListeners() {
    // API Modal Listeners
    const openModalBtn = document.getElementById('openApiKeyModalBtn');
    const closeModalBtn = document.getElementById('closeApiKeyModalBtn');
    const modal = document.getElementById('apiKeyModal');
    const saveAllKeysBtn = document.getElementById('modalSaveAllKeysBtn');

    if (openModalBtn && modal) {
      openModalBtn.addEventListener('click', () => modal.style.display = 'flex');
    }
    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    // Key test buttons
    const testBtns = document.querySelectorAll('.btn-test-single');
    testBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const provider = btn.getAttribute('data-provider');
        const input = document.getElementById(`keyInput_${provider}`);
        const statusEl = document.getElementById(`testStatus_${provider}`);

        if (!input || !statusEl) return;

        statusEl.style.display = 'block';
        statusEl.style.color = 'var(--text-dim)';
        statusEl.innerHTML = '⚡ <em>Đang kiểm tra...</em>';

        const result = await this.zizeeEngine.testApiKey(provider, input.value);
        if (result.success) {
          statusEl.style.color = '#10b981';
          statusEl.innerHTML = `🟢 <strong>Thành công!</strong> ${result.model}`;
        } else {
          statusEl.style.color = '#ef4444';
          statusEl.innerHTML = `🔴 <strong>Lỗi:</strong> ${result.error}`;
        }
      });
    });

    if (saveAllKeysBtn && modal) {
      saveAllKeysBtn.addEventListener('click', () => {
        const providers = ['gemini', 'groq', 'aiml', 'news', 'restcountries'];
        providers.forEach(p => {
          const val = (document.getElementById(`keyInput_${p}`)?.value || '').trim();
          this.zizeeEngine.setApiKey(p, val);
        });
        modal.style.display = 'none';
        alert('Đã cập nhật các API Keys thành công! 🚀');
      });
    }

    // Theme Toggle Listener
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('light-theme', !this.isDarkMode);
        document.getElementById('themeIcon').innerText = this.isDarkMode ? '🌙' : '☀️';
      });
    }

    // Reset Data Listener
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đặt lại bộ nhớ Zizee về mặc định không?')) {
          this.knowledgeStore.resetToDefault();
          this.updateKnowledgeUI();
          alert('Đã khôi phục dữ liệu mặc định thành công! 🚀');
        }
      });
    }

    // Navigation Listeners
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tabKey = item.getAttribute('data-tab');
        this.switchTab(tabKey);
      });
    });

    // Agent Selector Buttons
    const agentBtns = document.querySelectorAll('.agent-btn');
    agentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        agentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const agentName = btn.getAttribute('data-agent');
        this.selectedAgent = agentName;
        this.zizeeEngine.setActiveAgent(agentName);
      });
    });

    // Chat Attachment Listeners
    const attachBtn = document.getElementById('attachFileBtn');
    const chatFileInput = document.getElementById('chatFileInput');
    const removeAttachmentBtn = document.getElementById('removeChatAttachmentBtn');

    if (attachBtn && chatFileInput) {
      attachBtn.addEventListener('click', () => chatFileInput.click());

      chatFileInput.addEventListener('change', async () => {
        if (chatFileInput.files && chatFileInput.files.length > 0) {
          const file = chatFileInput.files[0];
          try {
            const parsedDoc = await this.knowledgeStore.addFileDocument(file);
            this.currentChatAttachment = parsedDoc;
            
            const badge = document.getElementById('chatAttachmentBadge');
            const nameEl = document.getElementById('chatAttachmentName');
            if (badge && nameEl) {
              nameEl.innerText = file.name;
              badge.style.display = 'flex';
            }
          } catch (e) {
            alert('Không thể đọc tệp văn bản này. Vui lòng thử lại với tệp PDF, DOCX, TXT khác.');
          }
        }
      });
    }

    if (removeAttachmentBtn) {
      removeAttachmentBtn.addEventListener('click', () => {
        this.currentChatAttachment = null;
        const badge = document.getElementById('chatAttachmentBadge');
        if (badge) badge.style.display = 'none';
        if (chatFileInput) chatFileInput.value = '';
      });
    }

    // Chat Form Submission
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text && !this.currentChatAttachment) return;

        input.value = '';
        await this.handleUserMessage(text || 'Phân tích tệp đính kèm và tổng hợp thông tin.');
      });
    }

    // Quick Action Chips
    const chips = document.querySelectorAll('.chip-btn');
    chips.forEach(chip => {
      chip.addEventListener('click', async () => {
        const promptText = chip.getAttribute('data-prompt');
        await this.handleUserMessage(promptText);
      });
    });

    // News Search
    const btnSearchNews = document.getElementById('btnSearchNews');
    const newsSearchInput = document.getElementById('newsSearchInput');
    if (btnSearchNews && newsSearchInput) {
      btnSearchNews.addEventListener('click', async () => {
        await this.loadNewsFeed(newsSearchInput.value.trim());
      });
      newsSearchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') await this.loadNewsFeed(newsSearchInput.value.trim());
      });
    }

    // Country Search
    const btnSearchCountry = document.getElementById('btnSearchCountry');
    const countrySearchInput = document.getElementById('countrySearchInput');
    if (btnSearchCountry && countrySearchInput) {
      btnSearchCountry.addEventListener('click', async () => {
        await this.handleCountrySearch(countrySearchInput.value.trim());
      });
      countrySearchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') await this.handleCountrySearch(countrySearchInput.value.trim());
      });
    }

    const countryQuickBtns = document.querySelectorAll('.country-quick-btn');
    countryQuickBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const country = btn.getAttribute('data-country');
        if (countrySearchInput) countrySearchInput.value = country;
        await this.handleCountrySearch(country);
      });
    });

    // File Upload & Drag-Drop listeners
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    if (dropzone && fileInput) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await this.processFileUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', async () => {
        if (fileInput.files && fileInput.files.length > 0) {
          await this.processFileUpload(fileInput.files[0]);
        }
      });
    }

    // Search Knowledge Input
    const searchInput = document.getElementById('searchKbInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const results = this.knowledgeStore.searchKnowledge(query);
        this.renderKnowledgeCards(results);
      });
    }

    // Template Studio Generators
    const btnTotrinh = document.getElementById('btnGenDocTotrinh');
    if (btnTotrinh) {
      btnTotrinh.addEventListener('click', async () => {
        this.switchTab('chat');
        await this.handleUserMessage('Soạn thảo mẫu Tờ Trình Đề Xuất Công Việc chi tiết');
      });
    }

    const btnThongbao = document.getElementById('btnGenDocThongbao');
    if (btnThongbao) {
      btnThongbao.addEventListener('click', async () => {
        this.switchTab('chat');
        await this.handleUserMessage('Soạn thảo mẫu Thông Báo Quan Trọng chuyên nghiệp');
      });
    }

    const btnCongvan = document.getElementById('btnGenDocCongvan');
    if (btnCongvan) {
      btnCongvan.addEventListener('click', async () => {
        this.switchTab('chat');
        await this.handleUserMessage('Soạn thảo Thư Ngỏ / Công Văn trao đổi hợp tác');
      });
    }
  }

  switchTab(tabKey) {
    this.currentTab = tabKey;

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabKey);
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === `tab-${tabKey}`);
    });
  }

  async handleUserMessage(userText) {
    let fullPromptText = userText;
    let displayUserText = userText;

    if (this.currentChatAttachment) {
      displayUserText = `📎 **[Tệp đính kèm: ${this.currentChatAttachment.title}]**\n\n${userText}`;
      fullPromptText = `--- TỆP ĐÍNH KÈM TỪ NGƯỜI DÙNG: ${this.currentChatAttachment.title} ---\n${this.currentChatAttachment.content}\n-----------------------------------\nYÊU CẦU CỦA NGƯỜI DÙNG: ${userText}`;
      
      this.currentChatAttachment = null;
      const badge = document.getElementById('chatAttachmentBadge');
      if (badge) badge.style.display = 'none';
      const chatFileInput = document.getElementById('chatFileInput');
      if (chatFileInput) chatFileInput.value = '';
    }

    // 1. Append User Message
    this.chatHistory.push({ sender: 'user', text: displayUserText });
    this.renderChatMessages();

    // Show loading typing indicator
    const agentLabels = {
      smart: '🌟 Zizee Smart',
      speed: '⚡ Zizee Speed (Groq Llama 3.3)',
      deep: '🧠 Zizee DeepReason',
      news: '📰 Zizee News',
      global: '🌍 Zizee Global'
    };
    const currentLabel = agentLabels[this.selectedAgent] || '🤖 Zizee AI';

    const typingMsg = { sender: 'zizee', text: `🤖 *${currentLabel} đang suy nghĩ và soạn phản hồi...*` };
    this.chatHistory.push(typingMsg);
    this.renderChatMessages();

    // 2. Process through zizeeEngine with selected Agent
    const responseText = await this.zizeeEngine.processUserMessage(fullPromptText, { 
      agent: this.selectedAgent,
      chatHistory: this.chatHistory 
    });
    
    // Remove typing indicator & push real response
    this.chatHistory.pop();
    this.chatHistory.push({ sender: 'zizee', text: responseText });
    this.renderChatMessages();
  }

  renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    container.innerHTML = this.chatHistory.map((msg, index) => {
      const isUser = msg.sender === 'user';
      const parsedText = marked.parse(msg.text);

      return `
        <div class="chat-bubble ${isUser ? 'user' : 'zizee'}">
          <div id="chat-msg-body-${index}">${parsedText}</div>
          ${!isUser && msg.text && !msg.text.includes('Zizee đang suy nghĩ') ? `
            <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 8px;">
              <button class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.76rem;" onclick="navigator.clipboard.writeText(document.getElementById('chat-msg-body-${index}').innerText); alert('Đã sao chép văn bản!');">📋 Sao chép</button>
              <button class="btn btn-primary" style="padding: 3px 8px; font-size: 0.76rem;" onclick="window.exportElementToWord('chat-msg-body-${index}', 'Noi_Dung_Zizee_${index+1}.doc')">📄 Xuất Word (.doc)</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  // --- NEWS FEED INTEGRATION ---
  async loadNewsFeed(query = '') {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return;

    newsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 30px;">⚡ Đang tải các điểm tin thời sự mới nhất...</div>`;

    const articles = await this.zizeeEngine.fetchNews(query);
    
    if (!articles || articles.length === 0) {
      newsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 30px;">Không tìm thấy bài báo nào. Vui lòng thử lại với từ khóa khác.</div>`;
      return;
    }

    newsGrid.innerHTML = articles.map((art) => `
      <div class="news-card glass-panel" style="padding: 18px; display: flex; flex-direction: column; justify-content: space-between; border-radius: var(--radius-md);">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--color-primary); font-weight: 700; margin-bottom: 8px;">
            <span>${art.source?.name || 'Tin Thời Sự'}</span>
            <span>${new Date(art.publishedAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <h4 style="font-size: 0.98rem; font-weight: 700; margin-bottom: 8px; line-height: 1.35; color: var(--text-main);">${art.title}</h4>
          <p style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 14px; line-height: 1.4;">${art.description || 'Bài báo cập nhật tin tức xã hội & công nghệ mới nhất.'}</p>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: space-between; gap: 8px;">
          <a href="${art.url}" target="_blank" rel="noopener" class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.78rem;">🔗 Đọc Bài Gốc</a>
          <button class="btn btn-primary btn-convert-fanpage" data-title="${encodeURIComponent(art.title)}" style="padding: 5px 10px; font-size: 0.78rem;">💬 Tóm Tắt & Viết Bài</button>
        </div>
      </div>
    `).join('');

    const convertBtns = newsGrid.querySelectorAll('.btn-convert-fanpage');
    convertBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const title = decodeURIComponent(btn.getAttribute('data-title'));
        this.switchTab('chat');
        this.selectedAgent = 'news';
        this.zizeeEngine.setActiveAgent('news');
        await this.handleUserMessage(`Tóm tắt nội dung bài báo sau và viết thành 1 bài chia sẻ bài viết thu hút: "${title}"`);
      });
    });
  }

  // --- RESTCOUNTRIES COUNTRY PROFILE HANDLER ---
  async handleCountrySearch(countryQuery) {
    const container = document.getElementById('countryResultBox');
    if (!container || !countryQuery) return;

    container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 30px;">⚡ Zizee đang tải thông tin quốc gia...</div>`;

    const country = await this.zizeeEngine.fetchCountryInfo(countryQuery);
    if (!country) {
      container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px;">Không tìm thấy thông tin quốc gia "${countryQuery}". Vui lòng thử lại.</div>`;
      return;
    }

    const officialName = country.name?.official || country.name?.common || countryQuery;
    const commonName = country.name?.common || countryQuery;
    const capital = country.capital?.[0] || 'N/A';
    const region = country.region || 'N/A';
    const population = country.population ? country.population.toLocaleString('vi-VN') + ' người' : 'N/A';
    const flagUrl = country.flags?.png || country.flags?.svg || '';

    container.innerHTML = `
      <div class="glass-panel" style="padding: 24px; border-radius: var(--radius-lg); margin-top: 16px;">
        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
          ${flagUrl ? `<img src="${flagUrl}" alt="Flag" style="width: 110px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />` : ''}
          <div>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">${commonName}</h3>
            <p style="font-size: 0.9rem; color: var(--color-primary); font-weight: 600;">${officialName}</p>
          </div>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
          <div class="stat-card">
            <div class="stat-value" style="font-size: 1.1rem; color: var(--text-main);">🏛️ ${capital}</div>
            <div class="stat-label">Thủ Đô</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size: 1.1rem; color: var(--text-main);">🗺️ ${region}</div>
            <div class="stat-label">Khu Vực Địa Lý</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size: 1.1rem; color: var(--text-main);">👥 ${population}</div>
            <div class="stat-label">Dân Số</div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn btn-primary" id="btnAskAiAboutCountry">🤖 Hỏi Zizee Về Đất Nước Này</button>
        </div>
      </div>
    `;

    const askBtn = document.getElementById('btnAskAiAboutCountry');
    if (askBtn) {
      askBtn.addEventListener('click', async () => {
        this.switchTab('chat');
        this.selectedAgent = 'global';
        this.zizeeEngine.setActiveAgent('global');
        await this.handleUserMessage(`Giới thiệu tổng quan về văn hóa, lịch sử và điểm nổi bật của đất nước ${commonName}`);
      });
    }
  }

  // Handle Client-Side Static File Upload
  async processFileUpload(file) {
    const statusBox = document.getElementById('uploadStatus');
    const statusText = document.getElementById('uploadStatusText');

    if (statusBox && statusText) {
      statusBox.style.display = 'flex';
      statusText.innerHTML = `Zizee đang đọc tệp <strong>${file.name}</strong> và ghi nhớ vào bộ não AI... 🧠`;
    }

    try {
      const newDoc = await this.knowledgeStore.addFileDocument(file);
      
      setTimeout(() => {
        if (statusText) {
          statusText.innerHTML = `✨ Zizee đã nạp thành công tài liệu <strong>"${newDoc.title}"</strong> vào bộ nhớ AI!`;
        }
        this.updateKnowledgeUI();
      }, 1000);

    } catch (err) {
      console.error('File parsing error:', err);
      if (statusText) {
        statusText.innerHTML = `⚠️ Lỗi khi đọc tệp văn bản. Vui lòng kiểm tra định dạng tệp.`;
      }
    }
  }

  updateKnowledgeUI() {
    const docs = this.knowledgeStore.getDocuments();

    const countEl = document.getElementById('statDocCount');
    const kbSizeEl = document.getElementById('statKbSize');
    const sidebarText = document.getElementById('sidebarMemoryText');

    if (countEl) countEl.innerText = docs.length;

    let totalChars = docs.reduce((acc, d) => acc + (d.content ? d.content.length : 0), 0);
    let sizeKb = (totalChars / 1024).toFixed(1) + ' KB';
    if (kbSizeEl) kbSizeEl.innerText = sizeKb;

    if (sidebarText) {
      sidebarText.innerText = `Đã học ${docs.length} tài liệu (${sizeKb}).`;
    }

    this.renderKnowledgeCards(docs);
  }

  renderKnowledgeCards(docs) {
    const grid = document.getElementById('knowledgeGrid');
    if (!grid) return;

    if (docs.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 40px;">Chưa có tài liệu nào. Bạn hãy tải tệp lên phía trên để DẠY Zizee nhé!</div>`;
      return;
    }

    grid.innerHTML = docs.map(doc => `
      <div class="knowledge-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <span class="badge badge-primary">${doc.category}</span>
            <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: 700;">${doc.fileType} (${doc.fileSize})</span>
          </div>
          <h4 style="font-weight: 700; font-size: 0.98rem; color: var(--text-main); margin-bottom: 6px; line-height: 1.3;">${doc.title}</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">${doc.summary}</p>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">🟢 Đã lưu vào AI</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.78rem;" onclick="window.viewDocContent('${doc.id}')">👁️ Xem</button>
            ${!doc.isDefault ? `<button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.78rem; color: #ef4444;" onclick="window.deleteDocItem('${doc.id}')">🗑️ Xóa</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    window.viewDocContent = (id) => {
      const doc = this.knowledgeStore.getDocumentById(id);
      if (doc) {
        alert(`📄 TIÊU ĐỀ: ${doc.title}\n\n📝 NỘI DUNG ĐÃ HỌC:\n${doc.content.substring(0, 800)}...`);
      }
    };

    window.deleteDocItem = (id) => {
      if (confirm('Bạn có muốn xóa tài liệu này khỏi bộ nhớ không?')) {
        this.knowledgeStore.deleteDocument(id);
        this.updateKnowledgeUI();
      }
    };
  }

  renderDocPreview(markdownContent) {
    const container = document.getElementById('docPreviewContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 12px;">
        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('docTextPreview').innerText); alert('Đã sao chép văn bản!');">📋 Sao chép Text</button>
        <button class="btn btn-primary" onclick="window.exportElementToWord('docTextPreview', 'Van_Ban_Zizee.doc')">📄 Xuất File Word (.doc A4)</button>
      </div>
      <div id="docTextPreview" class="chat-bubble zizee" style="max-width: 100%;">
        ${marked.parse(markdownContent)}
      </div>
    `;
  }
}

// Global Export to Word Engine
window.exportElementToWord = function(elementId, filename = 'Van_Ban_Zizee.doc') {
  const element = document.getElementById(elementId);
  if (!element) return;

  let rawHtml = element.innerHTML;
  rawHtml = rawHtml
    .replace(/<pre><code>/gi, '<div class="admin-doc-content">')
    .replace(/<\/code><\/pre>/gi, '</div>')
    .replace(/```markdown/gi, '')
    .replace(/```/gi, '');

  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
                        xmlns:w='urn:schemas-microsoft-com:office:word' 
                        xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>Xuất văn bản Word</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page WordSection1 {
        size: 21.0cm 29.7cm;
        margin: 2.0cm 2.0cm 2.0cm 2.5cm;
      }
      div.WordSection1 { page: WordSection1; }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt;
        line-height: 1.4;
        color: #000000;
      }
      h1, h2, h3, h4 { font-family: 'Times New Roman', Times, serif; font-weight: bold; }
      p { margin-bottom: 6pt; margin-top: 0; text-align: justify; white-space: pre-wrap; }
      .admin-doc-content { font-family: 'Times New Roman', Times, serif; font-size: 13pt; white-space: pre-wrap; line-height: 1.4; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
      td, th { border: 1px solid #ddd; padding: 6px 8px; font-size: 13pt; vertical-align: top; }
    </style>
  </head>
  <body>
    <div class="WordSection1">
      ${rawHtml}
    </div>
  </body>
  </html>`;

  const blob = new Blob(['\ufeff', header], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
