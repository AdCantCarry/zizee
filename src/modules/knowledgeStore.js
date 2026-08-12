import mammoth from 'mammoth';

const STORAGE_KEY = 'ZIZEE_KNOWLEDGE_BASE_V1';

// Initial pre-loaded sample administrative knowledge documents
const DEFAULT_KNOWLEDGE = [
  {
    id: 'sample-nd30',
    title: 'Nghị định 30/2020/NĐ-CP - Quy chuẩn Thể thức & Kỹ thuật Soạn thảo Văn bản Hành chính',
    category: 'Văn bản Quy phạm / Thể thức',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    dateAdded: '2026-08-01T08:00:00.000Z',
    summary: 'Quy định Quốc hiệu, Tiêu ngữ, Tên cơ quan ban hành, Số ký hiệu, Địa danh ngày tháng, Kính gửi, Căn cứ pháp lý, Thẩm quyền ký (KT. CHỦ TỊCH / PHÓ CHỦ TỊCH) và Nơi nhận.',
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM - Độc lập – Tự do – Hạnh phúc.
ỦY BAN NHÂN DÂN PHƯỜNG ĐÔNG HƯNG THUẬN.
Thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP:
1. Quốc hiệu: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM (in hoa, đậm).
2. Tiêu ngữ: Độc lập – Tự do – Hạnh phúc (in thường, đậm, đầu từ viết hoa).
3. Cơ quan chủ quản: ỦY BAN NHÂN DÂN PHƯỜNG ĐÔNG HƯNG THUẬN.
4. Số và ký hiệu văn bản: Số: .../UBND-VHXH (hoặc VP, ĐC, TP).
5. Địa danh và thời gian: Đông Hưng Thuận, ngày ... tháng ... năm ...
6. Chữ ký thẩm quyền: KT. CHỦ TỊCH - PHÓ CHỦ TỊCH (Ký thay Chủ tịch, Phó Chủ tịch Võ Thị Ngọc Lan ký tên).
7. Nơi nhận: Như trên, Lưu: VT, VHXH.`,
    isDefault: true
  },
  {
    id: 'sample-quyche-giao-khoan',
    title: 'Quy chế Quản lý & Hợp đồng Giao khoán Công việc Dịch vụ công Phường Đông Hưng Thuận',
    category: 'Quy chế Phường',
    fileType: 'DOCX',
    fileSize: '480 KB',
    dateAdded: '2026-08-05T09:30:00.000Z',
    summary: 'Hướng dẫn soạn thảo Hợp đồng Giao khoán chuyên môn, nghiệm thu khối lượng công việc, thanh quyết toán kinh phí dịch vụ công phường.',
    content: `CĂN CỨ THỰC HIỆN HỢP ĐỒNG GIAO KHOÁN CÔNG VIỆC:
- Căn cứ Bộ luật Dân sự và Nghị định của Chính phủ về cung ứng dịch vụ công ích tại Phường Đông Hưng Thuận.
- Bên giao khoán: Ủy ban nhân dân Phường Đông Hưng Thuận. Đại diện: Bà Võ Thị Ngọc Lan - Chức vụ: Phó Chủ tịch UBND Phường.
- Nội dung công việc: Thực hiện các công tác hành chính, hỗ trợ dịch vụ công trực tuyến, vệ sinh môi trường, số hóa hồ sơ dân cư.
- Nghiệm thu: Đánh giá theo kết quả tiến độ định kỳ hàng tuần/hàng tháng.`,
    isDefault: true
  },
  {
    id: 'sample-fanpage-standard',
    title: 'Khung Tiêu chuẩn Tin bài Truyền thông Fanpage Dịch vụ công 2026',
    category: 'Tin bài Truyền thông',
    fileType: 'TXT',
    fileSize: '120 KB',
    dateAdded: '2026-08-10T14:15:00.000Z',
    summary: 'Quy chuẩn đăng bài Facebook Phường: Tiêu đề IN HOA toàn bộ, nội dung 2-3 câu/đoạn, sử dụng icon mobile, đính kèm 3-4 hashtag cách nhau bằng dấu chấm phẩy.',
    content: `QUY CHUẨN ĐĂNG TIN FANPAGE TRUNG TÂM CUNG ỨNG DỊCH VỤ CÔNG:
1. TIÊU ĐỀ: Bắt buộc VIẾT HOA TOÀN BỘ, giật tít ngắn gọn, lôi cuốn.
2. THÂN BÀI: Cực kỳ ngắn gọn, 2-3 câu mỗi đoạn. Cung cấp ngay Địa điểm 📍, Thời gian ⏰, Sự kiện 🏥, Lưu ý ⚠️.
3. ICON: Bắt buộc chèn các emoji 📢, 📍, 🏥, ⚠️, ✅ để tối ưu hiển thị trên di động.
4. HASHTAG: Kết bài bằng 3-4 hashtag phù hợp sát bối cảnh, phân cách bằng dấu chấm phẩy (;). Ví dụ: #DongHungThuan;#TrungTamCungUngDichVuCong;#CaiCachHanhChinh.`,
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
          return fullText || 'Không trích xuất được văn bản PDF.';
        } catch (err) {
          console.warn('PDF parsing error, fallback to text read:', err);
          return await file.text();
        }
      } else {
        return await file.text();
      }
    }
    return await file.text();
  }

  autoClassifyDocument(filename, content) {
    const lower = (filename + ' ' + content).toLowerCase();
    if (lower.includes('nghị định') || lower.includes('tờ trình') || lower.includes('công văn') || lower.includes('thể thức')) {
      return 'Mẫu Nghị định 30';
    }
    if (lower.includes('fanpage') || lower.includes('facebook') || lower.includes('truyền thông') || lower.includes('tin bài')) {
      return 'Tin bài Truyền thông';
    }
    if (lower.includes('báo cáo') || lower.includes('tiến độ') || lower.includes('giao ban') || lower.includes('nhiệm vụ')) {
      return 'Báo cáo Tiến độ';
    }
    if (lower.includes('hợp đồng') || lower.includes('giao khoán') || lower.includes('nghiệm thu')) {
      return 'Hợp đồng & Quy chế';
    }
    return 'Tài liệu Huấn luyện CHUNG';
  }

  generateSummary(text) {
    if (!text || text.length === 0) return 'Tài liệu rỗng';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= 160) return clean;
    return clean.substring(0, 160) + '...';
  }

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  searchKnowledge(query) {
    if (!query) return this.documents;
    const q = query.toLowerCase();
    return this.documents.filter(doc => 
      doc.title.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q)
    );
  }

  // Find relevant knowledge context for zizee prompt augmentation
  findRelevantContext(query) {
    const q = query.toLowerCase();
    const matches = this.documents.filter(doc => {
      const titleMatch = doc.title.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w));
      const contentMatch = doc.content.toLowerCase().split(' ').some(w => w.length > 4 && q.includes(w));
      return titleMatch || contentMatch;
    });

    if (matches.length === 0) return null;
    return matches[0]; // Return top matched document
  }
}
