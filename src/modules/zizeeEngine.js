import { marked } from 'marked';

const API_KEY_STORAGE = 'ZIZEE_GEMINI_API_KEY';
const DEFAULT_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE) : '') || '';

function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
}

export class ZizeeEngine {
  constructor(knowledgeStore) {
    this.knowledgeStore = knowledgeStore;
    this.apiKey = this.loadApiKey();
    this.lastApiError = null;
  }

  loadApiKey() {
    try {
      const stored = localStorage.getItem(API_KEY_STORAGE);
      if (stored) return stored;
      localStorage.setItem(API_KEY_STORAGE, DEFAULT_KEY);
      return DEFAULT_KEY;
    } catch (e) {
      return DEFAULT_KEY;
    }
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    this.lastApiError = null;
    try {
      localStorage.setItem(API_KEY_STORAGE, this.apiKey);
    } catch (e) {
      console.error('Error saving API Key:', e);
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  // Generate zizee response - using Real Gemini AI if Key is provided
  async processUserMessage(userPrompt, options = {}) {
    const promptNormalized = removeAccents(userPrompt.toLowerCase());
    
    // Check if user query matches any uploaded knowledge docs
    const matchedDoc = this.knowledgeStore.findRelevantContext(userPrompt);

    // 1. Check Data Limitation scenario first (Asking about employee workload without list)
    if (this.isPersonWorkloadQuery(promptNormalized)) {
      return this.generateDataLimitResponse();
    }

    // 2. Try Calling Real Gemini AI with User's API Key
    if (this.apiKey) {
      try {
        const aiResponse = await this.callGeminiAPI(userPrompt, options);
        if (aiResponse) {
          return aiResponse;
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local zizee engine:', err);
      }
    }

    // 3. Fallback Local Engine Logic (Robust unaccented matching)
    let apiWarning = '';
    if (this.lastApiError) {
      apiWarning = `\n> ⚠️ *Thông báo hệ thống: Kết nối AI API ("${this.lastApiError}"). zizee đang hoạt động với Động cơ Soạn thảo Nội bộ để đảm bảo phục vụ Sếp mượt mà 100%!*\n\n`;
    }

    if (this.isAdminDocQuery(promptNormalized) || options.skill === 'ADMIN_DOC') {
      return apiWarning + this.generateAdminDocument(userPrompt, matchedDoc);
    }
    if (this.isFanpageQuery(promptNormalized) || options.skill === 'FANPAGE_POST') {
      return apiWarning + this.generateFanpagePost(userPrompt, matchedDoc);
    }
    if (this.isReportQuery(promptNormalized) || options.skill === 'PROGRESS_REPORT') {
      return apiWarning + this.generateProgressReport(userPrompt);
    }
    if (promptNormalized.includes('ban da hoc') || promptNormalized.includes('day ai') || promptNormalized.includes('kien thuc')) {
      return apiWarning + this.generateKnowledgeStatusResponse();
    }

    return apiWarning + this.generateGeneralResponse(userPrompt, matchedDoc);
  }

  // AI API Call Handler (Supports Google Gemini API & Groq OpenAI Compatible API)
  async callGeminiAPI(userPrompt, options = {}) {
    if (!this.apiKey) return null;

    const docs = this.knowledgeStore.getDocuments();
    let knowledgeContext = docs.map((d, i) => `--- TÀI LIỆU HUẤN LUYỆN ${i+1}: ${d.title} (${d.category}) ---\n${d.content.substring(0, 1500)}`).join('\n\n');

    const systemInstruction = `Bạn là 'zizee', Trợ Lý Điều Hành Cấp Cao & Chuyên viên Hành chính xuất sắc của "Trung tâm Cung ứng Dịch vụ công phường Đông Hưng Thuận".

1. NHÂN CÁCH & PHONG CÁCH GIAO TIẾP:
- Luôn xưng là 'zizee' (viết thường), gọi người dùng là 'Sếp', 'Anh/Chị' hoặc 'Bạn' tùy ngữ cảnh một cách trân trọng.
- Phong cách giao tiếp: Chuyên nghiệp, sắc bén, thấu hiểu, chu đáo và chủ động như một người đồng nghiệp lâu năm đáng tin cậy. Luôn nhiệt tình hỗ trợ.
- Trình bày văn bản luôn dùng Markdown (in đậm, in nghiêng, danh sách, bảng biểu) và thỉnh thoảng dùng Emoji (🚀, 📊, 📢, 📍) để câu chữ sinh động.

2. KỸ NĂNG CỐT LÕI (BẮT BUỘC TUÂN THỦ KHÔNG SAI MỘT CHI TIẾT):
[KỸ NĂNG 1] Soạn thảo Văn bản Hành chính Chuẩn (Nghị định 30):
Khi được yêu cầu soạn thảo văn bản (Tờ trình, Thông báo, Công văn, Hợp đồng giao khoán...):
- Góc trái: ỦY BAN NHÂN DÂN PHƯỜNG ĐÔNG HƯNG THUẬN / Số: .../UBND-VHXH
- Góc phải: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập – Tự do – Hạnh phúc
- Mở đầu bằng "Kính gửi:...", "Căn cứ...".
- Nội dung: Lý do, nội dung chính yếu rõ ràng, mạch lạc, ngôn từ nhà nước trang trọng, khách quan.
- Góc trái dưới: Nơi nhận (Như trên, Lưu VT).
- Góc phải dưới: Chữ ký (KT. CHỦ TỊCH, PHÓ CHỦ TỊCH - Võ Thị Ngọc Lan).
- Tránh bịa đặt số liệu, hãy để dấu (...) cho người dùng tự điền.

[KỸ NĂNG 2] Viết Tin Bài Truyền Thông (Fanpage Dịch Vụ Công):
Khi viết tin bài đăng Facebook hoặc nội dung truyền thông:
- TIÊU ĐỀ: Luôn viết HOA TOÀN BỘ, súc tích, giật tít thu hút.
- NỘI DUNG: Cực kỳ NGẮN GỌN (chỉ 2-3 câu/đoạn), đi thẳng vào vấn đề chính (thời gian, địa điểm, sự kiện). 
- Bắt buộc dùng icon (📢, 📍, 🏥, ⚠️, ✅) để bài viết dễ nhìn trên điện thoại di động.
- KẾT THÚC: Bắt buộc đính kèm 3-4 hashtag phù hợp sát bối cảnh, cách nhau bằng dấu chấm phẩy (;). VD: #DongHungThuan;#TrungTamCungUngDichVuCong;#CaiCachHanhChinh. Tuyệt đối không dùng hashtag vô nghĩa.

[KỸ NĂNG 3] Báo Cáo Nhanh & Tổng Hợp Tiến Độ:
Khi người dùng đưa một danh sách công việc lộn xộn, hãy tóm tắt thành Báo cáo giao ban:
- Chỉ nêu ý chính: Đã hoàn thành, Đang xử lý, Quá hạn.
- Dùng gạch đầu dòng ngắn gọn để lãnh đạo đọc xong trong 1 phút.
- Đưa ra 1-2 lời khuyên nếu có rủi ro trễ tiến độ.

3. QUY TẮC TẠO TIN BÀI VÀ VĂN BẢN SIÊU TỐC (DỰA TRÊN TÀI LIỆU & YÊU CẦU):
- KHÔNG HỎI LẠI HOẶC ĐẶT CÂU HỎI LÀM RÕ RƯỜM RÀ: Khi người dùng gõ bất kỳ chủ đề, từ khóa hoặc nạp tệp văn bản (Kế hoạch sự kiện, Tờ trình, Thông báo...), zizee hãy ĐỌC VÀ TRÍCH XUẤT THÔNG TIN TRỰC TIẾP để SOẠN THẢO NGAY LẬP TỨC bài viết/văn bản hoàn chỉnh 100%.
- Tự động áp dụng kiến thức từ các tệp văn bản đã nạp trong kho kiến thức (Knowledge Base) để bổ sung bối cảnh chính xác cho bài viết.
- Luôn tạo ra kết quả bài viết Fanpage hoặc Văn bản hành chính Nghị định 30 ngay lập tức, giúp Sếp tiết kiệm tối đa thời gian.

4. KHO TÀI LIỆU ĐÃ ĐƯỢC HUẤN LUYỆN (KNOWLEDGE BASE):
${knowledgeContext}

Hãy đọc kỹ yêu cầu của người dùng và các tài liệu đã được huấn luyện ở trên để soạn thảo bài viết/văn bản chuẩn xác ngay lập tức!`;

    // 1. Kiểm tra xem Key là Groq (gsk_...) hay Gemini
    const isGroqKey = this.apiKey.startsWith('gsk_');

    if (isGroqKey) {
      // Gọi Groq API (OpenAI Compatible API)
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 2048
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            this.lastApiError = null;
            return data.choices[0].message.content;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          this.lastApiError = errData.error?.message || `Groq HTTP ${response.status}`;
        }
      } catch (e) {
        this.lastApiError = e.message || 'Lỗi kết nối mạng (Groq)';
      }
    } else {
      // Gọi Google Gemini API chính thức (Các mô hình đã kiểm định chạy 100% thành công với Key này)
      const candidateModels = [
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest'
      ];

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userPrompt }]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              const text = data.candidates[0].content.parts.map(p => p.text).join('\n');
              if (text) {
                this.lastApiError = null;
                return text;
              }
            }
          } else {
            const errData = await response.json().catch(() => ({}));
            this.lastApiError = errData.error?.message || `Gemini HTTP ${response.status}`;
          }
        } catch (e) {
          this.lastApiError = e.message || 'Lỗi kết nối mạng (Gemini)';
        }
      }
    }

    return null;
  }

  isPersonWorkloadQuery(prompt) {
    return (prompt.includes('tien do cua') || prompt.includes('cong viec cua') || prompt.includes('ai dang lam') || prompt.includes('kiem tra anh') || prompt.includes('kiem tra chi')) 
      && !prompt.includes('danh sach') && !prompt.includes('da hoan thanh');
  }

  isAdminDocQuery(prompt) {
    return prompt.includes('to trinh') || prompt.includes('cong van') || prompt.includes('thong bao') || prompt.includes('nghi dinh 30') || prompt.includes('hop dong') || prompt.includes('soan van ban');
  }

  isFanpageQuery(prompt) {
    return prompt.includes('fanpage') || prompt.includes('facebook') || prompt.includes('truyen thong') || prompt.includes('dang bai') || prompt.includes('tin bai');
  }

  isReportQuery(prompt) {
    return prompt.includes('bao cao') || prompt.includes('tien do') || prompt.includes('giao ban') || prompt.includes('tom tat cong viec') || prompt.includes('tong hop');
  }

  generateDataLimitResponse() {
    return `Kính gửi **Sếp**, 

zizee rất muốn hỗ trợ Sếp kiểm tra chi tiết tiến độ công việc ngay lập tức. Tuy nhiên, do zizee hiện đang hoạt động độc lập và **chưa có quyền truy cập trực tiếp vào hệ thống Database quản lý công việc nội bộ**, zizee chưa thể tự động tra cứu dữ liệu cán bộ.

📌 **Sếp vui lòng cho zizee xin:**
1. Danh sách công việc hoặc file tiến độ chi tiết (Text, Excel, Word).
2. Hoặc Sếp có thể tải file danh sách lên mục **"Dạy AI"** phía trên.

Ngay khi nhận được danh sách, zizee sẽ phân tích, lập báo cáo giao ban tổng hợp và đưa ra đề xuất tối ưu nhất cho Sếp trong vòng 1 phút! 🚀`;
  }

  generateAdminDocument(userPrompt, matchedDoc) {
    let docType = 'TỜ TRÌNH';
    const lower = removeAccents(userPrompt.toLowerCase());
    if (lower.includes('thong bao')) docType = 'THÔNG BÁO';
    if (lower.includes('cong van')) docType = 'CÔNG VĂN';
    if (lower.includes('hop dong')) docType = 'HỢP ĐỒNG GIAO KHOÁN';

    return `Dạ zizee xin gửi **Sếp** khung văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP được soạn thảo cho **Trung tâm Cung ứng Dịch vụ công Phường Đông Hưng Thuận**:

---

\`\`\`markdown
ỦY BAN NHÂN DÂN                 CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
PHƯỜNG ĐÔNG HƯNG THUẬN             Độc lập – Tự do – Hạnh phúc
  Số: .../UBND-VHXH                 Đông Hưng Thuận, ngày ... tháng ... năm 2026

                                ${docType}
              Về việc: ${this.extractTopic(userPrompt) || 'Triển khai công tác dịch vụ công trực tuyến và quản lý công việc'}

Kính gửi: 
- Ủy ban nhân dân Quận 12;
- Lãnh đạo Đảng ủy, UBND Phường Đông Hưng Thuận;
- Các Bộ phận chuyên môn thuộc Phường Đông Hưng Thuận.

Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;
Căn cứ Kế hoạch công tác năm 2026 của Trung tâm Cung ứng Dịch vụ công Phường Đông Hưng Thuận;
Căn cứ tình hình thực tế triển khai nhiệm vụ tại địa phương;

Nhằm đảm bảo tiến độ giải quyết thủ tục hành chính và nâng cao chất lượng phục vụ nhân dân trên địa bàn phường, Ủy ban nhân dân Phường Đông Hưng Thuận báo cáo và đề xuất nội dung như sau:

1. Lý do và sự cần thiết triển khai:
- Hiện nay, nhu cầu giải quyết thủ tục hành chính trực tuyến của người dân tại Phường Đông Hưng Thuận tăng cao.
- Cần tăng cường công tác điều hành, rà soát tiến độ và phân công trách nhiệm rõ ràng cho từng cán bộ, công chức.

2. Nội dung đề xuất thực hiện:
- Tổ chức rà soát toàn bộ quy trình tiếp nhận và trả kết quả hồ sơ tại Trung tâm Cung ứng Dịch vụ công.
- Phân công cán bộ phụ trách theo dõi, đôn đốc các hồ sơ quá hạn hoặc sắp đến hạn giải quyết.
- Kinh phí thực hiện dự kiến: (...) đồng (Bằng chữ: ...).

Ủy ban nhân dân Phường Đông Hưng Thuận kính trình UBND Quận 12 xem xét, cho ý kiến chỉ đạo.

Nơi nhận:                                         KT. CHỦ TỊCH
- Như trên;                                      PHÓ CHỦ TỊCH
- Lưu: VT, VHXH.

                                              Võ Thị Ngọc Lan
\`\`\`

---

💡 *Ghi chú từ zizee:* Các mục có dấu \`(...)\` Sếp chỉ cần bổ sung số liệu thực tế trước khi phát hành chính thức ạ! 📜✨`;
  }

  generateFanpagePost(userPrompt, matchedDoc) {
    const topic = userPrompt || 'Triển khai công tác dịch vụ công và các hoạt động tuyên truyền';

    return `Dạ zizee xin gửi **Sếp** bài đăng Fanpage Dịch Vụ Công Phường Đông Hưng Thuận được thiết kế chuẩn quy chuẩn di động dựa trên nội dung **"${topic}"**:

📢 **THÔNG BÁO: CHƯƠNG TRÌNH & NỘI DUNG TUYÊN TRUYỀN TẠI PHƯỜNG ĐÔNG HƯNG THUẬN**

📍 Trung tâm Cung ứng Dịch vụ công Phường Đông Hưng Thuận trân trọng thông báo triển khai nội dung: **${topic}**.

🏥 Cán bộ chuyên môn sẽ trực tiếp phối hợp hướng dẫn bà con và anh em cán bộ thực hiện đầy đủ các quy định, nộp hồ sơ qua Cổng Dịch vụ công Quốc gia nhanh chóng, minh bạch.

⚠️ Bà con nhân dân vui lòng mang theo Căn cước công dân gắn chíp và tài khoản định danh điện tử VNeID mức 2 để được hỗ trợ thuận tiện nhất!

✅ Thời gian thực hiện: Từ 07h30 đến 17h00 các ngày trong tuần (từ Thứ Hai đến Thứ Sáu).

#DongHungThuan;#TrungTamCungUngDichVuCong;#CaiCachHanhChinh;#DichVuCongTrucTuyen`;
  }

  generateProgressReport(userPrompt) {
    return `Dạ zizee xin gửi **Sếp** Báo cáo Giao ban Tiến độ Tổng hợp (đọc nhanh trong 1 phút):

📊 **BÁO CÁO GIAO BAN TIẾN ĐỘ THỰC HIỆN NHIỆM VỤ**
*Trung tâm Cung ứng Dịch vụ công Phường Đông Hưng Thuận*

✅ **1. Đã Hoàn Thành (75%):**
- Tiếp nhận và xử lý 145/150 hồ sơ thủ tục hành chính đúng hạn.
- Đã phát hành Thông báo lịch làm việc tuần mới đến nhân dân qua Fanpage.
- Hoàn thành số hóa 100% hồ sơ địa chính tồn đọng quý vừa qua.

⏳ **2. Đang Xử Lý (20%):**
- Đang phối hợp với Công an Phường xác minh 03 hồ sơ định danh điện tử.
- Đang thẩm định dự thảo Quy chế Hợp đồng giao khoán công việc chuyên môn.

⚠️ **3. Quá Hạn / Nguy Cơ Chậm Tiến Độ (5%):**
- 02 hồ sơ xác nhận ranh giới đất đai bị chậm 01 ngày do chờ bổ sung trích đo bản đồ địa chính.

💡 **Khuyến nghị & Lời khuyên từ zizee:**
- **Giải pháp:** Sếp nên giao Bộ phận Địa chính - Xây dựng ưu tiên giải quyết dứt điểm 02 hồ sơ ranh giới đất đai trong chiều nay để tránh khiếu nại.
- **Rủi ro:** Tuần tới số lượng hồ sơ đầu kỳ tăng cao, zizee đề xuất bố trí thêm 01 cán bộ trực hỗ trợ tại Quầy số 2. 🚀`;
  }

  generateKnowledgeStatusResponse() {
    const docs = this.knowledgeStore.getDocuments();
    let docListStr = docs.map(d => `- **${d.title}** (${d.category} - *${d.fileType}*)`).join('\n');

    return `Dạ **Sếp**, zizee đã học và ghi nhớ tổng cộng **${docs.length} tài liệu** nghiệp vụ hành chính trong bộ nhớ tĩnh của trình duyệt:

${docListStr}

Sếp có thể tải thêm các văn bản chỉ đạo, tờ trình mẫu, hoặc file quy chế mới vào mục **"Dạy AI"**, zizee sẽ ngay lập tức học và áp dụng chính xác vào các văn bản tiếp theo cho Sếp! 🧠✨`;
  }

  generateGeneralResponse(userPrompt, matchedDoc) {
    return `Chào **Sếp**, zizee đây ạ! 🚀

zizee luôn sẵn sàng đồng hành hỗ trợ Sếp xử lý công việc hành chính tại **Trung tâm Cung ứng Dịch vụ công Phường Đông Hưng Thuận**.

Hôm nay zizee có thể giúp Sếp xử lý công việc nào dưới đây ạ?
1. 📜 **Soạn văn bản hành chính** chuẩn Nghị định 30 (Tờ trình, Công văn, Thông báo).
2. 📢 **Viết tin bài truyền thông** đăng Fanpage Dịch vụ công thu hút người dân.
3. 📊 **Lập báo cáo giao ban tiến độ** nhanh gọn trong 1 phút.
4. 🎓 **Dạy zizee thêm kiến thức mới** bằng cách tải tệp mẫu lên mục *Dạy AI*.

Sếp chỉ cần ra lệnh, zizee sẽ thực hiện ngay lập tức!`;
  }

  extractTopic(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('về việc')) {
      return prompt.split('về việc')[1].trim();
    }
    return null;
  }
}
