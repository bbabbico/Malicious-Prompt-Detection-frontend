# e5-small 임베딩 + LightGBM 학습
import time
import pickle
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import lightgbm as lgb
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

# ── 설정 ──────────────────────────────────────
ARTIFACTS_DIR    = Path(__file__).parent.parent / "artifacts"
DATA_PATH        = ARTIFACTS_DIR / "integrated_data.csv"
EMBED_MODEL_NAME = "intfloat/multilingual-e5-small"
EMBED_BATCH_SIZE = 256
EMBED_SAVE_PATH  = ARTIFACTS_DIR / "small" / "embeddings.npy"
LABEL_SAVE_PATH  = ARTIFACTS_DIR / "small" / "labels.npy"
MODEL_SAVE_PATH  = ARTIFACTS_DIR / "small" / "detector_model.pkl"
TEST_SIZE        = 0.2
RANDOM_STATE     = 42
# ──────────────────────────────────────────────

ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
(ARTIFACTS_DIR / "small").mkdir(parents=True, exist_ok=True)


# ══════════════════════════════════════════════
# STEP 1 | 데이터 로드
# ══════════════════════════════════════════════
print("=" * 60)
print("STEP 1 | 데이터 로드")
print("=" * 60)

df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
print(f"[integrated_data.csv] {len(df):,}행  "
      f"(정상={df['label'].eq(0).sum():,}, 악성={df['label'].eq(1).sum():,})")

texts  = ("query: " + df["text"].astype(str)).tolist()
labels = df["label"].values


# ══════════════════════════════════════════════
# STEP 2 | 텍스트 임베딩
# ══════════════════════════════════════════════
print("\n" + "=" * 60)
print(f"STEP 2 | 텍스트 임베딩  ({EMBED_MODEL_NAME})")
print("=" * 60)

embedder = SentenceTransformer(EMBED_MODEL_NAME)
print(f"모델 로드 완료 (임베딩 차원: {embedder.get_sentence_embedding_dimension()})")
print(f"배치 크기: {EMBED_BATCH_SIZE}  |  총 문장: {len(texts):,}개\n")

t0 = time.time()
batches    = [texts[i:i + EMBED_BATCH_SIZE] for i in range(0, len(texts), EMBED_BATCH_SIZE)]
embed_list = []

for batch in tqdm(batches, desc="임베딩 진행", unit="batch", ncols=80):
    embed_list.append(embedder.encode(batch, show_progress_bar=False))

embeddings = np.vstack(embed_list)
elapsed = time.time() - t0
print(f"\n임베딩 완료  |  shape: {embeddings.shape}  |  소요: {elapsed:.1f}초")


# ══════════════════════════════════════════════
# STEP 3 | 임베딩 저장
# ══════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 3 | 임베딩 결과 저장")
print("=" * 60)

np.save(EMBED_SAVE_PATH, embeddings)
np.save(LABEL_SAVE_PATH, labels)
print(f"임베딩 벡터  → {EMBED_SAVE_PATH}  ({embeddings.nbytes / 1024**2:.1f} MB)")
print(f"라벨 배열    → {LABEL_SAVE_PATH}")


# ══════════════════════════════════════════════
# STEP 4 | Train / Test 분리 (80/20, stratified)
# ══════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 4 | Train / Test 분리 (80 / 20)")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    embeddings, labels,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=labels,
)

print(f"Train: {len(X_train):,}개  (악성={y_train.sum():,} / 정상={(y_train==0).sum():,})")
print(f"Test : {len(X_test):,}개  (악성={y_test.sum():,} / 정상={(y_test==0).sum():,})")


# ══════════════════════════════════════════════
# STEP 5 | LightGBM 학습
# ══════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 5 | LightGBM 학습")
print("=" * 60)

train_data = lgb.Dataset(X_train, label=y_train)
valid_data = lgb.Dataset(X_test,  label=y_test, reference=train_data)

params = {
    "objective":         "binary",
    "metric":            "binary_logloss",
    "boosting_type":     "gbdt",
    "learning_rate":     0.05,
    "num_leaves":        63,
    "max_depth":         -1,
    "min_child_samples": 20,
    "feature_fraction":  0.8,
    "bagging_fraction":  0.8,
    "bagging_freq":      5,
    "is_unbalance":      True,
    "verbose":           -1,
}

print("학습 시작 (early stopping: 50 rounds)...\n")
t1 = time.time()
model = lgb.train(
    params,
    train_data,
    num_boost_round=1000,
    valid_sets=[train_data, valid_data],
    valid_names=["train", "valid"],
    callbacks=[
        lgb.early_stopping(stopping_rounds=50, verbose=True),
        lgb.log_evaluation(period=50),
    ],
)
print(f"\n학습 완료  |  최적 반복: {model.best_iteration}  |  소요: {time.time()-t1:.1f}초")


# ══════════════════════════════════════════════
# STEP 6 | HF test split 교차 평가
# ══════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 6 | HF test split 교차 평가  (deepset/prompt-injections)")
print("=" * 60)

try:
    from datasets import load_dataset
    from sklearn.metrics import f1_score, classification_report, confusion_matrix

    hf_test = load_dataset("deepset/prompt-injections", split="test")
    hf_test_df = pd.DataFrame(hf_test)[["text", "label"]]
    hf_test_df["label"] = pd.to_numeric(hf_test_df["label"], errors="coerce")
    hf_test_df = hf_test_df.dropna(subset=["label"])
    hf_test_df["label"] = hf_test_df["label"].astype(int)
    hf_test_df = hf_test_df[hf_test_df["label"].isin([0, 1])].reset_index(drop=True)

    hf_texts = ["query: " + t for t in hf_test_df["text"].tolist()]
    hf_embs  = embedder.encode(hf_texts, show_progress_bar=False, batch_size=64)
    hf_prob  = model.predict(hf_embs, num_iteration=model.best_iteration)
    hf_pred  = (hf_prob >= 0.5).astype(int)
    hf_true  = hf_test_df["label"].values

    f1  = f1_score(hf_true, hf_pred, zero_division=0)
    cm  = confusion_matrix(hf_true, hf_pred)
    tn, fp, fn, tp = cm.ravel()
    print(f"HF test split ({len(hf_test_df)}개):  정상={(hf_true==0).sum()}, 악성={(hf_true==1).sum()}")
    print(f"F1(악성)={f1:.4f}  TN={tn} FP={fp} FN={fn} TP={tp}")
    print()
    print(classification_report(hf_true, hf_pred, target_names=["정상(0)", "악성(1)"]))
except Exception as e:
    print(f"HF 교차 평가 실패: {e}")


# ══════════════════════════════════════════════
# STEP 7 | 모델 저장
# ══════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 7 | 모델 저장")
print("=" * 60)

with open(MODEL_SAVE_PATH, "wb") as f:
    pickle.dump(model, f)

print(f"모델 저장 완료 → {MODEL_SAVE_PATH}")
print("=" * 60)
print("전체 파이프라인 완료")
print("=" * 60)
