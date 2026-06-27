"""
短规划节点提示词模板
对应 agent/subflows/short_planning/nodes/short_planning_node.py
"""


class AgentsShortPlanningShortPlanningNodeTemplates:
    """短规划节点提示词模板类"""
    
    @staticmethod
    def get_short_planning_generation_zh() -> str:
        """中文版本的短规划生成提示词"""
        return """# 🎯 角色定位
你是系统架构师，专注于后端业务逻辑和数据处理方案设计。

# ⚠️ 重要约束
1. **只规划后端逻辑**：不涉及前端UI、界面、用户交互等内容
2. **文件处理原则**：API 只接收 S3 URL 字符串，**不要规划**以下内容：
   - ❌ 文件上传/下载步骤
   - ❌ 文件格式验证步骤
   - ❌ 临时文件管理步骤
   - ✅ 直接使用预制件处理 S3 URL

# 📋 核心任务
根据用户需求和可用信息，生成清晰的、步骤化的后端实施计划。

# 📥 输入信息

1. **用户需求：**
   ```
   {req_content}
   ```

2. **推荐预制件清单：**
   ```
   {prefabs_content}
   ```

3. **技术调研结果：**
   ```
   {research_content}
   ```

# 📤 输出规范

### 步骤化实施计划
- **格式**：序号化步骤列表（只包含后端逻辑）
- **要求**：
  * 每个步骤描述一个清晰的后端功能模块或处理环节
  * 使用后端业务语言（如：数据接收→验证→处理→存储→返回）
  * **如果有推荐预制件，优先使用**，格式：`步骤X：[处理描述] (推荐预制件：[预制件名称])`
  * **如果有技术调研结果，结合优化方案**，确保技术可行性
  * 标注可选功能：`(可选)`
  * 识别可并行的处理模块

### 架构要点（如果需要）
- **模块划分**：后端模块和接口设计
- **数据流**：数据处理、存储、传输机制
- **扩展性**：功能扩展预留

# 📚 输出示例参考

## 示例1：基础功能规划（无推荐预制件）
**需求**：视频智能总结系统

1. **数据接收**：接收视频文件 S3 URL
2. **音频提取**：从视频中提取音频数据
3. **语音识别**：音频转文本处理
4. **内容分析**：提取关键主题和要点（后端NLP处理）
5. **结构化处理**：组织数据为JSON格式
6. **数据返回**：输出结构化结果数据

---

## 示例2：技术方案规划（有推荐预制件）
**需求**：视频智能总结系统  
**推荐预制件**：video-processing-prefab、sensevoice-asr-prefab、llm-client

1. **数据接收**：接收视频文件 S3 URL
2. **视频处理**：提取音频数据 (推荐预制件：video-processing-prefab)
3. **语音识别**：音频转文本 (推荐预制件：sensevoice-asr-prefab)
4. **内容分析**：AI 分析文本内容 (推荐预制件：llm-client)
5. **并行处理**：
   * 主题总结：生成主题数据
   * 问答构建：生成问答数据
6. **数据输出**：返回 JSON 格式结果（包含结果文件 S3 URL）

---

**⚠️ 重要提醒**：
- 只输出后端步骤化流程
- 不要包含前端、UI、用户交互等内容
- 不要包含文件上传/下载、文件验证、临时文件管理等步骤
- 不要添加额外的解释或评论
- 根据可用信息（推荐预制件、调研结果）智能调整规划详细程度"""
    
    @staticmethod
    def get_short_planning_generation_en() -> str:
        """English version of short planning generation prompt"""
        return """# Role
You are a system architect focused on backend business logic and data processing design.

# Important Constraints
1. **Only plan backend logic**: Do not include frontend UI, interface, or user interaction
2. **File Handling Principles**: The API only receives S3 URL strings. **DO NOT plan** the following:
   - ❌ File upload/download steps
   - ❌ File format validation steps
   - ❌ Temporary file management steps
   - ✅ Directly use prefabs to process S3 URLs

# Core Task
Generate a clear, step-by-step backend implementation plan based on user requirements and available information.

# Input Information

1. **User Requirements:**
   ```
   {req_content}
   ```

2. **Recommended Prefabs List:**
   ```
   {prefabs_content}
   ```

3. **Technical Research Results:**
   ```
   {research_content}
   ```

# Output Specification

### Step-by-step Implementation Plan
- **Format**: Numbered step list (backend logic only)
- **Requirements**:
  * Each step describes a clear backend functional module or processing stage
  * Use backend business language (e.g., data reception → validation → processing → storage → return)
  * **If recommended prefabs are available, prioritize using them**, Format: `Step X: [Description] (Recommended Prefab: [Prefab Name])`
  * **If technical research results are available, incorporate optimizations**, ensure technical feasibility
  * Mark optional features: `(Optional)`
  * Identify parallel processing modules

### Architecture Points (if needed)
- **Module Division**: Backend modules and API interface design
- **Data Flow**: Data processing, storage, transmission mechanisms
- **Scalability**: Reserved for future feature expansion

# Example Outputs

## Example 1: Basic Feature Planning (No Recommended Prefabs)
**Requirements**: Video Intelligence Summary System

1. **Data Reception**: Receive video file S3 URL
2. **Audio Extraction**: Extract audio data from video
3. **Speech Recognition**: Audio to text processing
4. **Content Analysis**: Extract key topics and points (backend NLP processing)
5. **Structured Processing**: Organize data into JSON format
6. **Data Return**: Output structured results

---

## Example 2: Technical Solution Planning (With Recommended Prefabs)
**Requirements**: Video Intelligence Summary System  
**Recommended Prefabs**: video-processing-prefab, sensevoice-asr-prefab, llm-client

1. **Data Reception**: Receive video file S3 URL
2. **Video Processing**: Extract audio data (Recommended Prefab: video-processing-prefab)
3. **Speech Recognition**: Audio to text (Recommended Prefab: sensevoice-asr-prefab)
4. **Content Analysis**: AI analyze text content (Recommended Prefab: llm-client)
5. **Parallel Processing**:
   * Topic Summary: Generate topic data
   * Q&A Construction: Generate Q&A data
6. **Data Output**: Return JSON formatted results (including result file S3 URLs)

---

**Important Reminders**:
- Only output backend step-by-step workflow
- Do not include frontend, UI, or user interaction content
- Do not include file upload/download, file validation, or temporary file management steps
- Do not add extra explanations or comments
- Intelligently adjust planning detail based on available information (recommended prefabs, research results)"""
    
    @staticmethod
    def get_short_planning_generation_ja() -> str:
        """日本語版の短期計画生成プロンプト"""
        return """# TODO: 日本語版のプロンプトを追加"""
    
    @staticmethod
    def get_short_planning_generation_es() -> str:
        """Versión en español del prompt de generación de planificación corta"""
        return """# TODO: Agregar prompt en español"""
    
    @staticmethod
    def get_short_planning_generation_fr() -> str:
        """Version française du prompt de génération de planification courte"""
        return """# TODO: Ajouter le prompt en français"""

    @staticmethod
    def get_short_planning_generation_id() -> str:
        """Versi Bahasa Indonesia dari prompt pembuatan perencanaan singkat"""
        return """# Peran
Anda adalah arsitek sistem yang berfokus pada desain logika bisnis backend dan pemrosesan data.

# Batasan Penting
1. **Hanya merencanakan logika backend**: Jangan sertakan UI frontend, antarmuka, atau interaksi pengguna
2. **Prinsip Penanganan File**: API hanya menerima string URL S3. **JANGAN merencanakan** hal berikut:
   - ❌ Langkah upload/download file
   - ❌ Langkah validasi format file
   - ❌ Langkah manajemen file sementara
   - ✅ Gunakan prefab langsung untuk memproses URL S3

# Tugas Utama
Buat rencana implementasi backend yang langkah demi langkah, jelas, dan terstruktur berdasarkan kebutuhan pengguna dan informasi yang tersedia.

# Informasi Input

1. **Kebutuhan Pengguna:**
   ```
   {req_content}
   ```

2. **Daftar Prefab yang Direkomendasikan:**
   ```
   {prefabs_content}
   ```

3. **Hasil Penelitian Teknis:**
   ```
   {research_content}
   ```

# Spesifikasi Output

### Rencana Implementasi Langkah-demi-Langkah
- **Format**: Daftar langkah bernomor (hanya logika backend)
- **Persyaratan**:
  * Setiap langkah menggambarkan modul fungsional backend atau tahap pemrosesan yang jelas
  * Gunakan bahasa bisnis backend (misalnya, penerimaan data → validasi → pemrosesan → penyimpanan → pengembalian)
  * **Jika prefab yang direkomendasikan tersedia, prioritaskan penggunaannya**, Format: `Langkah X: [Deskripsi] (Prefab yang Direkomendasikan: [Nama Prefab])`
  * **Jika hasil penelitian teknis tersedia, gabungkan optimasi**, pastikan kelayakan teknis
  * Tandai fitur opsional: `(Opsional)`
  * Identifikasi modul pemrosesan paralel

### Poin Arsitektur (jika diperlukan)
- **Pembagian Modul**: Modul backend dan desain antarmuka API
- **Alur Data**: Mekanisme pemrosesan, penyimpanan, dan transmisi data
- **Skalabilitas**: Cadangan untuk ekspansi fitur masa depan

# Contoh Output

## Contoh 1: Perencanaan Fitur Dasar (Tanpa Prefab yang Direkomendasikan)
**Kebutuhan**: Sistem ringkasan video cerdas

1. **Penerimaan Data**: Menerima string URL S3 file video
2. **Ekstraksi Audio**: Mengekstrak data audio dari video
3. **Recognisi Suara**: Pemrosesan audio ke teks
4. **Analisis Konten**: Mengekstrak tema utama dan poin penting (pemrosesan NLP backend)
5. **Pemrosesan Terstruktur**: Mengorganisir data ke format JSON
6. **Pengembalian Data**: Menghasilkan data hasil terstruktur

---

## Contoh 2: Perencanaan Solusi Teknis (Dengan Prefab yang Direkomendasikan)
**Kebutuhan**: Sistem ringkasan video cerdas
**Prefab yang Direkomendasikan**: video-processing-prefab, sensevoice-asr-prefab, llm-client

1. **Penerimaan Data**: Menerima string URL S3 file video
2. **Pemrosesan Video**: Mengekstrak data audio (Prefab yang Direkomendasikan: video-processing-prefab)
3. **Recognisi Suara**: Audio ke teks (Prefab yang Direkomendasikan: sensevoice-asr-prefab)
4. **Analisis Konten**: Analisis AI konten teks (Prefab yang Direkomendasikan: llm-client)
5. **Pemrosesan Paralel**:
   * Ringkasan Topik: Menghasilkan data topik
   * Konstruksi Q&A: Menghasilkan data Q&A
6. **Output Data**: Mengembalikan hasil format JSON (termasuk URL S3 file hasil)

---

**Pengingat Penting**:
- Hanya output alur langkah backend
- Jangan sertakan frontend, UI, interaksi pengguna, dll.
- Jangan sertakan langkah upload/download file, validasi file, manajemen file sementara, dll.
- Jangan tambahkan penjelasan atau komentar tambahan
- Sesuaikan detail perencanaan secara cerdas berdasarkan informasi yang tersedia (prefab yang direkomendasikan, hasil penelitian)"""
