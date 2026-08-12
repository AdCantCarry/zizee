import mammoth from 'mammoth';

const STORAGE_KEY = 'ZIZEE_KNOWLEDGE_BASE_V2';

// Initial pre-loaded sample knowledge documents (General Purpose)
const DEFAULT_KNOWLEDGE = [
  {
    id: 'sample-van-ban',
    title: 'Quy chuẩn Thể thức & Kỹ thuật Soạn thảo Văn bản Hành chính & Công sở',
    category: 'Văn bản / Thể thức',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    dateAdded: '2026-08-01T08:00:00.000Z',
    summary: 'Hướng dẫn quy chuẩn Quốc hiệu, Tiêu ngữ, Số ký hiệu, Trích yếu nội dung, Thẩm quyền ký và Nơi nhận cho các văn bản hành chính công sở.',
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM - Độc lập – Tự do – Hạnh phúc.
CẤU TRÚC VĂN BẢN HÀNH CHÍNH CHUẨN MỰC:
1. Quốc hiệu & Tiêu ngữ: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM (In hoa, đậm). Độc lập – Tự do – Hạnh phúc (In thường, đậm).
2. Tên cơ quan ban hành: Đơn vị / Công ty / Tổ chức.
3. Số và ký hiệu văn bản: Số: .../TTr-VP hoặc CV-VK.
4. Tên loại văn bản & Trích yếu nội dung: TỜ TRÌNH / THÔNG BÁO / CÔNG VĂN Về việc triển khai nhiệm vụ.
5. Thẩm quyền ký: GIÁM ĐỐC / TRƯỞNG PHÒNG / KT. CHỦ TỊCH.
6. Nơi nhận: Như trên; Lưu: Văn thư.`,
    isDefault: true
  },
  {
    id: 'sample-truyen-thong',
    title: 'Cẩm nang Biên tập Bài đăng Mạng xã hội & Truyền thông Fanpage 2026',
    category: 'Truyền thông / PR',
    fileType: 'TXT',
    fileSize: '180 KB',
    dateAdded: '2026-08-10T14:15:00.000Z',
    summary: 'Quy chuẩn viết bài đăng Facebook: Tiêu đề thu hút, thân bài chia đoạn ngắn 2-3 câu, sử dụng emoji icon sinh động, hashtag sát chủ đề.',
    content: `QUY CHUẨN ĐĂNG BÀI TRUYỀN THÔNG & SOCIAL MEDIA:
1. TIÊU ĐỀ: Bắt buộc VIẾT HOA TOÀN BỘ, lôi cuốn, tạo sự chú ý.
2. THÂN BÀI: Trình bày ngắn gọn, chia đoạn nhỏ 2-3 câu. Cung cấp đầy đủ thông tin: Địa điểm 📍, Thời gian ⏰, Sự kiện 🚀, Lưu ý ⚠️.
3. ICON: Chèn các emoji sinh động 📢, 📍, ⚠️, ✅, 💡 để tối ưu hiển thị trên giao diện di động.
4. HASHTAG: Kết bài bằng 3-4 hashtag phù hợp sát bối cảnh, phân cách bằng dấu chấm phẩy (;).`,
    isDefault: true
  }
];

export class KnowledgeStore {
  constructor() {
    this.documents = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KNOWLEDGE));
        return DEFAULT_KNOWLEDGE;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading knowledge base:', e);
      return DEFAULT_KNOWLEDGE;
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.documents));
    } catch (e) {
      console.error('Error saving knowledge base:', e);
    }
  }

  getDocuments() {
    return this.documents;
  }

  getDocumentById(id) {
    return this.documents.find(doc => doc.id === id);
  }

  async addFileDocument(file) {
    const textContent = await this.parseFileContent(file);
    const category = this.autoClassifyDocument(file.name, textContent);
    const summary = this.generateSummary(textContent);

    const newDoc = {
      id: 'kb-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: file.name.replace(/\.[^/.]+$/, ''),
      category: category,
      fileType: file.name.split('.').pop().toUpperCase(),
      fileSize: this.formatFileSize(file.size),
      dateAdded: new Date().toISOString(),
      summary: summary,
      content: textContent,
      isDefault: false
    };

    this.documents.unshift(newDoc);
    this.saveToStorage();
    return newDoc;
  }

  deleteDocument(id) {
    this.documents = this.documents.filter(doc => doc.id !== id);
    this.saveToStorage();
  }

  resetToDefault() {
    this.documents = [...DEFAULT_KNOWLEDGE];
    this.saveToStorage();
  }

  // Client-side File Parsing (Static Site Compatible)
  async parseFileContent(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'csv') {
      return await file.text();
    } 
    else if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return result.value || 'Không thể trích xuất văn bản từ tệp Word này.';
    } 
    else if (ext === 'pdf') {
      if (window.pdfjsLib) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          return fullText || 'Đã tải tệp PDF.';
        } catch (e) {
          return `Tệp PDF: ${file.name}`;
        }
      }
      return `Tệp PDF: ${file.name}. (Đã nạp tên tệp và dữ liệu).`;
    }
    return await file.text();
  }

  autoClassifyDocument(filename, text) {
    const lower = (filename + ' ' + text).toLowerCase();
    if (lower.includes('hợp đồng') || lower.includes('quy chế')) return 'Quy chế / Hợp đồng';
    if (lower.includes('thông báo') || lower.includes('tờ trình') || lower.includes('công văn')) return 'Văn bản Hành chính';
    if (lower.includes('báo cáo') || lower.includes('tiến độ')) return 'Báo cáo / Tiến độ';
    if (lower.includes('truyền thông') || lower.includes('fanpage') || lower.includes('bài viết')) return 'Truyền thông / Social';
    return 'Tài liệu Nghiệp vụ';
  }

  generateSummary(text) {
    if (!text) return 'Tài liệu nạp mới.';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= 150) return clean;
    return clean.substring(0, 150) + '...';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  findRelevantContext(query) {
    if (!query || this.documents.length === 0) return null;
    const qLower = query.toLowerCase();

    for (const doc of this.documents) {
      const titleMatch = qLower.includes(doc.title.toLowerCase());
      if (titleMatch) return doc;
    }
    return null;
  }

  searchKnowledge(query) {
    if (!query) return this.documents;
    const qLower = query.toLowerCase();
    return this.documents.filter(doc => 
      doc.title.toLowerCase().includes(qLower) ||
      doc.summary.toLowerCase().includes(qLower) ||
      doc.category.toLowerCase().includes(qLower)
    );
  }
}
