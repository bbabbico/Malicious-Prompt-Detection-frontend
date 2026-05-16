# 통합 CSV로 만드는 데이터 전처리 파이프라인
import os
import re
import json
import pandas as pd
from pathlib import Path

try:
    from datasets import load_dataset
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

BASE_DIR      = Path(__file__).parent.parent
DATA_DIR      = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
OUTPUT_FILE   = ARTIFACTS_DIR / "integrated_data.csv"

ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

frames = []  # 각 소스에서 만들어진 DataFrame을 모을 리스트


# ──────────────────────────────────────────────
# 1. malignant.csv
# ──────────────────────────────────────────────
def load_malignant():
    path = DATA_DIR / "malignant.csv"
    df = pd.read_csv(path)

    # category: 'jailbreak' / 'act_as' → 1 (악성), 'conversation' → 0 (정상)
    label_map = {"conversation": 0, "jailbreak": 1, "act_as": 1}
    df["label"] = df["category"].map(label_map)

    result = pd.DataFrame({
        "text":   df["text"],
        "label":  df["label"],
        "source": "malignant.csv"
    })
    print(f"[malignant.csv]          로드 완료: {len(result)}행 "
          f"(악성={df['label'].eq(1).sum()}, 정상={df['label'].eq(0).sum()})")
    return result


# ──────────────────────────────────────────────
# 2. adversarial_dataset_with_techniques.csv
# ──────────────────────────────────────────────
def load_adversarial():
    path = DATA_DIR / "adversarial_dataset_with_techniques.csv"
    df = pd.read_csv(path)

    # persuasive_prompt 열이 조작된 악성 프롬프트
    result = pd.DataFrame({
        "text":   df["persuasive_prompt"],
        "label":  1,  # 전부 adversarial → 악성
        "source": "adversarial_dataset_with_techniques.csv"
    })
    print(f"[adversarial_dataset...] 로드 완료: {len(result)}행 (전부 악성=1)")
    return result


# ──────────────────────────────────────────────
# 3 & 4. fine_tuning_dataset_prepared_*.jsonl
# ──────────────────────────────────────────────
def load_jsonl(filename):
    path = DATA_DIR / filename
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            prompt = obj.get("prompt", "")
            completion = obj.get("completion", "").strip().lower()
            label = 1 if "jailbreakable" in completion else 0
            records.append({"text": prompt, "label": label, "source": filename})

    result = pd.DataFrame(records)
    mal = result["label"].eq(1).sum()
    ben = result["label"].eq(0).sum()
    print(f"[{filename}] 로드 완료: {len(result)}행 (악성={mal}, 정상={ben})")
    return result


# ──────────────────────────────────────────────
# 5~9. finding_1.json ~ finding_5.json
# ──────────────────────────────────────────────
def load_finding(filename):
    path = DATA_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    walkthroughs = data.get("harmony_response_walkthroughs", [])
    records = []
    for raw in walkthroughs:
        # <|start|>user<|message|>…<|end|> 패턴에서 사용자 메시지만 추출
        match = re.search(
            r"<\|start\|>user<\|message\|>(.*?)<\|end\|>",
            raw, re.DOTALL
        )
        text = match.group(1).strip() if match else raw.strip()
        records.append({"text": text, "label": 1, "source": filename})

    result = pd.DataFrame(records)
    print(f"[{filename}]          로드 완료: {len(result)}행 (전부 악성=1)")
    return result


# ──────────────────────────────────────────────
# 전체 로드
# ──────────────────────────────────────────────
print("=" * 60)
print("STEP 1 | 파일 로드 및 컬럼 통일")
print("=" * 60)

frames.append(load_malignant())
frames.append(load_adversarial())
frames.append(load_jsonl("fine_tuning_dataset_prepared_train.jsonl"))
frames.append(load_jsonl("fine_tuning_dataset_prepared_valid.jsonl"))
for i in range(1, 6):
    frames.append(load_finding(f"finding_{i}.json"))

# dataset-metadata.json, christine_classy_legacy_protected.json 은 텍스트/라벨 없어 스킵
print("\n[dataset-metadata.json]          → 메타데이터 전용, 스킵")
print("[christine_classy_legacy_protected.json] → 해시/기록 데이터, 스킵")

