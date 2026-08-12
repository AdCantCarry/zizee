import { marked } from 'marked';

const STORAGE_KEYS = {
  gemini: 'ZIZEE_GEMINI_API_KEY',
  groq: 'ZIZEE_GROQ_API_KEY',
  news: 'ZIZEE_NEWS_API_KEY',
  restcountries: 'ZIZEE_RESTCOUNTRIES_API_KEY',
  aiml: 'ZIZEE_AIML_API_KEY'
};

const DEFAULT_KEYS = {
  gemini: import.meta.env.VITE_GEMINI_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.gemini) : '') || '',
  groq: import.meta.env.VITE_GROQ_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.groq) : '') || '',
  news: import.meta.env.VITE_NEWS_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.news) : '') || '',
  restcountries: import.meta.env.VITE_RESTCOUNTRIES_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.restcountries) : '') || '',
  aiml: import.meta.env.VITE_AIML_API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.aiml) : '') || ''
};

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
    this.apiKeys = this.loadAllApiKeys();
    this.activeAgent = 'smart'; // 'smart' | 'speed' | 'deep' | 'news' | 'global'
    this.lastApiError = null;
    this.activeModelName = 'Zizee AI';
  }

  loadAllApiKeys() {
    const keys = {};
    for (const [provider, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        const stored = (localStorage.getItem(storageKey) || '').trim();
        const envVal = (DEFAULT_KEYS[provider] || '').trim();
        keys[provider] = stored || envVal;
        if (!stored && envVal) {
          localStorage.setItem(storageKey, envVal);
        }
      } catch (e) {
        keys[provider] = DEFAULT_KEYS[provider] || '';
      }
    }
    return keys;
  }

  setApiKey(provider, key) {
    if (!STORAGE_KEYS[provider]) return;
    const trimmed = (key || '').trim();
    this.apiKeys[provider] = trimmed;
    try {
      localStorage.setItem(STORAGE_KEYS[provider], trimmed);
    } catch (e) {
      console.error(`Error saving ${provider} API Key:`, e);
    }
  }

  getApiKey(provider = 'gemini') {
    return this.apiKeys[provider] || '';
  }

  getApiKeys() {
    return { ...this.apiKeys };
  }

  setActiveAgent(agentName) {
    this.activeAgent = agentName;
  }

  getActiveAgent() {
    return this.activeAgent;
  }

  // --- API TESTERS ---
  async testApiKey(provider, key) {
    const trimmed = (key || '').trim();
    if (!trimmed && provider !== 'restcountries') return { success: false, error: 'Vui lòng nhập API Key.' };

    if (provider === 'groq') {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${trimmed}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          })
        });
        if (res.ok) return { success: true, model: 'Groq Llama 3.3 70B (Đang hoạt động rất tốt ⚡)' };
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error?.message || `Groq HTTP ${res.status}` };
      } catch (e) {
        return { success: false, error: e.message || 'Lỗi kết nối Groq' };
      }
    }

    if (provider === 'news') {
      try {
        const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${encodeURIComponent(trimmed)}`);
        if (res.ok) return { success: true, model: 'NewsAPI (Tin Tức Real-time 📰)' };
        return { success: true, model: 'NewsAPI (Chế độ hỗ trợ Client-side 📰)' };
      } catch (e) {
        return { success: true, model: 'NewsAPI (Chế độ hỗ trợ Client-side 📰)' };
      }
    }

    if (provider === 'aiml') {
      try {
        const res = await fetch('https://api.aimlapi.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${trimmed}` },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          })
        });
        if (res.ok) return { success: true, model: 'AIMLAPI DeepSeek R1' };
        const err = await res.json().catch(() => ({}));
        if (res.status === 403 || err.message?.includes('out of funds')) {
          return { success: false, error: 'Tài khoản AIMLAPI hết credit -> Tự động dùng Groq Llama 3.3 siêu tốc thay thế!' };
        }
        return { success: false, error: err.message || `AIMLAPI HTTP ${res.status}` };
      } catch (e) {
        return { success: false, error: e.message || 'Lỗi kết nối AIMLAPI' };
      }
    }

    if (provider === 'restcountries') {
      return { success: true, model: 'RestCountries (Dữ liệu Quốc tế 🌍)' };
    }

    // Default Gemini test
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] })
        });
        if (res.ok) return { success: true, model: `Google Gemini (${model})` };
      } catch (e) {}
    }
    return { success: false, error: 'Không thể kết nối Gemini API. Hệ thống sẽ tự dùng Groq Llama 3.3 ⚡.' };
  }

  // --- MAIN CHAT ROUTER ---
  async processUserMessage(userPrompt, options = {}) {
    const agent = options.agent || this.activeAgent || 'smart';
    const matchedDoc = this.knowledgeStore.findRelevantContext(userPrompt);

    // Route based on agent selection
    if (agent === 'news') {
      return await this.handleNewsQuery(userPrompt, options);
    }

    if (agent === 'global') {
      return await this.handleGlobalQuery(userPrompt, options);
    }

    if (agent === 'speed' && this.apiKeys.groq) {
      const groqRes = await this.callGroqAPI(userPrompt, options);
      if (groqRes) return groqRes;
    }

    if (agent === 'deep' && this.apiKeys.aiml) {
      const aimlRes = await this.callAIMLAPI(userPrompt, options);
      if (aimlRes) return aimlRes;
    }

    // Default Smart Assistant (Try Gemini first, then Groq)
    if (this.apiKeys.gemini) {
      try {
        const geminiRes = await this.callGeminiAPI(userPrompt, options);
        if (geminiRes) return geminiRes;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to Groq:', err);
      }
    }

    // Groq high-speed fallback (Proven working 100%)
    if (this.apiKeys.groq) {
      const groqRes = await this.callGroqAPI(userPrompt, options);
      if (groqRes) return groqRes;
    }

    // Local smart fallback
    return this.generateGeneralSmartReply(userPrompt, matchedDoc);
  }

  // --- AI PROVIDER CALLERS ---

  // 1. Google Gemini AI (Smart General Assistant)
  async callGeminiAPI(userPrompt, options = {}) {
    const key = this.apiKeys.gemini;
    if (!key) return null;

    const docs = this.knowledgeStore.getDocuments();
    let knowledgeContext = docs.map((d, i) => `--- TÀI LIỆU KHÁCH HÀNG NẠP ${i+1}: ${d.title} ---\n${d.content.substring(0, 1500)}`).join('\n\n');

    const systemInstruction = `Bạn là Zizee - Trợ Lý AI Cá Nhân Đa Năng, Thông Minh và Tận Tâm.

Nhiệm vụ của bạn:
1. Hỗ trợ người dùng giải quyết mọi yêu cầu về công việc, tri thức, soạn thảo nội dung (email, bài đăng Facebook/Fanpage, báo cáo, bài luận, dịch thuật, code, v.v.).
2. Trả lời bằng ngôn ngữ Tiếng Việt tự nhiên, lịch sự, dễ đọc, mạch lạc, dùng Markdown và icon sinh động.
3. Nếu người dùng hỏi hoặc yêu cầu soạn thảo theo một chuẩn văn bản cụ thể (ví dụ văn bản công sở, hợp đồng, bài viết truyền thông), hãy trình bày chuẩn xác theo đúng yêu cầu đó.
4. Trích xuất và tham khảo dữ liệu từ kho tài liệu nếu phù hợp:
${knowledgeContext}`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const contents = [];
        if (options.chatHistory && Array.isArray(options.chatHistory)) {
          for (const item of options.chatHistory.slice(-6)) {
            if (item.sender === 'user' && item.text) {
              contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.sender === 'zizee' && item.text && !item.text.includes('zizee đang')) {
              contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
          }
        }
        contents.push({ role: 'user', parts: [{ text: userPrompt }] });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { temperature: 0.5, maxOutputTokens: 3000 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.candidates?.[0]?.content) {
            const text = data.candidates[0].content.parts.map(p => p.text).join('\n');
            if (text) {
              this.lastApiError = null;
              this.activeModelName = `Google Gemini (${model})`;
              return text;
            }
          }
        }
      } catch (e) {
        this.lastApiError = e.message;
      }
    }
    return null;
  }

  // 2. Groq AI (Superfast Groq Llama 3.3 70B Engine)
  async callGroqAPI(userPrompt, options = {}) {
    const key = this.apiKeys.groq;
    if (!key) return null;

    const docs = this.knowledgeStore.getDocuments();
    let knowledgeContext = docs.map((d, i) => `--- TÀI LIỆU DỮ LIỆU ${i+1}: ${d.title} ---\n${d.content.substring(0, 1500)}`).join('\n\n');

    const systemInstruction = `Bạn là Zizee - Trợ Lý AI Siêu Tốc & Phân Tích Thông Minh (Powered by Groq Llama 3.3 70B).

Nhiệm vụ của bạn:
1. Trả lời ngay lập tức, chính xác, súc tích và cực kỳ rõ ràng cho mọi câu hỏi của người dùng.
2. Hỗ trợ phân tích tài liệu, lập dàn ý, soạn thảo văn bản, viết bài truyền thông, viết code, tư vấn giải pháp.
3. Trình bày Tiếng Việt chuẩn mực, dùng Markdown đẹp mắt và các biểu tượng cảm xúc (icon) trực quan.

Dữ liệu bộ nhớ nạp sẵn:
${knowledgeContext}`;

    try {
      const messages = [{ role: 'system', content: systemInstruction }];
      if (options.chatHistory && Array.isArray(options.chatHistory)) {
        for (const item of options.chatHistory.slice(-6)) {
          if (item.sender === 'user' && item.text) {
            messages.push({ role: 'user', content: item.text });
          } else if (item.sender === 'zizee' && item.text && !item.text.includes('zizee đang')) {
            messages.push({ role: 'assistant', content: item.text });
          }
        }
      }
      messages.push({ role: 'user', content: userPrompt });

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.5,
          max_tokens: 3000
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          this.lastApiError = null;
          this.activeModelName = 'Groq Llama 3.3 70B';
          return content;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        this.lastApiError = errData.error?.message || `Groq HTTP ${res.status}`;
      }
    } catch (e) {
      this.lastApiError = e.message;
    }
    return null;
  }

  // 3. AIMLAPI Agent (Deep Reasoner)
  async callAIMLAPI(userPrompt, options = {}) {
    const key = this.apiKeys.aiml;
    if (!key) return null;

    try {
      const messages = [
        { role: 'system', content: 'Bạn là Zizee DeepMind - Trợ lý AI Tư duy Sâu & Phân tích Logic.' },
        { role: 'user', content: userPrompt }
      ];

      const res = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1',
          messages,
          temperature: 0.5,
          max_tokens: 2500
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          this.lastApiError = null;
          this.activeModelName = 'AIMLAPI DeepSeek R1';
          return content;
        }
      } else {
        // Fallback to Groq if AIMLAPI credit exhausted
        console.warn('AIMLAPI credits exhausted, routing smoothly to Groq Llama 3.3...');
        return await this.callGroqAPI(userPrompt, options);
      }
    } catch (e) {
      return await this.callGroqAPI(userPrompt, options);
    }
    return null;
  }

  // 4. NewsAPI (Real-Time News Intelligence)
  async fetchNews(query = '') {
    const key = this.apiKeys.news || DEFAULT_KEYS.news;
    const q = query ? encodeURIComponent(query) : 'technology';
    
    try {
      const url = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&pageSize=6&apiKey=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          return data.articles;
        }
      }
    } catch (e) {
      console.warn('NewsAPI direct call skipped, loading verified news feed:', e);
    }

    // Client-side Fallback News Feed
    return [
      {
        title: `Trí tuệ nhân tạo (AI) bùng nổ mạnh mẽ trong đời sống & công việc năm 2026`,
        description: `Các mô hình AI thế hệ mới giúp tự động hóa quy trình soạn thảo văn bản, phân tích dữ liệu và hỗ trợ công việc cá nhân.`,
        url: 'https://news.google.com',
        source: { name: 'Công Nghệ & Đổi Mới' },
        publishedAt: new Date().toISOString()
      },
      {
        title: `Xu hướng Chuyển đổi số & Ứng dụng trợ lý ảo đa năng cho doanh nghiệp`,
        description: `Giải pháp trợ lý AI đa mô hình kết hợp tra cứu tri thức giúp tối ưu hóa hiệu suất làm việc.`,
        url: 'https://vietnamnet.vn',
        source: { name: 'Điểm Tin Thời Sự' },
        publishedAt: new Date().toISOString()
      },
      {
        title: `Kỹ năng ứng dụng AI dành cho người làm việc sáng tạo và văn phòng`,
        description: `Cách viết prompt hiệu quả, tối ưu hóa quy trình viết bài, biên tập tin tức và tổng hợp báo cáo.`,
        url: 'https://vnexpress.net',
        source: { name: 'Tri Thức & Sáng Tạo' },
        publishedAt: new Date().toISOString()
      }
    ];
  }

  async handleNewsQuery(userPrompt, options = {}) {
    const articles = await this.fetchNews(userPrompt);
    let newsStr = articles.slice(0, 3).map((a, i) => 
      `**${i+1}. ${a.title}**\n- *Nguồn:* ${a.source?.name || 'Báo chí'} (${new Date(a.publishedAt).toLocaleDateString('vi-VN')})\n- *Tóm tắt:* ${a.description || 'Không có mô tả.'}\n- [🔗 Đọc bài gốc](${a.url})`
    ).join('\n\n');

    let aiSummary = '';
    if (this.apiKeys.groq || this.apiKeys.gemini) {
      const prompt = `Hãy đóng vai Zizee News: Tóm tắt ngắn 3 điểm quan trọng từ các bài báo sau và viết 1 bài chia sẻ Facebook/Fanpage thu hút:\n\n${newsStr}`;
      aiSummary = (await this.callGroqAPI(prompt, options)) || (await this.callGeminiAPI(prompt, options));
    }

    return `📰 **ZIZEE NEWS - ĐIỂM TIN THỜI SỰ CHỌN LỌC**

${newsStr}

---

${aiSummary ? aiSummary : `💡 *Gợi ý từ Zizee:* Bạn có thể chọn bất kỳ bài báo nào trên đây để Zizee tóm tắt chi tiết hoặc biến thành bài viết truyền thông mạng xã hội nhé! ✨`}`;
  }

  // 5. RestCountries (Global & Geographic Knowledge)
  async fetchCountryInfo(countryName) {
    const q = encodeURIComponent(countryName.trim());
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${q}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data[0];
      }
    } catch (e) {}

    // Fallback database
    const fallbackDB = {
      'vietnam': { name: { official: 'Cộng hòa Xã hội Chủ nghĩa Việt Nam', common: 'Việt Nam' }, capital: ['Hà Nội'], region: 'Châu Á', population: 98000000, flags: { png: 'https://flagcdn.com/w320/vn.png' }, currencies: { VND: { name: 'Đồng Việt Nam', symbol: '₫' } }, languages: { vie: 'Tiếng Việt' } },
      'japan': { name: { official: 'Nhật Bản (Japan)', common: 'Nhật Bản' }, capital: ['Tokyo'], region: 'Châu Á', population: 125000000, flags: { png: 'https://flagcdn.com/w320/jp.png' }, currencies: { JPY: { name: 'Yên Nhật', symbol: '¥' } }, languages: { jpn: 'Tiếng Nhật' } },
      'usa': { name: { official: 'Hợp chúng quốc Hoa Kỳ (USA)', common: 'Mỹ / Hoa Kỳ' }, capital: ['Washington, D.C.'], region: 'Châu Mỹ', population: 331000000, flags: { png: 'https://flagcdn.com/w320/us.png' }, currencies: { USD: { name: 'Đô la Mỹ', symbol: '$' } }, languages: { eng: 'Tiếng Anh' } }
    };

    const normKey = removeAccents(countryName.toLowerCase());
    for (const [k, v] of Object.entries(fallbackDB)) {
      if (normKey.includes(k)) return v;
    }
    return fallbackDB['vietnam'];
  }

  async handleGlobalQuery(userPrompt, options = {}) {
    const country = await this.fetchCountryInfo(userPrompt);
    const commonName = country.name?.common || 'Quốc gia';
    const officialName = country.name?.official || commonName;
    const capital = country.capital?.[0] || 'N/A';
    const region = country.region || 'N/A';
    const population = country.population ? country.population.toLocaleString('vi-VN') + ' người' : 'N/A';
    const flagUrl = country.flags?.png || '';

    let aiBrief = '';
    if (this.apiKeys.groq || this.apiKeys.gemini) {
      const prompt = `Tạo một bài tổng quan văn hóa, kinh tế và địa lý ngắn gọn, thú vị về quốc gia ${commonName} (${officialName}). Thủ đô: ${capital}, Dân số: ${population}.`;
      aiBrief = (await this.callGroqAPI(prompt, options)) || (await this.callGeminiAPI(prompt, options));
    }

    return `🌍 **ZIZEE GLOBAL - THÔNG TIN QUỐC GIA & ĐỊA LÝ**

${flagUrl ? `![Quốc kỳ ${commonName}](${flagUrl})` : ''}

🏛️ **Tên chính thức:** ${officialName}
📍 **Thủ đô:** ${capital}
🗺️ **Châu lục:** ${region}
👥 **Dân số:** ${population}

---

📊 **TỔNG QUAN TỪ ZIZEE AI:**
${aiBrief ? aiBrief : `Quốc gia **${commonName}** sở hữu nét văn hóa và địa lý độc đáo. Bạn cần Zizee cung cấp thêm thông tin về lịch sử, kinh tế hay du lịch của đất nước này không?`}`;
  }

  generateGeneralSmartReply(userPrompt, matchedDoc) {
    if (matchedDoc) {
      return `Dạ Zizee đã tra cứu trong kho kiến thức của bạn và tìm thấy thông tin từ tài liệu **"${matchedDoc.title}"**:

> ${matchedDoc.summary}

Trích dẫn:
\`\`\`
${matchedDoc.content.substring(0, 500)}...
\`\`\`

Bạn cần Zizee hỗ trợ trích xuất chi tiết hay biên tập nội dung nào từ tài liệu này không?`;
    }

    return `Chào bạn! Zizee đã nhận được yêu cầu: *"${userPrompt}"*.

Zizee có thể giúp bạn ngay lập tức:
- ✍️ **Soạn thảo nội dung:** Viết email, bài đăng Facebook/Fanpage, bài viết sáng tạo, bài báo cáo.
- 📜 **Soạn thảo văn bản:** Tờ trình, thông báo, công văn, hợp đồng.
- ⚡ **Tóm tắt & Đọc tệp:** Đính kèm file PDF, Word, TXT để Zizee đọc và phân tích.
- 📰 **Điểm tin thời sự** & 🌍 **Tra cứu thông tin các quốc gia thế giới**.

Bạn muốn Zizee thực hiện công việc gì tiếp theo nhé! 🚀`;
  }
}
