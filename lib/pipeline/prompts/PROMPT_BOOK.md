# 📖 Oogway AI System Prompt Book & Engineering Guide

This document is the **single source of truth** for all LLM system prompts used in Oogway Pulse & Analysis Engine. 
Each prompt section details its **Purpose**, **Location in Codebase**, **Output Schema**, and explicit **Good vs. Bad Examples**.

---

## Table of Contents
1. [Oogway Pulse System Prompt (Tier 1 Reviewer)](#1-oogway-pulse-system-prompt-tier-1-reviewer)
2. [Stage 1 Segmenter Prompt](#2-stage-1-segmenter-prompt)
3. [Stage 2 Chapter Extractor Prompt](#3-stage-2-chapter-extractor-prompt)
4. [Stage 3 Synthesizer Prompt](#4-stage-3-synthesizer-prompt)
5. [Stage 4 Flag Generator Prompt](#5-stage-4-flag-generator-prompt)
6. [On-Demand Coaching Prompt](#6-on-demand-coaching-prompt)
7. [Proactive Session Prep Intelligence Prompt (Deep Mode)](#7-proactive-session-prep-intelligence-prompt-deep-mode)
8. [Proactive Batch Prep Intelligence Prompt (Deep Mode)](#8-proactive-batch-prep-intelligence-prompt-deep-mode)

---

## 1. Oogway Pulse System Prompt (Tier 1 Reviewer)

- **File**: [`lib/pipeline/prompts/oogway-pulse-prompts.ts`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/oogway-pulse-prompts.ts)
- **Purpose**: Fast 60-second transcript evaluation analyzing Expert Execution and Student Behavior.
- **Good Example**:
  ```json
  {
    "overall_expert_summary": {
      "right": "Expert used clear e-commerce case studies and encouraged questions on catalog setup.",
      "wrong": "Session finished 15 minutes early without deep-diving into CAPI deduplication.",
      "action": "Plan interactive exercise for CAPI setup to utilize full 90 minutes."
    }
  }
  ```
- **Bad Example**:
  ```json
  {
    "overall_expert_summary": {
      "right": "Good session.",
      "wrong": "Ended early.",
      "action": "Do better."
    }
  }
  ```

---

## 2. Stage 1 Segmenter Prompt

- **File**: [`lib/pipeline/prompts/stage1-segmenter.txt`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/stage1-segmenter.txt)
- **Purpose**: Divides full transcript into logical 10-25 minute chapters based on topic transitions.

---

## 3. Stage 2 Chapter Extractor Prompt

- **File**: [`lib/pipeline/prompts/stage2-chapter-extractor.txt`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/stage2-chapter-extractor.txt)
- **Purpose**: Evaluates teaching depth, engagement, analogies, and student doubts within a specific chapter.

---

## 4. Stage 3 Synthesizer Prompt

- **File**: [`lib/pipeline/prompts/stage3-synthesizer.txt`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/stage3-synthesizer.txt)
- **Purpose**: Combines all chapter outputs into an executive session synthesis report.

---

## 5. Stage 4 Flag Generator Prompt

- **File**: [`lib/pipeline/prompts/stage4-flag-generator.txt`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/stage4-flag-generator.txt)
- **Purpose**: Identifies critical policy, accuracy, or quality violations.

---

## 6. On-Demand Coaching Prompt

- **File**: [`lib/pipeline/prompts/on-demand-coaching.txt`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/on-demand-coaching.txt)
- **Purpose**: Answers expert or admin questions directly against the session transcript.

---

## 7. Proactive Session Prep Intelligence Prompt (Deep Mode)

- **File**: [`lib/pipeline/prompts/proactive-session-prep.txt`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/proactive-session-prep.txt)
- **Purpose**: Performs deep recursive extraction across past chapter results, student doubts, and analogies to provide experts with non-skimming proactive tips.
- **Good Example**:
  ```json
  {
    "major_student_difficulty_topics": [
      {
        "topic": "Conversion API (CAPI) vs Meta Pixel Event Deduplication",
        "severity": "HIGH",
        "historical_context": "Students frequently get confused about why sending events via both Browser (Pixel) and Server (CAPI) does not double-count conversions. They fail to understand how event_id matching functions as a unique transaction receipt."
      }
    ],
    "best_analogies_to_use": [
      {
        "concept": "Event Deduplication",
        "analogy": "The Concert Ticket Analogy: Physical ticket vs digital barcode having the same Ticket ID #1234.",
        "why_it_works": "Makes event_id matching instantly clear."
      }
    ]
  }
  ```
- **Bad Example**:
  ```json
  {
    "major_student_difficulty_topics": [{"topic": "Pixel", "severity": "HIGH", "historical_context": "Hard topic."}],
    "best_analogies_to_use": [{"concept": "Pixel", "analogy": "Like a camera.", "why_it_works": "Good"}]
  }
  ```

---

## 8. Proactive Batch Prep Intelligence Prompt (Deep Mode)

- **File**: [`lib/pipeline/prompts/proactive-batch-prep.txt`](file:///Users/cyrustaneja/Desktop/Product/Oogway/lib/pipeline/prompts/proactive-batch-prep.txt)
- **Purpose**: Performs deep synthesis of cohort delivery logs, active student lists, and engagement bottlenecks.
- **Good Example**:
  ```json
  {
    "completed_modules_summary": [
      {
        "module_name": "SEO Foundations",
        "status": "COMPLETED",
        "key_learnings": "Covered Technical SEO, On-page Audit, and Keyword Clustering."
      }
    ],
    "current_module_standing": "60% completed through Performance Marketing (Google Ads).",
    "engagement_bottlenecks": [
      {
        "issue": "Silence on mic during math calculations",
        "impact": "ROAS calculation questions cause 20-30s awkward pauses."
      }
    ],
    "engagement_drivers": [
      {
        "driver": "Live Ads Manager UI walkthroughs",
        "recommendation": "Share screen with real client data to boost participation 3x."
      }
    ],
    "top_engaged_students": ["Rohan Sharma", "Priya Mehta"]
  }
  ```
- **Bad Example**:
  ```json
  {
    "completed_modules_summary": [],
    "current_module_standing": "Doing ok",
    "engagement_bottlenecks": [{"issue": "Quiet", "impact": "No answers"}],
    "engagement_drivers": [{"driver": "Talk", "recommendation": "Ask them"}],
    "top_engaged_students": ["Class"]
  }
  ```