# ──────────────────────────────────────────────
# 10. deepset/prompt-injections (HuggingFace)
# ──────────────────────────────────────────────
def load_hf_prompt_injections():
    if not HF_AVAILABLE:
        print("[deepset/prompt-injections] → datasets 미설치, 스킵 (pip install datasets)")
        return pd.DataFrame(columns=["text", "label", "source"])

    print("[deepset/prompt-injections] 로드 중...")
    ds = load_dataset("deepset/prompt-injections", split="train")
    df = pd.DataFrame(ds)[["text", "label"]]
    df["label"] = pd.to_numeric(df["label"], errors="coerce")
    df = df.dropna(subset=["label"])
    df["label"] = df["label"].astype(int)
    df = df[df["label"].isin([0, 1])]
    df["source"] = "deepset/prompt-injections"
    mal = df["label"].eq(1).sum()
    norm = df["label"].eq(0).sum()
    print(f"[deepset/prompt-injections]      로드 완료: {len(df)}행 (악성={mal}, 정상={norm})")
    return df[["text", "label", "source"]]

frames.append(load_hf_prompt_injections())

df = pd.concat(frames, ignore_index=True)
print(f"\n통합 전 총 행수: {len(df)}")


# ──────────────────────────────────────────────
# STEP 2 | 데이터 클리닝
# ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 2 | 데이터 클리닝")
print("=" * 60)

# 2-1. text 컬럼을 문자열로 강제 변환
df["text"] = df["text"].astype(str)

# 2-2. 텍스트 끝의 ### 및 불필요한 줄바꿈 제거
before = len(df)
df["text"] = df["text"].str.replace(r"#+\s*$", "", regex=True)  # 끝의 # 계열
df["text"] = df["text"].str.replace(r"\n+", " ", regex=True)    # 줄바꿈 → 공백
df["text"] = df["text"].str.strip()
print(f"특수기호 제거 완료")

# 2-3. 결측치 처리 (text 또는 label이 비어있는 행 삭제)
df = df[df["text"].notna() & (df["text"] != "") & (df["text"] != "nan")]
df = df[df["label"].notna()]
df["label"] = df["label"].astype(int)
after_null = len(df)
print(f"결측치 제거: {before - after_null}행 삭제 → 잔여 {after_null}행")

# 2-4. 중복 제거 (text 기준 완전 일치)
df = df.drop_duplicates(subset="text", keep="first")
after_dup = len(df)
print(f"중복 제거:   {after_null - after_dup}행 삭제 → 잔여 {after_dup}행")


# ──────────────────────────────────────────────
# STEP 3 | 라벨 분포 분석 및 셔플
# ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 3 | 라벨 분포 분석 및 셔플")
print("=" * 60)

label_counts = df["label"].value_counts().sort_index()
total = len(df)

for lbl, cnt in label_counts.items():
    name = "정상(0)" if lbl == 0 else "악성(1)"
    ratio = cnt / total * 100
    print(f"  {name}: {cnt:,}개  ({ratio:.1f}%)")

ratio_0 = label_counts.get(0, 0) / total
ratio_1 = label_counts.get(1, 0) / total
imbalance_threshold = 0.3  # 30% 이하면 불균형으로 판단

if min(ratio_0, ratio_1) < imbalance_threshold:
    print(f"\n  ⚠ 데이터 불균형 감지 (소수 클래스 비율 {min(ratio_0, ratio_1)*100:.1f}% < {imbalance_threshold*100:.0f}%)")
    print("  → 셔플을 수행합니다.")
else:
    print(f"\n  → 비율이 적절합니다. 셔플을 수행합니다.")

df = df.sample(frac=1, random_state=42).reset_index(drop=True)
print("  셔플 완료")


# ──────────────────────────────────────────────
# STEP 4 | 저장
# ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 4 | 저장")
print("=" * 60)

df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")
print(f"저장 완료: {OUTPUT_FILE}")
print(f"최종 데이터셋: {len(df):,}행 × {len(df.columns)}열 {df.columns.tolist()}")
print("=" * 60)
