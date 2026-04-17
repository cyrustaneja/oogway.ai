# 📖 Oogway Prompt Book

This "Live Manual" maps every output field you see in the UI to the exact AI instruction and logic used behind the scenes.

> [!TIP]
> **How to update:** To change a prompt or add a field, edit [prompt-book.ts](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompt-book.ts). The pipeline will automatically use the new logic in the next run.

---

## 🏗️ Deployment Stages & Output Mapping

### 1. What was taught? (Session Flow)
*   **Field:** `what_was_taught`
*   **Stage:** Stage 3 (Batch Extraction)
*   **Prompt Logic:** Identifies the core theoretical or practical concept discussed in a 15-minute slice.
*   **Connected Prompt:**
    > "You are extracting exactly what happened in a single teaching chapter..."

### 2. Pedagogical Gaps (Depth Analysis)
*   **Field:** `topics_lacking_examples`
*   **Stage:** Stage 6B (Expert Synthesis)
*   **Prompt Logic:** Specifically looks for abstract concepts where the trainer failed to provide a real-world use case or code example.
*   **Connected Prompt:**
    > "...analyze the trainer's pedagogical actions... topics lacking examples..."

### 3. Student Confusion
*   **Field:** `confusion_points`
*   **Stage:** Stage 3 (Batch Extraction)
*   **Prompt Logic:** Flags timestamps where students explicitly asked "Why?" or state they are lost.
*   **Connected Prompt:**
    > "...Detailed tracking of student friction topics..."

---

## 🛠️ Global Alignment Rules
Every AI call in Oogway follows these **Absolute Extraction Rules**:
1. **EXHAUSTIVE Fact Extractor:** Only pedagogical facts, no opinions.
2. **STRICTLY NEUTRAL:** No praising or criticizing without proof.
3. **TIMESTAMP PROOF:** Every claim (quote, analogy, resolution) MUST include a HH:MM:SS timestamp.

---

## 📊 Mapping Table

| UI Output Section | Field Name | Stage | Mapping Logic |
| :--- | :--- | :--- | :--- |
| **Session Summary** | `overall_summary` | 6A | Curriculum Match check |
| **Expert Audit** | `depth_analysis` | 6B | Surface vs Reasoning check |
| **Friction Cluster** | `top_issue_topics` | 6C | Frequency of technical doubts |
| **Live Timeline** | `analogies_and_examples`| 3 | Chronological truth extraction |

---

*This document is linked to the [Pipeline Architecture](file:///Users/cyrustaneja/Desktop/Product/Oogway/PIPELINE_ARCHITECTURE.md).*
