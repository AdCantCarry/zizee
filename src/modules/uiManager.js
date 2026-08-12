import { marked } from 'marked';

export class UIManager {
  constructor(appElement, knowledgeStore, zizeeEngine) {
    this.app = appElement;
    this.knowledgeStore = knowledgeStore;
    this.zizeeEngine = zizeeEngine;
    this.currentTab = 'chat';
    this.isDarkMode = true;
    this.currentChatAttachment = null;
    this.chatHistory = [
      {
        sender: 'zizee',
        text: `Chào **Sếp**! zizee đã sẵn sàng đồng hành cùng Sếp xử lý công việc và tạo văn bản! 🚀

Sếp có thể yêu cầu zizee thực hiện ngay các công việc:
- 📜 Soạn thảo văn bản hành chính chuẩn **Nghị định 30** (Tờ trình, Thông báo, Công văn, Hợp đồng giao khoán).
- 📢 Viết tin bài **Fanpage Dịch vụ công** ngắn gọn, thu hút và chuẩn hashtags.
- 📊 Tổng hợp **báo cáo giao ban tiến độ công việc** đọc nhanh trong 1 phút.
- 🎓 **Dạy zizee**: Tải tệp văn bản mẫu lên để zizee ghi nhớ và học hỏi phong cách của Sếp!

Sếp cần zizee hỗ trợ công việc gì ngay bây giờ ạ?`
      }
    ];

    this.renderMainLayout();
    this.attachEventListeners();
    this.updateKnowledgeUI();
  }

  renderMainLayout() {
    this.app.innerHTML = `
      <!-- TOP HEADER NAVBAR -->
      <header class="glass-header">
        <div class="header-nav">
          <div class="brand-badge">
            <div class="brand-logo">z</div>
            <div class="brand-title">
              <h1>zizee</h1>
              <div class="brand-subtitle">
                <span class="status-dot"></span>
                <span>Trung tâm Cung ứng Dịch vụ công Phường Đông Hưng Thuận</span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
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
        <aside class="sidebar glass-panel" style="margin: 16px; padding: 16px; border-radius: var(--radius-lg); height: calc(100vh - 102px); display: flex; flex-direction: column; justify-content: space-between;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="padding: 8px 12px; font-size: 0.75rem; font-weight: 700; color: var(--text-dim); letter-spacing: 0.05em; text-transform: uppercase;">
              DANH MỤC CHỨC NĂNG
            </div>

            <button class="nav-item active" data-tab="chat">
              <span style="display:flex; align-items:center; gap:8px;">💬 Trợ Lý zizee</span>
            </button>

            <button class="nav-item" data-tab="training">
              <span style="display:flex; align-items:center; gap:8px;">🎓 Dạy zizee (Tải văn bản)</span>
            </button>

            <button class="nav-item" data-tab="templates">
              <span style="display:flex; align-items:center; gap:8px;">📜 Mẫu Nghị Định 30</span>
            </button>

            <button class="nav-item" data-tab="fanpage">
              <span style="display:flex; align-items:center; gap:8px;">📢 Viết Tin Fanpage</span>
            </button>

            <button class="nav-item" data-tab="report">
              <span style="display:flex; align-items:center; gap:8px;">📊 Báo Cáo Giao Ban</span>
            </button>
          </div>

          <!-- SIDEBAR FOOTER CARD -->
          <div style="background: var(--color-primary-light); border: 1px solid var(--color-primary-border); padding: 14px; border-radius: var(--radius-md); font-size: 0.82rem;">
            <div style="font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">🧠 Bộ Nhớ zizee</div>
            <div style="color: var(--text-muted); font-size: 0.78rem;" id="sidebarMemoryText">
              Đã sẵn sàng ghi nhớ văn bản.
            </div>
          </div>
        </aside>

        <!-- MAIN WORKSPACE -->
        <main class="workspace" style="padding: 16px 16px 16px 0; display: flex; flex-direction: column;">
          
          <!-- TAB 1: CHAT WITH ZIZEE -->
          <section id="tab-chat" class="tab-content active" style="height: 100%; padding: 0;">
            <div class="glass-panel chat-container">
              <!-- CHAT MESSAGES STREAM -->
              <div class="chat-messages" id="chatMessages"></div>

              <!-- CHAT INPUT AREA -->
              <div class="chat-input-wrapper">
                <div class="quick-chips">
                  <button class="chip-btn" data-prompt="Soạn Tờ trình xin kinh phí nâng cấp Cổng Dịch vụ công Phường Đông Hưng Thuận theo Nghị định 30">📜 Soạn Tờ trình Nghị định 30</button>
                  <button class="chip-btn" data-prompt="Viết tin bài đăng Fanpage thông báo nộp hồ sơ dịch vụ công trực tuyến tuần này">📢 Bài đăng Fanpage Dịch vụ công</button>
                  <button class="chip-btn" data-prompt="Tổng hợp Báo cáo giao ban tiến độ xử lý 150 hồ sơ thủ tục hành chính">📊 Báo cáo giao ban 1 phút</button>
                </div>

                <!-- FILE ATTACHMENT BADGE PREVIEW -->
                <div id="chatAttachmentBadge" style="display: none; margin-bottom: 8px; padding: 6px 12px; background: var(--color-primary-light); border: 1px solid var(--color-primary-border); border-radius: var(--radius-md); font-size: 0.82rem; color: var(--color-primary); align-items: center; justify-content: space-between;">
                  <span style="display: flex; align-items: center; gap: 6px;">
                    📄 <strong id="chatAttachmentName">CV_2886.pdf</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(zizee sẽ phân tích tệp này trong câu hỏi)</span>
                  </span>
                  <button type="button" id="removeChatAttachmentBtn" style="background: none; border: none; color: #ef4444; font-weight: 700; cursor: pointer; padding: 0 4px;">✕ Hủy</button>
                </div>

                <form id="chatForm" class="chat-input-box">
                  <input type="file" id="chatFileInput" accept=".pdf,.docx,.txt,.md,.json,.csv" style="display: none;" />
                  <button type="button" class="btn btn-secondary" id="attachFileBtn" title="📎 Đính kèm tệp văn bản (PDF, Word, TXT...)" style="padding: 10px 14px; font-size: 1.1rem; border-radius: var(--radius-md);">
                    📎
                  </button>
                  <input type="text" id="chatInput" placeholder="Nhập câu lệnh hoặc nhấn 📎 đính kèm tệp văn bản để zizee phân tích..." autocomplete="off" />
                  <button type="submit" class="btn btn-primary" style="padding: 10px 20px;">
                    <span>Gửi</span> 🚀
                  </button>
                </form>
              </div>
            </div>
          </section>

          <!-- TAB 2: DẠY AI -->
          <section id="tab-training" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <div>
                  <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 10px;">
                    🎓 DẠY zizee - TẢI TỆP VĂN BẢN MẪU
                  </h2>
                  <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                    Tải tệp văn bản mẫu, quy chế, công văn chỉ đạo (PDF, DOCX, TXT, MD, JSON, CSV) để zizee ghi nhớ cấu trúc và học hỏi phong cách của Sếp.
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
                  <div class="stat-label">Dung Lượng Bộ Nhớ Tĩnh</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value" style="color: var(--color-primary);">Hoạt Động</div>
                  <div class="stat-label">Trạng Thái Động Cơ</div>
                </div>
              </div>

              <!-- DROPZONE FILE UPLOADER -->
              <div id="dropzone" class="dropzone">
                <div class="dropzone-icon">📥</div>
                <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 6px;">Kéo & Thả tệp văn bản vào đây để DẠY zizee</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 16px;">Hỗ trợ định dạng: <strong>.PDF, .DOCX, .TXT, .MD, .JSON, .CSV</strong> (Đọc trực tiếp 100% ở Client-side)</p>
                <input type="file" id="fileInput" accept=".pdf,.docx,.txt,.md,.json,.csv" style="display: none;" />
                <button type="button" class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                  📂 Chọn Tệp Từ Máy Tính
                </button>
              </div>

              <!-- UPLOAD PROGRESS NOTIFICATION -->
              <div id="uploadStatus" style="display: none; margin-top: 16px; padding: 14px; background: var(--color-primary-light); border: 1px solid var(--color-primary-border); border-radius: var(--radius-md); font-weight: 600; color: var(--color-primary); align-items: center; gap: 10px;">
                <span class="status-dot"></span>
                <span id="uploadStatusText">zizee đang đọc tệp và trích xuất cấu trúc văn bản...</span>
              </div>

              <!-- LEARNED KNOWLEDGE BASE LIST -->
              <div style="margin-top: 36px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <h3 style="font-size: 1.15rem; font-weight: 700;">📚 KHO KIẾN THỨC VĂN BẢN ZIZEE ĐÃ ĐƯỢC HUẤN LUYỆN</h3>
                  
                  <div style="display: flex; gap: 10px;">
                    <div style="position: relative;">
                      <input type="text" id="searchKbInput" placeholder="Tìm kiếm văn bản đã học..." style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: var(--radius-sm); color: var(--text-main); font-size: 0.85rem;" />
                    </div>
                  </div>
                </div>

                <div id="knowledgeGrid" class="knowledge-grid"></div>
              </div>

            </div>
          </section>

          <!-- TAB 3: MẪU NGHỊ ĐỊNH 30 GENERATOR -->
          <section id="tab-templates" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 8px;">📜 KHUNG VĂN BẢN HÀNH CHÍNH CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP</h2>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                Hệ thống tự động dựng bố cục thể thức văn bản hành chính theo đúng chuẩn Ủy ban nhân dân Phường Đông Hưng Thuận.
              </p>

              <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <button class="btn btn-primary" id="btnGenDocTotrinh">📜 Mẫu Tờ Trình Kinh Phí</button>
                <button class="btn btn-secondary" id="btnGenDocThongbao">📢 Mẫu Thông Báo Hành Chính</button>
                <button class="btn btn-secondary" id="btnGenDocCongvan">✉️ Mẫu Công Văn Đề Nghị</button>
              </div>

              <!-- DOCUMENT PREVIEW CONTAINER -->
              <div id="docPreviewContainer"></div>
            </div>
          </section>

          <!-- TAB 4: VIẾT TIN FANPAGE -->
          <section id="tab-fanpage" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 8px;">📢 TRUYỀN THÔNG FANPAGE DỊCH VỤ CÔNG PHƯỜNG ĐÔNG HƯNG THUẬN</h2>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                Tạo bài viết đăng Facebook đạt chuẩn: Tiêu đề IN HOA, đoạn văn ngắn gọn, icon sinh động và đính kèm bộ 3-4 hashtag chuẩn xác.
              </p>

              <div style="background: var(--bg-input); border: 1px solid var(--border-color); padding: 20px; border-radius: var(--radius-md); margin-bottom: 20px;">
                <label style="font-weight: 700; display: block; margin-bottom: 8px;">Chủ đề tin bài truyền thông:</label>
                <input type="text" id="fanpageTopicInput" placeholder="Ví dụ: 30/4 hoặc Lịch hỗ trợ làm Căn cước công dân và kích hoạt VNeID..." style="width: 100%; padding: 10px; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-main); font-family: inherit; margin-bottom: 14px;" />
                <button class="btn btn-primary" id="btnGenerateFanpage">🚀 Mở Khung Chat & Trò Chuyện Bài Đăng Fanpage Với zizee</button>
              </div>

              <div id="fanpageResultContainer"></div>
            </div>
          </section>

          <!-- TAB 5: BÁO CÁO GIAO BAN -->
          <section id="tab-report" class="tab-content">
            <div class="glass-panel" style="padding: 28px;">
              <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 8px;">📊 BÁO CÁO GIAO BAN TIẾN ĐỘ TỔNG HỢP (1 PHÚT)</h2>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                Dán danh sách công việc lộn xộn của các bộ phận vào đây, zizee sẽ phân loại thành Đã hoàn thành, Đang xử lý, Quá hạn và đề xuất hướng xử lý.
              </p>

              <div style="margin-bottom: 20px;">
                <textarea id="reportInputText" rows="5" placeholder="Dán danh sách công việc lộn xộn tại đây... (Ví dụ: Đã giải quyết 100 hồ sơ đất đai, còn 5 hồ sơ hộ tịch bị trễ do thiếu xác minh công an...)" style="width: 100%; padding: 12px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-main); font-family: inherit; resize: vertical;"></textarea>
                <button class="btn btn-primary" id="btnGenerateReport" style="margin-top: 12px;">⚡ Mở Khung Chat & Trò Chuyện Báo Cáo Giao Ban Với zizee</button>
              </div>

              <div id="reportResultContainer"></div>
            </div>
          </section>

        </main>
      </div>
    `;

    this.renderChatMessages();
  }

  attachEventListeners() {
    // API Key Save Event Listener
    const saveKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (saveKeyBtn && apiKeyInput) {
      saveKeyBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        this.zizeeEngine.setApiKey(val);
        alert('Đã lưu API Key Gemini thành công! zizee sẽ sử dụng AI này để tạo câu trả lời trực tiếp cho Sếp. 🚀');
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
        if (confirm('Sếp có chắc chắn muốn đặt lại kho kiến thức dạy zizee về mặc định ban đầu không ạ?')) {
          this.knowledgeStore.resetToDefault();
          this.updateKnowledgeUI();
          alert('Đã khôi phục dữ liệu ban đầu thành công! 🚀');
        }
      });
    }

    // Tab Navigation Listener
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tabKey = item.getAttribute('data-tab');
        this.switchTab(tabKey);
      });
    });

    // Chat Attachment Button Listeners
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
        await this.handleUserMessage(text || 'Phân tích tệp đính kèm và soạn thảo nội dung.');
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

    // Template Generator Quick Action Buttons -> Route to Interactive Chat Stream
    const btnTotrinh = document.getElementById('btnGenDocTotrinh');
    if (btnTotrinh) {
      btnTotrinh.addEventListener('click', async () => {
        this.switchTab('chat');
        await this.handleUserMessage('Soạn Tờ Trình xin kinh phí theo Nghị định 30');
      });
    }

    const btnThongbao = document.getElementById('btnGenDocThongbao');
    if (btnThongbao) {
      btnThongbao.addEventListener('click', async () => {
        this.switchTab('chat');
        await this.handleUserMessage('Soạn Thông Báo triển khai công tác theo Nghị định 30');
      });
    }

    const btnCongvan = document.getElementById('btnGenDocCongvan');
    if (btnCongvan) {
      btnCongvan.addEventListener('click', async () => {
        this.switchTab('chat');
        await this.handleUserMessage('Soạn Công Văn đề xuất gửi UBND Quận 12 theo Nghị định 30');
      });
    }

    const btnFanpage = document.getElementById('btnGenerateFanpage');
    if (btnFanpage) {
      btnFanpage.addEventListener('click', async () => {
        const topic = document.getElementById('fanpageTopicInput').value.trim() || 'Viết tin bài đăng Fanpage Dịch vụ công';
        this.switchTab('chat');
        await this.handleUserMessage(`Viết bài đăng Fanpage Dịch vụ công về chủ đề: ${topic}`);
      });
    }

    const btnReport = document.getElementById('btnGenerateReport');
    if (btnReport) {
      btnReport.addEventListener('click', async () => {
        const txt = document.getElementById('reportInputText').value.trim() || 'Tổng hợp báo cáo giao ban tiến độ công việc';
        this.switchTab('chat');
        await this.handleUserMessage(`Tổng hợp Báo cáo giao ban tiến độ dựa trên dữ liệu sau: ${txt}`);
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
    const typingMsg = { sender: 'zizee', text: '🤖 *zizee đang đọc tệp đính kèm và soạn thảo văn bản...*' };
    this.chatHistory.push(typingMsg);
    this.renderChatMessages();

    // 2. Process through zizeeEngine with Gemini API
    const responseText = await this.zizeeEngine.processUserMessage(fullPromptText);
    
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
          ${!isUser && msg.text && !msg.text.includes('zizee đang hỏi Google') ? `
            <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 8px;">
              <button class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.76rem;" onclick="navigator.clipboard.writeText(document.getElementById('chat-msg-body-${index}').innerText); alert('Đã sao chép văn bản!');">📋 Sao chép</button>
              <button class="btn btn-primary" style="padding: 3px 8px; font-size: 0.76rem;" onclick="window.exportElementToWord('chat-msg-body-${index}', 'Van_Ban_Zizee_${index+1}.doc')">📄 Xuất Word (.doc)</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  // Handle Client-Side Static File Upload & Machine Learning Simulation
  async processFileUpload(file) {
    const statusBox = document.getElementById('uploadStatus');
    const statusText = document.getElementById('uploadStatusText');

    if (statusBox && statusText) {
      statusBox.style.display = 'flex';
      statusText.innerHTML = `zizee đang đọc tệp <strong>${file.name}</strong> và truyền dữ liệu vào Gemini AI Prompt... 🧠`;
    }

    try {
      const newDoc = await this.knowledgeStore.addFileDocument(file);
      
      setTimeout(() => {
        if (statusText) {
          statusText.innerHTML = `✨ zizee đã nạp thành công văn bản <strong>"${newDoc.title}"</strong> vào bộ não Gemini AI!`;
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
      sidebarText.innerText = `Đã nạp ${docs.length} tài liệu vào Gemini Prompt (${sizeKb}).`;
    }

    this.renderKnowledgeCards(docs);
  }

  renderKnowledgeCards(docs) {
    const grid = document.getElementById('knowledgeGrid');
    if (!grid) return;

    if (docs.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 40px;">Chưa có tài liệu nào trong kho kiến thức. Sếp hãy tải tệp lên ở phía trên để DẠY zizee nhé!</div>`;
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
          <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">🟢 Đã nạp vào Gemini AI</span>
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
      if (confirm('Sếp có muốn xóa tài liệu này khỏi bộ nhớ của zizee không ạ?')) {
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
        <button class="btn btn-primary" onclick="window.exportElementToWord('docTextPreview', 'Van_Ban_Hanh_Chinh_Dong_Hung_Thuan.doc')">📄 Xuất File Word (.doc NĐ30)</button>
      </div>
      <div id="docTextPreview" class="chat-bubble zizee" style="max-width: 100%;">
        ${marked.parse(markdownContent)}
      </div>
    `;
  }
}

// Global Export to Word Engine (Standard Vietnamese Administrative Margin & Typography: A4, Times New Roman 13pt)
window.exportElementToWord = function(elementId, filename = 'Van_Ban_Hanh_Chinh_Zizee.doc') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const htmlContent = element.innerHTML;
  
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
        <w:DoNotOptimizeForCustomXSL/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page WordSection1 {
        size: 21.0cm 29.7cm; /* Khổ giấy A4 chuẩn */
        margin: 2.0cm 2.0cm 2.0cm 3.0cm; /* Căn lề chuẩn Nghị định 30: Trên 2cm, Dưới 2cm, Phải 2cm, Trái 3cm */
        mso-header-margin: 35.4pt;
        mso-footer-margin: 35.4pt;
        mso-paper-source: 0;
      }
      div.WordSection1 { page: WordSection1; }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 13pt;
        line-height: 1.4;
        color: #000000;
      }
      h1, h2, h3, h4 { font-family: 'Times New Roman', Times, serif; font-weight: bold; }
      p { margin-bottom: 6pt; margin-top: 0; text-align: justify; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
      td, th { border: 1px solid #000; padding: 6px 8px; font-size: 13pt; }
      pre, code { font-family: 'Courier New', Courier, monospace; font-size: 11pt; background: #f4f4f4; padding: 6px; border: 1px solid #ddd; }
      blockquote { border-left: 3px solid #000; margin-left: 10px; padding-left: 10px; font-style: italic; }
      ul, ol { margin-top: 0; margin-bottom: 8pt; padding-left: 20px; }
      .zizee-header-tag { display: none; }
    </style>
  </head>
  <body>
    <div class="WordSection1">
      ${htmlContent}
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
